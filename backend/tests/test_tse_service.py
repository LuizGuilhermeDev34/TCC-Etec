"""
Regressao de 2026-09-03: nao existia nenhum teste pra tse_service.py (achado
da auditoria de codigo, F-27) -- exatamente a area onde o bug mais grave da
rodada apareceu (F-04: CDN do TSE bloqueado por IP de datacenter). O modulo
foi reescrito pra ler um indice local (backend/app/data/tse_patrimonio_2022.json,
gerado por scripts/build_tse_index.py) em vez de baixar da rede a cada
cold start.
"""
import pytest

from app.services import tse_service


@pytest.fixture(autouse=True)
def _reset_indices():
    tse_service._cand_index = None
    tse_service._bens_index = None
    yield
    tse_service._cand_index = None
    tse_service._bens_index = None


def _set_indices(cand, bens):
    tse_service._cand_index = cand
    tse_service._bens_index = bens


async def test_get_patrimonio_deputado_federal_soma_bens_reais():
    _set_indices(
        cand={"ADRIANA MIGUEL VENTURA": [{"sq": "1", "uf": "SP", "cargo": "6"}]},
        bens={"1": [
            {"tipo": "Apartamento", "descricao": "Imóvel urbano", "valor": 900000.0},
            {"tipo": "Veículo", "descricao": "Carro", "valor": 100000.0},
        ]},
    )

    result = await tse_service.get_patrimonio_deputado_federal("Adriana Ventura", "Adriana Miguel Ventura")

    assert result["total"] == 1_000_000.0
    assert result["categorias"]["Apartamento"] == 900000.0


async def test_candidato_sem_bens_declarados_retorna_vazio():
    _set_indices(
        cand={"FULANO DE TAL": [{"sq": "2", "uf": "SP", "cargo": "6"}]},
        bens={},
    )

    result = await tse_service.get_patrimonio_deputado_federal("Fulano de Tal")

    assert result == {}


async def test_nome_nao_encontrado_retorna_vazio_sem_excecao():
    _set_indices(cand={}, bens={})

    result = await tse_service.get_patrimonio_deputado_federal("Ninguem Existe")

    assert result == {}


async def test_indice_ausente_nao_lanca_excecao(monkeypatch, tmp_path):
    # Simula o arquivo de índice não existindo (build_tse_index.py nunca
    # rodou) -- deve degradar pra "sem dado", não quebrar o endpoint.
    monkeypatch.setattr(tse_service, "_INDEX_PATH", tmp_path / "nao-existe.json")

    result = await tse_service.get_patrimonio_deputado_federal("Qualquer Nome")

    assert result == {}


async def test_busca_por_nome_civil_tem_prioridade_sobre_nome_publico():
    _set_indices(
        cand={
            "NOME CIVIL COMPLETO": [{"sq": "3", "uf": "SP", "cargo": "6"}],
        },
        bens={"3": [{"tipo": "Outros", "descricao": "x", "valor": 500.0}]},
    )

    result = await tse_service.get_patrimonio_deputado_federal("Nome Público", "Nome Civil Completo")

    assert result["total"] == 500.0


async def test_busca_cai_pro_nome_publico_quando_nome_civil_nao_bate():
    _set_indices(
        cand={
            "NOME PUBLICO": [{"sq": "4", "uf": "SP", "cargo": "6"}],
        },
        bens={"4": [{"tipo": "Outros", "descricao": "x", "valor": 700.0}]},
    )

    result = await tse_service.get_patrimonio_deputado_federal("Nome Publico", "Nome Civil Que Nao Existe No Indice")

    assert result["total"] == 700.0


async def test_get_patrimonio_senador_usa_cargo_5():
    _set_indices(
        cand={
            "FULANO": [
                {"sq": "5", "uf": "SP", "cargo": "6"},  # deputado, não deveria ser escolhido
                {"sq": "6", "uf": "SP", "cargo": "5"},  # senador
            ],
        },
        bens={"6": [{"tipo": "Outros", "descricao": "x", "valor": 300.0}]},
    )

    result = await tse_service.get_patrimonio_senador("Fulano")

    assert result["total"] == 300.0


async def test_indice_real_carrega_do_arquivo_gerado_pelo_script():
    """Se scripts/build_tse_index.py já rodou nesta máquina, confirma que o
    arquivo real carrega e resolve um caso conhecido (Adriana Ventura,
    valor documentado antes do bloqueio do TSE: R$ 1.203.188,79)."""
    if not tse_service._INDEX_PATH.exists():
        pytest.skip("Indice local nao gerado nesta maquina (rode scripts/build_tse_index.py)")

    result = await tse_service.get_patrimonio_deputado_federal("Adriana Ventura", "Adriana Miguel Ventura")

    assert result["total"] == pytest.approx(1_203_188.79, abs=0.01)
