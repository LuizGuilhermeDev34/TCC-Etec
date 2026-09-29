import asyncio
from app.services.camara_service import get_partido_by_id, get_deputados


async def main():
    partido_id = 38011

    partido = await get_partido_by_id(partido_id)

    print("=" * 70)
    print("TESTE DOS DEPUTADOS DA BANCADA")
    print("=" * 70)

    if not partido:
        print("Partido não encontrado.")
        return

    print(f"Partido: {partido['sigla']} - {partido['nome']}")
    print()

    deputados = await get_deputados()

    membros = [
        d for d in deputados
        if d.sigla_partido.upper() == partido["sigla"].upper()
    ]

    print(f"Membros encontrados: {len(membros)}")
    print()

    for d in membros[:10]:
        print(
            f"ID: {d.id} | "
            f"Nome: {d.nome} | "
            f"UF: {d.sigla_uf} | "
            f"Partido: {d.sigla_partido}"
        )


if __name__ == "__main__":
    asyncio.run(main())