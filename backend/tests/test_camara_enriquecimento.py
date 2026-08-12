"""
Fase 2: enriquecer votações com o nome real da proposição (via
proposicoesAfetadas em /votacoes/{id}) e filtrar proposições sem ementa
(tipos administrativos como DOC/OF, confirmado ao vivo: ementa vazia em
3 de 4 casos testados contra a API real da Câmara).

Regressão de 2026-08-11 (segunda revisão do Aether): o HUD classificava
"mérito vs. procedural" checando se proposicao_objeto existia. Antes do
enriquecimento isso funcionava (a maioria vinha nula). Depois do
enriquecimento, quase toda votação ganhou proposicao_objeto — inclusive
despachos puros ("Aprovado o Parecer.") — e o classificador quebrou,
voltando a misturar tudo numa única taxa de "100% de mérito". A correção
usa o campo `merito`, calculado a partir do placar ("Sim: X; Não: Y;
Total: Z") que a Câmara embute na descrição bruta ANTES da limpeza —
sinal independente de proposicao_objeto, que sobrevive ao enriquecimento.

Regressão nº 2, mesmo dia (terceira revisão do Aether): placar sozinho não
basta. Requerimentos às vezes são votados nominalmente (com placar) e ainda
assim são trâmite processual, não decisão de mérito — ex: "Aprovado o
Requerimento. Sim: 276; Não: 67; Total: 343." O critério agora exige as
duas condições: tem placar E a descrição não contém um verbo de trâmite
(requerimento/parecer/deferido/indeferido/retirado).
"""
import pytest

from app.services import camara_service


@pytest.fixture(autouse=True)
def _clear_caches():
    camara_service._cache.clear()
    camara_service._cache_live.clear()
    camara_service._cache_votacao_proposicao.clear()
    yield
    camara_service._cache.clear()
    camara_service._cache_live.clear()
    camara_service._cache_votacao_proposicao.clear()


def _votacao_payload(vid: str, descricao="Aprovado o Parecer."):
    return {
        "id": vid,
        "data": "2026-07-15",
        "dataHoraRegistro": "2026-07-15T15:00:00",
        "siglaOrgao": "PLEN",
        "proposicaoObjeto": None,
        "descricao": descricao,
        "aprovacao": 1,
    }


def test_despacho_com_proposicao_enriquecida_nao_vira_merito():
    """O caso exato da regressão: 'Aprovado o Parecer.' tem proposição
    identificada via enriquecimento, mas continua sendo despacho, não
    votação de mérito."""
    v = camara_service._to_votacao(_votacao_payload("1", "Aprovado o Parecer."))
    v.proposicao_objeto = "PL 5438/2025"  # como ficaria após o enriquecimento

    assert v.merito is False
    assert v.proposicao_objeto == "PL 5438/2025"


def test_votacao_com_placar_sem_verbo_processual_e_merito():
    payload = _votacao_payload(
        "2", "Rejeitado o Projeto de Lei. Sim: 151; Não: 236; Abstenção: 3; Total: 390."
    )
    v = camara_service._to_votacao(payload)

    assert v.merito is True
    assert "Total" not in v.descricao  # placar removido da descrição exibida


@pytest.mark.parametrize("descricao", [
    "Aprovado o Parecer.",
    "Aprovado o parecer na Comissão Mista",
    "Deferido o requerimento REQ 2726/2026, nos termos do artigo 104, caput, do RICD",
    "Retirado o REQ 123/2026 de pauta.",
    # Regressão de 2026-08-11 (segunda revisão do Aether): requerimento
    # votado nominalmente (com placar) continua sendo trâmite, não mérito —
    # placar sozinho não bastava como critério.
    "Aprovado o Requerimento. Sim: 276; Não: 67; Total: 343.",
    "Rejeitado o Requerimento. Sim: 114; Não: 319; Abstenção: 2; Total: 435.",
])
def test_despachos_processuais_nao_sao_merito(descricao):
    v = camara_service._to_votacao(_votacao_payload("x", descricao))
    assert v.merito is False


