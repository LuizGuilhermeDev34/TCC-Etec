import asyncio

from app.services.camara_service import (
    _fetch_camara_json,
    _VOTOS_SUFFIX_RE,
)


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

    candidatas = []

    for v in votacoes_list:
        descricao = v.get("descricao") or ""

        if _VOTOS_SUFFIX_RE.search(descricao):
            candidatas.append(v)

    print("=" * 70)
    print("ANÁLISE DAS VOTAÇÕES PLEN")
    print("=" * 70)
    print()
    print(f"Total de PLEN: {len(votacoes_list)}")
    print(f"Candidatas nominais pelo placar textual: {len(candidatas)}")
    print()

    print("PRIMEIRAS CANDIDATAS:")
    print()

    for i, v in enumerate(candidatas[:30], 1):
        descricao = (v.get("descricao") or "").replace("\n", " ")

        print(
            f"{i:02d}. "
            f"{v.get('id')} | "
            f"{v.get('data')} | "
            f"{descricao[:160]}"
        )

    print()
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(main())