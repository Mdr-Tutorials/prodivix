import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Box,
  Layers,
  Workflow,
  Clock,
  MoreHorizontal,
  Globe,
  Trash2,
  Pencil,
  Check,
  CloudUpload,
  Copy,
  Lock,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { EditorBarExitModal } from './EditorBar/EditorBarExitModal';
import { TIPS, type TipId } from './tips';
import { truncate } from '@prodivix/shared/safety';
import NewResourceModal from './features/newfile/NewResourceModal';
import { editorApi, type ProjectSummary } from './editorApi';
import { useAuthStore } from '@/auth/useAuthStore';
import { isAbortError } from '@/infra/api';
import { useEditorShortcut } from './shortcuts';
import { useEditorStore } from './store/useEditorStore';
import {
  deleteLocalProject,
  duplicateLocalProject,
  isLocalProjectId,
  isSyncedLocalProject,
  listLocalProjectRecords,
  markLocalProjectSynced,
  updateLocalProject,
  type LocalProjectRecord,
} from './localProjectStore';

type ProjectHomeItem = ProjectSummary & {
  source: 'remote' | 'local';
  localRecord?: LocalProjectRecord;
};

type ProjectBusyState =
  | 'publishing'
  | 'deleting'
  | 'renaming'
  | 'syncing'
  | 'duplicating';

const toRemoteItem = (project: ProjectSummary): ProjectHomeItem => ({
  ...project,
  source: 'remote',
});

const toLocalItem = (project: LocalProjectRecord): ProjectHomeItem => ({
  id: project.id,
  resourceType: project.resourceType,
  name: project.name,
  description: project.description,
  isPublic: project.isPublic,
  starsCount: project.starsCount,
  createdAt: project.createdAt,
  updatedAt: project.updatedAt,
  source: 'local',
  localRecord: project,
});

function EditorTipsRandom() {
  const { t } = useTranslation('editor');
  const tipsCount = TIPS.length;
  const [scores, setScores] = useState(() => Array(tipsCount).fill(1));
  const [active, setActive] = useState(0);

  const pickNextTip = useCallback(() => {
    const weights = scores.map((score) => 1 / score);
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * total;
    let next = 0;
    for (let index = 0; index < tipsCount; index++) {
      if (random < weights[index]) {
        next = index;
        break;
      }
      random -= weights[index];
    }
    if (next === active && tipsCount > 1) next = (active + 1) % tipsCount;
    setScores((prev) => {
      const clone = [...prev];
      clone[next] += 1;
      return clone;
    });
    setActive(next);
  }, [scores, active, tipsCount]);

  useEffect(() => {
    const timer = setInterval(pickNextTip, 5000);
    return () => clearInterval(timer);
  }, [pickNextTip]);

  const clickNext = () => pickNextTip();
  const tipId = TIPS[active] as TipId;

  return (
    <div
      className="mt-auto cursor-pointer p-[12px] text-center text-(length:--font-size-md) text-(--text-muted) select-none hover:text-(--text-primary)"
      onClick={clickNext}
    >
      <p>
        {t('tips.prefix')} {t(`tips.items.${tipId}.body`)}
      </p>
    </div>
  );
}

