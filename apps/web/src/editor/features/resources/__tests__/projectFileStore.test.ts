import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyProjectFileTemplate,
  createProjectFileTemplateContent,
  flattenEnabledProjectFiles,
  mergeLicenseEditableMetadata,
  normalizeLicenseForTemplateMatch,
  PROJECT_FILE_TEMPLATES,
  readProjectFiles,
  updateProjectFile,
  writeProjectFiles,
} from '@/editor/features/resources/projectFileStore';

describe('projectFileStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates default project root files', () => {
    const files = readProjectFiles('project-001');
    expect(files.map((file) => file.path)).toEqual([
      '.gitignore',
      'LICENSE',
      'README.md',
      '.env.example',
    ]);
    expect(flattenEnabledProjectFiles(files).map((file) => file.path)).toEqual([
      '.gitignore',
    ]);
  });

  it('updates and persists project root files', () => {
    const files = readProjectFiles('project-001');
    const nextFiles = updateProjectFile(files, 'LICENSE', {
      enabled: true,
      content: 'Custom license',
    });
    writeProjectFiles('project-001', nextFiles);

    const restored = readProjectFiles('project-001');
    const license = restored.find((file) => file.path === 'LICENSE');
    expect(license?.enabled).toBe(true);
    expect(license?.content).toBe('Custom license');
  });

  it('applies templates and enables the target file', () => {
    const files = readProjectFiles('project-001');
    const nextFiles = applyProjectFileTemplate(files, 'license-apache-2');
    const license = nextFiles.find((file) => file.path === 'LICENSE');
    expect(license?.enabled).toBe(true);
    expect(license?.content).toContain('Apache License');
  });

  it('creates common license templates from external template files', () => {
    const templateContents = PROJECT_FILE_TEMPLATES.filter(
      (template) => template.targetPath === 'LICENSE'
    ).map((template) =>
      createProjectFileTemplateContent(template, {
        year: 2026,
        copyrightHolder: 'Prodivix Labs',
      })
    );
    const allLicenseText = templateContents.join('\n');

    expect(templateContents).toHaveLength(5);
    expect(allLicenseText).toContain('MIT License');
    expect(allLicenseText).toContain('ISC License');
    expect(allLicenseText).toContain('BSD 2-Clause License');
    expect(allLicenseText).toContain('BSD 3-Clause License');
    expect(allLicenseText).toContain('Apache License');
    expect(templateContents.every((content) => content.includes('2026'))).toBe(
      true
    );
    expect(
      templateContents.every((content) => content.includes('Prodivix Labs'))
    ).toBe(true);
  });

  it('preserves editable license metadata while keeping template body canonical', () => {
    const mitTemplate = PROJECT_FILE_TEMPLATES.find(
      (template) => template.id === 'license-mit'
    );
    const apacheTemplate = PROJECT_FILE_TEMPLATES.find(
      (template) => template.id === 'license-apache-2'
    );
    expect(mitTemplate).toBeDefined();
    expect(apacheTemplate).toBeDefined();

    const mitContent = createProjectFileTemplateContent(mitTemplate!, {
      year: 2026,
      copyrightHolder: 'Prodivix Labs',
    });
    const editedContent = mitContent.replace(
      'THE SOFTWARE IS PROVIDED "AS IS"',
      'THE SOFTWARE IS PROVIDED WITH CUSTOM TERMS'
    );
    const apacheContent = createProjectFileTemplateContent(apacheTemplate!, {
      year: 2026,
      copyrightHolder: 'Default Holder',
    });
    const merged = mergeLicenseEditableMetadata(apacheContent, editedContent);

    expect(merged).toContain('Copyright (c) 2026 Prodivix Labs');
    expect(merged).toContain('Apache License');
    expect(merged).not.toContain('THE SOFTWARE IS PROVIDED WITH CUSTOM TERMS');
    expect(normalizeLicenseForTemplateMatch(merged)).toBe(
      normalizeLicenseForTemplateMatch(apacheContent)
    );
  });
});
