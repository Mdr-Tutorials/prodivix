import type { PIRDocument } from '@prodivix/shared/types/pir';
import {
  createDefaultPirDocument,
  normalizePirDocumentToCurrentSchema,
} from './graph/normalize';

export const createDefaultPirDoc = (): PIRDocument =>
  createDefaultPirDocument();

export const normalizePirDocument = (source: unknown): PIRDocument =>
  normalizePirDocumentToCurrentSchema(source);

export const resolvePirDocument = (source: unknown): PIRDocument =>
  normalizePirDocument(source);
