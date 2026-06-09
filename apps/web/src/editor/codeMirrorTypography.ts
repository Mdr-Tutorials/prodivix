import { EditorView } from '@codemirror/view';

export const codeMirrorTypographyTheme = EditorView.theme({
  '&': {
    fontFamily: 'var(--font-family-mono)',
  },
  '.cm-scroller': {
    fontFamily: 'var(--font-family-mono)',
  },
  '.cm-content': {
    fontFamily: 'var(--font-family-mono)',
  },
  '.cm-gutters': {
    fontFamily: 'var(--font-family-mono)',
  },
});
