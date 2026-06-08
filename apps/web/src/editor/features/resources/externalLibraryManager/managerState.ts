import type {
  LibraryMode,
  PackageSizeThresholds,
  PersistedLibrary,
} from './types';
import { normalizeLibraryIds } from './libraryScope';
import { normalizePackageSizeThresholds } from './viewUtils';

export type NpmMetadata = {
  description: string | null;
  license: string | null;
  updatedAt: number;
};

export const PRE_RELEASE_PATTERN = /(alpha|beta|rc|next|canary|dev|broken)/i;
export const METADATA_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export const getExternalSelectionStorageKey = (projectId?: string) =>
  `prodivix.resourceManager.external.selection.${projectId?.trim() || 'default'}`;

export const getIconSelectionStorageKey = (projectId?: string) =>
  `prodivix.resourceManager.icon.selection.${projectId?.trim() || 'default'}`;

export const getManagerStateStorageKey = (projectId?: string) =>
  `prodivix.resourceManager.external.manager.${projectId?.trim() || 'default'}`;

export const getManagerModeStorageKey = (projectId?: string) =>
  `prodivix.resourceManager.external.mode.${projectId?.trim() || 'default'}`;

export const getManagerSizeThresholdsStorageKey = (projectId?: string) =>
  `prodivix.resourceManager.external.sizeThresholds.${projectId?.trim() || 'default'}`;

export const getManagerMetadataStorageKey = (projectId?: string) =>
  `prodivix.resourceManager.external.metadata.${projectId?.trim() || 'default'}`;

export const parseStoredLibraryIds = (raw: string | null) => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return null;
  }
};

export const parseStoredManagerState = (
  raw: string | null
): PersistedLibrary[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item): PersistedLibrary | null => {
        if (!item || typeof item !== 'object') return null;
        const record = item as Record<string, unknown>;
        const id =
          typeof record.id === 'string'
            ? normalizeLibraryIds([record.id])[0]
            : '';
        if (!id) return null;
        return {
          id,
          scope:
            record.scope === 'component' ||
            record.scope === 'icon' ||
            record.scope === 'utility'
              ? record.scope
              : 'utility',
          version:
            typeof record.version === 'string' &&
            record.version.trim().length > 0
              ? record.version.trim()
              : 'latest',
          status:
            record.status === 'loading' ||
            record.status === 'success' ||
            record.status === 'warning' ||
            record.status === 'error'
              ? record.status
              : 'idle',
        };
      })
      .filter((item): item is PersistedLibrary => Boolean(item));
  } catch {
    return [];
  }
};

export const parseStoredSizeThresholds = (
  raw: string | null
): PackageSizeThresholds | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const record = parsed as Partial<
      Record<keyof PackageSizeThresholds, unknown>
    >;
    const cautionKb =
      typeof record.cautionKb === 'number' ? record.cautionKb : undefined;
    const warningKb =
      typeof record.warningKb === 'number' ? record.warningKb : undefined;
    const criticalKb =
      typeof record.criticalKb === 'number' ? record.criticalKb : undefined;
    if (
      cautionKb === undefined &&
      warningKb === undefined &&
      criticalKb === undefined
    ) {
      return null;
    }
    return normalizePackageSizeThresholds({
      cautionKb,
      warningKb,
      criticalKb,
    });
  } catch {
    return null;
  }
};

export const parseStoredMetadataCache = (
  raw: string | null
): Record<string, NpmMetadata> => {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const next: Record<string, NpmMetadata> = {};
    Object.entries(parsed).forEach(([key, value]) => {
      if (!value || typeof value !== 'object') return;
      const record = value as Record<string, unknown>;
      if (
        typeof record.updatedAt !== 'number' ||
        !Number.isFinite(record.updatedAt)
      ) {
        return;
      }
      next[key] = {
        description:
          typeof record.description === 'string' &&
          record.description.trim().length > 0
            ? record.description.trim()
            : null,
        license:
          typeof record.license === 'string' && record.license.trim().length > 0
            ? record.license.trim()
            : null,
        updatedAt: record.updatedAt,
      };
    });
    return next;
  } catch {
    return {};
  }
};

export const normalizeLicenseText = (license: unknown): string | null => {
  if (typeof license === 'string' && license.trim().length > 0) {
    return license.trim();
  }
  if (
    license &&
    typeof license === 'object' &&
    'type' in (license as Record<string, unknown>)
  ) {
    const type = (license as Record<string, unknown>).type;
    if (typeof type === 'string' && type.trim().length > 0) {
      return type.trim();
    }
  }
  return null;
};

export const pickVersionByMode = (versions: string[], mode: LibraryMode) => {
  if (versions.length === 0) return 'latest';
  if (mode === 'dev') {
    return (
      versions.find((version) => PRE_RELEASE_PATTERN.test(version)) ??
      versions[0]
    );
  }
  return (
    versions.find((version) => !PRE_RELEASE_PATTERN.test(version)) ??
    versions[0]
  );
};
