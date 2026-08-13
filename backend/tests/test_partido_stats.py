"""
Regressao de 2026-08-13 (revisao de Partidos/Comparador do Aether):

1) "100% de aprovacao" na pagina de partido vinha de somar sim/nao/abstencao
   de TODAS as votacoes com dado individual da bancada, misturando
   requerimentos/despachos processuais (quase sempre unanimes) com votacoes
   de merito. Exemplo real: "10 Sim . 0 Nao . 0 Abstencao" vinha de uma
   unica votacao processual em 6 meses. A correcao separa merito de
   procedural (mesmo criterio de Votacao.merito) e so soma merito no
   percentual exibido, expondo o tamanho da amostra de cada grupo.

2) CEAP mostrado como "R$ 0" real na pagina de partido e no comparador,
   quando na verdade e a fonte (Camara) devolvendo 200 com dados: [] pra
   todo mundo (verificado ao vivo) -- nao zero de gasto real. Os dois
   endpoints agora expoem despesas_indisponivel pra distinguir os casos.
"""
import pytest

from app.services import camara_service


@pytest.fixture(autouse=True)
def _clear_caches():
    camara_service._cache.clear()
    camara_service._cache_live.clear()
    yield
    camara_service._cache.clear()
    camara_service._cache_live.clear()


class _FakeVotosResponse:
    def __init__(self, votos):
        self.is_success = True
        self._votos = votos

    def json(self):
        return {"dados": self._votos}


class _FakeVotosClient:
    def __init__(self, votos_by_id):
        self._votos_by_id = votos_by_id

    async def get(self, url, timeout=None):
        vid = url.rstrip("/").split("/")[-2]
        return _FakeVotosResponse(self._votos_by_id.get(vid, []))


def _voto(sigla, tipo):
    return {"deputado_": {"siglaPartido": sigla}, "tipoVoto": tipo}


async def test_fetch_votacao_party_stats_requerimento_nominal_nao_e_merito():
    """Requerimento votado nominalmente (com placar) continua sendo tramite,
    nao decisao de merito -- mesmo criterio ja usado em Votacao.merito."""
    client = _FakeVotosClient({"1": [_voto("PDT", "SIM")] * 10})
    votacao = {
        "id": "1",
        "data": "2026-07-01",
        "descricao": "Aprovado o Requerimento. Sim: 276; Nao: 67; Total: 343.",
    }

    result = await camara_service._fetch_votacao_party_stats(client, votacao, "PDT")

    assert result["sim"] == 10
    assert result["merito"] is False


async def test_fetch_votacao_party_stats_projeto_de_lei_e_merito():
    client = _FakeVotosClient({"2": [_voto("PDT", "SIM")] * 9})
    votacao = {
        "id": "2",
        "data": "2026-06-01",
        "descricao": "Aprovado o Projeto de Lei. Sim: 9; Nao: 0; Total: 9.",
    }

    result = await camara_service._fetch_votacao_party_stats(client, votacao, "PDT")

    assert result["sim"] == 9
    assert result["merito"] is True


async def test_get_partido_votacoes_stats_exclui_procedural_do_percentual(monkeypatch):
    """O caso exato reportado: uma votacao processual com 10 votos nao pode
    sozinha decidir a taxa de aprovacao exibida -- so a votacao de merito
    (9 votos) deve entrar no total_sim."""

    async def fake_get_partido(partido_id):
        return {"id": partido_id, "sigla": "PDT"}

    async def fake_fetch_list(path, params=None):
        return {
            "dados": [
                {"id": "1", "siglaOrgao": "PLEN", "data": "2026-07-01"},
                {"id": "2", "siglaOrgao": "PLEN", "data": "2026-06-01"},
            ]
        }

    async def fake_stats(client, votacao, sigla):
        if votacao["id"] == "1":
            return {"id": "1", "data": votacao["data"], "descricao": "processual",
                     "sim": 10, "nao": 0, "abstencao": 0, "merito": False}
        return {"id": "2", "data": votacao["data"], "descricao": "merito",
                 "sim": 9, "nao": 0, "abstencao": 0, "merito": True}

    monkeypatch.setattr(camara_service, "get_partido_by_id", fake_get_partido)
    monkeypatch.setattr(camara_service, "_fetch_camara_json", fake_fetch_list)
    monkeypatch.setattr(camara_service, "_fetch_votacao_party_stats", fake_stats)

    result = await camara_service.get_partido_votacoes_stats(1)

    assert result["total_sim"] == 9
    assert result["total_nao"] == 0
    assert result["votacoes_merito_count"] == 1
    assert result["votacoes_procedural_count"] == 1


async def test_get_partido_gastos_marca_indisponivel_quando_fonte_vazia(monkeypatch):
    async def fake_get_partido(partido_id):
        return {"id": partido_id, "sigla": "PDT"}

    async def fake_get_deputados():
        return []

    monkeypatch.setattr(camara_service, "get_partido_by_id", fake_get_partido)
    monkeypatch.setattr(camara_service, "get_deputados", fake_get_deputados)

    result = await camara_service.get_partido_gastos(1)

    assert result["total"] == 0
    assert result["despesas_indisponivel"] is True


async def test_get_partido_gastos_com_dados_reais_nao_marca_indisponivel(monkeypatch):
    from app.models import Deputado

    async def fake_get_partido(partido_id):
        return {"id": partido_id, "sigla": "PDT"}

    async def fake_get_deputados():
        return [Deputado(id=1, nome="Fulano", sigla_partido="PDT", sigla_uf="RJ", id_legislatura=57)]

    async def fake_despesas_totals(client, dep_id, ano=2025):
        return {"Combustiveis": 500.0}

    monkeypatch.setattr(camara_service, "get_partido_by_id", fake_get_partido)
    monkeypatch.setattr(camara_service, "get_deputados", fake_get_deputados)
    monkeypatch.setattr(camara_service, "_fetch_dep_despesas_totals", fake_despesas_totals)

    result = await camara_service.get_partido_gastos(1)

    assert result["total"] == 500.0
    assert result["despesas_indisponivel"] is False
