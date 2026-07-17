import {
  readExecutionNetworkBridgeMessage,
  type ExecutionNetworkTrace,
} from '@prodivix/runtime-core';
import type { BlueprintProjectRunProvider } from '@/editor/features/blueprint/editor/runner/blueprintProjectRunnerClient';

/** Accepts Network messages only from the exact active local preview origin. */
export const readBlueprintProjectNetworkBridgeMessage = (input: {
  provider: BlueprintProjectRunProvider;
  previewUrl: string;
  messageOrigin: string;
  value: unknown;
}): ExecutionNetworkTrace | undefined => {
  if (input.provider !== 'browser') return undefined;
  let previewOrigin: string;
  try {
    previewOrigin = new URL(input.previewUrl).origin;
  } catch {
    return undefined;
  }
  if (input.messageOrigin !== previewOrigin) return undefined;
  return readExecutionNetworkBridgeMessage(input.value);
};
