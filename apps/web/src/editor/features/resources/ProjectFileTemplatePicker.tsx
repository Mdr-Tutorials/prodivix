import { Check, ExternalLink, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  LICENSE_TEMPLATE_PROFILES,
  type LicenseTemplateCategory,
} from './licenseTemplates';
import type {
  ProjectFileTemplate,
  ProjectFileTemplateId,
  ProjectGitignoreSnippet,
} from './projectFileStore';

type LicenseTemplateGroup = {
  category: LicenseTemplateCategory;
  templates: ProjectFileTemplate[];
};

type ProjectFileTemplatePickerProps = {
  open: boolean;
  isEditingGitignore: boolean;
  fileTemplateOptions: ProjectFileTemplate[];
  gitignoreSnippets: ProjectGitignoreSnippet[];
  licenseTemplateGroups: LicenseTemplateGroup[];
  selectedTemplateId?: ProjectFileTemplateId;
  isGitignoreSnippetEnabled: (snippet: ProjectGitignoreSnippet) => boolean;
  onApplyTemplate: (template: ProjectFileTemplate) => void;
  onToggleGitignoreSnippet: (
    snippet: ProjectGitignoreSnippet,
    checked: boolean
  ) => void;
  onClose: () => void;
};

export function ProjectFileTemplatePicker({
  open,
  isEditingGitignore,
  fileTemplateOptions,
  gitignoreSnippets,
  licenseTemplateGroups,
  selectedTemplateId,
  isGitignoreSnippetEnabled,
  onApplyTemplate,
  onToggleGitignoreSnippet,
  onClose,
}: ProjectFileTemplatePickerProps) {
  const { t } = useTranslation('editor');
  if (!open) return null;

  const isLicensePicker = licenseTemplateGroups.length > 0;

  return (
    <div className="absolute top-20 right-4 z-20 grid max-h-[min(620px,calc(100vh-180px))] w-[min(620px,calc(100%-2rem))] gap-4 overflow-auto rounded-xl bg-(--bg-canvas) p-4 shadow-2xl ring-1 ring-black/10">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium tracking-[0.08em] text-(--text-muted) uppercase">
            {t('resourceManager.projectFiles.labels.templates')}
          </p>
          {isLicensePicker ? (
            <p className="mt-1 text-xs leading-5 text-(--text-secondary)">
              {t('resourceManager.projectFiles.licenseGuide.note')}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-(--text-secondary) hover:bg-black/[0.04] hover:text-(--text-primary)"
          onClick={onClose}
          aria-label={t('resourceManager.projectFiles.actions.closeTemplates')}
          title={t('resourceManager.projectFiles.actions.closeTemplates')}
        >
          <X size={15} />
        </button>
      </div>

      {isEditingGitignore ? (
        <div className="grid gap-1">
          {gitignoreSnippets.map((snippet) => {
            const checked = isGitignoreSnippetEnabled(snippet);
            return (
              <label
                key={snippet.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-xs transition-colors ${
                  checked
                    ? 'bg-black/[0.06] text-(--text-primary)'
                    : 'text-(--text-secondary) hover:bg-black/[0.03] hover:text-(--text-primary)'
                }`}
              >
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 accent-black"
                  checked={checked}
                  onChange={(event) =>
                    onToggleGitignoreSnippet(snippet, event.target.checked)
                  }
                />
                <span className="min-w-0 flex-1 truncate">{snippet.label}</span>
              </label>
            );
          })}
        </div>
      ) : null}

      {!isEditingGitignore && !isLicensePicker ? (
        <div className="grid gap-1">
          {fileTemplateOptions.map((template) => {
            const isSelected = selectedTemplateId === template.id;
            return (
              <button
                key={template.id}
                type="button"
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                  isSelected
                    ? 'bg-black/[0.06] text-(--text-primary)'
                    : 'text-(--text-secondary) hover:bg-black/[0.03] hover:text-(--text-primary)'
                }`}
                onClick={() => onApplyTemplate(template)}
                aria-pressed={isSelected}
              >
                <span className="min-w-0 flex-1 truncate">
                  {template.label}
                </span>
                {isSelected ? <Check size={14} className="shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {isLicensePicker ? (
        <div className="grid gap-4">
          {licenseTemplateGroups.map((group) => (
            <section key={group.category} className="grid gap-2">
              <div className="grid gap-1 px-1">
                <p className="text-[11px] font-medium tracking-[0.08em] text-(--text-muted) uppercase">
                  {t(
                    `resourceManager.projectFiles.licenseGuide.categories.${group.category}.label`
                  )}
                </p>
                <p className="text-xs leading-5 text-(--text-secondary)">
                  {t(
                    `resourceManager.projectFiles.licenseGuide.categories.${group.category}.hint`
                  )}
                </p>
              </div>
              <div className="grid gap-1">
                {group.templates.map((template) => {
                  const profile = LICENSE_TEMPLATE_PROFILES[template.id];
                  const isSelected = selectedTemplateId === template.id;
                  return (
                    <div
                      key={template.id}
                      className={`grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 rounded-lg px-3 py-2 transition-colors ${
                        isSelected ? 'bg-black/[0.06]' : 'hover:bg-black/[0.03]'
                      }`}
                    >
                      <button
                        type="button"
                        className="grid min-w-0 gap-1 text-left"
                        onClick={() => onApplyTemplate(template)}
                        aria-pressed={isSelected}
                      >
                        <span className="flex min-w-0 items-center gap-2 text-xs font-medium text-(--text-primary)">
                          <span className="truncate">{template.label}</span>
                          {isSelected ? (
                            <Check size={13} className="shrink-0" />
                          ) : null}
                        </span>
                        <span className="text-xs leading-5 text-(--text-secondary)">
                          {profile
                            ? t(
                                `resourceManager.projectFiles.licenseGuide.summaries.${profile.summaryKey}`
                              )
                            : template.label}
                        </span>
                      </button>
                      {profile ? (
                        <a
                          href={profile.referenceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-(--text-secondary) hover:bg-black/[0.04] hover:text-(--text-primary)"
                          aria-label={t(
                            'resourceManager.projectFiles.actions.openLicenseReference',
                            { template: template.label }
                          )}
                          title={t(
                            'resourceManager.projectFiles.actions.openLicenseReference',
                            { template: template.label }
                          )}
                        >
                          <ExternalLink size={13} />
                        </a>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
