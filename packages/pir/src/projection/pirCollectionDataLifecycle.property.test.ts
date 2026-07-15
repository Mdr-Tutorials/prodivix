import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type {
  PIRCollectionDataLifecycleMapping,
  PIRDataOperationBinding,
} from '../pir.types';
import {
  PIR_COLLECTION_DATA_LIFECYCLE_ISSUE_CODES,
  resolvePirCollectionDataLifecycle,
  type PIRDataOperationLifecycleSnapshot,
} from './pirCollectionDataLifecycle';

const operation = Object.freeze({
  documentId: 'data-catalog',
  operationId: 'list-products',
});
const binding: PIRDataOperationBinding = Object.freeze({ operation });

const createSnapshot = (
  status: PIRDataOperationLifecycleSnapshot['status']
): PIRDataOperationLifecycleSnapshot => {
  switch (status) {
    case 'idle':
      return { operation, status };
    case 'loading':
      return { operation, status };
    case 'success':
      return { operation, status, value: [] };
    case 'empty':
      return { operation, status };
    case 'error':
      return {
        operation,
        status,
        error: { code: 'DATA_FAILED', message: 'Failed', retryable: true },
      };
  }
};

describe('PIR Collection data lifecycle properties', () => {
  it('maps every Data lifecycle status without inferring empty from values', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<PIRDataOperationLifecycleSnapshot['status']>(
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
