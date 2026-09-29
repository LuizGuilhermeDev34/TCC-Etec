import httpx
import zipfile
import io
import csv

r = httpx.get(
    "https://www.camara.leg.br/cotas/Ano-2025.csv.zip",
    timeout=60,
)

z = zipfile.ZipFile(io.BytesIO(r.content))
f = z.open("Ano-2025.csv")

reader = csv.DictReader(
    (line.decode("utf-8-sig") for line in f),
    delimiter=";",
)

totais = {}

for row in reader:
    partido = (row.get("sgPartido") or "").strip()
    valor = float(row.get("vlrLiquido") or 0)

    if not partido:
        continue

    totais[partido] = totais.get(partido, 0) + valor

print("TOTAIS POR PARTIDO - CEAP 2025")
print("=" * 50)

for partido, total in sorted(totais.items(), key=lambda x: x[1], reverse=True):
    print(f"{partido:10} R$ {total:,.2f}")

print("=" * 50)
print("Partidos:", len(totais))
print("Total:", f"R$ {sum(totais.values()):,.2f}")