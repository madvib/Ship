import { PROVIDERS } from '../types'

interface Props {
  selected: string[]
  activeMode: string
  onToggle: (id: string) => void
  onModeChange: (mode: string) => void
}

export function ProvidersForm({ selected, activeMode, onToggle, onModeChange }: Props) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        {PROVIDERS.map((p) => {
          const checked = selected.includes(p.id)
          return (
            <label
              key={p.id}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${
                checked
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-border/60 bg-card/50 hover:border-border hover:bg-card'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(p.id)}
                className="mt-1 accent-primary"
              />
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background p-1.5">
                  {p.logo ? (
                    <img src={p.logo} alt={p.name} className="size-full object-contain dark:invert" />
                  ) : (
                    <span className="text-[10px] font-bold text-muted-foreground">{p.name.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-none">{p.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{p.description}</p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-0.5 pt-0.5">
                {p.files.map((f) => (
                  <span key={f} className="block text-right font-mono text-[9px] text-muted-foreground/60">{f}</span>
                ))}
              </div>
            </label>
          )
        })}
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-foreground">
          Active mode <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <p className="mb-2 text-[11px] text-muted-foreground">
          Filter MCP servers and providers by workspace mode — e.g. <code className="rounded bg-muted px-1 text-[10px]">planning</code>, <code className="rounded bg-muted px-1 text-[10px]">coding</code>.
        </p>
        <input
          type="text"
          value={activeMode}
          onChange={(e) => onModeChange(e.target.value)}
          placeholder="Leave blank for all"
          className="h-8 w-full rounded-lg border border-border bg-muted px-3 text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
      </div>
    </div>
  )
}
