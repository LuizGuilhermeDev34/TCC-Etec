interface Slice {
  value: number;
  color: string;
  label: string;
}

export function DonutChart({ slices }: { slices: Slice[] }) {
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  if (total === 0) return (
    <div className="flex h-36 w-36 items-center justify-center rounded-full bg-slate-100">
      <span className="text-xs text-slate-400">Sem dados</span>
    </div>
  );

  const r = 56;
  const ri = 34;
  const cx = 70;
  const cy = 70;

  const paths: { d: string; color: string }[] = [];
  let angle = -Math.PI / 2;

  for (const sl of slices) {
    if (sl.value === 0) continue;
    const sweep = (sl.value / total) * 2 * Math.PI;
    const end = angle + sweep;
    const large = sweep > Math.PI ? 1 : 0;
    const cos1 = Math.cos(angle), sin1 = Math.sin(angle);
    const cos2 = Math.cos(end), sin2 = Math.sin(end);
    paths.push({
      d: [
        `M ${cx + r * cos1} ${cy + r * sin1}`,
        `A ${r} ${r} 0 ${large} 1 ${cx + r * cos2} ${cy + r * sin2}`,
        `L ${cx + ri * cos2} ${cy + ri * sin2}`,
        `A ${ri} ${ri} 0 ${large} 0 ${cx + ri * cos1} ${cy + ri * sin1}`,
        "Z",
      ].join(" "),
      color: sl.color,
    });
    angle = end;
  }

  return (
    <svg viewBox="0 0 140 140" className="h-36 w-36">
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.color} stroke="white" strokeWidth={2} />
      ))}
    </svg>
  );
}
