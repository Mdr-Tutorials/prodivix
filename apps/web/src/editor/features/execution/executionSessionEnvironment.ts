import { createExecutionSessionCoordinator } from '@prodivix/runtime-core';

export const executionSessionCoordinator = createExecutionSessionCoordinator({
  maxEvents: 500,
});
