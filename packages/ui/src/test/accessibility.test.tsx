import { render } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import PdxButton from '../button/PdxButton';
import PdxMessage from '../feedback/PdxMessage';
import PdxInput from '../input/PdxInput';
import PdxTabs from '../nav/PdxTabs';

describe('representative component accessibility', () => {
  it('has no automatically detectable violations', async () => {
    const { container } = render(
      <main>
        <PdxButton text="Save" variant="Primary" />
        <label>
          Project name
          <PdxInput />
        </label>
        <PdxMessage text="Saved" type="Success" />
        <PdxTabs
          aria-label="Project sections"
          items={[
            { key: 'overview', label: 'Overview', content: 'Overview content' },
            { key: 'activity', label: 'Activity', content: 'Activity content' },
          ]}
        />
      </main>
    );

    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
