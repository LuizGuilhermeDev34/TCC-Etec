"""
Regressao de 2026-08-13: o comparador mostrava CEAP como "R$ 0 (menor =
melhor)" quando na verdade a Camara nao devolveu nenhuma despesa pra
nenhum dos dois lados (fonte vazia, verificado ao vivo), nao zero real.
_get_deputado_data precisa expor despesas_indisponivel pro front distinguir
os dois casos.
"""
from app.api.v1.endpoints import comparar
from app.models.deputado_detail import DeputadoDetail


def _fake_detail(dep_id: int) -> DeputadoDetail:
    return DeputadoDetail(
        id=dep_id,
        nome=f"Deputado {dep_id}",
        nome_civil=f"Deputado {dep_id}",
        sigla_partido="PDT",
        sigla_uf="RJ",
        id_legislatura=57,
    )


async def test_get_deputado_data_marca_despesas_indisponivel_quando_vazio(monkeypatch):
    async def fake_detail(dep_id):
        return _fake_detail(dep_id)

    async def fake_proposicoes(dep_id):
        return [], 0

    async def fake_despesas(dep_id):
        return []

    async def fake_patrimonio(nome, nome_civil):
        return {"total": 0.0}

    monkeypatch.setattr(comparar, "get_deputado_detail", fake_detail)
    monkeypatch.setattr(comparar, "get_deputado_proposicoes", fake_proposicoes)
    monkeypatch.setattr(comparar, "get_deputado_despesas", fake_despesas)
    monkeypatch.setattr(comparar, "get_patrimonio_deputado_federal", fake_patrimonio)

    data = await comparar._get_deputado_data(1)

    assert data["despesas_indisponivel"] is True
    assert data["gastos_total"] == 0


async def test_get_deputado_data_com_despesas_reais_nao_marca_indisponivel(monkeypatch):
    from app.models.deputado_despesa import DeputadoDespesa

    async def fake_detail(dep_id):
        return _fake_detail(dep_id)

    async def fake_proposicoes(dep_id):
        return [], 0

    async def fake_despesas(dep_id):
        return [DeputadoDespesa(
            ano=2026, mes=1, tipo_despesa="Combustiveis", valor_liquido=250.0,
            nome_fornecedor="Posto X", data_documento=None, url_documento=None,
        )]

    async def fake_patrimonio(nome, nome_civil):
        return {"total": 0.0}

    monkeypatch.setattr(comparar, "get_deputado_detail", fake_detail)
    monkeypatch.setattr(comparar, "get_deputado_proposicoes", fake_proposicoes)
    monkeypatch.setattr(comparar, "get_deputado_despesas", fake_despesas)
    monkeypatch.setattr(comparar, "get_patrimonio_deputado_federal", fake_patrimonio)

    data = await comparar._get_deputado_data(1)

    assert data["despesas_indisponivel"] is False
    assert data["gastos_total"] == 250.0
