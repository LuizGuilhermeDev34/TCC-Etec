import asyncio
import httpx

from app.services.camara_service import _fetch_camara_json


async def main():
    data_inicio = "2026-03-14"

    votacoes_list = []
    pagina = 1

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

        if not dados:
            break

        votacoes_list.extend(
            v
            for v in dados
            if v.get("siglaOrgao") == "PLEN"
        )

        links = payload.get("links", [])
        tem_proxima = any(
            link.get("rel") == "next"
            for link in links
        )

        if not tem_proxima:
            break

        pagina += 1

    candidatas = [
        v
        for v in votacoes_list
        if "Sim:" in (v.get("descricao") or "")
        and "Não:" in (v.get("descricao") or "")
        and "Total:" in (v.get("descricao") or "")
    ]

    print("=" * 70)
    print("TESTE DAS 10 PRIMEIRAS CANDIDATAS NOMINAIS")
    print("=" * 70)

    async with httpx.AsyncClient(timeout=15.0) as client:
        for i, v in enumerate(candidatas[:10], 1):
            vid = v.get("id")

            try:
                resp = await client.get(
                    f"https://dadosabertos.camara.leg.br/api/v2/votacoes/{vid}/votos"
                )

                if not resp.is_success:
                    print(
                        f"{i:02d}. {vid} -> HTTP {resp.status_code}"
                    )
                    continue

                votos = resp.json().get("dados", [])

                print(
                    f"{i:02d}. {vid} | "
                    f"{v.get('data')} | "
                    f"votos individuais: {len(votos)}"
                )

            except Exception as e:
                print(
                    f"{i:02d}. {vid} -> ERRO: {type(e).__name__}: {e}"
                )

    print()
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(main())