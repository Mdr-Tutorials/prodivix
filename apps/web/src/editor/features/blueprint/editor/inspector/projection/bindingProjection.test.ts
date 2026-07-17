import { describe, expect, it } from 'vitest';
import type { PIRElementNode } from '@prodivix/pir';
import { projectEvents, toElementNode } from './bindingProjection';

describe('Blueprint Inspector Data mutation projection', () => {
  it('round-trips a typed mutation event without degrading its binding', () => {
    const current: PIRElementNode = {
      id: 'remove-button',
      kind: 'element',
      type: 'button',
      events: {
        onClick: {
          kind: 'dispatch-data-operation',
          operation: { documentId: 'catalog', operationId: 'remove' },
          input: {
            kind: 'object',
            propertiesByKey: {
              id: { kind: 'trigger-payload', path: '/id' },
            },
          },
        },
      },
    };
    const events = projectEvents(current.events);
    expect(events?.onClick).toMatchObject({
      action: 'executeDataMutation',
      editable: true,
      params: {
        operation: { documentId: 'catalog', operationId: 'remove' },
      },
    });
    expect(
      toElementNode(
        {
          id: current.id,
          type: current.type,
          events,
        },
        current
      )
    ).toEqual(current);
  });
});
