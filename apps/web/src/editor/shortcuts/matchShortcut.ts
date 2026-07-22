import type { ParsedShortcut } from './shortcutTypes';

const MODIFIER_ALIASES: Record<string, keyof Omit<ParsedShortcut, 'key'>> = {
  ctrl: 'ctrl',
  control: 'ctrl',
  alt: 'alt',
  option: 'alt',
  shift: 'shift',
  meta: 'meta',
  cmd: 'meta',
  command: 'meta',
};

const KEY_ALIASES: Record<string, string> = {
  esc: 'escape',
  return: 'enter',
  spacebar: 'space',
  ' ': 'space',
};

const normalizeKeyToken = (token: string) => {
  const normalized = token.trim().toLowerCase();
  if (!normalized) return '';
  return KEY_ALIASES[normalized] ?? normalized;
};

const isApplePlatform = () => {
  if (typeof navigator === 'undefined') return false;
  return /mac|iphone|ipad|ipod/i.test(navigator.platform);
};

export const parseShortcut = (combo: string): ParsedShortcut => {
  const initial: ParsedShortcut = {
    key: '',
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
  };

  return combo.split('+').reduce((current, token) => {
    const normalized = normalizeKeyToken(token);
    if (!normalized) return current;
    if (normalized === 'mod') {
      if (isApplePlatform()) {
        current.meta = true;
      } else {
        current.ctrl = true;
      }
      return current;
    }
    const modifierKey = MODIFIER_ALIASES[normalized];
    if (modifierKey) {
      current[modifierKey] = true;
      return current;
    }
    current.key = normalized;
    return current;
  }, initial);
};

const normalizeEventKey = (event: KeyboardEvent) => {
  const normalized = event.key.trim().toLowerCase();
  if (!normalized) return '';
  return KEY_ALIASES[normalized] ?? normalized;
};

const normalizeAltCodeKey = (event: KeyboardEvent): string | undefined => {
  if (/^Key[A-Z]$/.test(event.code)) return event.code.slice(3).toLowerCase();
  if (/^Digit[0-9]$/.test(event.code)) return event.code.slice(5);
  return undefined;
};

export const matchShortcut = (
  shortcut: ParsedShortcut,
  event: KeyboardEvent
) => {
  const eventKey = normalizeEventKey(event);
  const keyMatches =
    eventKey === shortcut.key ||
    (shortcut.alt && normalizeAltCodeKey(event) === shortcut.key);
  if (!keyMatches) return false;
  return (
    event.ctrlKey === shortcut.ctrl &&
    event.altKey === shortcut.alt &&
    event.shiftKey === shortcut.shift &&
    event.metaKey === shortcut.meta
  );
};
