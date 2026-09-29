import asyncio

from app.services.camara_service import _fetch_camara_json


async def main():
    data_inicio = "2026-03-14"

    votacoes_list = []
    pagina = 1

    print("=" * 70)
    print("TESTE DO FLUXO DE VOTAÇÕES DA BANCADA")
    print("=" * 70)

    while True:
        payload = await _fetch_camara_json(
            "/votacoes",
            params={
                "dataInicio": data_inicio,
                "itens": 100,
                "pagina": pagina,
                "ordem": "DESC",
                "ordenarPor": "dataHoraRegistro",
            },
        )

        dados = payload.get("dados", [])

        print(f"Página {pagina}: {len(dados)} registros")

        if not dados:
            break

        plen = [
            v for v in dados
            if v.get("siglaOrgao") == "PLEN"
        ]

        print(f"  PLEN encontrados nesta página: {len(plen)}")

        votacoes_list.extend(plen)

        links = payload.get("links", [])

        tem_proxima = any(
            link.get("rel") == "next"
            for link in links
        )

        print(f"  Possui próxima página: {tem_proxima}")

        if not tem_proxima:
            break

        pagina += 1

    print()
    print("=" * 70)
    print(f"TOTAL DE PLEN ENCONTRADOS: {len(votacoes_list)}")
    print("=" * 70)

    print()
    print("PRIMEIRAS 20 VOTAÇÕES:")

    for i, v in enumerate(votacoes_list[:20], 1):
        print(
            f"{i:02d}. "
            f"{v.get('id')} | "
            f"{v.get('data')} | "
            f"{v.get('descricao', '')[:80]}"
        )


if __name__ == "__main__":
    asyncio.run(main())