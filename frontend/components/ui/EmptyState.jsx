export function EmptyState({ icon, title, hint, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center">
      {icon ? <div className="mb-3 text-zinc-400">{icon}</div> : null}
      <p className="text-sm font-semibold text-zinc-900">{title}</p>
      {hint ? <p className="mt-1 max-w-sm text-sm text-zinc-500">{hint}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
