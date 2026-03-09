import {
    Tag,
    FileText,
    Circle,
    PlayCircle,
    Archive
} from 'lucide-react';
import {
    Badge,
    Button,
    FacetedFilter,
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from '@ship/ui';
import { BaseMetadataHeader } from '../common/BaseMetadataHeader';
import { MetadataPopover } from '../common/MetadataPopover';

interface SpecHeaderMetadataProps {
    fileName: string;
    status: string;
    onMoveStatus?: (status: string) => Promise<void> | void;
    movingStatus?: boolean;
    tags?: string[];
    isEditing: boolean;
    onUpdate: (updates: {
        tags?: string[];
    }) => void;
    tagSuggestions?: string[];
}

const STATUS_OPTIONS = [
    { value: 'draft', label: 'Draft', icon: Circle },
    { value: 'active', label: 'Active', icon: PlayCircle },
    { value: 'archived', label: 'Archived', icon: Archive },
];

export function SpecHeaderMetadata({
    fileName,
    status,
    onMoveStatus,
    movingStatus = false,
    tags = [],
    isEditing,
    onUpdate,
    tagSuggestions = [],
}: SpecHeaderMetadataProps) {
    const statusOption = STATUS_OPTIONS.find((option) => option.value === status) ?? STATUS_OPTIONS[0];

    return (
        <BaseMetadataHeader>
            {/* Status Popover */}
            <MetadataPopover
                icon={statusOption.icon}
                label={statusOption.label}
                title="Move Spec"
                contentClassName="w-44 p-2"
            >
                <div className="space-y-1">
                    {STATUS_OPTIONS.map((option) => (
                        <Button
                            key={option.value}
                            variant="ghost"
                            size="xs"
                            className="h-8 w-full justify-start gap-2"
                            onClick={() => {
                                if (!onMoveStatus || option.value === status || movingStatus) return;
                                void Promise.resolve(onMoveStatus(option.value)).catch(() => {
                                    // Shared workspace error state captures move failures.
                                });
                            }}
                            disabled={!onMoveStatus || movingStatus || option.value === status}
                        >
                            <option.icon className="size-3.5" />
                            {option.label}
                        </Button>
                    ))}
                </div>
            </MetadataPopover>

            {/* File Name Info */}
            <div className="flex items-center gap-1.5 shrink-0">
                <FileText className="size-3.5" />
                <span className="font-medium text-foreground">{fileName}</span>
            </div>

            {/* Tags Popover */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <div>
                        <MetadataPopover
                            icon={Tag}
                            label={tags.length > 0 ? `${tags.length} Tag${tags.length === 1 ? '' : 's'}` : 'No tags'}
                            title="Tags"
                            triggerClassName="shrink-0"
                            contentClassName="w-64 p-3"
                        >
                            <div className="flex flex-wrap gap-1.5">
                                {tags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="h-5 px-1.5 text-[10px] font-normal uppercase">
                                        {tag}
                                    </Badge>
                                ))}
                                {tags.length === 0 && (
                                    <span className="text-xs text-muted-foreground italic">No tags</span>
                                )}
                            </div>
                            {isEditing && (
                                <FacetedFilter
                                    title="Edit Tags"
                                    options={tagSuggestions.map(t => ({ value: t, label: t }))}
                                    selectedValues={tags}
                                    onSelectionChange={(next) => onUpdate({ tags: next })}
                                    allowNew
                                    onAddNew={(tag) => onUpdate({ tags: [...tags, tag] })}
                                />
                            )}
                        </MetadataPopover>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">View and manage tags for this spec.</TooltipContent>
            </Tooltip>
        </BaseMetadataHeader>
    );
}
