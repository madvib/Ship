import { useState } from 'react';
import {
  AdrEntry,
  Config,
  DEFAULT_STATUSES,
  IssueEntry,
  LogEntry,
  Project,
  ProjectConfig,
  SpecDocument,
  SpecEntry,
} from '../types';
import { getActiveProject, listLogEntries } from '../platform/tauri/commands';
import { isTauriRuntime } from '../platform/tauri/runtime';
import { applyTheme, SIDEBAR_COLLAPSED_STORAGE_KEY, projectFromInfo } from './workspace/constants';
import { useWorkspaceLifecycle } from './workspace/useWorkspaceLifecycle';
import { useProjectActions } from './workspace/useProjectActions';
import { useIssueActions } from './workspace/useIssueActions';
import { useAdrActions } from './workspace/useAdrActions';
import { useSpecActions } from './workspace/useSpecActions';
import { useSettingsActions } from './workspace/useSettingsActions';

export function useWorkspaceController() {
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [detectedProject, setDetectedProject] = useState<Project | null>(null);
  const [detectingProject, setDetectingProject] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [issues, setIssues] = useState<IssueEntry[]>([]);
  const [adrs, setAdrs] = useState<AdrEntry[]>([]);
  const [specs, setSpecs] = useState<SpecEntry[]>([]);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [config, setConfig] = useState<Config>({});
  const [projectConfig, setProjectConfig] = useState<ProjectConfig | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<IssueEntry | null>(null);
  const [selectedAdr, setSelectedAdr] = useState<AdrEntry | null>(null);
  const [selectedSpec, setSelectedSpec] = useState<SpecDocument | null>(null);
  const [showNewIssue, setShowNewIssue] = useState(false);
  const [showNewAdr, setShowNewAdr] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === '1';
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const statuses = projectConfig?.statuses?.length ? projectConfig.statuses : DEFAULT_STATUSES;

  const { loadProjectData, loadProjectConfig, refreshDetectedProject } = useWorkspaceLifecycle({
    activeProject,
    sidebarCollapsed,
    setIssues,
    setAdrs,
    setSpecs,
    setLogEntries,
    setProjectConfig,
    setDetectedProject,
    setDetectingProject,
    setRecentProjects,
    setConfig,
    setError,
    setLoading,
  });

  const refreshLog = async () => {
    if (!isTauriRuntime()) return;
    const entries = await listLogEntries().catch(() => []);
    setLogEntries(entries);
  };

  const refreshProjectInfo = async () => {
    if (!isTauriRuntime()) return;
    const info = await getActiveProject().catch(() => null);
    if (info) setActiveProject(projectFromInfo(info));
  };

  const {
    handleOpenProject,
    handleNewProject,
    handlePickProjectDirectory,
    handleCreateProjectFromForm,
    handleSelectProject,
  } = useProjectActions({
    setError,
    setActiveProject,
    setDetectedProject,
    setSelectedIssue,
    setSelectedAdr,
    setSelectedSpec,
    setCreatingProject,
    loadProjectData,
    loadProjectConfig,
  });

  const {
    handleCreateIssue,
    handleStatusChange,
    handleSaveIssue,
    handleDeleteIssue,
  } = useIssueActions({
    issues,
    setIssues,
    setSelectedIssue,
    setShowNewIssue,
    setError,
    refreshLog,
    refreshProjectInfo,
  });

  const {
    handleCreateAdr,
    handleSelectAdr,
    handleSaveAdr,
    handleDeleteAdr,
  } = useAdrActions({
    setAdrs,
    setSelectedAdr,
    setShowNewAdr,
    setError,
    refreshLog,
  });

  const {
    handleSelectSpec,
    handleCreateSpec,
    handleSaveSpec,
    handleDeleteSpec,
  } = useSpecActions({
    setSpecs,
    setSelectedSpec,
    setError,
    refreshLog,
  });

  const { handleSaveSettings, handleSaveProjectSettings } = useSettingsActions({
    setConfig,
    setProjectConfig,
    setError,
  });

  const noProject = !activeProject;
  const tagSuggestions = Array.from(
    new Set(
      issues
        .flatMap((entry) => entry.issue?.metadata?.tags ?? [])
        .filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0)
    )
  ).sort((a, b) => a.localeCompare(b));
  const mcpEnabled = config.mcp_enabled !== false;

  return {
    activeProject,
    detectedProject,
    detectingProject,
    creatingProject,
    recentProjects,
    issues,
    adrs,
    specs,
    logEntries,
    config,
    projectConfig,
    selectedIssue,
    selectedAdr,
    selectedSpec,
    showNewIssue,
    showNewAdr,
    sidebarCollapsed,
    error,
    loading,
    statuses,
    noProject,
    tagSuggestions,
    mcpEnabled,
    setSelectedIssue,
    setSelectedAdr,
    setSelectedSpec,
    setShowNewIssue,
    setShowNewAdr,
    setSidebarCollapsed,
    setError,
    refreshDetectedProject,
    handleOpenProject,
    handleNewProject,
    handlePickProjectDirectory,
    handleCreateProjectFromForm,
    handleSelectProject,
    handleCreateIssue,
    handleStatusChange,
    handleSaveIssue,
    handleDeleteIssue,
    handleCreateAdr,
    handleSelectAdr,
    handleSaveAdr,
    handleDeleteAdr,
    handleSelectSpec,
    handleCreateSpec,
    handleSaveSpec,
    handleDeleteSpec,
    refreshLog,
    handleSaveSettings,
    handleSaveProjectSettings,
    applyTheme,
  };
}
