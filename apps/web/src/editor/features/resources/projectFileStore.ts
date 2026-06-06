import apache20LicenseTemplate from './templates/licenses/apache-2.0.txt?raw';
import bsd2ClauseLicenseTemplate from './templates/licenses/bsd-2-clause.txt?raw';
import bsd3ClauseLicenseTemplate from './templates/licenses/bsd-3-clause.txt?raw';
import iscLicenseTemplate from './templates/licenses/isc.txt?raw';
import mitLicenseTemplate from './templates/licenses/mit.txt?raw';

export type ProjectFileKind = 'gitignore' | 'license' | 'readme' | 'env';

export type ProjectFile = {
  id: string;
  path: string;
  kind: ProjectFileKind;
  mime: string;
  content: string;
  enabled: boolean;
  updatedAt: string;
};

export type ProjectFileTemplateId =
  | 'gitignore-vite-react'
  | 'license-mit'
  | 'license-isc'
  | 'license-bsd-2-clause'
  | 'license-bsd-3-clause'
  | 'license-apache-2'
  | 'readme-basic'
  | 'env-example';

export type ProjectGitignoreSnippetId =
  | 'dependencies'
  | 'buildOutput'
  | 'localEnv'
  | 'logs'
  | 'editor'
  | 'testCache';

export type ProjectFileTemplate = {
  id: ProjectFileTemplateId;
  targetPath: string;
  label: string;
  content: string;
};

export type ProjectGitignoreSnippet = {
  id: ProjectGitignoreSnippetId;
  label: string;
  content: string;
};

export type ProjectFileTemplateContext = {
  projectName?: string;
  projectDescription?: string;
  copyrightHolder?: string;
  year?: number;
};

const nowIso = () => new Date().toISOString();

export const PROJECT_GITIGNORE_SNIPPETS: ProjectGitignoreSnippet[] = [
  {
    id: 'dependencies',
    label: 'Dependencies',
    content: `# dependencies
node_modules
`,
  },
  {
    id: 'buildOutput',
    label: 'Build output',
    content: `# production
dist
build
`,
  },
  {
    id: 'localEnv',
    label: 'Local env',
    content: `# local env
.env
.env.*
!.env.example
`,
  },
  {
    id: 'logs',
    label: 'Logs',
    content: `# logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
`,
  },
  {
    id: 'editor',
    label: 'Editor settings',
    content: `# editor
.DS_Store
.idea
.vscode
`,
  },
  {
    id: 'testCache',
    label: 'Test and cache',
    content: `# test and cache
coverage
.turbo
.vite
`,
  },
];

const defaultGitignoreContent = PROJECT_GITIGNORE_SNIPPETS.map((snippet) =>
  snippet.content.trimEnd()
).join('\n\n');

const createReadmeTemplateContent = (
  projectName: string,
  projectDescription: string
) => `# ${projectName}

${projectDescription}

## Overview

This project was exported from Prodivix as a standalone Vite + React application.

## Tech stack

- React
- TypeScript
- Vite

## Getting started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Available scripts

\`\`\`bash
npm install
npm run dev
npm run build
npm run preview
\`\`\`

## Project structure

\`\`\`text
src/
  App.tsx
  main.tsx
index.html
package.json
\`\`\`

## Notes

- Update this README before publishing or handing off the exported project.
- Keep environment-specific values in .env files and commit only safe examples.
`;

export const PROJECT_FILE_TEMPLATES: ProjectFileTemplate[] = [
  {
    id: 'gitignore-vite-react',
    targetPath: '.gitignore',
    label: 'Vite + React',
    content: `${defaultGitignoreContent}\n`,
  },
  {
    id: 'license-mit',
    targetPath: 'LICENSE',
    label: 'MIT',
    content: mitLicenseTemplate,
  },
  {
    id: 'license-isc',
    targetPath: 'LICENSE',
    label: 'ISC',
    content: iscLicenseTemplate,
  },
  {
    id: 'license-bsd-2-clause',
    targetPath: 'LICENSE',
    label: 'BSD-2-Clause',
    content: bsd2ClauseLicenseTemplate,
  },
  {
    id: 'license-bsd-3-clause',
    targetPath: 'LICENSE',
    label: 'BSD-3-Clause',
    content: bsd3ClauseLicenseTemplate,
  },
  {
    id: 'license-apache-2',
    targetPath: 'LICENSE',
    label: 'Apache-2.0',
    content: apache20LicenseTemplate,
  },
  {
    id: 'readme-basic',
    targetPath: 'README.md',
    label: 'Basic README',
    content: createReadmeTemplateContent(
      '[project name]',
      '[Describe what this exported project does.]'
    ),
  },
  {
    id: 'env-example',
    targetPath: '.env.example',
    label: 'Environment example',
    content: `# Replace with your API base URL.
VITE_API_BASE_URL=https://api.example.com
`,
  },
];

