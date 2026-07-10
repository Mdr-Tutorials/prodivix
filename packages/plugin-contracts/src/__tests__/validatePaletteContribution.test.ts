import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import {
  PALETTE_CONTRIBUTION_V1_SCHEMA_ID,
  validatePaletteContribution,
  type PaletteContributionV1,
} from '#contracts/index';

const createDescriptor = (): PaletteContributionV1 => ({
  $schema: PALETTE_CONTRIBUTION_V1_SCHEMA_ID,
  schemaVersion: '1.0',
  surface: 'blueprint.components',
  groups: [
    {
      id: 'forms',
      label: 'Forms',
      placement: { section: 'external', libraryId: 'example-ui' },
      items: [
        {
          kind: 'component',
          id: 'example-button',
          label: 'Button',
          runtimeType: 'ExampleButton',
          defaultProps: { disabled: false },
          presentation: {
            sizes: [
              { id: 'small', label: 'Small', value: 'small' },
              { id: 'large', label: 'Large', value: 'large' },
            ],
            status: {
              prop: 'variant',
              label: 'Variant',
              defaultValue: 'primary',
              options: [
                { id: 'primary', label: 'Primary', value: 'primary' },
                { id: 'danger', label: 'Danger', value: 'danger' },
              ],
            },
          },
        },
      ],
    },
  ],
});

describe('validatePaletteContribution', () => {
  it('keeps the committed example descriptor valid', async () => {
    const source = await readFile(
      new URL(
        '../../../../specs/plugins/examples/palette-contribution-v1.example.json',
        import.meta.url
      ),
      'utf8'
    );
    const descriptor = JSON.parse(source) as unknown;

    expect(validatePaletteContribution(descriptor)).toEqual({
      ok: true,
      descriptor,
      diagnostics: [],
    });
  });

  it('accepts a serializable Blueprint component descriptor', () => {
    const descriptor = createDescriptor();

    const result = validatePaletteContribution(descriptor);

    expect(result).toEqual({ ok: true, descriptor, diagnostics: [] });
  });

  it('rejects runtime callbacks at the wire boundary', () => {
    const descriptor = createDescriptor() as unknown as Record<string, unknown>;
    descriptor.resolvePreview = () => null;

    const result = validatePaletteContribution(descriptor);

    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]?.code).toBe('PLG-1003');
  });

  it('requires an external library identity', () => {
    const descriptor = createDescriptor();
    descriptor.groups[0]!.placement = {
      section: 'external',
    } as never;

    const result = validatePaletteContribution(descriptor);

    expect(result.ok).toBe(false);
    expect(result.diagnostics.map((item) => item.code)).toContain('PLG-1014');
  });

  it('rejects duplicate group and globally duplicate item ids', () => {
    const descriptor = createDescriptor();
    descriptor.groups.push({
      ...descriptor.groups[0]!,
      items: [...descriptor.groups[0]!.items],
    });

    const result = validatePaletteContribution(descriptor);

    expect(result.ok).toBe(false);
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'PLG-1014',
          meta: expect.objectContaining({ documentPath: '/groups/1/id' }),
        }),
        expect.objectContaining({
          code: 'PLG-1014',
          meta: expect.objectContaining({
            documentPath: '/groups/1/items/0/id',
          }),
        }),
      ])
    );
  });

  it('rejects duplicate option values', () => {
    const descriptor = createDescriptor();
    descriptor.groups[0]!.items[0]!.presentation!.sizes![1]!.value = 'small';

    const result = validatePaletteContribution(descriptor);

    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]?.meta.documentPath).toBe(
      '/groups/0/items/0/presentation/sizes/1/value'
    );
  });

  it('requires the status default to reference an option', () => {
    const descriptor = createDescriptor();
    descriptor.groups[0]!.items[0]!.presentation!.status!.defaultValue =
      'missing';

    const result = validatePaletteContribution(descriptor);

    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]?.meta.documentPath).toBe(
      '/groups/0/items/0/presentation/status/defaultValue'
    );
  });
});
