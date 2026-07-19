import { EXECUTION_TERMINAL_LIMITS } from '@prodivix/runtime-core';

export type ExecutionTerminalKeyboardAction =
  | Readonly<{ kind: 'input'; data: string }>
  | Readonly<{ kind: 'interrupt' }>
  | Readonly<{ kind: 'browser' }>;

export type ExecutionTerminalKeyboardInput = Readonly<{
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  applicationCursorKeys?: boolean;
}>;

const normalCursorKeys = Object.freeze({
  ArrowUp: '\u001b[A',
  ArrowDown: '\u001b[B',
  ArrowRight: '\u001b[C',
  ArrowLeft: '\u001b[D',
  Home: '\u001b[H',
  End: '\u001b[F',
});

const applicationCursorKeys = Object.freeze({
  ArrowUp: '\u001bOA',
  ArrowDown: '\u001bOB',
  ArrowRight: '\u001bOC',
  ArrowLeft: '\u001bOD',
  Home: '\u001bOH',
  End: '\u001bOF',
});

const fixedKeys = Object.freeze({
  Enter: '\r',
  Backspace: '\u007f',
  Tab: '\t',
  Escape: '\u001b',
  Insert: '\u001b[2~',
  Delete: '\u001b[3~',
  PageUp: '\u001b[5~',
  PageDown: '\u001b[6~',
  F1: '\u001bOP',
  F2: '\u001bOQ',
  F3: '\u001bOR',
  F4: '\u001bOS',
  F5: '\u001b[15~',
  F6: '\u001b[17~',
  F7: '\u001b[18~',
  F8: '\u001b[19~',
  F9: '\u001b[20~',
  F10: '\u001b[21~',
  F11: '\u001b[23~',
  F12: '\u001b[24~',
});

const controlCharacter = (key: string): string | undefined => {
  if (/^[a-z]$/iu.test(key))
    return String.fromCharCode(key.toUpperCase().charCodeAt(0) - 64);
  if (key === '[') return '\u001b';
  if (key === '\\') return '\u001c';
  if (key === ']') return '\u001d';
  if (key === '^') return '\u001e';
  if (key === '_') return '\u001f';
  if (key === '?') return '\u007f';
  return undefined;
};

export const createExecutionTerminalKeyboardAction = (
  input: ExecutionTerminalKeyboardInput
): ExecutionTerminalKeyboardAction | undefined => {
  if (input.metaKey) return Object.freeze({ kind: 'browser' });
  if (
    input.ctrlKey &&
    input.shiftKey &&
    ['c', 'v', 'x'].includes(input.key.toLowerCase())
  )
    return Object.freeze({ kind: 'browser' });
  if (input.ctrlKey && !input.altKey) {
    if (input.key.toLowerCase() === 'c')
      return Object.freeze({ kind: 'interrupt' });
    const data = controlCharacter(input.key);
    return data ? Object.freeze({ kind: 'input', data }) : undefined;
  }
  const cursorMap = input.applicationCursorKeys
    ? applicationCursorKeys
    : normalCursorKeys;
  const cursor = cursorMap[input.key as keyof typeof cursorMap];
  if (cursor) return Object.freeze({ kind: 'input', data: cursor });
  const fixed = fixedKeys[input.key as keyof typeof fixedKeys];
  if (fixed) return Object.freeze({ kind: 'input', data: fixed });
  if (input.key.length > 0 && [...input.key].length === 1) {
    const data =
      input.altKey && !input.ctrlKey ? `\u001b${input.key}` : input.key;
    return Object.freeze({ kind: 'input', data });
  }
  return undefined;
};

export const createExecutionTerminalPasteInput = (
  input: Readonly<{
    text: string;
    bracketedPaste: boolean;
  }>
): string | undefined => {
  if (!input.text) return undefined;
  const normalized = input.text.replaceAll('\r\n', '\n').replaceAll('\r', '\n');
  const value = input.bracketedPaste
    ? `\u001b[200~${normalized}\u001b[201~`
    : normalized;
  return new TextEncoder().encode(value).byteLength <=
    EXECUTION_TERMINAL_LIMITS.maximumInputBytes
    ? value
    : undefined;
};
