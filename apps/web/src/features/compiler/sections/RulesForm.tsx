import { RuleListEditor } from '@ship/ui'
import type { Rule } from '@ship/ui'

interface Props {
  rules: Rule[]
  onChange: (rules: Rule[]) => void
}

export function RulesForm({ rules, onChange }: Props) {
  return <RuleListEditor rules={rules} onChange={onChange} />
}
