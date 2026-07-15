import type React from 'react';
import type {
  PIRCollectionPreviewInput,
  PIRCollectionProjectionLocation,
} from '@prodivix/pir';
import type { WorkspacePirProjectionPlan } from '@prodivix/workspace';
import type {
  PIRDataOperationRuntimePort,
  PIRRenderLocation,
  PIRRendererBlockingIssue,
  PIRResolvedRendererHost,
  PIRTriggerDispatchRequest,
} from '../PIRRenderer.types';

export type PIRProjectionRuntime = Readonly<{
  plan: WorkspacePirProjectionPlan;
  host: PIRResolvedRendererHost;
  dispatchTrigger: (request: PIRTriggerDispatchRequest) => void;
  resolveCollectionPreviewState?: (
    location: PIRCollectionProjectionLocation
  ) => PIRCollectionPreviewInput | undefined;
  dataOperationRuntime?: PIRDataOperationRuntimePort;
  reportCollectionBlockingIssues: (
    location: PIRCollectionProjectionLocation,
    issues: readonly PIRRendererBlockingIssue[]
  ) => void;
  reportDataBlockingIssues: (
    documentId: string,
    instancePath: string,
    issues: readonly PIRRendererBlockingIssue[]
  ) => void;
  selectedLocation?: PIRRenderLocation;
  hiddenLocations?: readonly PIRRenderLocation[];
  onNodeSelect?: (
    location: PIRRenderLocation,
    event: React.SyntheticEvent
  ) => void;
}>;

export const createPirCollectionLocationIdentity = (
  location: PIRCollectionProjectionLocation
): string =>
  JSON.stringify([location.documentId, location.nodeId, location.instancePath]);

export const createPirDataLocationIdentity = (
  documentId: string,
  instancePath: string
): string => JSON.stringify([documentId, instancePath]);
