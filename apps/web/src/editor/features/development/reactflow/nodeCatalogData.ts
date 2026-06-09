import { flowControlNodeCatalog } from './nodeCatalogData/flowControl';
import { eventsNodeCatalog } from './nodeCatalogData/events';
import { dataInputNodeCatalog } from './nodeCatalogData/dataInput';
import { dataTransformNodeCatalog } from './nodeCatalogData/dataTransform';
import { stateNodeCatalog } from './nodeCatalogData/state';
import { networkNodeCatalog } from './nodeCatalogData/network';
import { routingNodeCatalog } from './nodeCatalogData/routing';
import { uiNodeCatalog } from './nodeCatalogData/ui';
import { interactionMotionNodeCatalog } from './nodeCatalogData/interactionMotion';
import { advancedFormsNodeCatalog } from './nodeCatalogData/advancedForms';
import { realtimeFilesNodeCatalog } from './nodeCatalogData/realtimeFiles';
import { systemEnvironmentNodeCatalog } from './nodeCatalogData/systemEnvironment';
import { abstractionNodeCatalog } from './nodeCatalogData/abstraction';
import { annotationNodeCatalog } from './nodeCatalogData/annotation';
import { debugNodeCatalog } from './nodeCatalogData/debug';
import type { NodeCatalogItem } from './nodeCatalog';

export const NODE_CATALOG: NodeCatalogItem[] = [
  ...flowControlNodeCatalog,
  ...eventsNodeCatalog,
  ...dataInputNodeCatalog,
  ...dataTransformNodeCatalog,
  ...stateNodeCatalog,
  ...networkNodeCatalog,
  ...routingNodeCatalog,
  ...uiNodeCatalog,
  ...interactionMotionNodeCatalog,
  ...advancedFormsNodeCatalog,
  ...realtimeFilesNodeCatalog,
  ...systemEnvironmentNodeCatalog,
  ...abstractionNodeCatalog,
  ...annotationNodeCatalog,
  ...debugNodeCatalog,
];
