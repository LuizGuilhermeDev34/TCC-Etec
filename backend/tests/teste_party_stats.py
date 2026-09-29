import asyncio
import httpx

from app.services.camara_service import _fetch_votacao_party_stats


async def main():
    votacao = {
        "id": "2629954-8",
        "data": "2026-06-03",
        "descricao": "Aprovado o Requerimento de Urgência",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        resultado = await _fetch_votacao_party_stats(
            client,
            votacao,
            "PT",
        )

    print("=" * 70)
    print("TESTE _fetch_votacao_party_stats")
    print("=" * 70)
    print()
    print(f"Votação: {votacao['id']}")
    print(f"Partido: PT")
    print()

    if resultado is None:
        print("RESULTADO: None")
        print("A função descartou a votação.")
    else:
        print("RESULTADO:")
        print(resultado)

    print()
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(main())