import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { WorkspacePirDocument } from '@prodivix/workspace';
import type { PIRRenderRole } from '../PIRRenderer.types';
import { PIRNodeProjection } from '../node/PIRNodeProjection';
import type { PIRProjectionRuntime } from '../runtime/pirProjectionRuntime';
import { projectPirDocumentDataLifecycle } from '../runtime/pirDataOperationRuntime';
import {
  createPirDocumentScope,
  createPirInitialState,
  type PIRComponentRuntimeInput,
} from '../runtime/pirRenderScope';

export const PIRDocumentProjection: React.FC<{
  document: WorkspacePirDocument;
  instancePath: string;
  role: PIRRenderRole;
  componentInput?: PIRComponentRuntimeInput;
  rootParamsById?: Readonly<Record<string, unknown>>;
  rootStateById?: Readonly<Record<string, unknown>>;
  rootDataById?: Readonly<Record<string, unknown>>;
  rootComponentPropsById?: Readonly<Record<string, unknown>>;
  rootComponentVariantsById?: Readonly<Record<string, string | undefined>>;
  runtime: PIRProjectionRuntime;
}> = ({
  document,
  instancePath,
  role,
  componentInput,
  rootParamsById,
  rootStateById,
  rootDataById,
  rootComponentPropsById,
  rootComponentVariantsById,
  runtime,
}) => {
  const initialState = useMemo(
    () => createPirInitialState(document.content, rootStateById),
    [document.content, rootStateById]
  );
  const [stateById, setStateById] = useState(initialState);
  useEffect(() => setStateById(initialState), [initialState]);
  const updateStateById = useCallback((stateId: string, value: unknown) => {
    setStateById((current) => ({ ...current, [stateId]: value }));
  }, []);
  const dataProjection = useMemo(
    () =>
      projectPirDocumentDataLifecycle({
        documentId: document.id,
        rootNodeId: document.content.ui.graph.rootId,
        instancePath,
        bindingsByDataId: document.content.logic?.dataById,
        rootDataById,
        runtime: runtime.dataOperationRuntime,
      }),
    [
      document.content.logic?.dataById,
      document.content.ui.graph.rootId,
      document.id,
      instancePath,
      rootDataById,
      runtime.dataOperationRuntime,
    ]
  );
  const reportDataBlockingIssues = runtime.reportDataBlockingIssues;
  useEffect(() => {
    reportDataBlockingIssues(document.id, instancePath, dataProjection.issues);
    return () => reportDataBlockingIssues(document.id, instancePath, []);
  }, [
    dataProjection.issues,
    document.id,
    instancePath,
    reportDataBlockingIssues,
  ]);
  const scope = useMemo(
    () =>
      createPirDocumentScope({
        document: document.content,
        stateById,
        setStateById: updateStateById,
        ...(rootParamsById ? { paramsById: rootParamsById } : {}),
        dataById: dataProjection.dataById,
        dataLifecycleById: dataProjection.lifecycleByDataId,
        ...(componentInput ? { componentInput } : {}),
        ...(rootComponentPropsById ? { rootComponentPropsById } : {}),
        ...(rootComponentVariantsById ? { rootComponentVariantsById } : {}),
      }),
    [
      componentInput,
      document.content,
      rootComponentPropsById,
      rootComponentVariantsById,
      dataProjection.dataById,
      dataProjection.lifecycleByDataId,
      rootParamsById,
      stateById,
      updateStateById,
    ]
  );
  if (dataProjection.issues.length > 0) return null;
  return (
    <PIRNodeProjection
      document={document}
      nodeId={document.content.ui.graph.rootId}
      scope={scope}
      instancePath={instancePath}
      role={role}
      componentInput={componentInput}
      runtime={runtime}
    />
  );
};