function ProjectCard({
  project,
  onOpen,
  onRename,
  onPublish,
  onSync,
  onDuplicate,
  onDelete,
  canSyncLocalProject,
  isRenaming,
  isPublishing,
  isSyncing,
  isDuplicating,
  isDeleting,
}: {
  project: ProjectHomeItem;
  onOpen: (project: ProjectHomeItem) => void;
  onRename: (project: ProjectHomeItem, name: string) => Promise<boolean>;
  onPublish: (project: ProjectHomeItem) => void;
  onSync: (project: ProjectHomeItem) => void;
  onDuplicate: (project: ProjectHomeItem) => void;
  onDelete: (project: ProjectHomeItem) => void;
  canSyncLocalProject: boolean;
  isRenaming: boolean;
  isPublishing: boolean;
  isSyncing: boolean;
  isDuplicating: boolean;
  isDeleting: boolean;
}) {
  const { t } = useTranslation('editor');
  const [isActionsOpen, setActionsOpen] = useState(false);
  const [draftName, setDraftName] = useState(project.name || '');
  const [isEditingName, setEditingName] = useState(false);
  const isClonedProject = /\(copy\)\s*$/i.test(project.name || '');
  const isLocalProject =
    project.source === 'local' || isLocalProjectId(project.id);
  const isReadonlyLocalCache = isSyncedLocalProject(project.localRecord);
  const canRename = !isReadonlyLocalCache;

  useEffect(() => {
    if (isEditingName) return;
    setDraftName(project.name || '');
  }, [project.name, isEditingName]);

  const getIcon = () => {
    switch (project.resourceType) {
      case 'project':
        return <Box size={24} />;
      case 'component':
        return <Layers size={24} />;
      case 'nodegraph':
        return <Workflow size={24} />;
      default:
        return <Box size={24} />;
    }
  };

  const formatTime = (value: string) => {
    const date = new Date(value);
    return (
      date.toLocaleDateString() +
      ' ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  };

  const startRename = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!canRename) return;
    setActionsOpen(false);
    setDraftName(project.name || '');
    setEditingName(true);
  };

  const cancelRename = () => {
    setDraftName(project.name || '');
    setEditingName(false);
  };

  const applyRename = async () => {
    if (isRenaming) return;
    const nextName = draftName.trim();
    if (!nextName || nextName === (project.name || '')) {
      cancelRename();
      return;
    }
    const renamed = await onRename(project, nextName);
    if (renamed) setEditingName(false);
  };

  return (
    <div className="group/card relative flex h-full min-h-[280px] w-full flex-col rounded-[16px] border border-(--border-subtle) bg-(--bg-panel) p-[24px] text-left transition-all duration-[300ms] ease-[ease] hover:-translate-y-1 hover:border-(--border-default) hover:bg-(--bg-canvas) hover:shadow-(--shadow-lg)">
      <button
        type="button"
        onClick={() => setActionsOpen((prev) => !prev)}
        aria-label={t('home.card.moreActions', 'More actions')}
        className="absolute top-[14px] right-[14px] z-10 inline-flex h-[30px] w-[30px] items-center justify-center rounded-[9px] border border-(--border-subtle) bg-(--bg-canvas) text-(--text-secondary) transition-colors hover:border-(--border-default) hover:text-(--text-primary)"
      >
        <MoreHorizontal size={16} />
      </button>

      {isActionsOpen && (
        <div className="absolute top-[48px] right-[14px] z-20 flex min-w-[170px] flex-col gap-[6px] rounded-[12px] border border-(--border-subtle) bg-(--bg-canvas) p-[8px] shadow-(--shadow-lg)">
          {isLocalProject ? (
            !isReadonlyLocalCache ? (
              <button
                type="button"
                onClick={() => onSync(project)}
                disabled={isSyncing || isDeleting || !canSyncLocalProject}
                title={
                  canSyncLocalProject
                    ? undefined
                    : t(
                        'home.card.syncSignInRequired',
                        'Sign in to sync local projects.'
                      )
                }
                className="inline-flex items-center gap-[6px] rounded-[8px] border border-(--border-subtle) bg-(--bg-canvas) px-[10px] py-[7px] text-(length:--font-size-xs) text-(--text-primary) transition-colors hover:border-(--border-default) disabled:cursor-not-allowed disabled:opacity-[0.45]"
              >
                <CloudUpload size={14} />
                {isSyncing
                  ? t('home.card.syncing', 'Syncing...')
                  : t('home.card.syncToCloud', 'Sync to Cloud')}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onDuplicate(project)}
                disabled={isDuplicating || isDeleting}
                className="inline-flex items-center gap-[6px] rounded-[8px] border border-(--border-subtle) bg-(--bg-canvas) px-[10px] py-[7px] text-(length:--font-size-xs) text-(--text-primary) transition-colors hover:border-(--border-default) disabled:cursor-not-allowed disabled:opacity-[0.45]"
              >
                <Copy size={14} />
                {isDuplicating
                  ? t('home.card.duplicating', 'Creating copy...')
                  : t('home.card.saveAsLocalCopy', 'Save as Local Copy')}
              </button>
            )
          ) : !project.isPublic ? (
            <button
              type="button"
              onClick={() => onPublish(project)}
              disabled={isPublishing || isDeleting || isClonedProject}
              title={
                isClonedProject
                  ? t(
                      'home.card.publishDisabledReason',
                      'Cloned projects cannot be published.'
                    )
                  : undefined
              }
              className="inline-flex items-center gap-[6px] rounded-[8px] border border-(--border-subtle) bg-(--bg-canvas) px-[10px] py-[7px] text-(length:--font-size-xs) text-(--text-primary) transition-colors hover:border-(--border-default) disabled:cursor-not-allowed disabled:opacity-[0.45]"
            >
              <Globe size={14} />
              {isClonedProject
                ? t('home.card.publishDisabled', 'Publish disabled for copies')
                : isPublishing
                  ? t('home.card.publishing', 'Publishing...')
                  : t('home.card.publish', 'Publish to Community')}
            </button>
          ) : (
            <a
              href={`/community/${project.id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-[6px] rounded-[8px] border border-(--border-subtle) bg-(--bg-canvas) px-[10px] py-[7px] text-(length:--font-size-xs) text-(--text-primary) no-underline transition-colors hover:border-(--border-default)"
            >
              <Globe size={14} />
              {t('home.card.openCommunity', 'Open Community')}
            </a>
          )}
          <button
            type="button"
            onClick={() => onDelete(project)}
            disabled={isPublishing || isDeleting}
            className="inline-flex items-center gap-[6px] rounded-[8px] border border-(--danger-subtle) bg-(--bg-canvas) px-[10px] py-[7px] text-(length:--font-size-xs) text-(--danger-color) transition-colors hover:border-(--danger-hover) disabled:cursor-not-allowed disabled:opacity-[0.45]"
          >
            <Trash2 size={14} />
            {isDeleting
              ? t('home.card.deleting', 'Deleting...')
              : t('home.card.delete', 'Delete Project')}
          </button>
        </div>
      )}

      {isEditingName ? (
        <button
          type="button"
          aria-label={t('home.card.renameConfirm', 'Confirm rename')}
          disabled={isRenaming}
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => {
            event.stopPropagation();
            void applyRename();
          }}
          className="absolute top-[70px] right-[14px] z-10 inline-flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[6px] border border-(--border-default) text-(--text-primary) transition hover:border-(--border-strong) hover:text-(--text-primary) disabled:opacity-[0.5]"
        >
          <Check size={14} />
        </button>
      ) : (
        <button
          type="button"
          onClick={startRename}
          disabled={!canRename}
          aria-label={t('home.card.rename', 'Rename project')}
          className="absolute top-[70px] right-[14px] z-10 inline-flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[6px] border border-transparent text-(--text-muted) opacity-0 transition group-hover/card:opacity-100 hover:border-(--border-default) hover:text-(--text-primary) focus:opacity-100 disabled:hidden"
        >
          <Pencil size={14} />
        </button>
      )}

      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (isActionsOpen) {
            setActionsOpen(false);
            return;
          }
          if (isEditingName) return;
          onOpen(project);
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          if (isEditingName || isActionsOpen) return;
          onOpen(project);
        }}
        className="flex flex-1 cursor-pointer flex-col justify-between border-0 bg-transparent p-0 text-left"
      >
        <div className="flex flex-col gap-[12px]">
          <div className="mb-[8px] text-(--accent-color)">{getIcon()}</div>
          <div className="pr-[36px]">
            {isEditingName ? (
              <input
                autoFocus
                value={draftName}
                disabled={isRenaming}
                aria-label={t('home.card.renameInput', 'Rename project')}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => setDraftName(event.target.value)}
                onBlur={() => {
                  void applyRename();
                }}
                onKeyDown={(event) => {
                  event.stopPropagation();
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    cancelRename();
                    return;
                  }
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void applyRename();
                  }
                }}
                className="h-[30px] w-full rounded-[8px] border border-(--border-default) bg-(--bg-canvas) px-[8px] text-(length:--font-size-lg) font-medium text-(--text-primary) outline-none"
              />
            ) : (
              <div className="flex min-w-0 items-center gap-[8px]">
                <h3 className="m-0 min-w-0 flex-1 text-(length:--font-size-xl) font-medium text-(--text-primary)">
                  <span className="block truncate">
                    {project.name || t('home.card.untitled', 'Untitled')}
                  </span>
                </h3>
                {isLocalProject && (
                  <span className="inline-flex shrink-0 items-center gap-[4px] rounded-[6px] border border-(--border-subtle) px-[6px] py-[2px] text-(length:--font-size-xs) font-medium text-(--text-muted)">
                    {isReadonlyLocalCache && <Lock size={12} />}
                    {isReadonlyLocalCache
                      ? t('home.card.syncedCache', 'Synced cache')
                      : t('home.card.localOnly', 'Local only')}
                  </span>
                )}
              </div>
            )}
          </div>
          <p className="flex items-center justify-between border-t border-(--border-subtle) pt-[16px] text-(length:--font-size-xs) leading-(--line-height-normal) text-(--text-muted)">
            {truncate(project.description || '', 160) ||
              t('home.card.noDescription', 'No description')}
          </p>
        </div>
        <div className="flex items-center gap-[6px] text-(--text-muted)">
          <Clock size={14} />
          <span className="text-(length:--font-size-xs)">
            {formatTime(project.updatedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

function EditorHome() {
  const { t } = useTranslation('editor');
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const hasAuthHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const [isResourceModalOpen, setResourceModalOpen] = useState(false);
  const [isExitModalOpen, setExitModalOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectHomeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyByProject, setBusyByProject] = useState<
    Record<string, ProjectBusyState | undefined>
  >({});
  const setProjectsInStore = useEditorStore((state) => state.setProjects);
  const setProjectInStore = useEditorStore((state) => state.setProject);
  const removeProjectInStore = useEditorStore((state) => state.removeProject);

  useEditorShortcut(
    'Escape',
    () => {
      setExitModalOpen(true);
    },
    {
      enabled: !isResourceModalOpen && !isExitModalOpen,
    }
  );

  useEffect(() => {
    if (!hasAuthHydrated) {
      return;
    }
    if (!isAuthenticated || !token) {
      let cancelled = false;
      setLoadError(null);
      setIsLoading(true);
      void listLocalProjectRecords()
        .then((localProjects) => {
          if (cancelled) return;
          const items = localProjects.map(toLocalItem);
          setProjects(items);
          setProjectsInStore(
            items.map((project) => ({
              id: project.id,
              name: project.name,
              description: project.description,
              type: project.resourceType,
              isPublic: project.isPublic,
              starsCount: project.starsCount,
            }))
          );
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          setLoadError(
            error instanceof Error
              ? error.message
              : t('home.localLoadFailed', 'Failed to load local projects.')
          );
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }

    let cancelled = false;
    const controller =
      typeof AbortController === 'function' ? new AbortController() : null;
    const requestOptions: RequestInit = controller
      ? { signal: controller.signal }
      : {};
    setIsLoading(true);
    setLoadError(null);

    Promise.all([
      editorApi.listProjects(token, requestOptions),
      listLocalProjectRecords(),
    ])
      .then(([{ projects: remoteProjects }, localProjects]) => {
        if (cancelled) return;
        const remoteItems = remoteProjects.map(toRemoteItem);
        const remoteIds = new Set(remoteProjects.map((project) => project.id));
        const unsyncedLocalItems = localProjects
          .filter((project) => {
            const remoteProjectId = project.syncBinding?.remoteProjectId;
            if (!remoteProjectId) return true;
            return !remoteIds.has(remoteProjectId);
          })
          .map(toLocalItem);
        const items = [...remoteItems, ...unsyncedLocalItems];
        setProjects(items);
        setProjectsInStore(
          items.map((project) => ({
            id: project.id,
            name: project.name,
            description: project.description,
            type: project.resourceType,
            isPublic: project.isPublic,
            starsCount: project.starsCount,
          }))
        );
      })
      .catch((error: unknown) => {
        if (cancelled || isAbortError(error)) return;
        setLoadError(
          error instanceof Error ? error.message : 'Failed to load projects.'
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
      controller?.abort();
    };
  }, [hasAuthHydrated, isAuthenticated, token, setProjectsInStore, t]);

  const sortedProjects = useMemo(
    () =>
      [...projects].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [projects]
  );

  const openProject = (project: ProjectHomeItem) => {
    if (project.source === 'local' && isAuthenticated) {
      const remoteProjectId = project.localRecord?.syncBinding?.remoteProjectId;
      if (remoteProjectId) {
        openProject({ ...project, id: remoteProjectId, source: 'remote' });
        return;
      }
    }
    switch (project.resourceType) {
      case 'component':
        navigate(`/editor/project/${project.id}/component`);
        return;
      case 'nodegraph':
        navigate(`/editor/project/${project.id}/nodegraph`);
        return;
      default:
        navigate(`/editor/project/${project.id}/blueprint`);
    }
  };

  const publishProject = async (project: ProjectHomeItem) => {
    const isClonedProject = /\(copy\)\s*$/i.test(project.name || '');
    if (
      isLocalProjectId(project.id) ||
      !token ||
      project.isPublic ||
      busyByProject[project.id] ||
      isClonedProject
    )
      return;
    setBusyByProject((prev) => ({ ...prev, [project.id]: 'publishing' }));
    try {
      const { project: published } = await editorApi.publishProject(
        token,
        project.id
      );
      setProjects((prev) =>
        prev.map((item) =>
          item.id === project.id
            ? {
                ...item,
                isPublic: published.isPublic,
                starsCount: published.starsCount,
                updatedAt: published.updatedAt,
              }
            : item
        )
      );
      setProjectInStore({
        id: published.id,
        name: published.name,
        description: published.description,
        type: published.resourceType,
        isPublic: published.isPublic,
        starsCount: published.starsCount,
      });
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : t('home.card.publishFailed', 'Failed to publish project.')
      );
    } finally {
      setBusyByProject((prev) => ({ ...prev, [project.id]: undefined }));
    }
  };

  const renameProject = async (project: ProjectHomeItem, name: string) => {
    if (isSyncedLocalProject(project.localRecord)) return false;

    if (project.source === 'local' || isLocalProjectId(project.id)) {
      if (busyByProject[project.id]) return false;
      setBusyByProject((prev) => ({ ...prev, [project.id]: 'renaming' }));
      try {
        const renamed = await updateLocalProject(project.id, { name });
        if (!renamed) {
          setLoadError(
            t('home.card.renameFailed', 'Failed to rename project.')
          );
          return false;
        }
        setProjects((prev) =>
          prev.map((item) =>
            item.id === project.id
              ? {
                  ...item,
                  name: renamed.name,
                  description: renamed.description,
                  updatedAt: renamed.updatedAt,
                  localRecord: renamed,
                }
              : item
          )
        );
        setProjectInStore({
          id: renamed.id,
          name: renamed.name,
          description: renamed.description,
          type: renamed.resourceType,
          isPublic: renamed.isPublic,
          starsCount: renamed.starsCount,
        });
        return true;
      } finally {
        setBusyByProject((prev) => ({ ...prev, [project.id]: undefined }));
      }
    }

    if (!token || busyByProject[project.id]) return false;
    setBusyByProject((prev) => ({ ...prev, [project.id]: 'renaming' }));
    try {
      const { project: renamed } = await editorApi.updateProject(
        token,
        project.id,
        {
          name,
        }
      );
      setProjects((prev) =>
        prev.map((item) =>
          item.id === project.id
            ? {
                ...item,
                name: renamed.name,
                description: renamed.description,
                updatedAt: renamed.updatedAt,
              }
            : item
        )
      );
      setProjectInStore({
        id: renamed.id,
        name: renamed.name,
        description: renamed.description,
        type: renamed.resourceType,
        isPublic: renamed.isPublic,
        starsCount: renamed.starsCount,
      });
      return true;
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : t('home.card.renameFailed', 'Failed to rename project.')
      );
      return false;
    } finally {
      setBusyByProject((prev) => ({ ...prev, [project.id]: undefined }));
    }
  };

  const syncLocalProject = async (project: ProjectHomeItem) => {
    if (!token || !isAuthenticated || project.source !== 'local') return;
    if (busyByProject[project.id] || !project.localRecord) return;
    if (isSyncedLocalProject(project.localRecord)) return;

    setBusyByProject((prev) => ({ ...prev, [project.id]: 'syncing' }));
    try {
      const { project: remoteProject, workspace } =
        await editorApi.importLocalProject(token, {
          name: project.localRecord.name,
          description: project.localRecord.description,
          resourceType: project.localRecord.resourceType,
          workspace: project.localRecord.workspace,
        });
      await markLocalProjectSynced(project.id, {
        remoteProjectId: remoteProject.id,
        remoteWorkspaceId: workspace.id,
        workspaceRev: workspace.workspaceRev,
      });
      setProjects((prev) => {
        const withoutLocal = prev.filter((item) => item.id !== project.id);
        const withoutDuplicateRemote = withoutLocal.filter(
          (item) => item.id !== remoteProject.id
        );
        return [toRemoteItem(remoteProject), ...withoutDuplicateRemote];
      });
      setProjectInStore({
        id: remoteProject.id,
        name: remoteProject.name,
        description: remoteProject.description,
        type: remoteProject.resourceType,
        isPublic: remoteProject.isPublic,
        starsCount: remoteProject.starsCount,
      });
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : t('home.card.syncFailed', 'Failed to sync local project.')
      );
    } finally {
      setBusyByProject((prev) => ({ ...prev, [project.id]: undefined }));
    }
  };

  const duplicateProject = async (project: ProjectHomeItem) => {
    if (project.source !== 'local') return;
    if (busyByProject[project.id]) return;
    setBusyByProject((prev) => ({ ...prev, [project.id]: 'duplicating' }));
    try {
      const duplicated = await duplicateLocalProject(project.id, {
        name: t('home.card.localCopyName', '{{name}} (local copy)', {
          name: project.name || t('home.card.untitled', 'Untitled'),
        }),
      });
      if (!duplicated) {
        setLoadError(t('home.card.copyFailed', 'Failed to create local copy.'));
        return;
      }
      setProjects((prev) => [toLocalItem(duplicated), ...prev]);
      setProjectInStore({
        id: duplicated.id,
        name: duplicated.name,
        description: duplicated.description,
        type: duplicated.resourceType,
        isPublic: duplicated.isPublic,
        starsCount: duplicated.starsCount,
      });
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : t('home.card.copyFailed', 'Failed to create local copy.')
      );
    } finally {
      setBusyByProject((prev) => ({ ...prev, [project.id]: undefined }));
    }
  };

  const deleteProject = async (project: ProjectHomeItem) => {
    if (busyByProject[project.id]) return;
    const confirmed = window.confirm(
      t('home.card.deleteConfirm', 'Delete this project permanently?')
    );
    if (!confirmed) return;
    setBusyByProject((prev) => ({ ...prev, [project.id]: 'deleting' }));
    try {
      if (project.source === 'local' || isLocalProjectId(project.id)) {
        await deleteLocalProject(project.id);
        setProjects((prev) => prev.filter((item) => item.id !== project.id));
        removeProjectInStore(project.id);
        return;
      }
      if (!token) return;
      await editorApi.deleteProject(token, project.id);
      setProjects((prev) => prev.filter((item) => item.id !== project.id));
      removeProjectInStore(project.id);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : t('home.card.deleteFailed', 'Failed to delete project.')
      );
    } finally {
      setBusyByProject((prev) => ({ ...prev, [project.id]: undefined }));
    }
  };

  return (
    <div className="flex h-full w-full flex-1 bg-(--bg-canvas) text-(--text-primary)">
      <div className="flex flex-1 flex-col gap-[32px] overflow-y-auto p-[40px]">
        <header className="flex w-full flex-col gap-[8px]">
          <h1 className="m-0 text-(length:--font-size-3xl) leading-[1.25] font-semibold text-(--text-primary)">
            {t('home.welcomeTitle')}
          </h1>
        </header>

        {loadError && (
          <p className="m-0 rounded-[12px] border border-(--border-default) bg-(--bg-panel) p-[12px] text-(length:--font-size-sm) text-(--text-secondary)">
            {loadError}
          </p>
        )}

        <div className="grid auto-rows-[minmax(280px,auto)] grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-[20px] max-[1200px]:grid-cols-3 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
          <button
            className="flex h-full min-h-[280px] w-full cursor-pointer flex-col items-center justify-center rounded-[16px] border-2 border-dashed border-(--border-default) bg-(--bg-panel) text-(length:--font-size-xl) text-(--text-primary) transition-all duration-[300ms] ease-[ease] hover:border-(--border-strong) hover:bg-(--bg-raised)"
            onClick={() => setResourceModalOpen(true)}
          >
            <Plus size={48} />
            <span className="text-(length:--font-size-lg)">
              {t('home.actions.newProject')}
            </span>
          </button>

          {hasAuthHydrated && !isAuthenticated && (
            <div className="flex min-h-[280px] items-center justify-center rounded-[16px] border border-(--border-subtle) bg-(--bg-panel) p-[24px] text-(length:--font-size-sm) text-(--text-muted)">
              {t(
                'home.localModeHint',
                'Local projects are saved in this browser. Sign in to sync and publish.'
              )}
            </div>
          )}

          {isLoading && (
            <div className="flex min-h-[280px] items-center justify-center rounded-[16px] border border-(--border-subtle) bg-(--bg-panel) p-[24px] text-(length:--font-size-sm) text-(--text-muted)">
              {t('common.loading', 'Loading...')}
            </div>
          )}

          {!isLoading &&
            sortedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={openProject}
                onRename={renameProject}
                onPublish={publishProject}
                onSync={syncLocalProject}
                onDuplicate={duplicateProject}
                onDelete={deleteProject}
                canSyncLocalProject={Boolean(isAuthenticated && token)}
                isRenaming={busyByProject[project.id] === 'renaming'}
                isPublishing={busyByProject[project.id] === 'publishing'}
                isSyncing={busyByProject[project.id] === 'syncing'}
                isDuplicating={busyByProject[project.id] === 'duplicating'}
                isDeleting={busyByProject[project.id] === 'deleting'}
              />
            ))}
        </div>

        <div className="mt-auto flex items-center justify-center pt-[48px] pb-[20px]">
          <EditorTipsRandom />
        </div>
      </div>

      <NewResourceModal
        open={isResourceModalOpen}
        onClose={() => setResourceModalOpen(false)}
        onCreated={(project) => {
          setProjects((prev) => {
            const next = prev.filter((item) => item.id !== project.id);
            return [
              isLocalProjectId(project.id)
                ? toLocalItem(project as LocalProjectRecord)
                : toRemoteItem(project),
              ...next,
            ];
          });
        }}
      />
      <EditorBarExitModal
        isOpen={isExitModalOpen}
        exitLabel={t('bar.exitToHome')}
        cancelLabel={t('bar.cancel')}
        exitText={t('bar.exit')}
        title={t('bar.exitTitle')}
        onClose={() => setExitModalOpen(false)}
        onConfirm={() => {
          setExitModalOpen(false);
          navigate('/');
        }}
      />
    </div>
  );
}

export default EditorHome;
