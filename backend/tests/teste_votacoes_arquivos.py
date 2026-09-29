
import csv
import time
from pathlib import Path

import httpx


BASE_URL = "https://dadosabertos.camara.leg.br/arquivos"

ANO = 2026

ARQUIVOS = {
    "votacoes": f"{BASE_URL}/votacoes/csv/votacoes-{ANO}.csv",
    "votos": f"{BASE_URL}/votacoesVotos/csv/votacoesVotos-{ANO}.csv",
}

PASTA = Path("tmp_ceap_votacoes")
PASTA.mkdir(exist_ok=True)


def baixar(nome: str, url: str) -> Path:
    destino = PASTA / Path(url).name

    if destino.exists():
        print(f"[CACHE] {destino}")
        return destino

    print(f"[DOWNLOAD] {url}")

    inicio = time.perf_counter()

    with httpx.stream("GET", url, timeout=120.0, follow_redirects=True) as response:
        response.raise_for_status()

        with destino.open("wb") as arquivo:
            for chunk in response.iter_bytes():
                arquivo.write(chunk)

    segundos = time.perf_counter() - inicio

    print(f"[OK] {destino}")
    print(f"[TEMPO] {segundos:.2f}s")
    print(f"[TAMANHO] {destino.stat().st_size / 1024 / 1024:.2f} MB")

    return destino


def mostrar_cabecalho(caminho: Path):
    print()
    print("=" * 70)
    print(caminho.name)
    print("=" * 70)

    with caminho.open("r", encoding="utf-8-sig", newline="") as arquivo:
        reader = csv.reader(arquivo)

        cabecalho = next(reader)

        for i, coluna in enumerate(cabecalho):
            print(f"{i}: {coluna}")


def main():
    inicio_total = time.perf_counter()

    votacoes = baixar("votacoes", ARQUIVOS["votacoes"])
    votos = baixar("votos", ARQUIVOS["votos"])

    mostrar_cabecalho(votacoes)
    mostrar_cabecalho(votos)

    print()
    print("=" * 70)
    print(f"TEMPO TOTAL: {time.perf_counter() - inicio_total:.2f}s")


if __name__ == "__main__":
    main()