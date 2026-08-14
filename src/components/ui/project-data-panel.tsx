export type ProjectDataField = { label: string; value: string | number | null | undefined };

export function ProjectDataPanel({ title = "Project data", fields }: { title?: string; fields: ProjectDataField[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      <h3 className="mb-4 font-semibold">{title}</h3>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.label}>
            <dt className="text-muted-foreground">{f.label}</dt>
            <dd className="mt-0.5 font-medium">{f.value || "—"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
