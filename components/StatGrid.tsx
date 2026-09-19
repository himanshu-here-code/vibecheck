export function StatGrid({
  issues, passed, files,
}: { issues: number; passed: number; files: number }) {
  const stats = [
    { label: 'Issues', value: issues, bg: '#fbbf24' },
    { label: 'Passed', value: passed, bg: '#34d399' },
    { label: 'Files',  value: files,  bg: '#38bdf8' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bd bs rounded-2xl px-5 py-6 text-center"
          style={{ background: s.bg }}
        >
          <div className="headline text-4xl tabular-nums sm:text-5xl">{s.value}</div>
          <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em]">
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}