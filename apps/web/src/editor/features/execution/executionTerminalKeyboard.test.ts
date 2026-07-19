import { describe, expect, it } from 'vitest';
import { EXECUTION_TERMINAL_LIMITS } from '@prodivix/runtime-core';
import {
  createExecutionTerminalKeyboardAction,
  createExecutionTerminalPasteInput,
} from './executionTerminalKeyboard';

describe('Execution Terminal keyboard projection', () => {
  it('projects cursor, control, function, printable, and browser-owned keys', () => {
    expect(createExecutionTerminalKeyboardAction({ key: 'ArrowUp' })).toEqual({
      kind: 'input',
      data: '\u001b[A',
    });
    expect(
      createExecutionTerminalKeyboardAction({
        key: 'ArrowUp',
        applicationCursorKeys: true,
      })
    ).toEqual({ kind: 'input', data: '\u001bOA' });
    expect(
      createExecutionTerminalKeyboardAction({ key: 'd', ctrlKey: true })
    ).toEqual({ kind: 'input', data: '\u0004' });
    expect(
      createExecutionTerminalKeyboardAction({ key: 'c', ctrlKey: true })
    ).toEqual({ kind: 'interrupt' });
    expect(
      createExecutionTerminalKeyboardAction({
        key: 'c',
        ctrlKey: true,
        shiftKey: true,
      })
    ).toEqual({ kind: 'browser' });
    expect(
      createExecutionTerminalKeyboardAction({ key: 'x', altKey: true })
    ).toEqual({ kind: 'input', data: '\u001bx' });
    expect(
      createExecutionTerminalKeyboardAction({
        key: '€',
        ctrlKey: true,
        altKey: true,
      })
    ).toEqual({ kind: 'input', data: '€' });
    expect(createExecutionTerminalKeyboardAction({ key: 'F12' })).toEqual({
      kind: 'input',
      data: '\u001b[24~',
    });
  });

  it('normalizes and brackets bounded paste without truncating stdin', () => {
    expect(
      createExecutionTerminalPasteInput({
        text: 'one\r\ntwo\rthree',
        bracketedPaste: true,
      })
    ).toBe('\u001b[200~one\ntwo\nthree\u001b[201~');
    expect(
      createExecutionTerminalPasteInput({
        text: 'x'.repeat(EXECUTION_TERMINAL_LIMITS.maximumInputBytes + 1),
        bracketedPaste: false,
      })
    ).toBeUndefined();
  });
});
