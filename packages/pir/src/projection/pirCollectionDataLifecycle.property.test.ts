import type { DataLifecycleSnapshot } from '@prodivix/data';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type {
  PIRCollectionDataLifecycleMapping,
  PIRDataOperationBinding,
} from '../pir.types';
import {
  PIR_COLLECTION_DATA_LIFECYCLE_ISSUE_CODES,
  resolvePirCollectionDataLifecycle,
} from './pirCollectionDataLifecycle';

const operation = Object.freeze({
  documentId: 'data-catalog',
  operationId: 'list-products',
});
const binding: PIRDataOperationBinding = Object.freeze({ operation });

const createSnapshot = (
  status: DataLifecycleSnapshot['status']
): DataLifecycleSnapshot => {
  const invocation = {
    operation,
    sequence: 1,
    invocationId: 'invocation-1',
    attempt: 1,
    startedAt: 10,
  } as const;
  switch (status) {
    case 'idle':
      return { operation, sequence: 0, status };
    case 'loading':
      return { ...invocation, status };
    case 'success':
      return { ...invocation, status, completedAt: 20, value: [] };
    case 'empty':
      return { ...invocation, status, completedAt: 20 };
    case 'error':
      return {
        ...invocation,
        status,
        completedAt: 20,
        error: { code: 'DATA_FAILED', message: 'Failed', retryable: true },
      };
  }
};

describe('PIR Collection data lifecycle properties', () => {
  it('maps every Data lifecycle status without inferring empty from values', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<DataLifecycleSnapshot['status']>(
          'idle',
          'loading',
          'success',
          'empty',
          'error'
        ),
        fc.constantFrom<PIRCollectionDataLifecycleMapping['idle']>(
          'loading',
          'empty'
        ),
        (status, idle) => {
          const mapping = {
            kind: 'data-operation',
            dataId: 'catalog-rows',
            idle,
          } as const;
          const result = resolvePirCollectionDataLifecycle({
            binding,
            mapping,
            snapshot: createSnapshot(status),
          });
          expect(result.status).toBe('ready');
          if (result.status !== 'ready') return;
          expect(result.dataId).toBe('catalog-rows');
          expect(result.state).toBe(
            status === 'idle' ? idle : status === 'success' ? 'item' : status
          );
          if (status === 'success') expect(result.value).toEqual([]);
          if (status === 'error') {
            expect(result.errorValue).toMatchObject({ code: 'DATA_FAILED' });
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  it('fails closed when a snapshot belongs to another operation', () => {
    const result = resolvePirCollectionDataLifecycle({
      binding,
      mapping: {
        kind: 'data-operation',
        dataId: 'catalog-rows',
        idle: 'loading',
      },
      snapshot: {
        operation: { ...operation, operationId: 'other-operation' },
        sequence: 0,
        status: 'idle',
      },
    });

    expect(result).toEqual({
      status: 'blocked',
      issues: [
        expect.objectContaining({
          code: PIR_COLLECTION_DATA_LIFECYCLE_ISSUE_CODES.operationMismatch,
        }),
      ],
    });
  });
});
