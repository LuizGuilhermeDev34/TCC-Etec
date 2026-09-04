"""
Achado da auditoria de código (F-28): _to_votacao e _fetch_votacao_party_stats
tinham cada um sua própria expressão pra decidir "é mérito?", que podiam
divergir silenciosamente pra uma mesma votação. Unificadas em _eh_merito().
Estes testes travam o critério compartilhado.
"""
from app.services.camara_service import _eh_merito


def test_nominal_e_de_merito_via_placar_no_texto():
    desc = "Aprovado o Projeto de Lei. Sim: 276; Não: 67; Total: 343."
    assert _eh_merito(desc) is True


def test_nominal_mas_procedural_nao_e_merito():
    desc = "Aprovado o Requerimento. Sim: 276; Não: 67; Total: 343."
    assert _eh_merito(desc) is False


def test_sem_placar_e_sem_confirmacao_nao_e_nominal():
    desc = "Aprovado por unanimidade."
    assert _eh_merito(desc) is False


def test_nominal_confirmado_dispensa_placar_no_texto():
    desc = "Aprovado o Projeto de Lei."
    assert _eh_merito(desc, nominal_confirmado=True) is True


def test_nominal_confirmado_ainda_exclui_procedural():
    desc = "Aprovado o Parecer."
    assert _eh_merito(desc, nominal_confirmado=True) is False
