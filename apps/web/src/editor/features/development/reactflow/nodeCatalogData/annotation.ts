import type { NodeCatalogItem } from '../nodeCatalog';
import {
  CONTROL_IN,
  CONTROL_OUT,
  CONDITION_IN,
  CONDITION_OUT,
  DATA_IN,
  DATA_OUT,
} from '../nodeCatalogConstants';

export const annotationNodeCatalog: NodeCatalogItem[] = [
  {
    kind: 'groupBox',
    label: 'Group Box',
    icon: '▭',
    groupId: 'annotation',
    groupLabel: 'Annotations',
    ports: {},
    defaults: {
      value: '',
      color: 'minimal',
    },
  },
  {
    kind: 'stickyNote',
    label: 'Sticky Note',
    icon: '✎',
    groupId: 'annotation',
    groupLabel: 'Annotations',
    ports: {},
    defaults: {
      value: '',
      description: '',
      color: 'minimal',
    },
  },
];
