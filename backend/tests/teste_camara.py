import asyncio
import time

from app.services.camara_service import get_partido_votacoes_stats


async def main():
    print("=" * 70)
    print("TESTE DA get_partido_votacoes_stats")
    print("=" * 70)

    partido_id = 36844

    print()
    print(f"PARTIDO: {partido_id}")
    print("EXECUTANDO...")
    print()

    inicio = time.perf_counter()

    result = await get_partido_votacoes_stats(partido_id)

    fim = time.perf_counter()

    print("=" * 70)
    print("RESULTADO")
    print("=" * 70)

    print(f"Total SIM: {result.get('total_sim', 0)}")
    print(f"Total NÃO: {result.get('total_nao', 0)}")
    print(f"Total ABSTENÇÃO: {result.get('total_abstencao', 0)}")
    print(f"Votações de mérito: {result.get('votacoes_merito_count', 0)}")
    print(f"Votações processuais: {result.get('votacoes_procedural_count', 0)}")
    print(f"Votações retornadas: {len(result.get('votacoes', []))}")
    print(f"Tempo total: {fim - inicio:.2f} segundos")

    print()
    print("VOTAÇÕES RETORNADAS:")

    for v in result.get("votacoes", []):
        print(
            f"{v.get('id')} | "
            f"{v.get('data')} | "
            f"SIM: {v.get('sim')} | "
            f"NÃO: {v.get('nao')} | "
            f"ABST: {v.get('abstencao')} | "
            f"MÉRITO: {v.get('merito')}"
        )


if __name__ == "__main__":
    asyncio.run(main())
    