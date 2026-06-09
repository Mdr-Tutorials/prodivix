import type { ReactNode } from 'react';

const INLINE_MARKDOWN_PATTERN =
  /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|\[[^\]]+\]\(([^)\s]+)\)|\*[^*]+\*|_[^_]+_)/g;

const sanitizeHref = (href: string) => {
  if (/^(https?:\/\/|\/|#|mailto:)/i.test(href)) return href;
  return '#';
};

const renderInlineMarkdown = (text: string, keyPrefix: string): ReactNode[] => {
  const chunks: ReactNode[] = [];
  let cursor = 0;
  let index = 0;
  for (const token of text.matchAll(INLINE_MARKDOWN_PATTERN)) {
    const match = token[0];
    const start = token.index ?? 0;
    if (start > cursor) {
      chunks.push(
        <span key={`${keyPrefix}-text-${index}`}>
          {text.slice(cursor, start)}
        </span>
      );
      index += 1;
    }
    if (match.startsWith('`')) {
      chunks.push(
        <code
          key={`${keyPrefix}-code-${index}`}
          className="rounded bg-(--nodegraph-code-inline-bg) px-1 py-0.5 text-[10px]"
        >
          {match.slice(1, -1)}
        </code>
      );
      index += 1;
      cursor = start + match.length;
      continue;
    }
    if (
      (match.startsWith('**') && match.endsWith('**')) ||
      (match.startsWith('__') && match.endsWith('__'))
    ) {
      chunks.push(
        <strong key={`${keyPrefix}-strong-${index}`}>
          {match.slice(2, -2)}
        </strong>
      );
      index += 1;
      cursor = start + match.length;
      continue;
    }
    if (match.startsWith('~~') && match.endsWith('~~')) {
      chunks.push(
        <del key={`${keyPrefix}-del-${index}`}>{match.slice(2, -2)}</del>
      );
      index += 1;
      cursor = start + match.length;
      continue;
    }
    if (match.startsWith('[') && match.includes('](') && match.endsWith(')')) {
      const linkMatch = match.match(/^\[(.*)\]\((.*)\)$/);
      if (linkMatch) {
        const label = linkMatch[1];
        const href = sanitizeHref(linkMatch[2]);
        chunks.push(
          <a
            key={`${keyPrefix}-link-${index}`}
            className="text-(--nodegraph-info) underline decoration-(--nodegraph-info) underline-offset-2"
            href={href}
            rel="noreferrer"
            target="_blank"
          >
            {label}
          </a>
        );
      } else {
        chunks.push(<span key={`${keyPrefix}-text-${index}`}>{match}</span>);
      }
      index += 1;
      cursor = start + match.length;
      continue;
    }
    if (
      (match.startsWith('*') && match.endsWith('*')) ||
      (match.startsWith('_') && match.endsWith('_'))
    ) {
      chunks.push(
        <em key={`${keyPrefix}-em-${index}`}>{match.slice(1, -1)}</em>
      );
      index += 1;
      cursor = start + match.length;
      continue;
    }
    chunks.push(<span key={`${keyPrefix}-text-${index}`}>{match}</span>);
    index += 1;
    cursor = start + match.length;
  }
  if (cursor < text.length) {
    chunks.push(
      <span key={`${keyPrefix}-tail-${index}`}>
        {text.slice(cursor, text.length)}
      </span>
    );
  }
  return chunks;
};

export const renderMarkdownBlocks = (
  markdown: string,
  keyPrefix: string
): ReactNode[] => {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let keyIndex = 0;
  let listKind: 'ul' | 'ol' | null = null;
  let listItems: ReactNode[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];

  const flushList = () => {
    if (!listKind || !listItems.length) return;
    if (listKind === 'ul') {
      blocks.push(
        <ul
          key={`${keyPrefix}-ul-${keyIndex}`}
          className="list-disc space-y-1 pl-4"
        >
          {listItems}
        </ul>
      );
    } else {
      blocks.push(
        <ol
          key={`${keyPrefix}-ol-${keyIndex}`}
          className="list-decimal space-y-1 pl-4"
        >
          {listItems}
        </ol>
      );
    }
    keyIndex += 1;
    listKind = null;
    listItems = [];
  };

  const flushCodeBlock = () => {
    if (!codeLines.length) return;
    flushList();
    blocks.push(
      <pre
        key={`${keyPrefix}-code-block-${keyIndex}`}
        className="overflow-x-auto rounded-md bg-(--nodegraph-code-block-bg) px-2 py-2 text-[10px] leading-5 text-(--nodegraph-code-block-text)"
      >
        <code>{codeLines.join('\n')}</code>
      </pre>
    );
    keyIndex += 1;
    codeLines = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        inCodeBlock = false;
        flushCodeBlock();
      } else {
        flushList();
        inCodeBlock = true;
      }
      continue;
    }
    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }
    if (!trimmed) {
      flushList();
      blocks.push(
        <div key={`${keyPrefix}-space-${keyIndex}`} className="h-2" />
      );
      keyIndex += 1;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushList();
      const headingSizeMap = ['text-[16px]', 'text-[14px]', 'text-[13px]'];
      const headingClass =
        headingSizeMap[
          Math.min(headingMatch[1].length - 1, headingSizeMap.length - 1)
        ];
      blocks.push(
        <p
          key={`${keyPrefix}-heading-${keyIndex}`}
          className={`leading-6 font-semibold ${headingClass}`}
        >
          {renderInlineMarkdown(
            headingMatch[2],
            `${keyPrefix}-heading-${keyIndex}`
          )}
        </p>
      );
      keyIndex += 1;
      continue;
    }

    const unorderedMatch = trimmed.match(/^[-*+]\s+(.*)$/);
    if (unorderedMatch) {
      if (listKind !== 'ul') {
        flushList();
        listKind = 'ul';
      }
      listItems.push(
        <li key={`${keyPrefix}-li-${keyIndex}`}>
          {renderInlineMarkdown(
            unorderedMatch[1],
            `${keyPrefix}-li-${keyIndex}`
          )}
        </li>
      );
      keyIndex += 1;
      continue;
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      if (listKind !== 'ol') {
        flushList();
        listKind = 'ol';
      }
      listItems.push(
        <li key={`${keyPrefix}-li-${keyIndex}`}>
          {renderInlineMarkdown(orderedMatch[1], `${keyPrefix}-li-${keyIndex}`)}
        </li>
      );
      keyIndex += 1;
      continue;
    }

    const blockquoteMatch = trimmed.match(/^>\s?(.*)$/);
    if (blockquoteMatch) {
      flushList();
      blocks.push(
        <blockquote
          key={`${keyPrefix}-quote-${keyIndex}`}
          className="border-l-2 border-(--nodegraph-node-border-strong) pl-2 italic"
        >
          {renderInlineMarkdown(
            blockquoteMatch[1],
            `${keyPrefix}-quote-${keyIndex}`
          )}
        </blockquote>
      );
      keyIndex += 1;
      continue;
    }

    flushList();
    blocks.push(
      <p key={`${keyPrefix}-p-${keyIndex}`} className="leading-6">
        {renderInlineMarkdown(trimmed, `${keyPrefix}-p-${keyIndex}`)}
      </p>
    );
    keyIndex += 1;
  }

  if (inCodeBlock) {
    flushCodeBlock();
  }
  flushList();
  return blocks;
};
