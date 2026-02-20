export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">K</span>
          </div>
          <span className="font-semibold text-2xl text-foreground tracking-tight">
            Krown
          </span>
        </div>

        <div className="bg-card rounded-xl p-8 border border-border">
          {children}
        </div>
      </div>
    </div>
  );
}
