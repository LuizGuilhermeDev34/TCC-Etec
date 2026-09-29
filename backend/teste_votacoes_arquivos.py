import csv
import time
from datetime import date, timedelta
from pathlib import Path

from app.services.camara_service import _eh_merito


PASTA = Path("tmp_votacoes")

VOTACOES = PASTA / "votacoes-2026.csv"
VOTOS = PASTA / "votacoesVotos-2026.csv"

IDS_PARTIDO = {"204536"}

data_inicio = date.today() - timedelta(days=180)

inicio_total = time.perf_counter()

# =========================================================
# 1. VOTACOES: periodo + PLEN + placar nominal
# =========================================================

votacoes = {}

with VOTACOES.open(
    "r",
    encoding="utf-8-sig",
    newline="",
) as arquivo:
    reader = csv.DictReader(
        arquivo,
        delimiter=";",
    )

    for row in reader:
        if (row.get("siglaOrgao") or "").strip() != "PLEN":
            continue

        data_str = (row.get("data") or "").strip()

        if not data_str:
            continue

        try:
            data_votacao = date.fromisoformat(data_str[:10])
        except ValueError:
            continue

        if data_votacao < data_inicio:
            continue

        descricao = (row.get("descricao") or "").strip()

        votacao_id = (row.get("id") or "").strip()

        if not votacao_id:
            continue

        # Mesmo criterio de candidatura usado hoje:
        # precisa haver placar Sim/Nao/Total.
        if not (
            "Sim:" in descricao
            and "Não:" in descricao
            and "Total:" in descricao
        ):
            continue

        votacoes[votacao_id] = {
            "id": votacao_id,
            "data": data_str,
            "descricao": descricao,
        }

# =========================================================
# 2. VOTOS: somente votacoes relevantes + bancada
# =========================================================

resultado = {}

with VOTOS.open(
    "r",
    encoding="utf-8-sig",
    newline="",
) as arquivo:
    reader = csv.DictReader(
        arquivo,
        delimiter=";",
    )

    for row in reader:
        votacao_id = (row.get("idVotacao") or "").strip()

        if votacao_id not in votacoes:
            continue

        deputado_id = (row.get("deputado_id") or "").strip()

        if deputado_id not in IDS_PARTIDO:
            continue

        voto = (row.get("voto") or "").strip().upper()

        item = resultado.setdefault(
            votacao_id,
            {
                "sim": 0,
                "nao": 0,
                "abstencao": 0,
            },
        )

        if voto == "SIM":
            item["sim"] += 1
        elif voto in ("NAO", "NÃO"):
            item["nao"] += 1
        else:
            item["abstencao"] += 1

# =========================================================
# 3. CLASSIFICACAO COM O CLASSIFICADOR REAL DO PROJETO
# =========================================================

merito = []
procedurais = []

for votacao_id, votos in resultado.items():
    descricao = votacoes[votacao_id]["descricao"]

    eh_merito = _eh_merito(
        descricao,
        nominal_confirmado=True,
    )

    item = {
        "id": votacao_id,
        "data": votacoes[votacao_id]["data"],
        "descricao": descricao,
        "sim": votos["sim"],
        "nao": votos["nao"],
        "abstencao": votos["abstencao"],
        "merito": eh_merito,
    }

    if eh_merito:
        merito.append(item)
    else:
        procedurais.append(item)

merito.sort(
    key=lambda x: x["data"],
    reverse=True,
)

procedurais.sort(
    key=lambda x: x["data"],
    reverse=True,
)

total_sim = sum(x["sim"] for x in merito)
total_nao = sum(x["nao"] for x in merito)
total_abstencao = sum(x["abstencao"] for x in merito)

print("=" * 70)
print("RESULTADO FINAL - MESMO CLASSIFICADOR DO PROJETO")
print("=" * 70)

print("Votacoes candidatas:", len(votacoes))
print("Votacoes com voto da bancada:", len(resultado))
print("Merito:", len(merito))
print("Procedurais:", len(procedurais))
print("SIM:", total_sim)
print("NAO:", total_nao)
print("ABSTENCAO:", total_abstencao)

print()
print("10 MAIS RECENTES")

for item in sorted(
    resultado.keys(),
    key=lambda vid: votacoes[vid]["data"],
    reverse=True,
)[:10]:
    votos = resultado[item]
    print()
    print(item)
    print(votacoes[item]["data"])
    print("MERITO:", _eh_merito(
        votacoes[item]["descricao"],
        nominal_confirmado=True,
    ))
    print("SIM:", votos["sim"])
    print("NAO:", votos["nao"])
    print("ABST:", votos["abstencao"])
    print(votacoes[item]["descricao"][:180])

print()
print("=" * 70)
print(f"TEMPO TOTAL: {time.perf_counter() - inicio_total:.3f}s")
