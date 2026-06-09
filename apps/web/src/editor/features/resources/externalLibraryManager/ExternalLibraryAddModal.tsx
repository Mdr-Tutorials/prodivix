import { useTranslation } from 'react-i18next';

type ExternalLibraryAddModalProps = {
  libraryId: string;
  libraryVersion: string;
  isOpen: boolean;
  onLibraryIdChange: (value: string) => void;
  onLibraryVersionChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function ExternalLibraryAddModal({
  libraryId,
  libraryVersion,
  isOpen,
  onLibraryIdChange,
  onLibraryVersionChange,
  onClose,
  onSubmit,
}: ExternalLibraryAddModalProps) {
  const { t } = useTranslation('editor');
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <div className="grid w-full max-w-md gap-3 rounded-2xl border border-(--border-default) bg-(--bg-canvas) p-4 shadow-(--shadow-lg)">
        <h3 className="text-sm font-medium text-(--text-primary)">
          {t('resourceManager.external.modal.title')}
        </h3>
        <input
          data-testid="external-library-modal-name-input"
          className="h-9 rounded-lg border border-(--border-default) bg-transparent px-3 text-sm text-(--text-primary) outline-none focus:border-(--accent-color)"
          value={libraryId}
          onChange={(event) => onLibraryIdChange(event.target.value)}
          placeholder={t('resourceManager.external.modal.packageId')}
        />
        <input
          data-testid="external-library-modal-version-input"
          className="h-9 rounded-lg border border-(--border-default) bg-transparent px-3 text-sm text-(--text-primary) outline-none focus:border-(--accent-color)"
          value={libraryVersion}
          onChange={(event) => onLibraryVersionChange(event.target.value)}
          placeholder={t('resourceManager.external.modal.versionOptional')}
        />
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="rounded-lg border border-(--border-default) px-3 py-1.5 text-xs text-(--text-secondary) hover:text-(--text-primary)"
            onClick={onClose}
          >
            {t('resourceManager.external.actions.cancel')}
          </button>
          <button
            type="button"
            data-testid="external-library-modal-submit"
            className="rounded-lg border border-(--text-primary) bg-(--text-primary) px-3 py-1.5 text-xs text-(--text-inverse) disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!libraryId.trim()}
            onClick={onSubmit}
          >
            {t('resourceManager.external.actions.addLibrary')}
          </button>
        </div>
      </div>
    </div>
  );
}
