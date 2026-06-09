import {
  renderTarget,
  resolveMultiplicity,
  type GraphNodeData,
} from '@/editor/features/development/reactflow/graphNodeShared';
import {
  buildNodeContainerClass,
  NODE_TEXT_INPUT_CLASS,
  NODE_TEXTAREA_CLASS,
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

export const renderAdvancedFormsGraphNode = ({
  id,
  nodeData,
  selected,
  t,
}: Props) => {
  if (nodeData.kind === 'validate') {
    return (
      <div className={buildNodeContainerClass(selected, 'min-w-[280px]')}>
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
              value={nodeData.ruleType ?? 'schema'}
              onChange={(value) =>
                nodeData.onChangeField?.(id, 'ruleType', value)
              }
              options={[
                {
                  value: 'schema',
                  label: tNode(
                    t,
                    'advancedForms.validate.ruleType.schema',
                    'schema'
                  ),
                },
                {
                  value: 'rules',
                  label: tNode(
                    t,
                    'advancedForms.validate.ruleType.rules',
                    'rules'
                  ),
                },
                {
                  value: 'custom',
                  label: tNode(
                    t,
                    'advancedForms.validate.ruleType.custom',
                    'custom'
                  ),
                },
              ]}
            />
            <SelectField
              className="w-full"
              value={nodeData.stopAtFirstError ?? 'false'}
              onChange={(value) =>
                nodeData.onChangeField?.(id, 'stopAtFirstError', value)
              }
              options={[
                {
                  value: 'false',
                  label: tNode(
                    t,
                    'advancedForms.validate.stopAtFirstError.false',
                    'collect all'
                  ),
                },
                {
                  value: 'true',
                  label: tNode(
                    t,
                    'advancedForms.validate.stopAtFirstError.true',
                    'stop first'
                  ),
                },
              ]}
            />
          </div>
          <div className="px-4 pb-1">
            <textarea
              className={NODE_TEXTAREA_CLASS}
              value={nodeData.schema ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'schema', event.target.value)
              }
              rows={2}
              placeholder={tNode(
                t,
                'advancedForms.validate.schemaPlaceholder',
                'schema / rule DSL'
              )}
              spellCheck={false}
            />
          </div>
          {renderNodeRow(id, nodeData, tNode(t, 'common.rows.value', 'value'), {
            inHandle: 'in.data.value',
            inSemantic: 'data',
          })}
          {renderNodeRow(id, nodeData, tNode(t, 'common.rows.rules', 'rules'), {
            inHandle: 'in.data.rules',
            inSemantic: 'data',
          })}
          {renderNodeRow(id, nodeData, tNode(t, 'common.rows.valid', 'valid'), {
            outHandle: 'out.control.valid',
          })}
          {renderNodeRow(
            id,
            nodeData,
            tNode(t, 'common.rows.invalid', 'invalid'),
            {
              outHandle: 'out.control.invalid',
            }
          )}
          {renderNodeRow(
            id,
            nodeData,
            tNode(t, 'common.rows.cleaned', 'cleaned'),
            {
              outHandle: 'out.data.cleaned',
              outSemantic: 'data',
            }
          )}
          {renderNodeRow(
            id,
            nodeData,
            tNode(t, 'common.rows.errors', 'errors'),
            {
              outHandle: 'out.data.errors',
              outSemantic: 'data',
            }
          )}
        </div>
        <NodeValidationHint message={nodeData.validationMessage} />
      </div>
    );
  }

  if (nodeData.kind === 'rateLimit') {
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
            <SelectField
              className="w-full"
              value={nodeData.mode ?? 'debounce'}
              onChange={(value) => nodeData.onChangeField?.(id, 'mode', value)}
              options={[
                {
                  value: 'debounce',
                  label: tNode(
                    t,
                    'advancedForms.rateLimit.mode.debounce',
                    'debounce'
                  ),
                },
                {
                  value: 'throttle',
                  label: tNode(
                    t,
                    'advancedForms.rateLimit.mode.throttle',
                    'throttle'
                  ),
                },
              ]}
            />
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.waitMs ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'waitMs', event.target.value)
              }
              placeholder={tNode(
                t,
                'advancedForms.rateLimit.waitMsPlaceholder',
                'wait ms'
              )}
              spellCheck={false}
            />
          </div>
          <div className="grid grid-cols-3 gap-1 px-4 pb-1">
            <SelectField
              className="w-full"
              value={nodeData.leading ?? 'false'}
              onChange={(value) =>
                nodeData.onChangeField?.(id, 'leading', value)
              }
              options={[
                {
                  value: 'false',
                  label: tNode(
                    t,
                    'advancedForms.rateLimit.leading.false',
                    'leading off'
                  ),
                },
                {
                  value: 'true',
                  label: tNode(
                    t,
                    'advancedForms.rateLimit.leading.true',
                    'leading on'
                  ),
                },
              ]}
            />
            <SelectField
              className="w-full"
              value={nodeData.trailing ?? 'true'}
              onChange={(value) =>
                nodeData.onChangeField?.(id, 'trailing', value)
              }
              options={[
                {
                  value: 'true',
                  label: tNode(
                    t,
                    'advancedForms.rateLimit.trailing.true',
                    'trailing on'
                  ),
                },
                {
                  value: 'false',
                  label: tNode(
                    t,
                    'advancedForms.rateLimit.trailing.false',
                    'trailing off'
                  ),
                },
              ]}
            />
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.maxWaitMs ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'maxWaitMs', event.target.value)
              }
              placeholder={tNode(
                t,
                'advancedForms.rateLimit.maxWaitPlaceholder',
                'max wait'
              )}
              spellCheck={false}
            />
          </div>
          {renderNodeRow(id, nodeData, tNode(t, 'common.rows.value', 'value'), {
            inHandle: 'in.data.value',
            inSemantic: 'data',
          })}
          {renderNodeRow(
            id,
            nodeData,
            tNode(t, 'advancedForms.rateLimit.fire', 'fire'),
            {
              outHandle: 'out.control.fire',
            }
          )}
          {renderNodeRow(id, nodeData, tNode(t, 'common.rows.value', 'value'), {
            outHandle: 'out.data.value',
            outSemantic: 'data',
          })}
        </div>
      </div>
    );
  }

  if (nodeData.kind === 'formContext') {
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
          <div className="px-4 pb-1">
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.formId ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'formId', event.target.value)
              }
              placeholder={tNode(
                t,
                'advancedForms.formContext.formIdPlaceholder',
                'form id'
              )}
              spellCheck={false}
            />
          </div>
          <div className="grid grid-cols-2 gap-1 px-4 pb-1">
            <SelectField
              className="w-full"
              value={nodeData.autoCreate ?? 'true'}
              onChange={(value) =>
                nodeData.onChangeField?.(id, 'autoCreate', value)
              }
              options={[
                {
                  value: 'true',
                  label: tNode(
                    t,
                    'advancedForms.formContext.autoCreate.true',
                    'auto create'
                  ),
                },
                {
                  value: 'false',
                  label: tNode(
                    t,
                    'advancedForms.formContext.autoCreate.false',
                    'manual'
                  ),
                },
              ]}
            />
            <SelectField
              className="w-full"
              value={nodeData.resetOnSubmit ?? 'false'}
              onChange={(value) =>
                nodeData.onChangeField?.(id, 'resetOnSubmit', value)
              }
              options={[
                {
                  value: 'false',
                  label: tNode(
                    t,
                    'advancedForms.formContext.resetOnSubmit.false',
                    'keep values'
                  ),
                },
                {
                  value: 'true',
                  label: tNode(
                    t,
                    'advancedForms.formContext.resetOnSubmit.true',
                    'reset submit'
                  ),
                },
              ]}
            />
          </div>
          {renderNodeRow(
            id,
            nodeData,
            tNode(t, 'common.rows.changed', 'changed'),
            {
              outHandle: 'out.control.changed',
            }
          )}
          {renderNodeRow(id, nodeData, tNode(t, 'common.rows.form', 'form'), {
            outHandle: 'out.data.form',
            outSemantic: 'data',
          })}
          {renderNodeRow(
            id,
            nodeData,
            tNode(t, 'common.rows.values', 'values'),
            {
              outHandle: 'out.data.values',
              outSemantic: 'data',
            }
          )}
          {renderNodeRow(
            id,
            nodeData,
            tNode(t, 'common.rows.errors', 'errors'),
            {
              outHandle: 'out.data.errors',
              outSemantic: 'data',
            }
          )}
        </div>
      </div>
    );
  }

  if (nodeData.kind === 'formField') {
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
          <div className="grid grid-cols-2 gap-1 px-4 pb-1">
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.fieldName ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'fieldName', event.target.value)
              }
              placeholder={tNode(
                t,
                'advancedForms.formField.fieldPlaceholder',
                'field'
              )}
              spellCheck={false}
            />
            <SelectField
              className="w-full"
              value={nodeData.action ?? 'bind'}
              onChange={(value) =>
                nodeData.onChangeField?.(id, 'action', value)
              }
              options={[
                {
                  value: 'bind',
                  label: tNode(
                    t,
                    'advancedForms.formField.actions.bind',
                    'bind'
                  ),
                },
                {
                  value: 'get',
                  label: tNode(t, 'advancedForms.formField.actions.get', 'get'),
                },
                {
                  value: 'set',
                  label: tNode(t, 'advancedForms.formField.actions.set', 'set'),
                },
                {
                  value: 'reset',
                  label: tNode(
                    t,
                    'advancedForms.formField.actions.reset',
                    'reset'
                  ),
                },
              ]}
            />
          </div>
          <div className="px-4 pb-1">
            <input
              className={NODE_TEXT_INPUT_CLASS}
              value={nodeData.defaultValue ?? ''}
              onChange={(event) =>
                nodeData.onChangeField?.(id, 'defaultValue', event.target.value)
              }
              placeholder={tNode(
                t,
                'advancedForms.formField.defaultValuePlaceholder',
                'default value'
              )}
              spellCheck={false}
            />
          </div>
          {renderNodeRow(id, nodeData, tNode(t, 'common.rows.form', 'form'), {
            inHandle: 'in.data.form',
            inSemantic: 'data',
          })}
          {renderNodeRow(id, nodeData, tNode(t, 'common.rows.value', 'value'), {
            inHandle: 'in.data.value',
            inSemantic: 'data',
          })}
          {renderNodeRow(
            id,
            nodeData,
            tNode(t, 'common.rows.changed', 'changed'),
            {
              outHandle: 'out.control.changed',
            }
          )}
          {renderNodeRow(id, nodeData, tNode(t, 'common.rows.value', 'value'), {
            outHandle: 'out.data.value',
            outSemantic: 'data',
          })}
          {renderNodeRow(id, nodeData, tNode(t, 'common.rows.error', 'error'), {
            outHandle: 'out.data.error',
            outSemantic: 'data',
          })}
        </div>
      </div>
    );
  }

  return null;
};
