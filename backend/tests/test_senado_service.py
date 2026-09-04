"""
F-11 da auditoria de código: não existia test_senado_service.py. O único
"except Exception: return []" ao redor da busca de votações de um senador
mascarava falha real (Senado fora do ar, timeout, XML malformado) com o
MESMO resultado do caso legítimo "senador sem votos no período" -- os dois
casos ficavam indistinguíveis pro chamador. Removido o swallow; estes
testes travam que cada falha real propaga (pra virar 503 no endpoint) e que
o caso legítimo de lista vazia continua funcionando sem lançar nada.
"""
import httpx
import pytest

from app.services import senado_service


@pytest.fixture(autouse=True)
def _clear_cache():
    senado_service._cache.clear()
    yield
    senado_service._cache.clear()


def _fake_get(status_code=200, text="<xml/>"):
    async def fake(self, url, params=None, **kwargs):
        request = httpx.Request("GET", url)
        return httpx.Response(status_code, request=request, text=text)
    return fake


async def test_senador_sem_votos_retorna_lista_vazia_sem_lancar(monkeypatch):
    xml_vazio = (
        "<VotacaoParlamentar><Metadados></Metadados></VotacaoParlamentar>"
    )
    monkeypatch.setattr(httpx.AsyncClient, "get", _fake_get(200, xml_vazio))

    votacoes = await senado_service.get_senador_votacoes("999999")

    assert votacoes == []


async def test_status_de_erro_do_senado_propaga_nao_vira_lista_vazia(monkeypatch):
    monkeypatch.setattr(httpx.AsyncClient, "get", _fake_get(500, "erro"))

    with pytest.raises(httpx.HTTPStatusError):
        await senado_service.get_senador_votacoes("123")


async def test_timeout_propaga_nao_vira_lista_vazia(monkeypatch):
    async def fake_get(self, url, params=None, **kwargs):
        raise httpx.ConnectTimeout("timeout")

    monkeypatch.setattr(httpx.AsyncClient, "get", fake_get)

    with pytest.raises(httpx.ConnectTimeout):
        await senado_service.get_senador_votacoes("123")


async def test_xml_malformado_propaga_nao_vira_lista_vazia(monkeypatch):
    monkeypatch.setattr(httpx.AsyncClient, "get", _fake_get(200, "<nao-fecha"))

    import xml.etree.ElementTree as ET

    with pytest.raises(ET.ParseError):
        await senado_service.get_senador_votacoes("123")


async def test_parseia_votacao_real_corretamente(monkeypatch):
    xml_com_voto = """
    <VotacaoParlamentar>
      <Votacoes>
        <Votacao>
          <SessaoPlenaria><DataSessao>20260115</DataSessao><SiglaCasaSessao>SF</SiglaCasaSessao></SessaoPlenaria>
          <Materia><Sigla>PL</Sigla><Numero>123</Numero><Ano>2025</Ano><Ementa>Ementa teste</Ementa></Materia>
          <DescricaoVoto>Sim</DescricaoVoto>
          <IndicadorVotacaoSecreta>Nao</IndicadorVotacaoSecreta>
        </Votacao>
      </Votacoes>
    </VotacaoParlamentar>
    """
    monkeypatch.setattr(httpx.AsyncClient, "get", _fake_get(200, xml_com_voto))

    votacoes = await senado_service.get_senador_votacoes("123")

    assert len(votacoes) == 1
    assert votacoes[0].tipo_voto == "Sim"
    assert votacoes[0].proposicao_sigla == "PL"
    assert votacoes[0].proposicao_numero == 123
