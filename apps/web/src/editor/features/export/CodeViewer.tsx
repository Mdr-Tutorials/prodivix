import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

const exportCodeFontFamily = 'var(--font-family-mono)';

interface CodeViewerProps {
  code: string;
  lang?: string;
  className?: string;
}

export function CodeViewer({
  code,
  lang = 'typescript',
  className,
}: CodeViewerProps) {
  return (
    <div
      className={className}
      style={{
        flex: 1,
        overflow: 'auto',
        borderRadius: '8px',
        fontSize: '14px',
        lineHeight: '1',
        fontFamily: exportCodeFontFamily,
      }}
    >
      <SyntaxHighlighter
        language={lang}
        style={oneLight}
        showLineNumbers
        showInlineLineNumbers={false}
        codeTagProps={{
          style: {
            fontFamily: exportCodeFontFamily,
          },
        }}
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
          fontFamily: exportCodeFontFamily,
        }}
        lineNumberStyle={{
          display: 'block',
          minWidth: '24px',
          paddingRight: 0,
          color: 'inherit',
          fontVariantNumeric: 'tabular-nums',
          fontFamily: exportCodeFontFamily,
        }}
        customStyle={{
          margin: 0,
          padding: '20px',
          height: '100%',
          fontFamily: exportCodeFontFamily,
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
