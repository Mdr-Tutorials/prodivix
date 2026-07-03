import { useInspectorContext } from '@/editor/features/design/inspector/InspectorContext';
import { InspectorPanelFrame } from '@/editor/features/design/inspector/components/InspectorPanelFrame';

export function InspectorStyleTab() {
  const {
    t,
    matchedPanels,
    expandedPanels,
    togglePanel,
    selectedNode,
    updateSelectedNode,
  } = useInspectorContext();

  return (
    <div className="flex min-h-0 flex-1 [scrollbar-width:none] flex-col overflow-y-auto px-4 pt-2 pb-3 [-ms-overflow-style:none] [&::-webkit-scrollbar]:h-0 [&::-webkit-scrollbar]:w-0">
      {matchedPanels.length ? (
        matchedPanels.map((panel) => {
          const isExpanded = expandedPanels[panel.key] ?? true;
          const panelTitle = t(`inspector.panels.${panel.key}.title`, {
            defaultValue: panel.title,
          });
          return (
            <InspectorPanelFrame
              key={panel.key}
              panelKey={panel.key}
              title={panelTitle}
              isExpanded={isExpanded}
              onToggle={() => togglePanel(panel.key)}
              actions={panel.headerActions}
            >
              {isExpanded
                ? panel.render({
                    node: selectedNode!,
                    updateNode: updateSelectedNode,
                  })
                : null}
            </InspectorPanelFrame>
          );
        })
      ) : (
        <div className="InspectorDescription pt-1 text-[10px] text-(--text-muted)">
          {t('inspector.groups.style.empty', {
            defaultValue: 'No style settings for this component.',
          })}
        </div>
      )}
    </div>
  );
}
