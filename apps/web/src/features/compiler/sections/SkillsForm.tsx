import { SkillListEditor } from '@ship/ui'
import type { Skill } from '@ship/ui'

interface Props {
  skills: Skill[]
  onChange: (skills: Skill[]) => void
}

export function SkillsForm({ skills, onChange }: Props) {
  return <SkillListEditor skills={skills} onChange={onChange} />
}
