import { describe, expect, it } from 'vitest';
import { decodeNodeGraphDocument } from '..';
import { nodeGraphCurrentWireSchema } from '../wire';

describe('NodeGraph current wire conformance', () => {
  it('decodes every canonical schema example through the current model', () => {
    for (const example of nodeGraphCurrentWireSchema.examples) {
      expect(decodeNodeGraphDocument(example)).toEqual({
        ok: true,
        value: example,
      });
    }
  });
});