async def test_enrich_false_nao_faz_fan_out(monkeypatch):
    calls = {"detail": 0}

    async def fake_fetch_list(path, params=None):
        return {"dados": [_votacao_payload("1"), _votacao_payload("2")]}

    async def fake_fetch_proposicao(client, votacao_id):
        calls["detail"] += 1
        return votacao_id, "NAO DEVERIA SER CHAMADO", None

    monkeypatch.setattr(camara_service, "_fetch_camara_json", fake_fetch_list)
    monkeypatch.setattr(camara_service, "_fetch_votacao_proposicao", fake_fetch_proposicao)

    votacoes = await camara_service.get_votacoes_recentes(itens=10, enrich=False)

    assert calls["detail"] == 0
    assert votacoes[0].proposicao_objeto is None


async def test_enrich_true_preenche_nome_e_ementa_reais(monkeypatch):
    async def fake_fetch_list(path, params=None):
        return {"dados": [_votacao_payload("1"), _votacao_payload("2")]}

    async def fake_fetch_proposicao(client, votacao_id):
        if votacao_id == "1":
            return votacao_id, "PDL 497/2020", "Susta a decisão da ANEEL sobre bandeira tarifária"
        return votacao_id, None, None  # sem proposição vinculada (despacho, redação final...)

    monkeypatch.setattr(camara_service, "_fetch_camara_json", fake_fetch_list)
    monkeypatch.setattr(camara_service, "_fetch_votacao_proposicao", fake_fetch_proposicao)

    votacoes = await camara_service.get_votacoes_recentes(itens=10, enrich=True)

    by_id = {v.id: v for v in votacoes}
    assert by_id["1"].proposicao_objeto == "PDL 497/2020"
    assert by_id["1"].proposicao_ementa == "Susta a decisão da ANEEL sobre bandeira tarifária"
    assert by_id["2"].proposicao_objeto is None
    assert by_id["2"].proposicao_ementa is None


async def test_fetch_votacao_proposicao_monta_sigla_numero_ano_e_ementa():
    class FakeResponse:
        is_success = True

        def json(self):
            return {
                "dados": {
                    "proposicoesAfetadas": [
                        {"siglaTipo": "PDL", "numero": 497, "ano": 2020, "ementa": "Susta a decisão..."}
                    ]
                }
            }

    class FakeClient:
        async def get(self, url, timeout=None):
            return FakeResponse()

    votacao_id, nome, ementa = await camara_service._fetch_votacao_proposicao(FakeClient(), "2464733-32")

    assert nome == "PDL 497/2020"
    assert ementa == "Susta a decisão..."


async def test_fetch_votacao_proposicao_sem_proposicao_retorna_none():
    class FakeResponse:
        is_success = True

        def json(self):
            return {"dados": {"proposicoesAfetadas": []}}

    class FakeClient:
        async def get(self, url, timeout=None):
            return FakeResponse()

    votacao_id, nome, ementa = await camara_service._fetch_votacao_proposicao(FakeClient(), "2632301-33")

    assert nome is None
    assert ementa is None


async def test_get_proposicoes_filtra_ementa_vazia(monkeypatch):
    async def fake_fetch_list(path, params=None):
        return {
            "dados": [
                {"id": 1, "siglaTipo": "PL", "numero": 5005, "ano": 2026, "ementa": "Ementa de verdade"},
                {"id": 2, "siglaTipo": "DOC", "numero": 919, "ano": 2026, "ementa": ""},
                {"id": 3, "siglaTipo": "DOC", "numero": 920, "ano": 2026, "ementa": "   "},
            ]
        }

    async def fake_status(client, prop_id):
        return prop_id, None, None

    monkeypatch.setattr(camara_service, "_fetch_camara_json", fake_fetch_list)
    monkeypatch.setattr(camara_service, "_fetch_proposicao_status", fake_status)

    proposicoes = await camara_service.get_proposicoes(ano=2026, itens=10)

    assert [p.id for p in proposicoes] == [1]
