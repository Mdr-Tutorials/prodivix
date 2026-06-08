import type {
  ProjectFileTemplate,
  ProjectFileTemplateId,
} from './projectFileStore';

const PROJECT_COPYRIGHT_LICENSE_TEMPLATE_IDS = new Set<ProjectFileTemplateId>([
  'license-mit',
  'license-isc',
  'license-bsd-2-clause',
  'license-bsd-3-clause',
  'license-apache-2',
]);

const findLicenseCopyrightLineIndex = (lines: string[]) =>
  lines.findIndex((line) => /^copyright\b/i.test(line.trim()));

export const isLicenseProjectFileTemplate = (template: ProjectFileTemplate) =>
  template.targetPath === 'LICENSE';

export const isProjectCopyrightLicenseTemplate = (
  template: ProjectFileTemplate
) => PROJECT_COPYRIGHT_LICENSE_TEMPLATE_IDS.has(template.id);

export const mergeLicenseEditableMetadata = (
  templateContent: string,
  value: string
) => {
  const templateLines = templateContent.split('\n');
  const valueLines = value.split('\n');
  const templateCopyrightIndex = findLicenseCopyrightLineIndex(templateLines);
  const valueCopyrightIndex = findLicenseCopyrightLineIndex(valueLines);
  if (templateCopyrightIndex === -1 || valueCopyrightIndex === -1) {
    return templateContent;
  }
  const nextLines = [...templateLines];
  nextLines[templateCopyrightIndex] = valueLines[valueCopyrightIndex];
  return nextLines.join('\n');
};

export const normalizeLicenseForTemplateMatch = (content: string) => {
  const lines = content.trim().split('\n');
  const copyrightLineIndex = findLicenseCopyrightLineIndex(lines);
  if (copyrightLineIndex !== -1) lines[copyrightLineIndex] = '';
  return lines.join('\n').trim();
};
