// Shown when a lead's site has been requested but not generated yet.
//
// Deliberately not a partial render of whatever data happens to exist. A
// catalog-assembled stand-in looks like a finished website, which meant an
// operator could send a client a link to something that was never built --
// and the client would judge the work by it.
export function NotBuiltYet({ businessName }: { businessName: string }) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6 py-24">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 h-1 w-16 rounded-full bg-primary" />
        <h1 className="font-display text-2xl font-bold tracking-tight">{businessName}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This site is being designed. It will appear here as soon as the build finishes.
        </p>
      </div>
    </main>
  );
}
