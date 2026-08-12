"""
Regressão de 2026-08-12: get_deputado_votacoes pedia dataInicio=2023-01-01 e
dataFim=2023-12-31 numa chamada só. Confirmado ao vivo que a Câmara rejeita
faixas de um ano inteiro nesse endpoint (400) — janelas menores (trimestre)
funcionam. A busca agora é feita por trimestre e os resultados são somados.
"""
import pytest

from app.services import camara_service


@pytest.fixture(autouse=True)
def _clear_cache():
    camara_service._cache_votacoes_historico.clear()
    yield
    camara_service._cache_votacoes_historico.clear()


async def test_busca_por_trimestre_nao_ano_inteiro(monkeypatch):
    faixas_pedidas = []

    async def fake_fetch(path, params=None):
        faixas_pedidas.append((params.get("dataInicio"), params.get("dataFim")))
        return {"dados": []}

    monkeypatch.setattr(camara_service, "_fetch_camara_json", fake_fetch)

    await camara_service.get_deputado_votacoes(1)

    assert faixas_pedidas == camara_service._TRIMESTRES_2023
    # nenhuma faixa cobre o ano inteiro numa chamada só
    for inicio, fim in faixas_pedidas:
        assert inicio.startswith("2023") and fim.startswith("2023")
        assert inicio[5:7] != "01" or fim[5:7] != "12"


async def test_junta_resultados_dos_quatro_trimestres(monkeypatch):
    async def fake_fetch(path, params=None):
        # um PLEN por trimestre
        return {
            "dados": [
                {"id": f"v-{params['dataInicio']}", "siglaOrgao": "PLEN", "data": params["dataInicio"], "proposicaoObjeto": None},
                {"id": f"c-{params['dataInicio']}", "siglaOrgao": "CCJ", "data": params["dataInicio"], "proposicaoObjeto": None},
            ]
        }

    async def fake_vote(client, votacao, deputado_id):
        # simula: deputado votou em todas as PLEN encontradas
        from app.models.deputado_votacao import DeputadoVotacao
        return DeputadoVotacao(
            id=str(votacao["id"]), data=votacao["data"], sigla_orgao=votacao["siglaOrgao"],
            tipo_voto="Sim", proposicao_sigla=None, proposicao_numero=None,
            proposicao_ano=None, proposicao_ementa=None,
        )

    monkeypatch.setattr(camara_service, "_fetch_camara_json", fake_fetch)
    monkeypatch.setattr(camara_service, "_fetch_deputy_vote_for_votacao", fake_vote)

    resultados = await camara_service.get_deputado_votacoes(1)

    # 4 trimestres x 1 PLEN cada (CCJ é comissão, filtrado fora)
    assert len(resultados) == 4
