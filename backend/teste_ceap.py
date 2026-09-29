import httpx
import zipfile
import io
import csv

r = httpx.get(
    "https://www.camara.leg.br/cotas/Ano-2025.csv.zip",
    timeout=60,
)

r.raise_for_status()

z = zipfile.ZipFile(io.BytesIO(r.content))
f = z.open("Ano-2025.csv")

reader = csv.DictReader(
    (line.decode("utf-8-sig") for line in f),
    delimiter=";",
)

totais = {}
registros = {}
deputados = {}

partidos_teste = [
    "MISSAO",
    "PL",
    "PT",
    "NOVO",
    "PSOL",
    "REPUBLICANOS",
]

for row in reader:
    partido = (row.get("sgPartido") or "").strip()

    if not partido:
        continue

    valor = float(row.get("vlrLiquido") or 0)

    totais[partido] = totais.get(partido, 0) + valor
    registros[partido] = registros.get(partido, 0) + 1

    ide = (row.get("ideCadastro") or "").strip()

    if ide:
        deputados.setdefault(partido, set()).add(ide)

print("VALIDACAO CEAP 2025")
print("=" * 70)

for partido in partidos_teste:
    print()
    print(partido)
    print(f"  Registros: {registros.get(partido, 0):,}")
    print(f"  Deputados: {len(deputados.get(partido, set()))}")
    print(f"  Total:     R$ {totais.get(partido, 0):,.2f}")

print()
print("=" * 70)
print(f"Partidos encontrados: {len(totais)}")
