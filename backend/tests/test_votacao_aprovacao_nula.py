"""
Regressao de 2026-09-03 (F-02 da auditoria de codigo, o achado critico de
prioridade 1): a Camara deixa o campo aprovacao null quando uma votacao nao
tem resultado binario registrado (destaque, supressao de texto -- ex:
"Mantido o texto."). _to_votacao fazia `int(data.get("aprovacao") or 0)`,
convertendo "sem resultado" em "Rejeitado" -- confirmado ao vivo em ~3-5%
das votacoes reais amostradas (2024/2025/2026), sempre no mesmo padrao de
descricao. O selo vermelho "Rejeitado" que aparecia nesses cards nunca foi
informado pela Camara.
"""
from app.services import camara_service


def _payload(aprovacao, descricao="Mantido o texto. Sim: 335; Não: 117; Abstenção: 5; Total: 457."):
    return {
        "id": "1",
        "data": "2026-07-15",
        "dataHoraRegistro": "2026-07-15T15:00:00",
        "siglaOrgao": "PLEN",
        "proposicaoObjeto": None,
        "descricao": descricao,
        "aprovacao": aprovacao,
    }


def test_aprovacao_null_da_camara_preserva_none_nao_vira_zero():
    v = camara_service._to_votacao(_payload(None))
    assert v.aprovacao is None


def test_aprovacao_1_continua_1():
    v = camara_service._to_votacao(_payload(1))
    assert v.aprovacao == 1


def test_aprovacao_0_continua_0_nao_confundido_com_null():
    v = camara_service._to_votacao(_payload(0))
    assert v.aprovacao == 0


def test_aprovacao_ausente_do_payload_tambem_vira_none():
    payload = _payload(1)
    del payload["aprovacao"]
    v = camara_service._to_votacao(payload)
    assert v.aprovacao is None
