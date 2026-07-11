import { createAuthoringEnvironment } from './createAuthoringEnvironment';
import type { AuthoringEnvironment } from './authoring.types';

export const createEmptyAuthoringEnvironment = (
  revision = 'empty'
): AuthoringEnvironment => createAuthoringEnvironment({ revision });
