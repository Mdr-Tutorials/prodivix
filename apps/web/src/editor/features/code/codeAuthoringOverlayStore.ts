import { create } from 'zustand';
import {
  createCodeAuthoringRequest,
  type CodeAuthoringRequest,
  type CodeAuthoringRequestInput,
  type CodeSlotKind,
} from '@prodivix/authoring';

export type CodeAuthoringOverlayPresentation = 'compact' | 'maximized';

export type CodeAuthoringOverlayRequestInput = Omit<
  CodeAuthoringRequestInput,
  'artifactId' | 'requestId' | 'presentation'
> &
  Readonly<{
    artifactId: string;
    presentation: CodeAuthoringOverlayPresentation;
  }>;

export type CodeAuthoringOverlayRequest = CodeAuthoringRequest &
  Readonly<{ presentation: CodeAuthoringOverlayPresentation }>;

type CodeAuthoringOverlayStore = {
  request: CodeAuthoringOverlayRequest | null;
  open: (request: CodeAuthoringOverlayRequestInput) => void;
  close: (requestId?: string) => void;
};

let nextRequestId = 0;

export const resolveCodeAuthoringPresentation = (
  slotKind: CodeSlotKind
): CodeAuthoringOverlayPresentation => {
  switch (slotKind) {
    case 'event-handler':
    case 'validator':
    case 'animation-function':
      return 'compact';
    default:
      return 'maximized';
  }
};

export const useCodeAuthoringOverlayStore = create<CodeAuthoringOverlayStore>()(
  (set) => ({
    request: null,
    open: (request) => {
      nextRequestId += 1;
      set({
        request: createCodeAuthoringRequest({
          ...request,
          requestId: `code-authoring-overlay:${nextRequestId}`,
        }) as CodeAuthoringOverlayRequest,
      });
    },
    close: (requestId) =>
      set((state) => {
        if (
          !state.request ||
          (requestId && state.request.requestId !== requestId)
        ) {
          return state;
        }
        return { request: null };
      }),
  })
);

export const openCodeAuthoringOverlay = (
  request: CodeAuthoringOverlayRequestInput
) => useCodeAuthoringOverlayStore.getState().open(request);

export const closeCodeAuthoringOverlay = (requestId?: string) =>
  useCodeAuthoringOverlayStore.getState().close(requestId);
