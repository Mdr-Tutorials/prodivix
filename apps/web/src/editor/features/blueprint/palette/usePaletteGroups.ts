import { useSyncExternalStore } from 'react';
import {
  getPaletteRegistrySnapshot,
  subscribePaletteRegistry,
} from '@/editor/features/blueprint/palette/registry';

export const usePaletteRegistrySnapshot = () =>
  useSyncExternalStore(
    subscribePaletteRegistry,
    getPaletteRegistrySnapshot,
    getPaletteRegistrySnapshot
  );

export const usePaletteGroups = () => usePaletteRegistrySnapshot().groups;
