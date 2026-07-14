import { describe, expect, it } from 'vitest';
import { PdxButton } from '@prodivix/ui';
import { createComponentRegistry } from '@prodivix/pir-react-renderer';
import { createPirWebRendererHost } from './pirWebRendererHost';

describe('createPirWebRendererHost', () => {
  it('resolves built-in Prodivix UI components when no extension owns the type', () => {
    const host = createPirWebRendererHost(createComponentRegistry());

    expect(host.resolveElement('PdxButton')?.component).toBe(PdxButton);
  });
});
