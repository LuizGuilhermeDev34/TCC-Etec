import asyncio
import httpx


async def main():
    deputado_id = 204536

    url = (
        "https://dadosabertos.camara.leg.br/api/v2/"
        f"deputados/{deputado_id}/despesas"
    )

    print("=" * 70)
    print("TESTE DIRETO DE DESPESAS")
    print("=" * 70)
    print(f"Deputado: Kim Kataguiri")
    print(f"ID: {deputado_id}")
    print()

    async with httpx.AsyncClient(timeout=20.0) as client:
        for ano in [2025, 2026]:
            try:
                response = await client.get(
                    url,
                    params={
                        "ano": ano,
                        "itens": 100,
                    },
                )

                print(f"ANO {ano}")
                print(f"HTTP: {response.status_code}")

                if not response.is_success:
                    print(response.text[:500])
                    print()
                    continue

                payload = response.json()
                dados = payload.get("dados", [])

                print(f"Registros: {len(dados)}")

                if dados:
                    print("Primeiro registro:")
                    print(dados[0])
                else:
                    print("dados: []")

                print()

            except Exception as e:
                print(
                    f"Erro no ano {ano}: "
                    f"{type(e).__name__}: {e}"
                )

    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(main())