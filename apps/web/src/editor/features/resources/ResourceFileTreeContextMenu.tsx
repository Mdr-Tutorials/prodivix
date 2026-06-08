import { type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import type { PublicFileCategory, PublicResourceNode } from './publicTree';
import type { PublicFileKind } from './publicResourceModel';

type ResourceFileTreeContextMenuProps = {
  menuRef: RefObject<HTMLDivElement | null>;
  node: PublicResourceNode;
  rootId: string;
  x: number;
  y: number;
  onClose: () => void;
  onCreateFolder?: (parentId: string) => void;
  onCreateFile?: (parentId: string) => void;
  onCreateFileByKind?: (parentId: string, kind: PublicFileKind) => void;
  onImport: (parentId: string) => void;
  onImportByCategory: (parentId: string, category: PublicFileCategory) => void;
  onRename: (node: PublicResourceNode) => void;
  onDelete?: (nodeId: string) => void;
};

export function ResourceFileTreeContextMenu({
  menuRef,
  node,
  rootId,
  x,
  y,
  onClose,
  onCreateFolder,
  onCreateFile,
  onCreateFileByKind,
  onImport,
  onImportByCategory,
  onRename,
  onDelete,
}: ResourceFileTreeContextMenuProps) {
  const { t } = useTranslation('editor');
  const targetParentId =
    node.type === 'folder' ? node.id : (node.parentId ?? rootId);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[220px] rounded-md border border-black/12 bg-white p-1 text-xs shadow-[0_8px_30px_rgba(0,0,0,0.15)]"
      style={{ left: x + 4, top: y + 4 }}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left hover:bg-black/5"
        onClick={() => {
          onCreateFolder?.(targetParentId);
          onClose();
        }}
      >
        <span>{t('resourceManager.tree.menu.newFolder')}</span>
        <span>{t('resourceManager.tree.menu.folder')}</span>
      </button>
      <button
        type="button"
        className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left hover:bg-black/5"
        onClick={() => {
          onCreateFile?.(targetParentId);
          onClose();
        }}
      >
        <span>{t('resourceManager.tree.menu.newFile')}</span>
        <span>{t('resourceManager.tree.menu.text')}</span>
      </button>
      <button
        type="button"
        className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left hover:bg-black/5"
        onClick={() => {
          onCreateFileByKind?.(targetParentId, 'json');
          onClose();
        }}
      >
        <span>{t('resourceManager.tree.menu.newFileJson')}</span>
        <span>.json</span>
      </button>
      <button
        type="button"
        className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left hover:bg-black/5"
        onClick={() => {
          onCreateFileByKind?.(targetParentId, 'svg');
          onClose();
        }}
      >
        <span>{t('resourceManager.tree.menu.newFileSvg')}</span>
        <span>.svg</span>
      </button>
      <div className="my-1 h-px bg-black/10" />
      <button
        type="button"
        className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left hover:bg-black/5"
        onClick={() => {
          onImport(targetParentId);
          onClose();
        }}
      >
        <span>{t('resourceManager.tree.menu.importFiles')}</span>
        <span>{t('resourceManager.tree.menu.any')}</span>
      </button>
      <button
        type="button"
        className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left hover:bg-black/5"
        onClick={() => {
          onImportByCategory(targetParentId, 'image');
          onClose();
        }}
      >
        <span>{t('resourceManager.tree.menu.importImage')}</span>
        <span>png/jpg/webp/svg</span>
      </button>
      <button
        type="button"
        className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left hover:bg-black/5"
        onClick={() => {
          onImportByCategory(targetParentId, 'font');
          onClose();
        }}
      >
        <span>{t('resourceManager.tree.menu.importFont')}</span>
        <span>woff/woff2/ttf/otf</span>
      </button>
      <button
        type="button"
        className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left hover:bg-black/5"
        onClick={() => {
          onImportByCategory(targetParentId, 'document');
          onClose();
        }}
      >
        <span>{t('resourceManager.tree.menu.importDocument')}</span>
        <span>txt/md/json/svg</span>
      </button>
      {node.id !== rootId ? (
        <>
          <div className="my-1 h-px bg-black/10" />
          <button
            type="button"
            className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left hover:bg-black/5"
            onClick={() => {
              onRename(node);
              onClose();
            }}
          >
            <span>{t('resourceManager.tree.menu.rename')}</span>
            <span>F2</span>
          </button>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-red-700 hover:bg-red-50"
            onClick={() => {
              onDelete?.(node.id);
              onClose();
            }}
          >
            <span>{t('resourceManager.tree.menu.delete')}</span>
            <span>Del</span>
          </button>
        </>
      ) : null}
    </div>
  );
}
