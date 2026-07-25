export function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-foreground">{title}</h1>
      <div className="rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          This page is being built in the next phase and isn't wired up yet.
        </p>
      </div>
    </div>
  );
}
