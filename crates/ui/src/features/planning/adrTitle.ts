import { ADR } from '@/bindings';

export function deriveAdrDocTitle(body: string): string {
  const lines = body.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const heading = trimmed.match(/^#{1,6}\s+(.+)$/)?.[1]?.trim() ?? '';
    const candidate = (heading || trimmed).replace(/\s+/g, ' ').trim();
    if (!candidate) continue;
    if (/^decision$/i.test(candidate)) continue;
    return candidate.slice(0, 120);
  }
  return '';
}

export function deriveAdrHeaderTitle(adr: ADR, fallbackFileName: string): string {
  const docTitle = deriveAdrDocTitle(adr.body);
  if (docTitle) return docTitle;
  if (adr.metadata.title?.trim()) return adr.metadata.title.trim();
  return fallbackFileName.replace(/\.md$/i, '');
}
