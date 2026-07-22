type EventHandler = (event: unknown) => void;

const REACT_EVENT_NAMES: Readonly<Record<string, string>> = Object.freeze({
  animationend: 'onAnimationEnd',
  animationiteration: 'onAnimationIteration',
  animationstart: 'onAnimationStart',
  beforeinput: 'onBeforeInput',
  beforetoggle: 'onBeforeToggle',
  blur: 'onBlur',
  canplay: 'onCanPlay',
  canplaythrough: 'onCanPlayThrough',
  change: 'onChange',
  click: 'onClick',
  compositionend: 'onCompositionEnd',
  compositionstart: 'onCompositionStart',
  compositionupdate: 'onCompositionUpdate',
  contextmenu: 'onContextMenu',
  copy: 'onCopy',
  cut: 'onCut',
  dblclick: 'onDoubleClick',
  drag: 'onDrag',
  dragend: 'onDragEnd',
  dragenter: 'onDragEnter',
  dragexit: 'onDragExit',
  dragleave: 'onDragLeave',
  dragover: 'onDragOver',
  dragstart: 'onDragStart',
  drop: 'onDrop',
  focus: 'onFocus',
  input: 'onInput',
  invalid: 'onInvalid',
  keydown: 'onKeyDown',
  keypress: 'onKeyPress',
  keyup: 'onKeyUp',
  load: 'onLoad',
  mousedown: 'onMouseDown',
  mouseenter: 'onMouseEnter',
  mouseleave: 'onMouseLeave',
  mousemove: 'onMouseMove',
  mouseout: 'onMouseOut',
  mouseover: 'onMouseOver',
  mouseup: 'onMouseUp',
  paste: 'onPaste',
  pointercancel: 'onPointerCancel',
  pointerdown: 'onPointerDown',
  pointerenter: 'onPointerEnter',
  pointerleave: 'onPointerLeave',
  pointermove: 'onPointerMove',
  pointerout: 'onPointerOut',
  pointerover: 'onPointerOver',
  pointerup: 'onPointerUp',
  reset: 'onReset',
  scroll: 'onScroll',
  submit: 'onSubmit',
  touchcancel: 'onTouchCancel',
  touchend: 'onTouchEnd',
  touchmove: 'onTouchMove',
  touchstart: 'onTouchStart',
  transitioncancel: 'onTransitionCancel',
  transitionend: 'onTransitionEnd',
  transitionrun: 'onTransitionRun',
  transitionstart: 'onTransitionStart',
  wheel: 'onWheel',
});

export const toReactEventName = (trigger: string): string | undefined => {
  const normalized = trigger.trim();
  if (!normalized) return undefined;
  if (/^on[A-Z]/.test(normalized)) return normalized;
  const lower = normalized.toLowerCase();
  const eventName = lower.startsWith('on') ? lower.slice(2) : lower;
  return REACT_EVENT_NAMES[eventName];
};

export const mergeHandlers = (first: unknown, second: unknown): unknown => {
  if (typeof first === 'function' && typeof second === 'function') {
    const firstHandler = first as EventHandler;
    const secondHandler = second as EventHandler;
    return (event: unknown) => {
      firstHandler(event);
      secondHandler(event);
    };
  }
  return typeof second === 'function' ? second : first;
};

export const stripChildProps = (
  props: Record<string, unknown>
): Record<string, unknown> => {
  const projected = { ...props };
  delete projected.children;
  delete projected.dangerouslySetInnerHTML;
  return projected;
};