export const createProjectFileTemplateContent = (
  template: ProjectFileTemplate,
  context: ProjectFileTemplateContext = {}
) => {
  const projectName = context.projectName?.trim() || '[project name]';
  const projectDescription =
    context.projectDescription?.trim() ||
    '[Describe what this exported project does.]';
  const copyrightHolder =
    context.copyrightHolder?.trim() || '[copyright holder]';
  const year = String(context.year ?? new Date().getFullYear());

  if (template.id === 'readme-basic') {
    return createReadmeTemplateContent(projectName, projectDescription);
  }

  if (
    template.id === 'license-mit' ||
    template.id === 'license-isc' ||
    template.id === 'license-bsd-2-clause' ||
    template.id === 'license-bsd-3-clause' ||
    template.id === 'license-apache-2'
  ) {
    return template.content
      .replaceAll('[year]', year)
      .replaceAll('[copyright holder]', copyrightHolder);
  }

  return template.content;
};

const findLicenseCopyrightLineIndex = (lines: string[]) =>
  lines.findIndex((line) => /^copyright\b/i.test(line.trim()));

export const isLicenseProjectFileTemplate = (template: ProjectFileTemplate) =>
  template.targetPath === 'LICENSE';

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

const createProjectFile = (
  path: string,
  kind: ProjectFileKind,
  mime: string,
  content: string,
  enabled: boolean
): ProjectFile => ({
  id: `project-file-${path.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`,
  path,
  kind,
  mime,
  content,
  enabled,
  updatedAt: nowIso(),
});

const getFirstProjectFileTemplateByPath = (path: string) =>
  PROJECT_FILE_TEMPLATES.find((template) => template.targetPath === path);

export const createDefaultProjectFiles = (): ProjectFile[] => [
  (() => {
    const template = getFirstProjectFileTemplateByPath('.gitignore');
    return createProjectFile(
      '.gitignore',
      'gitignore',
      'text/plain',
      template?.content ?? '',
      true
    );
  })(),
  (() => {
    const template = getFirstProjectFileTemplateByPath('LICENSE');
    return createProjectFile(
      'LICENSE',
      'license',
      'text/plain',
      template ? createProjectFileTemplateContent(template) : '',
      false
    );
  })(),
  (() => {
    const template = getFirstProjectFileTemplateByPath('README.md');
    return createProjectFile(
      'README.md',
      'readme',
      'text/markdown',
      template ? createProjectFileTemplateContent(template) : '',
      false
    );
  })(),
  (() => {
    const template = getFirstProjectFileTemplateByPath('.env.example');
    return createProjectFile(
      '.env.example',
      'env',
      'text/plain',
      template?.content ?? '',
      false
    );
  })(),
];

const getProjectFilesStorageKey = (projectId?: string) =>
  `prodivix.projectFiles.${projectId?.trim() || 'default'}`;

const withDefaultProjectFiles = (files: ProjectFile[]) => {
  const filesByPath = new Map(files.map((file) => [file.path, file]));
  const defaults = createDefaultProjectFiles();
  defaults.forEach((file) => {
    if (!filesByPath.has(file.path)) filesByPath.set(file.path, file);
  });
  return Array.from(filesByPath.values()).map((file) => ({
    ...file,
    updatedAt: file.updatedAt || nowIso(),
  }));
};

export const readProjectFiles = (projectId?: string): ProjectFile[] => {
  if (typeof window === 'undefined') return createDefaultProjectFiles();
  try {
    const raw = window.localStorage.getItem(
      getProjectFilesStorageKey(projectId)
    );
    if (!raw) return createDefaultProjectFiles();
    const parsed = JSON.parse(raw) as ProjectFile[];
    if (!Array.isArray(parsed)) return createDefaultProjectFiles();
    const validFiles = parsed.filter(
      (file): file is ProjectFile =>
        Boolean(file) &&
        typeof file.path === 'string' &&
        typeof file.content === 'string' &&
        typeof file.enabled === 'boolean'
    );
    return withDefaultProjectFiles(validFiles);
  } catch {
    return createDefaultProjectFiles();
  }
};

export const writeProjectFiles = (
  projectId: string | undefined,
  files: ProjectFile[]
) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    getProjectFilesStorageKey(projectId),
    JSON.stringify(withDefaultProjectFiles(files))
  );
};

export const updateProjectFile = (
  files: ProjectFile[],
  path: string,
  patch: Partial<Pick<ProjectFile, 'content' | 'enabled'>>
): ProjectFile[] =>
  withDefaultProjectFiles(files).map((file) =>
    file.path === path
      ? {
          ...file,
          ...patch,
          updatedAt: nowIso(),
        }
      : file
  );

export const applyProjectFileTemplate = (
  files: ProjectFile[],
  templateId: ProjectFileTemplateId
): ProjectFile[] => {
  const template = PROJECT_FILE_TEMPLATES.find(
    (item) => item.id === templateId
  );
  if (!template) return withDefaultProjectFiles(files);
  return updateProjectFile(files, template.targetPath, {
    content: createProjectFileTemplateContent(template),
    enabled: true,
  });
};

export const flattenEnabledProjectFiles = (
  files: ProjectFile[]
): Array<ProjectFile & { path: string }> =>
  withDefaultProjectFiles(files).filter((file) => file.enabled);
