import { describe, expect, it } from 'vitest';
import { resolveExecutionPrimarySourceTrace } from './executionSourceTraceModel';

describe('execution SourceTrace selection', () => {
  it('retains exactly one canonical owner', () => {
    const trace = {
      sourceRef: { kind: 'code-artifact' as const, artifactId: 'code-test' },
      sourceSpan: {
        artifactId: 'code-test',
        startLine: 1,
        startColumn: 1,
        endLine: 1,
        endColumn: 10,
      },
    };

    expect(resolveExecutionPrimarySourceTrace([trace])).toBe(trace);
  });

  it('fails closed for root/helper ambiguity', () => {
    expect(
      resolveExecutionPrimarySourceTrace([
        {
          sourceRef: { kind: 'code-artifact', artifactId: 'code-root' },
        },
        {
          sourceRef: { kind: 'code-artifact', artifactId: 'code-helper' },
        },
      ])
    ).toBeUndefined();
  });

  it('rejects a span that crosses CodeArtifact identity', () => {
    expect(
      resolveExecutionPrimarySourceTrace([
        {
          sourceRef: { kind: 'code-artifact', artifactId: 'code-root' },
          sourceSpan: {
            artifactId: 'code-helper',
            startLine: 1,
            startColumn: 1,
            endLine: 1,
            endColumn: 2,
          },
        },
      ])
    ).toBeUndefined();
  });
});
