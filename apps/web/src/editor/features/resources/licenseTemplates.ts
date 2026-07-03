import agpl30OnlyLicenseTemplate from './templates/licenses/agpl-3.0-only.txt?raw';
import agpl30OrLaterLicenseTemplate from './templates/licenses/agpl-3.0-or-later.txt?raw';
import apache20LicenseTemplate from './templates/licenses/apache-2.0.txt?raw';
import bsd2ClauseLicenseTemplate from './templates/licenses/bsd-2-clause.txt?raw';
import bsd3ClauseLicenseTemplate from './templates/licenses/bsd-3-clause.txt?raw';
import gpl30OnlyLicenseTemplate from './templates/licenses/gpl-3.0-only.txt?raw';
import gpl30OrLaterLicenseTemplate from './templates/licenses/gpl-3.0-or-later.txt?raw';
import iscLicenseTemplate from './templates/licenses/isc.txt?raw';
import lgpl30OnlyLicenseTemplate from './templates/licenses/lgpl-3.0-only.txt?raw';
import lgpl30OrLaterLicenseTemplate from './templates/licenses/lgpl-3.0-or-later.txt?raw';
import mitLicenseTemplate from './templates/licenses/mit.txt?raw';
import type {
  ProjectFileTemplate,
  ProjectFileTemplateId,
} from './projectFileStore';

export type LicenseTemplateCategory =
  'permissive' | 'weakCopyleft' | 'strongCopyleft' | 'networkCopyleft';

export type LicenseTemplateProfile = {
  category: LicenseTemplateCategory;
  summaryKey: string;
  referenceUrl: string;
};

export const LICENSE_FILE_TEMPLATES: ProjectFileTemplate[] = [
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
    id: 'license-lgpl-3-only',
    targetPath: 'LICENSE',
    label: 'LGPL-3.0-only',
    content: lgpl30OnlyLicenseTemplate,
  },
  {
    id: 'license-lgpl-3-or-later',
    targetPath: 'LICENSE',
    label: 'LGPL-3.0-or-later',
    content: lgpl30OrLaterLicenseTemplate,
  },
  {
    id: 'license-gpl-3-only',
    targetPath: 'LICENSE',
    label: 'GPL-3.0-only',
    content: gpl30OnlyLicenseTemplate,
  },
  {
    id: 'license-gpl-3-or-later',
    targetPath: 'LICENSE',
    label: 'GPL-3.0-or-later',
    content: gpl30OrLaterLicenseTemplate,
  },
  {
    id: 'license-agpl-3-only',
    targetPath: 'LICENSE',
    label: 'AGPL-3.0-only',
    content: agpl30OnlyLicenseTemplate,
  },
  {
    id: 'license-agpl-3-or-later',
    targetPath: 'LICENSE',
    label: 'AGPL-3.0-or-later',
    content: agpl30OrLaterLicenseTemplate,
  },
];

export const LICENSE_TEMPLATE_PROFILES: Partial<
  Record<ProjectFileTemplateId, LicenseTemplateProfile>
> = {
  'license-mit': {
    category: 'permissive',
    summaryKey: 'mit',
    referenceUrl: 'https://spdx.org/licenses/MIT.html',
  },
  'license-isc': {
    category: 'permissive',
    summaryKey: 'isc',
    referenceUrl: 'https://spdx.org/licenses/ISC.html',
  },
  'license-bsd-2-clause': {
    category: 'permissive',
    summaryKey: 'bsd2',
    referenceUrl: 'https://spdx.org/licenses/BSD-2-Clause.html',
  },
  'license-bsd-3-clause': {
    category: 'permissive',
    summaryKey: 'bsd3',
    referenceUrl: 'https://spdx.org/licenses/BSD-3-Clause.html',
  },
  'license-apache-2': {
    category: 'permissive',
    summaryKey: 'apache2',
    referenceUrl: 'https://spdx.org/licenses/Apache-2.0.html',
  },
  'license-lgpl-3-only': {
    category: 'weakCopyleft',
    summaryKey: 'lgpl3Only',
    referenceUrl: 'https://spdx.org/licenses/LGPL-3.0-only.html',
  },
  'license-lgpl-3-or-later': {
    category: 'weakCopyleft',
    summaryKey: 'lgpl3OrLater',
    referenceUrl: 'https://spdx.org/licenses/LGPL-3.0-or-later.html',
  },
  'license-gpl-3-only': {
    category: 'strongCopyleft',
    summaryKey: 'gpl3Only',
    referenceUrl: 'https://spdx.org/licenses/GPL-3.0-only.html',
  },
  'license-gpl-3-or-later': {
    category: 'strongCopyleft',
    summaryKey: 'gpl3OrLater',
    referenceUrl: 'https://spdx.org/licenses/GPL-3.0-or-later.html',
  },
  'license-agpl-3-only': {
    category: 'networkCopyleft',
    summaryKey: 'agpl3Only',
    referenceUrl: 'https://spdx.org/licenses/AGPL-3.0-only.html',
  },
  'license-agpl-3-or-later': {
    category: 'networkCopyleft',
    summaryKey: 'agpl3OrLater',
    referenceUrl: 'https://spdx.org/licenses/AGPL-3.0-or-later.html',
  },
};
