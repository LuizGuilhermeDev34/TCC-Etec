"""
Fase 2: enriquecer votações com o nome real da proposição (via
proposicoesAfetadas em /votacoes/{id}) e filtrar proposições sem ementa
(tipos administrativos como DOC/OF, confirmado ao vivo: ementa vazia em
3 de 4 casos testados contra a API real da Câmara).
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


def _votacao_payload(vid: str, proposicao_objeto=None):
    return {
        "id": vid,
        "data": "2026-07-15",
        "dataHoraRegistro": "2026-07-15T15:00:00",
        "siglaOrgao": "PLEN",
        "proposicaoObjeto": proposicao_objeto,
        "descricao": "Aprovado o Parecer.",
        "aprovacao": 1,
    }


async def test_enrich_false_nao_faz_fan_out(monkeypatch):
    calls = {"detail": 0}

    async def fake_fetch_list(path, params=None):
        return {"dados": [_votacao_payload("1"), _votacao_payload("2")]}

    async def fake_fetch_proposicao(client, votacao_id):
        calls["detail"] += 1
        return votacao_id, "NAO DEVERIA SER CHAMADO"

    monkeypatch.setattr(camara_service, "_fetch_camara_json", fake_fetch_list)
    monkeypatch.setattr(camara_service, "_fetch_votacao_proposicao", fake_fetch_proposicao)

    votacoes = await camara_service.get_votacoes_recentes(itens=10, enrich=False)

    assert calls["detail"] == 0
    assert votacoes[0].proposicao_objeto is None


async def test_enrich_true_preenche_nome_real_da_pl(monkeypatch):
    async def fake_fetch_list(path, params=None):
        return {"dados": [_votacao_payload("1"), _votacao_payload("2")]}

    async def fake_fetch_proposicao(client, votacao_id):
        if votacao_id == "1":
            return votacao_id, "PDL 497/2020"
        return votacao_id, None  # sem proposição vinculada (despacho, redação final...)

    monkeypatch.setattr(camara_service, "_fetch_camara_json", fake_fetch_list)
    monkeypatch.setattr(camara_service, "_fetch_votacao_proposicao", fake_fetch_proposicao)

    votacoes = await camara_service.get_votacoes_recentes(itens=10, enrich=True)

    by_id = {v.id: v for v in votacoes}
    assert by_id["1"].proposicao_objeto == "PDL 497/2020"
    assert by_id["2"].proposicao_objeto is None


async def test_fetch_votacao_proposicao_monta_sigla_numero_ano(monkeypatch):
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

    votacao_id, nome = await camara_service._fetch_votacao_proposicao(FakeClient(), "2464733-32")

    assert nome == "PDL 497/2020"


async def test_fetch_votacao_proposicao_sem_proposicao_retorna_none(monkeypatch):
    class FakeResponse:
        is_success = True

        def json(self):
            return {"dados": {"proposicoesAfetadas": []}}

    class FakeClient:
        async def get(self, url, timeout=None):
            return FakeResponse()

    votacao_id, nome = await camara_service._fetch_votacao_proposicao(FakeClient(), "2632301-33")

    assert nome is None


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
