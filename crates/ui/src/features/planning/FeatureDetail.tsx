import { useCallback, useEffect, useState } from 'react';
import { FeatureDocument } from '@/bindings';
import MarkdownEditor from '@/components/editor';
import FeatureMetadataPanel from '@/components/editor/FeatureMetadataPanel';
import DetailSheet from './DetailSheet';
import { Button } from '@/components/ui/button';

interface FeatureDetailProps {
  feature: FeatureDocument;
  releaseSuggestions?: string[];
  specSuggestions?: string[];
  adrSuggestions?: string[];
  tagSuggestions?: string[];
  mcpEnabled?: boolean;
  onClose: () => void;
  onSave: (fileName: string, content: string) => Promise<void> | void;
}

export default function FeatureDetail({
  feature,
  releaseSuggestions = [],
  specSuggestions = [],
  adrSuggestions = [],
  tagSuggestions = [],
  mcpEnabled = true,
  onClose,
  onSave,
}: FeatureDetailProps) {
  const [content, setContent] = useState(feature.content);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setContent(feature.content);
    setDirty(false);
    setSaving(false);
  }, [feature]);

  const saveFeature = useCallback(async () => {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      await onSave(feature.file_name, content);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }, [content, dirty, feature.file_name, onSave, saving]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void saveFeature();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, saveFeature]);

  return (
    <DetailSheet
      label="Feature"
      title={<h2 className="truncate text-xl font-semibold tracking-tight">{feature.title}</h2>}
      meta={<p className="text-muted-foreground text-xs">{feature.file_name}</p>}
      onClose={onClose}
      className="max-w-[1800px]"
      bodyScrollable={false}
      bodyClassName="overflow-hidden p-0"
      footerClassName="px-3 py-2 md:px-4 md:py-2.5"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="min-h-0 h-full p-2 md:p-3">
        <MarkdownEditor
          toolbarStart={
            <Button size="xs" className="h-7 px-2 text-xs" onClick={() => void saveFeature()} disabled={!dirty || saving}>
              {saving ? 'Saving…' : 'Save Feature'}
            </Button>
          }
          value={content}
          onChange={(next) => {
            setContent(next);
            setDirty(true);
          }}
          frontmatterPanel={({ frontmatter, delimiter, onChange }) => (
            <FeatureMetadataPanel
              frontmatter={frontmatter}
              delimiter={delimiter}
              defaultTitle={feature.title}
              defaultStatus={feature.status}
              releaseSuggestions={releaseSuggestions}
              specSuggestions={specSuggestions}
              adrSuggestions={adrSuggestions}
              tagSuggestions={tagSuggestions}
              onChange={onChange}
            />
          )}
          mcpEnabled={mcpEnabled}
          fillHeight
          defaultMode="doc"
        />
      </div>
    </DetailSheet>
  );
}
