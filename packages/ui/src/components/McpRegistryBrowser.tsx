import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Plus, ExternalLink, Loader2, AlertCircle, Server, RefreshCw } from 'lucide-react'
import type { McpRegistryServer, McpServerConfig } from '../types'

const REGISTRY_API = 'https://registry.modelcontextprotocol.io'

interface RegistryResponse {
  servers: McpRegistryServer[]
  total?: number
  next?: string | null
}

interface Props {
  onAdd: (server: McpServerConfig) => void
  addedIds?: Set<string>
}

export function McpRegistryBrowser({ onAdd, addedIds = new Set() }: Props) {
  const [query, setQuery] = useState('')
  const [servers, setServers] = useState<McpRegistryServer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchServers = useCallback(async (q: string, append = false) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      params.set('per_page', '20')
      const res = await fetch(`${REGISTRY_API}/api/v0/servers?${params}`)
      if (!res.ok) throw new Error(`Registry returned ${res.status}`)
      const data = (await res.json()) as RegistryResponse
      const list = data.servers ?? []
      setServers(append ? (prev) => [...prev, ...list] : list)
      setHasMore(!!data.next)
      setCursor(data.next ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load registry')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    void fetchServers('')
  }, [fetchServers])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void fetchServers(query)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, fetchServers])

  const loadMore = () => {
    if (cursor) void fetchServers(query, true)
  }

  const addToConfig = (s: McpRegistryServer) => {
    const pkg = s.package
    const server: McpServerConfig = {
      name: s.id ?? s.name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      command: pkg?.command ?? (pkg?.registry === 'npm' ? 'npx' : pkg?.registry === 'pypi' ? 'uvx' : 'npx'),
      args: pkg?.args ?? (pkg?.name ? ['-y', pkg.name] : []),
      env: {},
      server_type: 'stdio',
      scope: 'project',
      disabled: false,
      url: null,
      timeout_secs: null,
    }
    onAdd(server)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search MCP servers..."
          className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
        {loading && (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground animate-spin" />
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => void fetchServers(query)}
            className="ml-auto flex items-center gap-1 opacity-70 hover:opacity-100"
          >
            <RefreshCw className="size-3" /> Retry
          </button>
        </div>
      )}

      {/* Results */}
      <div className="space-y-1.5">
        {servers.length === 0 && !loading && !error && (
          <p className="py-6 text-center text-xs text-muted-foreground">No servers found.</p>
        )}

        {servers.map((s) => {
          const isAdded = addedIds.has(s.id ?? s.name)
          return (
            <div
              key={s.id ?? s.name}
              className="group flex items-start gap-2.5 rounded-xl border border-border/60 bg-card/50 p-3 transition hover:border-border hover:bg-card"
            >
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 mt-0.5">
                <Server className="size-3.5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-xs font-semibold truncate">{s.name}</p>
                  {s.vendor?.name && (
                    <span className="text-[10px] text-muted-foreground">by {s.vendor.name}</span>
                  )}
                  {s.tags?.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
                {s.description && (
                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground line-clamp-2">
                    {s.description}
                  </p>
                )}
                {s.package?.name && (
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground/60">{s.package.name}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {s.homepage && (
                  <a
                    href={s.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex size-6 items-center justify-center rounded text-muted-foreground/60 transition hover:text-foreground"
                    aria-label="Open homepage"
                  >
                    <ExternalLink className="size-3" />
                  </a>
                )}
                <button
                  onClick={() => addToConfig(s)}
                  disabled={isAdded}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                    isAdded
                      ? 'bg-muted text-muted-foreground cursor-default'
                      : 'bg-primary/10 text-primary hover:bg-primary/20'
                  }`}
                >
                  {isAdded ? (
                    'Added'
                  ) : (
                    <>
                      <Plus className="size-3" /> Add
                    </>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-border/60 py-2 text-xs text-muted-foreground transition hover:text-foreground disabled:opacity-50"
        >
          {loading ? <Loader2 className="size-3.5 animate-spin" /> : null}
          Load more
        </button>
      )}

      <p className="text-center text-[10px] text-muted-foreground">
        Powered by{' '}
        <a
          href="https://registry.modelcontextprotocol.io"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground"
        >
          modelcontextprotocol.io
        </a>
      </p>
    </div>
  )
}
