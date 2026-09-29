import asyncio
from app.services.camara_service import _fetch_camara_json


async def main():
    print("=" * 70)
    print("TESTE DE PAGINAÇÃO DA API DE VOTAÇÕES")
    print("=" * 70)

    for pagina in range(1, 6):
        payload = await _fetch_camara_json(
            "/votacoes",
            params={
                "dataInicio": "2026-03-14",
                "itens": 100,
                "pagina": pagina,
                "ordem": "DESC",
                "ordenarPor": "dataHoraRegistro",
            },
        )

        dados = payload.get("dados", [])
        links = payload.get("links", [])

        plen = [
            v for v in dados
            if v.get("siglaOrgao") == "PLEN"
        ]

        rels = [
            link.get("rel")
            for link in links
        ]

        print()
        print(f"PÁGINA {pagina}")
        print(f"Total de registros: {len(dados)}")
        print(f"PLEN encontrados: {len(plen)}")
        print(f"Links: {rels}")

    print()
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(main())