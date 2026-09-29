import type { ReactNode } from "react";
import { getGlossarioInfo } from "../utils/glossario";
import { tipoColor } from "../utils/TipoColors";

type GlossarioTooltipProps = {
  termo: string;
  children?: ReactNode;
  className?: string;
  mostrarInterrogacao?: boolean;
};

export function GlossarioTooltip({
  termo,
  children,
  className = "",
  mostrarInterrogacao = true,
}: GlossarioTooltipProps) {
  const info = getGlossarioInfo(termo);

  if (!info) {
    return <>{children ?? termo}</>;
  }

  const chave = termo.trim().toUpperCase();

  const ehTipoProposicao = [
    "PL",
    "PEC",
    "PDC",
    "MPV",
    "PDL",
    "PLP",
    "REQ",
    "RIC",
    "MSC",
    "INC",
  ].includes(chave);

  const classeBase = ehTipoProposicao
    ? tipoColor(chave)
    : "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <span className="relative group/glossario inline-block">
      <span
        className={`cursor-help rounded border px-2 py-0.5 text-xs font-semibold ${classeBase} ${className}`}
      >
        {children ?? info.nome}

        {mostrarInterrogacao && (
          <span className="ml-1 text-[9px] opacity-50">?</span>
        )}
      </span>

      <span
        className="
          pointer-events-none
          absolute
          bottom-full
          left-[calc(50%+20px)]
          z-50
          mb-2
          w-72
          -translate-x-1/2
          rounded-lg
          border
          border-slate-200
          bg-white
          p-3
          text-left
          shadow-xl
          opacity-0
          transition-opacity
          duration-150
          group-hover/glossario:opacity-100
        "
      >
        <span className="block text-xs font-bold text-slate-800">
          {info.nome}
        </span>

        <span className="mt-1 block text-[11px] leading-relaxed text-slate-500">
          {info.descricao}
        </span>
      </span>
    </span>
  );
}