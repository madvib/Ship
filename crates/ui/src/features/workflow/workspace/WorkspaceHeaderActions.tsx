import { useMemo, useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@ship/ui';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';
import { ModeConfig } from '@/bindings';
import { WorkspaceRow } from './types';

const WORKSPACE_MODE_DEFAULT = '__workspace_default__';
const CREATE_MODE_DEFAULT = '__mode_default__';

type WorkspaceTypeOption = 'feature' | 'patch' | 'service';

interface CreateWorkspaceInput {
  branch: string;
  workspaceType: WorkspaceTypeOption;
  environmentId: string | null;
  modeId: string | null;
  featureId: string | null;
  specId: string | null;
  releaseId: string | null;
}

interface WorkspaceLinkOption {
  id: string;
  label: string;
}

interface WorkspaceHeaderActionsProps {
  detail: WorkspaceRow | null;
  modeOptions: ModeConfig[];
  creatingWorkspace: boolean;
  deletingWorkspace: boolean;
  updatingWorkspaceMode: boolean;
  environmentOptions: WorkspaceLinkOption[];
  featureOptions: WorkspaceLinkOption[];
  specOptions: WorkspaceLinkOption[];
  releaseOptions: WorkspaceLinkOption[];
  onCreateWorkspace: (input: CreateWorkspaceInput) => Promise<void>;
  onDeleteWorkspace: (branch: string) => Promise<void>;
  onUpdateWorkspaceMode: (modeId: string | null) => Promise<void>;
}

export function WorkspaceHeaderActions({
  detail,
  modeOptions,
  creatingWorkspace,
  deletingWorkspace,
  updatingWorkspaceMode,
  environmentOptions,
  featureOptions,
  specOptions,
  releaseOptions,
  onCreateWorkspace,
  onDeleteWorkspace,
  onUpdateWorkspaceMode,
}: WorkspaceHeaderActionsProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createBranch, setCreateBranch] = useState('');
  const [createType, setCreateType] = useState<WorkspaceTypeOption>('feature');
  const [createModeId, setCreateModeId] = useState<string>(CREATE_MODE_DEFAULT);
  const [createEnvironmentId, setCreateEnvironmentId] = useState<string>('');
  const [createFeatureId, setCreateFeatureId] = useState<string>('');
  const [createSpecId, setCreateSpecId] = useState<string>('');
  const [createReleaseId, setCreateReleaseId] = useState<string>('');

  const modeLabelById = useMemo(
    () =>
      new Map(
        modeOptions.map((mode) => [mode.id, mode.name ?? mode.id] as const)
      ),
    [modeOptions]
  );

  const modeSelectValue = useMemo(() => {
    if (!detail?.activeMode) return WORKSPACE_MODE_DEFAULT;
    return modeLabelById.has(detail.activeMode)
      ? detail.activeMode
      : WORKSPACE_MODE_DEFAULT;
  }, [detail?.activeMode, modeLabelById]);

  const createModeValue = useMemo(() => {
    if (createModeId === CREATE_MODE_DEFAULT) return CREATE_MODE_DEFAULT;
    return modeLabelById.has(createModeId) ? createModeId : CREATE_MODE_DEFAULT;
  }, [createModeId, modeLabelById]);

  const resetCreateWorkspaceDraft = () => {
    setCreateDialogOpen(false);
    setCreateBranch('');
    setCreateType('feature');
    setCreateModeId(CREATE_MODE_DEFAULT);
    setCreateEnvironmentId('');
    setCreateFeatureId('');
    setCreateSpecId('');
    setCreateReleaseId('');
  };

  const handleDelete = async () => {
    if (!detail) return;
    const confirmed = window.confirm(
      `Delete workspace '${detail.branch}'? This removes runtime workspace/session state for this branch.`
    );
    if (!confirmed) return;
    await onDeleteWorkspace(detail.branch);
  };

  const handleCreate = async () => {
    const branch = createBranch.trim();
    if (!branch) return;
    await onCreateWorkspace({
      branch,
      workspaceType: createType,
      environmentId: createEnvironmentId.trim() || null,
      modeId: createModeId === CREATE_MODE_DEFAULT ? null : createModeId,
      featureId: createFeatureId.trim() || null,
      specId: createSpecId.trim() || null,
      releaseId: createReleaseId.trim() || null,
    });
    resetCreateWorkspaceDraft();
  };

  return (
    <div className="flex items-center gap-2">
      {detail && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Select
                value={modeSelectValue}
                onValueChange={(next) =>
                  void onUpdateWorkspaceMode(
                    next === WORKSPACE_MODE_DEFAULT ? null : next
                  )
                }
                disabled={updatingWorkspaceMode}
              >
                <SelectTrigger size="sm" className="h-8 w-40 text-xs">
                  <SelectValue placeholder="Mode: Default">
                    {(value) => {
                      if (!value || value === WORKSPACE_MODE_DEFAULT) {
                        return 'Mode: Default';
                      }
                      const asString = String(value);
                      return `Mode: ${modeLabelById.get(asString) ?? 'Default'}`;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={WORKSPACE_MODE_DEFAULT}>
                    Default (service)
                  </SelectItem>
                  {modeOptions.map((mode) => (
                    <SelectItem key={mode.id} value={mode.id}>
                      {mode.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TooltipTrigger>
          <TooltipContent>Workspace mode override. Applies to this branch only.</TooltipContent>
        </Tooltip>
      )}

      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          if (open) {
            setCreateDialogOpen(true);
            return;
          }
          resetCreateWorkspaceDraft();
        }}
      >
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="size-3.5" />
          New Workspace
        </Button>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Workspace</DialogTitle>
            <DialogDescription>
              Create a feature/patch/service workspace and activate it.
              Optional environment profile seeds initial settings; each workspace keeps its own configuration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={createBranch}
              onChange={(event) => setCreateBranch(event.target.value)}
              placeholder="feature/auth-session-recovery"
            />
            <Select
              value={createType}
              onValueChange={(value) =>
                setCreateType(value as WorkspaceTypeOption)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="feature">feature</SelectItem>
                <SelectItem value="patch">patch</SelectItem>
                <SelectItem value="service">service</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={createModeValue}
              onValueChange={(value) =>
                setCreateModeId(value ?? CREATE_MODE_DEFAULT)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Service Default Mode">
                  {(value) => {
                    if (!value || value === CREATE_MODE_DEFAULT) {
                      return 'Service Default Mode';
                    }
                    const asString = String(value);
                    return modeLabelById.get(asString) ?? 'Service Default Mode';
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CREATE_MODE_DEFAULT}>
                  Service Default Mode
                </SelectItem>
                {modeOptions.map((mode) => (
                  <SelectItem key={mode.id} value={mode.id}>
                    {mode.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              list="create-workspace-environment-options"
              value={createEnvironmentId}
              onChange={(event) => setCreateEnvironmentId(event.target.value)}
              placeholder="Environment profile id (optional)"
            />
            <datalist id="create-workspace-environment-options">
              {environmentOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </datalist>
            <Input
              list="create-workspace-feature-options"
              value={createFeatureId}
              onChange={(event) => setCreateFeatureId(event.target.value)}
              placeholder="Link feature id (optional)"
            />
            <datalist id="create-workspace-feature-options">
              {featureOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </datalist>
            <Input
              list="create-workspace-spec-options"
              value={createSpecId}
              onChange={(event) => setCreateSpecId(event.target.value)}
              placeholder="Link spec id (optional)"
            />
            <datalist id="create-workspace-spec-options">
              {specOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </datalist>
            <Input
              list="create-workspace-release-options"
              value={createReleaseId}
              onChange={(event) => setCreateReleaseId(event.target.value)}
              placeholder="Link release id (optional)"
            />
            <datalist id="create-workspace-release-options">
              {releaseOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </datalist>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={resetCreateWorkspaceDraft}
              disabled={creatingWorkspace}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleCreate()}
              disabled={creatingWorkspace || !createBranch.trim()}
            >
              {creatingWorkspace ? (
                <RefreshCw className="size-3.5 animate-spin" />
              ) : (
                <Plus className="size-3.5" />
              )}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button
        size="sm"
        variant="outline"
        className="h-8 gap-1.5 text-status-red"
        onClick={() => void handleDelete()}
        disabled={!detail || deletingWorkspace}
      >
        {deletingWorkspace ? (
          <RefreshCw className="size-3.5 animate-spin" />
        ) : (
          <Trash2 className="size-3.5" />
        )}
        Delete
      </Button>
    </div>
  );
}
