import React, { useEffect, useMemo } from 'react';
import {
  appendPirProjectionCollectionItemPath,
  projectPirCollection,
  resolvePirCollectionDataLifecycle,
  type PIRCollectionNode,
  type PIRCollectionProjectionLocation,
} from '@prodivix/pir';
import type { WorkspacePirDocument } from '@prodivix/workspace';
import { PIRNodeList } from '../node/PIRNodeProjection';
import {
  PIR_RENDERER_BLOCKING_ISSUE_CODES,
  type PIRRenderLocation,
  type PIRRenderRole,
  type PIRRendererBlockingIssue,
} from '../PIRRenderer.types';
import type { PIRProjectionRuntime } from '../runtime/pirProjectionRuntime';
import {
  withPirProjectedValueScope,
  type PIRComponentRuntimeInput,
  type PIRInternalRenderScope,
} from '../runtime/pirRenderScope';

const EMPTY_REGIONS: Readonly<Record<string, readonly string[]>> =
  Object.freeze({});
const AUTO_COLLECTION_PREVIEW = Object.freeze({ state: 'auto' as const });

const escapePointerToken = (value: string): string =>
  value.replaceAll('~', '~0').replaceAll('/', '~1');

const createCollectionIssuePath = (
  documentId: string,
  nodeId: string,
  issuePath: string
): string =>
  `/documentsById/${escapePointerToken(documentId)}/content/ui/graph/nodesById/${escapePointerToken(nodeId)}${issuePath}`;

/** Projects one Collection exclusively through the shared PIR evaluator. */
export const PIRCollectionProjection: React.FC<{
  document: WorkspacePirDocument;
  node: PIRCollectionNode;
  scope: PIRInternalRenderScope;
  location: PIRRenderLocation;
  role: PIRRenderRole;
  componentInput?: PIRComponentRuntimeInput;
  runtime: PIRProjectionRuntime;
}> = ({ document, node, scope, location, role, componentInput, runtime }) => {
  const collectionLocation = useMemo<PIRCollectionProjectionLocation>(
    () => ({
      documentId: location.documentId,
      nodeId: location.nodeId,
      instancePath: location.instancePath,
    }),
    [location.documentId, location.instancePath, location.nodeId]
  );
  const preview =
    runtime.resolveCollectionPreviewState?.(collectionLocation) ??
    AUTO_COLLECTION_PREVIEW;
  const lifecycleProjection = useMemo(() => {
    if (preview.state !== 'auto' || !node.lifecycle) {
      return Object.freeze({
        status: 'ready' as const,
        preview,
        scope,
      });
    }
    const binding = document.content.logic?.dataById?.[node.lifecycle.dataId];
    const snapshot = scope.dataLifecycleById[node.lifecycle.dataId];
    if (!binding || !snapshot) {
      return Object.freeze({
        status: 'blocked' as const,
        issues: Object.freeze([
          {
            code: PIR_RENDERER_BLOCKING_ISSUE_CODES.dataLifecycleUnavailable,
            path: createCollectionIssuePath(
              document.id,
              node.id,
              '/lifecycle/dataId'
            ),
            message: `Collection data lifecycle "${node.lifecycle.dataId}" is unavailable in this document instance.`,
            documentId: document.id,
            nodeId: node.id,
            dataId: node.lifecycle.dataId,
            instancePath: collectionLocation.instancePath,
          },
        ]),
      });
    }
    const resolution = resolvePirCollectionDataLifecycle({
      binding,
      mapping: node.lifecycle,
      snapshot,
    });
    if (resolution.status === 'blocked') {
      return Object.freeze({
        status: 'blocked' as const,
        issues: Object.freeze(
          resolution.issues.map((issue) => ({
            code: PIR_RENDERER_BLOCKING_ISSUE_CODES.dataLifecycleProjectionBlocked,
            causeCode: issue.code,
            path: createCollectionIssuePath(
              document.id,
              node.id,
              `/lifecycle${issue.path}`
            ),
            message: issue.message,
            documentId: document.id,
            nodeId: node.id,
            dataId: node.lifecycle!.dataId,
            instancePath: collectionLocation.instancePath,
          }))
        ),
      });
    }
    return Object.freeze({
      status: 'ready' as const,
      preview: Object.freeze({
        state: resolution.state,
        ...(resolution.errorValue === undefined
          ? {}
          : { errorValue: resolution.errorValue }),
      }),
      scope:
        resolution.value === undefined
          ? scope
          : Object.freeze({
              ...scope,
              dataById: Object.freeze({
                ...scope.dataById,
                [resolution.dataId]: resolution.value,
              }),
            }),
    });
  }, [
    collectionLocation.instancePath,
    document.content.logic?.dataById,
    document.id,
    node,
    preview,
    scope,
  ]);
  const regions =
    document.content.ui.graph.regionsById?.[node.id] ?? EMPTY_REGIONS;
  const result = useMemo(
    () =>
      lifecycleProjection.status === 'blocked'
        ? undefined
        : projectPirCollection({
            node,
            regions,
            parentScope: lifecycleProjection.scope,
            preview: lifecycleProjection.preview,
            ...(runtime.host.resolveCodeValue
              ? { resolveCodeValue: runtime.host.resolveCodeValue }
              : {}),
          }),
    [lifecycleProjection, node, regions, runtime.host.resolveCodeValue]
  );
  const blockingIssues = useMemo<readonly PIRRendererBlockingIssue[]>(
    () =>
      lifecycleProjection.status === 'blocked'
        ? lifecycleProjection.issues
        : result?.status === 'blocked'
          ? result.issues.map((issue) => ({
              code: PIR_RENDERER_BLOCKING_ISSUE_CODES.collectionProjectionBlocked,
              causeCode: issue.code,
              path: createCollectionIssuePath(document.id, node.id, issue.path),
              message: issue.message,
              documentId: document.id,
              nodeId: node.id,
              instancePath: collectionLocation.instancePath,
            }))
          : [],
    [
      collectionLocation.instancePath,
      document.id,
      lifecycleProjection,
      node.id,
      result,
    ]
  );
  const reportCollectionBlockingIssues = runtime.reportCollectionBlockingIssues;
  useEffect(() => {
    reportCollectionBlockingIssues(collectionLocation, blockingIssues);
    return () => reportCollectionBlockingIssues(collectionLocation, []);
  }, [blockingIssues, collectionLocation, reportCollectionBlockingIssues]);

  if (!result || result.status === 'blocked') return null;
  if (result.projection.kind === 'region') {
    return (
      <PIRNodeList
        document={document}
        nodeIds={result.projection.nodeIds}
        scope={withPirProjectedValueScope(scope, result.projection.scope)}
        instancePath={location.instancePath}
        role={role}
        componentInput={componentInput}
        runtime={runtime}
      />
    );
  }
  return (
    <>
      {result.projection.items.map((item) => {
        const itemInstancePath = appendPirProjectionCollectionItemPath(
          location.instancePath,
          document.id,
          node.id,
          item.keyIdentity
        );
        return (
          <React.Fragment key={item.keyIdentity}>
            <PIRNodeList
              document={document}
              nodeIds={result.projection.nodeIds}
              scope={withPirProjectedValueScope(scope, item.scope)}
              instancePath={itemInstancePath}
              role={role}
              componentInput={componentInput}
              runtime={runtime}
            />
          </React.Fragment>
        );
      })}
    </>
  );
};
