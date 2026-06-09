import {
  ControlButton,
  Controls,
  useReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react';
import { Maximize2, Minus, Plus } from 'lucide-react';
import type { GraphNodeData } from './GraphNode';
import type { NodeGraphTranslate } from './nodeGraphI18nTypes';

type NodeGraphViewportControlsProps = {
  t: NodeGraphTranslate;
};

export const NodeGraphViewportControls = ({
  t,
}: NodeGraphViewportControlsProps) => {
  const reactFlow = useReactFlow<Node<GraphNodeData>, Edge>();

  return (
    <Controls
      position="top-right"
      showZoom={false}
      showFitView={false}
      showInteractive={false}
      aria-label={t('nodeGraph.controls.label')}
    >
      <ControlButton
        onClick={() => void reactFlow.zoomIn()}
        title={t('nodeGraph.controls.zoomIn')}
        aria-label={t('nodeGraph.controls.zoomIn')}
      >
        <Plus size={16} aria-hidden="true" />
      </ControlButton>
      <ControlButton
        onClick={() => void reactFlow.zoomOut()}
        title={t('nodeGraph.controls.zoomOut')}
        aria-label={t('nodeGraph.controls.zoomOut')}
      >
        <Minus size={16} aria-hidden="true" />
      </ControlButton>
      <ControlButton
        onClick={() =>
          void reactFlow.fitView({
            duration: 180,
            maxZoom: 1.15,
            minZoom: 0.4,
            padding: 0.18,
          })
        }
        title={t('nodeGraph.controls.fitView')}
        aria-label={t('nodeGraph.controls.fitView')}
      >
        <Maximize2 size={16} aria-hidden="true" />
      </ControlButton>
    </Controls>
  );
};
