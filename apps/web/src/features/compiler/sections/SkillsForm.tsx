import { useState } from 'react'
import { Plus, Trash2, BookOpen, FileText } from 'lucide-react'
import { MarkdownEditor } from '@ship/primitives'
import type { Skill } from '@ship/ui'

interface Props {
  skills: Skill[]
  onChange: (skills: Skill[]) => void
}

const EMPTY: Skill = {
  id: '',
  name: '',
  content: '',
  description: null,
  source: 'custom',
  author: null,
  version: null,
}

export function SkillsForm({ skills, onChange }: Props) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(skills.length > 0 ? 0 : null)

  const add = () => {
    const next = [...skills, { ...EMPTY, id: `skill-${Date.now()}`, name: 'New Skill' }]
    onChange(next)
    setSelectedIdx(next.length - 1)
  }

  const remove = (idx: number) => {
    const next = skills.filter((_, i) => i !== idx)
    onChange(next)
    setSelectedIdx(next.length > 0 ? Math.min(idx, next.length - 1) : null)
  }

  const update = (idx: number, patch: Partial<Skill>) => {
    onChange(skills.map((s, i) => (i === idx ? { ...s, ...patch } : s)))
  }

  const selected = selectedIdx !== null ? skills[selectedIdx] : null

  return (
    <div className="flex gap-0 border border-border/60 rounded-xl overflow-hidden" style={{ minHeight: '480px' }}>
      {/* Left: file list */}
      <div className="w-48 shrink-0 flex flex-col border-r border-border/60 bg-muted/20">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Skills</span>
          <button
            onClick={add}
            className="flex size-5 items-center justify-center rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition"
            title="New skill"
          >
            <Plus className="size-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {skills.length === 0 && (
            <p className="px-3 py-4 text-center text-[11px] text-muted-foreground">No skills yet.</p>
          )}
          {skills.map((skill, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIdx(idx)}
              className={`group flex w-full items-center gap-2 px-2.5 py-2 text-left transition ${
                selectedIdx === idx
                  ? 'bg-primary/10 text-foreground'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              }`}
            >
              <FileText className="size-3 shrink-0 opacity-60" />
              <span className="flex-1 truncate text-[11px] font-medium">
                {skill.name || <span className="italic opacity-60">Unnamed</span>}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); remove(idx) }}
                className="flex size-4 shrink-0 items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:text-destructive transition"
                title="Delete skill"
              >
                <Trash2 className="size-2.5" />
              </button>
            </button>
          ))}
        </div>

        <div className="border-t border-border/60 p-2">
          <button
            onClick={add}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-primary/30 bg-primary/5 py-2 text-[11px] font-medium text-primary transition hover:bg-primary/10"
          >
            <Plus className="size-3" />
            New skill
          </button>
        </div>
      </div>

      {/* Right: editor */}
      <div className="flex flex-1 min-w-0 flex-col">
        {selected && selectedIdx !== null ? (
          <>
            {/* Skill metadata row */}
            <div className="flex items-center gap-3 border-b border-border/60 px-4 py-2.5 bg-card/50">
              <BookOpen className="size-3.5 shrink-0 text-muted-foreground" />
              <input
                value={selected.name}
                onChange={(e) => update(selectedIdx, { name: e.target.value })}
                placeholder="Skill name"
                className="flex-1 bg-transparent text-sm font-semibold placeholder:text-muted-foreground/60 focus:outline-none min-w-0"
                spellCheck={false}
              />
              <input
                value={selected.id}
                onChange={(e) => update(selectedIdx, { id: e.target.value })}
                placeholder="id (slug)"
                className="w-32 bg-transparent font-mono text-[11px] text-muted-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                spellCheck={false}
              />
            </div>

            {/* Markdown editor */}
            <div className="flex-1 min-h-0 overflow-hidden p-3">
              <MarkdownEditor
                value={selected.content ?? ''}
                onChange={(v) => update(selectedIdx, { content: v })}
                placeholder="Write your skill in markdown. Use headings, rules, examples..."
                fillHeight
                showStats={false}
                showFrontmatter={false}
                showAiActions={false}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
            <BookOpen className="size-8 opacity-20" />
            <div>
              <p className="text-sm font-medium">Select a skill to edit</p>
              <p className="mt-1 text-xs opacity-60">Or create a new one to get started.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
