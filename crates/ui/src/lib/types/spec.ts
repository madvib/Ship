import type { SpecDocument as RawSpecDocument, SpecInfo as RawSpecInfo } from '@/bindings';

export interface SpecInfo extends RawSpecInfo { }

export interface SpecDocument extends RawSpecDocument { }

export function toSpecInfo(entry: RawSpecInfo): SpecInfo {
  return entry;
}

export function toSpecDocument(entry: RawSpecDocument): SpecDocument {
  return entry;
}

export function stubSpecDocument(entry: SpecInfo, content = ''): SpecDocument {
  return {
    ...entry,
    content,
  };
}
