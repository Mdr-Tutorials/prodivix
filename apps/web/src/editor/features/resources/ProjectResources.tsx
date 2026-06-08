import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { CodeResourcePage } from './CodeResourcePage';
import { ExternalLibraryManager } from './ExternalLibraryManager';
import { I18nResourcePage } from './I18nResourcePage';
import { ProjectFileManager } from './ProjectFileManager';
import { ResourceOverviewPanel } from './ResourceOverviewPanel';
import { PublicResourcePage } from './PublicResourcePage';
import {
  createCodeFile,
  findCodeNodeById,
  readCodeTree,
  writeCodeTree,
} from './codeTree';
import {
  createTemplateForCodeFolder,
  resolveCreatedNodeId,
} from './codeResourceCreate';
import { getResourceManagerCodeSelectionStorageKey } from './codeResourceModel';
import {
  buildOverviewSnapshot,
  getResourceManagerViewStorageKey,
  sectionMetas,
  type SectionId,
} from './projectResourceOverview';

export function ProjectResources() {
  const { t } = useTranslation('editor');
  const { projectId } = useParams();
  const [activeSection, setActiveSection] = useState<SectionId>(() => {
    if (typeof window === 'undefined') return 'overview';
    const raw = window.localStorage.getItem(
      getResourceManagerViewStorageKey(projectId)
    );
    if (
      raw === 'overview' ||
      raw === 'public' ||
      raw === 'code' ||
      raw === 'i18n' ||
      raw === 'external' ||
      raw === 'projectFiles'
    ) {
      return raw;
    }
    return 'overview';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      getResourceManagerViewStorageKey(projectId),
      activeSection
    );
  }, [activeSection, projectId]);

  const overviewSnapshot = useMemo(() => {
    if (activeSection !== 'overview') return null;
    return buildOverviewSnapshot(projectId);
  }, [activeSection, projectId]);

  const createCodeAssetAndOpen = (folder: 'scripts' | 'styles' | 'shaders') => {
    if (typeof window === 'undefined') return;
    const currentTree = readCodeTree(projectId);
    const template = createTemplateForCodeFolder(folder);
    const parentId =
      folder === 'scripts'
        ? 'code-scripts'
        : folder === 'styles'
          ? 'code-styles'
          : 'code-shaders';
    const resolvedParentId =
      findCodeNodeById(currentTree, parentId)?.type === 'folder'
        ? parentId
        : currentTree.id;
    const contentRef = `data:${template.mime};charset=utf-8,${encodeURIComponent(template.content)}`;
    const size = new TextEncoder().encode(template.content).length;
    const nextTree = createCodeFile(currentTree, resolvedParentId, {
      name: template.name,
      mime: template.mime,
      size,
      textContent: template.content,
      contentRef,
      category: 'document',
    });
    writeCodeTree(projectId, nextTree);
    const createdNodeId = resolveCreatedNodeId(currentTree, nextTree);
    if (createdNodeId) {
      window.localStorage.setItem(
        getResourceManagerCodeSelectionStorageKey(projectId),
        createdNodeId
      );
    }
    setActiveSection('code');
  };

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-6 py-6">
      <header className="rounded-2xl border border-black/8 bg-white/92 p-5 shadow-[0_10px_28px_rgba(0,0,0,0.06)]">
        <p className="mb-2 text-xs font-semibold tracking-[0.12em] text-(--text-muted) uppercase">
          {t('resourceManager.header.badge')}
        </p>
        <h1 className="text-2xl font-semibold text-(--text-primary)">
          {t('resourceManager.header.title')}
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-(--text-secondary)">
          {t('resourceManager.header.description')}
        </p>
      </header>

      <nav className="rounded-2xl border border-black/8 bg-(--bg-canvas) p-2">
        <div className="flex flex-wrap gap-2">
          {sectionMetas.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'border border-black/16 bg-black text-white'
                    : 'border border-transparent bg-transparent text-(--text-secondary) hover:border-black/10 hover:text-(--text-primary)'
                }`}
              >
                <Icon size={14} />
                {t(`resourceManager.tabs.${section.id}`)}
              </button>
            );
          })}
        </div>
      </nav>

      {activeSection === 'overview' ? (
        <ResourceOverviewPanel
          overviewSnapshot={overviewSnapshot}
          onOpenSection={setActiveSection}
          onCreateCodeAsset={createCodeAssetAndOpen}
        />
      ) : null}

      {activeSection === 'public' ? <PublicResourcePage embedded /> : null}

      {activeSection === 'code' ? <CodeResourcePage embedded /> : null}

      {activeSection === 'i18n' ? <I18nResourcePage embedded /> : null}

      {activeSection === 'external' ? (
        <ExternalLibraryManager projectId={projectId} />
      ) : null}

      {activeSection === 'projectFiles' ? (
        <ProjectFileManager embedded />
      ) : null}
    </section>
  );
}
