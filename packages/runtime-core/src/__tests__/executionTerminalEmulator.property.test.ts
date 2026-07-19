import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  createExecutionTerminalEmulator,
  createExecutionTerminalEmulatorCopyText,
  EXECUTION_TERMINAL_EMULATOR_LIMITS,
  type ExecutionTerminalOutputRecord,
} from '../index';

const output = (
  cursor: number,
  data: string,
  overrides: Partial<ExecutionTerminalOutputRecord> = {}
): ExecutionTerminalOutputRecord =>
  Object.freeze({
    terminalSessionId: 'terminal-1',
    executionId: 'execution-1',
    jobId: 'job-1',
    cursor,
    emittedAt: cursor,
    stream: 'stdout',
    data,
    byteLength: Buffer.byteLength(data),
    redacted: false,
    truncated: false,
    ...overrides,
  });

describe('Execution Terminal emulator', () => {
  it('incrementally applies fragmented ANSI style, cursor, and erase output', () => {
    const emulator = createExecutionTerminalEmulator({ columns: 24, rows: 4 });
    emulator.consume({
      records: [
        output(1, '\u001b[31mred'),
        output(2, '\u001b[0m normal\r\nprogress 10%'),
        output(3, '\rprogress 100%\u001b[K'),
      ],
    });

    const snapshot = emulator.getSnapshot();
    expect(snapshot.lines[snapshot.screenStartLine]?.text).toBe('red normal');
    expect(snapshot.lines[snapshot.screenStartLine + 1]?.text).toBe(
      'progress 100%'
    );
    expect(snapshot.lines[snapshot.screenStartLine]?.runs).toMatchObject([
      {
        text: 'red',
        style: { foreground: { kind: 'palette', index: 1 } },
      },
      { text: ' normal' },
    ]);
    expect(
      snapshot.lines[snapshot.screenStartLine]?.runs[1]?.style.foreground
    ).toBeUndefined();
    expect(snapshot.cursor).toMatchObject({ column: 13, visible: true });
    expect(snapshot.metrics.discardedControlSequences).toBe(0);
  });

  it('preserves primary output across alternate-screen and cursor mode changes', () => {
    const emulator = createExecutionTerminalEmulator({ columns: 20, rows: 3 });
    emulator.consume({ records: [output(1, 'primary')] });
    const alternate = emulator.consume({
      records: [
        output(2, '\u001b[?1049hALT\u001b[?25l\u001b[?1h\u001b[?2004h'),
      ],
    });

    expect(alternate.modes).toMatchObject({
      alternateScreen: true,
      applicationCursorKeys: true,
      bracketedPaste: true,
    });
    expect(alternate.cursor.visible).toBe(false);
    expect(alternate.lines[0]?.text).toBe('ALT');

    const restored = emulator.consume({
      records: [output(3, '\u001b[?1049l')],
    });
    expect(restored.modes.alternateScreen).toBe(false);
    expect(restored.lines[restored.screenStartLine]?.text).toBe('primary');
  });

  it('hard-fences gaps and redacted or truncated chunks from partial controls', () => {
    const emulator = createExecutionTerminalEmulator({ columns: 40, rows: 5 });
    const snapshot = emulator.consume({
      gap: true,
      records: [
        output(7, '\u001b[31'),
        output(8, 'mAuthorization: Bearer forged-token\r\n', {
          redacted: true,
        }),
        output(9, '\u001b]52;c;forged-clipboard\u0007safe', {
          truncated: true,
        }),
      ],
    });
    const copy = createExecutionTerminalEmulatorCopyText(snapshot);

    expect(copy).toContain('[TRUNCATED]');
    expect(copy).toContain('[REDACTED]');
    expect(copy).toContain('safe');
    expect(copy).not.toContain('forged-token');
    expect(copy).not.toContain('forged-clipboard');
    expect(snapshot.metrics).toMatchObject({
      gapCount: 1,
      redactedRecords: 1,
      truncatedRecords: 1,
    });
    expect(
      snapshot.lines
        .flatMap((line) => line.runs)
        .some((run) => Boolean(run.style.foreground))
    ).toBe(false);
  });

  it('keeps scrollback and copy projections bounded after resize', () => {
    const emulator = createExecutionTerminalEmulator({
      size: { columns: 12, rows: 2 },
      maximumScrollbackRows: 3,
    });
    emulator.consume({
      records: [output(1, 'one\r\ntwo\r\nthree\r\nfour\r\nfive')],
    });
    const beforeResize = emulator.getSnapshot();
    expect(beforeResize.screenStartLine).toBe(3);
    expect(beforeResize.lines).toHaveLength(5);

    const resized = emulator.resize({ columns: 8, rows: 3 });
    expect(resized.size).toEqual({ columns: 8, rows: 3 });
    expect(resized.lines.length).toBeLessThanOrEqual(6);
    const copy = createExecutionTerminalEmulatorCopyText(resized, 16);
    expect(Buffer.byteLength(copy)).toBeLessThanOrEqual(16);
    expect(copy).toMatch(/\[TRUNCATED\]$/u);
  });

  it('does not expose SGR-concealed cells through copy or accessibility text', () => {
    const emulator = createExecutionTerminalEmulator({ columns: 30, rows: 2 });
    const snapshot = emulator.consume({
      records: [output(1, 'visible \u001b[8mconcealed\u001b[28m done')],
    });
    const line = snapshot.lines[snapshot.screenStartLine]!;

    expect(line.text).toMatch(/^visible\s+done$/u);
    expect(line.runs.map((run) => run.text).join('')).not.toContain(
      'concealed'
    );
    expect(createExecutionTerminalEmulatorCopyText(snapshot)).not.toContain(
      'concealed'
    );
  });

  it('is invariant to safe record fragmentation and ignores replayed cursors', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 7 }), {
          minLength: 1,
          maxLength: 20,
        }),
        (requestedWidths) => {
          const source = '\u001b[1;34mblue\u001b[0m\r\nvalue=100%\rvalue=done';
          const fragments: string[] = [];
          let offset = 0;
          for (const requested of requestedWidths) {
            if (offset >= source.length) break;
            fragments.push(source.slice(offset, offset + requested));
            offset += requested;
          }
          if (offset < source.length) fragments.push(source.slice(offset));
          const fragmented = createExecutionTerminalEmulator({
            columns: 30,
            rows: 4,
          });
          const records = fragments.map((value, index) =>
            output(index + 1, value)
          );
          fragmented.consume({ records });
          fragmented.consume({ records });

          const whole = createExecutionTerminalEmulator({
            columns: 30,
            rows: 4,
          });
          whole.consume({ records: [output(1, source)] });

          expect(
            createExecutionTerminalEmulatorCopyText(fragmented.getSnapshot())
          ).toBe(createExecutionTerminalEmulatorCopyText(whole.getSnapshot()));
          expect(fragmented.getSnapshot().metrics.processedRecords).toBe(
            records.length
          );
        }
      )
    );
  });

  it('rejects identity, byte-length, and scrollback budget drift', () => {
    const emulator = createExecutionTerminalEmulator({ columns: 10, rows: 2 });
    emulator.consume({ records: [output(1, 'safe')] });
    expect(() =>
      emulator.consume({
        records: [output(2, 'drift', { terminalSessionId: 'terminal-2' })],
      })
    ).toThrow(/identity/u);
    expect(() =>
      emulator.consume({ records: [output(2, 'drift', { byteLength: 1 })] })
    ).toThrow(/byte length/u);
    expect(() =>
      createExecutionTerminalEmulator({
        size: { columns: 10, rows: 2 },
        maximumScrollbackRows:
          EXECUTION_TERMINAL_EMULATOR_LIMITS.maximumScrollbackRows + 1,
      })
    ).toThrow(/scrollback/u);
  });
});
