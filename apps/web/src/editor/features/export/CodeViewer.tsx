// src/editor/features/export/CodeViewer.tsx
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// 引入 VS Code 暗色风格主题
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeViewerProps {
  code: string; // 要显示的代码字符串
  lang?: string; // 语言类型，比如 'typescript', 'javascript', 'html'
  className?: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  code,
  lang = 'typescript',
  className,
}) => {
  return (
    <div
      className={className}
      style={{
        flex: 1,
        overflow: 'auto',
        borderRadius: '8px',
        fontSize: '14px',
        lineHeight: '1',
      }}
    >
      <SyntaxHighlighter
        language={lang}
        style={oneLight}
        showLineNumbers
        showInlineLineNumbers={false}
        lineNumberContainerStyle={{
          float: 'left',
          minWidth: '40px',
          paddingRight: '12px',
          marginRight: '14px',
          borderRight: '1px solid rgba(0, 0, 0, 0.08)',
          color: 'var(--text-muted)',
          opacity: 0.72,
          textAlign: 'right',
          userSelect: 'none',
        }}
        lineNumberStyle={{
          display: 'block',
          minWidth: '24px',
          paddingRight: 0,
          color: 'inherit',
          fontVariantNumeric: 'tabular-nums',
        }}
        customStyle={{
          margin: 0,
          padding: '20px',
          height: '100%',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};
