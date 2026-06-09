import {
  renderTarget,
  resolveMultiplicity,
  type GraphNodeData,
} from '@/editor/features/development/reactflow/graphNodeShared';
import {
  buildNodeContainerClass,
  NODE_TEXT_INPUT_CLASS,
  NodeHeader,
  NodeValidationHint,
  SelectField,
} from './nodePrimitives';
import type { NodeI18n } from './nodeI18n';
import { renderNodeRow } from './nodeRows';
import { tNode } from './nodeI18n';

type Props = {
  id: string;
  nodeData: GraphNodeData;
  selected: boolean;
  t: NodeI18n;
};

export const renderInteractionMotionGraphNode = ({
  id,
  nodeData,
  selected,
  t,
}: Props) => {
  if (nodeData.kind === 'playAnimation') {
    return (
      <div className={buildNodeContainerClass(selected, 'min-w-[260px]')}>
        <NodeHeader
          title={nodeData.label}
          leftSlot={renderTarget(
            id,
            'in.control.prev',
            'control',
            resolveMultiplicity('target', 'control'),
            undefined,
            nodeData.onPortContextMenu
          )}
        />
        <div className="pb-1">
          <div className="grid grid-cols-2 gap-1 px-4 pb-1">
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.targetId ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'targetId', event.target.value)
              }
              placeholder={tNode(
                t,
                'interactionMotion.playAnimation.targetIdPlaceholder',
                'target id'
              )}
              spellCheck={false}
            />
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.timelineName ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'timelineName', event.target.value)
              }
              placeholder={tNode(
                t,
                'interactionMotion.playAnimation.timelinePlaceholder',
                'timeline'
              )}
              spellCheck={false}
            />
          </div>
          <div className="grid grid-cols-3 gap-1 px-4 pb-1">
            <SelectField
              className="w-full"
              value={nodeData.action ?? 'play'}
              onChange={(value) =>
                nodeData.onChangeField?.(id, 'action', value)
              }
              options={[
                {
                  value: 'play',
                  label: tNode(
                    t,
                    'interactionMotion.playAnimation.actions.play',
                    'play'
                  ),
                },
                {
                  value: 'pause',
                  label: tNode(
                    t,
                    'interactionMotion.playAnimation.actions.pause',
                    'pause'
                  ),
                },
                {
                  value: 'reverse',
                  label: tNode(
                    t,
                    'interactionMotion.playAnimation.actions.reverse',
                    'reverse'
                  ),
                },
                {
                  value: 'stop',
                  label: tNode(
                    t,
                    'interactionMotion.playAnimation.actions.stop',
                    'stop'
                  ),
                },
              ]}
            />
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.speed ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'speed', event.target.value)
              }
              placeholder={tNode(
                t,
                'interactionMotion.playAnimation.speedPlaceholder',
                'speed'
              )}
              spellCheck={false}
            />
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.iterations ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'iterations', event.target.value)
              }
              placeholder={tNode(
                t,
                'interactionMotion.playAnimation.loopsPlaceholder',
                'loops'
              )}
              spellCheck={false}
            />
          </div>
          {renderNodeRow(
            id,
            nodeData,
            tNode(t, 'common.rows.target', 'target'),
            {
              inHandle: 'in.data.target',
              inSemantic: 'data',
            }
          )}
          {renderNodeRow(
            id,
            nodeData,
            tNode(t, 'common.rows.timeline', 'timeline'),
            {
              inHandle: 'in.data.timeline',
              inSemantic: 'data',
            }
          )}
          {renderNodeRow(id, nodeData, tNode(t, 'common.rows.start', 'start'), {
            outHandle: 'out.control.start',
          })}
          {renderNodeRow(
            id,
            nodeData,
            tNode(t, 'common.rows.complete', 'complete'),
            {
              outHandle: 'out.control.complete',
            }
          )}
          {renderNodeRow(id, nodeData, tNode(t, 'common.rows.error', 'error'), {
            outHandle: 'out.control.error',
          })}
        </div>
        <NodeValidationHint message={nodeData.validationMessage} />
      </div>
    );
  }

  if (nodeData.kind === 'scrollTo') {
    return (
      <div className={buildNodeContainerClass(selected, 'min-w-[250px]')}>
        <NodeHeader
          title={nodeData.label}
          leftSlot={renderTarget(
            id,
            'in.control.prev',
            'control',
            resolveMultiplicity('target', 'control'),
            undefined,
            nodeData.onPortContextMenu
          )}
        />
        <div className="pb-1">
          <div className="grid grid-cols-3 gap-1 px-4 pb-1">
            <SelectField
              className="w-full"
              value={nodeData.target ?? 'top'}
              onChange={(value) =>
                nodeData.onChangeField?.(id, 'target', value)
              }
              options={[
                {
                  value: 'top',
                  label: tNode(
                    t,
                    'interactionMotion.scrollTo.targets.top',
                    'top'
                  ),
                },
                {
                  value: 'bottom',
                  label: tNode(
                    t,
                    'interactionMotion.scrollTo.targets.bottom',
                    'bottom'
                  ),
                },
                {
                  value: 'selector',
                  label: tNode(
                    t,
                    'interactionMotion.scrollTo.targets.selector',
                    'selector'
                  ),
                },
              ]}
            />
            <SelectField
              className="w-full"
              value={nodeData.behavior ?? 'smooth'}
              onChange={(value) =>
                nodeData.onChangeField?.(id, 'behavior', value)
              }
              options={[
                {
                  value: 'smooth',
                  label: tNode(
                    t,
                    'interactionMotion.scrollTo.behaviors.smooth',
                    'smooth'
                  ),
                },
                {
                  value: 'auto',
                  label: tNode(
                    t,
                    'interactionMotion.scrollTo.behaviors.auto',
                    'auto'
                  ),
                },
              ]}
            />
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.offset ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'offset', event.target.value)
              }
              placeholder={tNode(
                t,
                'interactionMotion.scrollTo.offsetPlaceholder',
                'offset'
              )}
              spellCheck={false}
            />
          </div>
          {nodeData.target === 'selector' ? (
            <div className="px-4 pb-1">
              <input
                className={NODE_TEXT_INPUT_CLASS}
                value={nodeData.selector ?? ''}
                onChange={(event) =>
                  nodeData.onChangeField?.(id, 'selector', event.target.value)
                }
                placeholder={tNode(
                  t,
                  'interactionMotion.scrollTo.selectorPlaceholder',
                  '#selector'
                )}
                spellCheck={false}
              />
            </div>
          ) : null}
          {renderNodeRow(
            id,
            nodeData,
            tNode(t, 'common.rows.target', 'target'),
            {
              inHandle: 'in.data.target',
              inSemantic: 'data',
            }
          )}
          {renderNodeRow(id, nodeData, tNode(t, 'common.rows.done', 'done'), {
            outHandle: 'out.control.done',
          })}
          {renderNodeRow(id, nodeData, tNode(t, 'common.rows.error', 'error'), {
            outHandle: 'out.control.error',
          })}
        </div>
        <NodeValidationHint message={nodeData.validationMessage} />
      </div>
    );
  }

  if (nodeData.kind === 'focusControl') {
    return (
      <div className={buildNodeContainerClass(selected, 'min-w-[240px]')}>
        <NodeHeader
          title={nodeData.label}
          leftSlot={renderTarget(
            id,
            'in.control.prev',
            'control',
            resolveMultiplicity('target', 'control'),
            undefined,
            nodeData.onPortContextMenu
          )}
        />
        <div className="pb-1">
          <div className="grid grid-cols-2 gap-1 px-4 pb-1">
            <SelectField
              className="w-full"
              value={nodeData.action ?? 'focus'}
              onChange={(value) =>
                nodeData.onChangeField?.(id, 'action', value)
              }
              options={[
                {
                  value: 'focus',
                  label: tNode(
                    t,
                    'interactionMotion.focusControl.actions.focus',
                    'focus'
                  ),
                },
                {
                  value: 'blur',
                  label: tNode(
                    t,
                    'interactionMotion.focusControl.actions.blur',
                    'blur'
                  ),
                },
                {
                  value: 'select',
                  label: tNode(
                    t,
                    'interactionMotion.focusControl.actions.select',
                    'select'
                  ),
                },
              ]}
            />
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.selector ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'selector', event.target.value)
              }
              placeholder={tNode(
                t,
                'interactionMotion.focusControl.selectorPlaceholder',
                '#input'
              )}
              spellCheck={false}
            />
          </div>
          {renderNodeRow(
            id,
            nodeData,
            tNode(t, 'common.rows.target', 'target'),
            {
              inHandle: 'in.data.target',
              inSemantic: 'data',
            }
          )}
          {renderNodeRow(id, nodeData, tNode(t, 'common.rows.done', 'done'), {
            outHandle: 'out.control.done',
          })}
          {renderNodeRow(id, nodeData, tNode(t, 'common.rows.error', 'error'), {
            outHandle: 'out.control.error',
          })}
        </div>
        <NodeValidationHint message={nodeData.validationMessage} />
      </div>
    );
  }

  if (nodeData.kind === 'clipboard') {
    return (
      <div className={buildNodeContainerClass(selected, 'min-w-[230px]')}>
        <NodeHeader
          title={nodeData.label}
          leftSlot={renderTarget(
            id,
            'in.control.prev',
            'control',
            resolveMultiplicity('target', 'control'),
            undefined,
            nodeData.onPortContextMenu
          )}
        />
        <div className="pb-1">
          <div className="px-4 pb-1">
            <SelectField
              className="w-full"
              value={nodeData.mode ?? 'copy'}
              onChange={(value) => nodeData.onChangeField?.(id, 'mode', value)}
              options={[
                {
                  value: 'copy',
                  label: tNode(
                    t,
                    'interactionMotion.clipboard.modes.copy',
                    'copy'
                  ),
                },
                {
                  value: 'read',
                  label: tNode(
                    t,
                    'interactionMotion.clipboard.modes.read',
                    'read'
                  ),
                },
              ]}
            />
          </div>
          {renderNodeRow(
            id,
            nodeData,
            tNode(t, 'clipboard.rows.valueIn', 'value in'),
            {
              inHandle: 'in.data.value',
              inSemantic: 'data',
            }
          )}
          {renderNodeRow(id, nodeData, tNode(t, 'common.rows.done', 'done'), {
            outHandle: 'out.control.done',
          })}
          {renderNodeRow(id, nodeData, tNode(t, 'common.rows.error', 'error'), {
            outHandle: 'out.control.error',
          })}
          {renderNodeRow(
            id,
            nodeData,
            tNode(t, 'clipboard.rows.valueOut', 'value out'),
            {
              outHandle: 'out.data.value',
              outSemantic: 'data',
            }
          )}
        </div>
      </div>
    );
  }

  return null;
};
