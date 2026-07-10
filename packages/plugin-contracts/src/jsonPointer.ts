export type JsonPath = readonly (string | number)[];

const escapeJsonPointerSegment = (segment: string | number): string =>
  String(segment).replaceAll('~', '~0').replaceAll('/', '~1');

export const toJsonPointer = (path: JsonPath): string =>
  path.length === 0 ? '' : `/${path.map(escapeJsonPointerSegment).join('/')}`;

export const appendJsonPointer = (
  pointer: string,
  segment: string | number
): string => `${pointer}/${escapeJsonPointerSegment(segment)}`;
