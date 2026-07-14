import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, CloudOff, Loader2, Save } from 'lucide-react';
import type {
  SaveIndicatorTone,
  SaveStatus,
  SaveTransport,
} from './saveIndicator.types';

type BlueprintEditorSaveIndicatorProps = {
  status: SaveStatus;
  transport: SaveTransport;
  label: string;
  tone: SaveIndicatorTone;
  isWorkspaceSaveDisabled: boolean;
  hasPendingChanges: boolean;
  isManualSave: boolean;
  onSaveNow?: () => void;
};

type ErrorCopyResult = Readonly<{
  label: string;
  state: 'copied' | 'failed';
}>;

export function BlueprintEditorSaveIndicator({
  status,
  transport,
  label,
  tone,
  isWorkspaceSaveDisabled,
  hasPendingChanges,
  isManualSave,
  onSaveNow,
}: BlueprintEditorSaveIndicatorProps) {
  const [errorCopyResult, setErrorCopyResult] =
    useState<ErrorCopyResult | null>(null);
  const errorCopyFeedbackTimer = useRef<number | null>(null);
  const errorCopyState =
    errorCopyResult?.label === label ? errorCopyResult.state : 'idle';

  useEffect(
    () => () => {
      if (errorCopyFeedbackTimer.current !== null) {
        window.clearTimeout(errorCopyFeedbackTimer.current);
      }
    },
    []
  );

  const showErrorCopyResult = (state: ErrorCopyResult['state']) => {
    setErrorCopyResult({ label, state });
    if (errorCopyFeedbackTimer.current !== null) {
      window.clearTimeout(errorCopyFeedbackTimer.current);
    }
    errorCopyFeedbackTimer.current = window.setTimeout(() => {
      setErrorCopyResult(null);
      errorCopyFeedbackTimer.current = null;
    }, 1600);
  };

  const copyErrorDetails = async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API is unavailable.');
      }
      await navigator.clipboard.writeText(label);
      showErrorCopyResult('copied');
    } catch {
      showErrorCopyResult('failed');
    }
  };

  const canManualSave =
    isManualSave && hasPendingChanges && status !== 'saving';
  const icon =
    status === 'error' && errorCopyState === 'copied' ? (
      <Check size={14} />
    ) : status === 'error' ? (
      <AlertTriangle size={14} />
    ) : status === 'saving' ? (
      <Loader2 size={14} className="animate-spin" />
    ) : isWorkspaceSaveDisabled ? (
      <CloudOff size={14} />
    ) : canManualSave ? (
      <Save size={14} />
    ) : (
      <Check size={14} />
    );
  const className = `inline-flex h-7 w-7 items-center justify-center rounded-full border ${
    tone === 'error'
      ? 'border-(--danger-color) bg-(--danger-subtle) text-(--danger-color)'
      : tone === 'warning'
        ? 'border-(--warning-color) bg-(--warning-subtle) text-(--warning-color)'
        : tone === 'success'
          ? 'border-(--success-color) bg-(--success-subtle) text-(--success-color)'
          : 'border-(--border-default) bg-(--bg-raised) text-(--text-secondary)'
  }`;

  if (status === 'error') {
    const copyLabel =
      errorCopyState === 'copied'
        ? `Error details copied: ${label}`
        : errorCopyState === 'failed'
          ? `Copy failed. Click to retry: ${label}`
          : `Copy error details: ${label}`;
    const copyTitle =
      errorCopyState === 'copied'
        ? 'Error details copied.'
        : errorCopyState === 'failed'
          ? `Unable to copy error details. Click to retry.\n\n${label}`
          : `${label}\n\nClick to copy error details.`;

    return (
      <button
        type="button"
        data-testid="blueprint-save-indicator"
        data-status={status}
        data-transport={transport ?? 'none'}
        title={copyTitle}
        aria-label={copyLabel}
        className={`${className} cursor-pointer hover:bg-(--bg-panel)`}
        onClick={() => void copyErrorDetails()}
      >
        {icon}
      </button>
    );
  }

  if (canManualSave) {
    return (
      <button
        type="button"
        data-testid="blueprint-save-indicator"
        data-status={status}
        data-transport={transport ?? 'none'}
        title={label}
        aria-label={label}
        className={`${className} hover:bg-(--bg-panel) hover:text-(--text-primary)`}
        onClick={onSaveNow}
      >
        {icon}
      </button>
    );
  }

  return (
    <div
      data-testid="blueprint-save-indicator"
      data-status={status}
      data-transport={transport ?? 'none'}
      title={label}
      aria-live="polite"
      className={className}
    >
      {icon}
      <span className="sr-only">{label}</span>
    </div>
  );
}
