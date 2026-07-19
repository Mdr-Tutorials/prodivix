import {
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ClipboardEvent,
  type KeyboardEvent,
} from 'react';
import type {
  ExecutionTerminalEmulatorColor,
  ExecutionTerminalEmulatorSnapshot,
  ExecutionTerminalEmulatorStyle,
  ExecutionTerminalOutputStream,
} from '@prodivix/runtime-core';
import {
  createExecutionTerminalKeyboardAction,
  createExecutionTerminalPasteInput,
} from './executionTerminalKeyboard';

type ExecutionTerminalEmulatorSurfaceProps = Readonly<{
  snapshot: ExecutionTerminalEmulatorSnapshot;
  connected: boolean;
  inputLabel: string;
  keyboardHelp: string;
  pasteRejectedMessage: string;
  emptyMessage: string;
  onInput(data: string): void | Promise<boolean>;
  onInterrupt(): void | Promise<boolean>;
}>;

const ansiPalette = Object.freeze([
  '#1f2937',
  '#ef4444',
  '#22c55e',
  '#eab308',
  '#3b82f6',
  '#d946ef',
  '#06b6d4',
  '#d1d5db',
  '#6b7280',
  '#f87171',
  '#4ade80',
  '#fde047',
  '#60a5fa',
  '#e879f9',
  '#22d3ee',
  '#f9fafb',
] as const);

const colorToCss = (
  color: ExecutionTerminalEmulatorColor | undefined
): string | undefined => {
  if (!color) return undefined;
  if (color.kind === 'rgb')
    return `rgb(${color.red} ${color.green} ${color.blue})`;
  if (color.index < ansiPalette.length) return ansiPalette[color.index];
  if (color.index >= 232) {
    const level = 8 + (color.index - 232) * 10;
    return `rgb(${level} ${level} ${level})`;
  }
  const offset = color.index - 16;
  const levels = [0, 95, 135, 175, 215, 255];
  const red = levels[Math.floor(offset / 36)] ?? 0;
  const green = levels[Math.floor((offset % 36) / 6)] ?? 0;
  const blue = levels[offset % 6] ?? 0;
  return `rgb(${red} ${green} ${blue})`;
};

const runStyle = (
  style: ExecutionTerminalEmulatorStyle,
  stream: ExecutionTerminalOutputStream
): CSSProperties => {
  let foreground =
    colorToCss(style.foreground) ??
    (stream === 'stderr' ? 'var(--danger-color)' : 'var(--text-secondary)');
  let background = colorToCss(style.background);
  if (style.inverse)
    [foreground, background] = [background ?? 'var(--bg-panel)', foreground];
  const decorations = [
    style.underline ? 'underline' : '',
    style.strikethrough ? 'line-through' : '',
  ].filter(Boolean);
  return {
    color: style.hidden ? (background ?? 'transparent') : foreground,
    ...(background ? { backgroundColor: background } : {}),
    ...(style.bold ? { fontWeight: 700 } : {}),
    ...(style.dim ? { opacity: 0.65 } : {}),
    ...(style.italic ? { fontStyle: 'italic' } : {}),
    ...(decorations.length
      ? { textDecorationLine: decorations.join(' ') }
      : {}),
  };
};

export const ExecutionTerminalEmulatorSurface = ({
  snapshot,
  connected,
  inputLabel,
  keyboardHelp,
  pasteRejectedMessage,
  emptyMessage,
  onInput,
  onInterrupt,
}: ExecutionTerminalEmulatorSurfaceProps) => {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const helpId = useId();
  const [pasteRejected, setPasteRejected] = useState(false);
  const screenReaderText = useMemo(
    () =>
      snapshot.lines
        .map((line) => line.text.trimEnd())
        .filter(Boolean)
        .slice(-4)
        .join('\n'),
    [snapshot.lines]
  );

  const submit = (data: string): void => {
    setPasteRejected(false);
    void onInput(data);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (!connected || event.nativeEvent.isComposing) return;
    const action = createExecutionTerminalKeyboardAction({
      key: event.key,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
      applicationCursorKeys: snapshot.modes.applicationCursorKeys,
    });
    if (!action || action.kind === 'browser') return;
    event.preventDefault();
    if (action.kind === 'interrupt') void onInterrupt();
    else submit(action.data);
  };

  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>): void => {
    if (!connected) return;
    event.preventDefault();
    const value = createExecutionTerminalPasteInput({
      text: event.clipboardData.getData('text/plain'),
      bracketedPaste: snapshot.modes.bracketedPaste,
    });
    if (!value) {
      setPasteRejected(true);
      return;
    }
    submit(value);
  };

  return (
    <div
      className="relative min-h-full cursor-text outline-none focus-within:ring-1 focus-within:ring-(--accent-color) focus-within:ring-inset"
      data-testid="execution-terminal-emulator"
      data-columns={snapshot.size.columns}
      data-rows={snapshot.size.rows}
      onClick={() => inputRef.current?.focus()}
    >
      <textarea
        ref={inputRef}
        className="absolute top-0 left-0 size-px resize-none overflow-hidden opacity-0"
        aria-label={inputLabel}
        aria-describedby={helpId}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        disabled={!connected}
        value=""
        onChange={(event) => {
          if (event.target.value) submit(event.target.value);
        }}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
      />
      <span id={helpId} className="sr-only">
        {keyboardHelp}
      </span>
      <div aria-hidden="true">
        {snapshot.lines.map((line) => (
          <div
            key={line.index}
            className="relative min-h-4 whitespace-pre"
            data-terminal-line={line.index}
          >
            {line.runs.map((run, index) => (
              <span
                key={`${line.index}:${index.toString(10)}`}
                style={runStyle(run.style, run.stream)}
              >
                {run.text}
              </span>
            ))}
            {connected &&
            snapshot.cursor.visible &&
            snapshot.cursor.line === line.index ? (
              <span
                className="pointer-events-none absolute top-0 h-4 w-[1ch] bg-(--text-primary)/55"
                style={{ left: `${snapshot.cursor.column}ch` }}
              />
            ) : null}
          </div>
        ))}
      </div>
      {!screenReaderText ? (
        <span className="text-(--text-muted)">{emptyMessage}</span>
      ) : null}
      <span className="sr-only" role="log" aria-live="polite">
        {screenReaderText}
      </span>
      {pasteRejected ? (
        <span role="status" className="mt-1 block text-(--warning-color)">
          {pasteRejectedMessage}
        </span>
      ) : null}
    </div>
  );
};
