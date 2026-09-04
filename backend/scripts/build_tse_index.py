"""
Gera um índice local de patrimônio do TSE a partir dos ZIPs oficiais já
baixados manualmente (a fonte bloqueia download direto de IP de datacenter
— confirmado ao vivo, ver F-04 da auditoria de código: os ZIPs e até a
home do TSE retornam 403 da Akamai a partir de nuvem, mas carregam normal
de uma rede residencial).

Uso:
    python scripts/build_tse_index.py <consulta_cand_2022.zip> <bem_candidato_2022.zip>

Gera backend/app/data/tse_patrimonio_2022.json, que tse_service.py passa a
ler localmente em vez de baixar da rede a cada cold start.
"""
import csv
import io
import json
import sys
import zipfile
from pathlib import Path
from typing import Any, Dict, Iterator, List, Set

_CARGOS_RELEVANTES = {"5", "6", "7"}  # 5=Senador, 6=Dep.Federal, 7=Dep.Estadual


def _iter_csv_from_zip(path: str, encoding: str = "latin-1") -> Iterator[Dict[str, str]]:
    with zipfile.ZipFile(path) as zf:
        brasil = [n for n in zf.namelist() if "BRASIL" in n.upper() and n.endswith(".csv")]
        name = brasil[0] if brasil else zf.namelist()[0]
        with zf.open(name) as f:
            reader = csv.DictReader(io.TextIOWrapper(f, encoding=encoding), delimiter=";")
            for row in reader:
                yield row


def build(cand_zip: str, bens_zip: str) -> Dict[str, Any]:
    print(f"Lendo candidatos de {cand_zip}...")
    ci: Dict[str, List[Dict[str, str]]] = {}
    sqs_relevantes: Set[str] = set()
    total_rows = 0
    for row in _iter_csv_from_zip(cand_zip):
        total_rows += 1
        cargo = row.get("CD_CARGO", "")
        if cargo not in _CARGOS_RELEVANTES:
            continue
        nome = row.get("NM_CANDIDATO", "").upper().strip()
        sq = row.get("SQ_CANDIDATO", "")
        if not nome or not sq:
            continue
        ci.setdefault(nome, []).append({"sq": sq, "uf": row.get("SG_UF", ""), "cargo": cargo})
        sqs_relevantes.add(sq)
    print(f"  {total_rows:,} candidatos no arquivo, {len(sqs_relevantes):,} relevantes (cargos {_CARGOS_RELEVANTES})")

    print(f"Lendo bens de {bens_zip}...")
    bi: Dict[str, List[Dict[str, Any]]] = {}
    total_bens_rows = 0
    for row in _iter_csv_from_zip(bens_zip):
        total_bens_rows += 1
        sq = row.get("SQ_CANDIDATO", "").strip()
        if not sq or sq not in sqs_relevantes:
            continue
        valor_str = row.get("VR_BEM_CANDIDATO", "0").replace(".", "").replace(",", ".")
        try:
            valor = float(valor_str)
        except ValueError:
            valor = 0.0
        bi.setdefault(sq, []).append({
            "tipo": row.get("DS_TIPO_BEM_CANDIDATO", "Outros"),
            "descricao": row.get("DS_BEM_CANDIDATO", ""),
            "valor": valor,
        })
    print(f"  {total_bens_rows:,} itens de bens no arquivo, {len(bi):,} candidatos relevantes com bens declarados")

    # Só mantém no índice de candidatos quem tem bens declarados — um
    # candidato sem nenhum bem sempre devolveria {} de qualquer forma
    # (_get_patrimonio já trata "sem bens" = indisponível), então indexá-lo
    # só infla o arquivo sem nunca mudar o resultado de uma busca.
    ci_com_bens: Dict[str, List[Dict[str, str]]] = {}
    for nome, candidatos in ci.items():
        filtrados = [c for c in candidatos if c["sq"] in bi]
        if filtrados:
            ci_com_bens[nome] = filtrados

    print(f"  {len(ci):,} nomes no índice de candidatos, {len(ci_com_bens):,} após remover quem não tem bens")

    return {"candidatos": ci_com_bens, "bens": bi}


def main() -> None:
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)

    cand_zip, bens_zip = sys.argv[1], sys.argv[2]
    data = build(cand_zip, bens_zip)

    out_dir = Path(__file__).resolve().parent.parent / "app" / "data"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "tse_patrimonio_2022.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))

    size_mb = out_path.stat().st_size / (1024 * 1024)
    print(f"\nGravado {out_path} — {size_mb:.1f} MB")


if __name__ == "__main__":
    main()
