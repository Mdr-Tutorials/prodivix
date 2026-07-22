import type {
  ThemeTokenIndex,
  ThemeTokenPath,
} from '../schema/themeManifest.types';
import { extractReferencePath } from '../tokens/tokenPaths';

export type ThemeTokenCycle = {
  path: ThemeTokenPath;
  chain: ThemeTokenPath[];
};

export const detectTokenCycles = (
  tokens: ThemeTokenIndex,
  fallbackTokens: ThemeTokenIndex = {} as ThemeTokenIndex
) => {
  const cycles: ThemeTokenCycle[] = [];
  const visited = new Set<ThemeTokenPath>();
  const visiting = new Set<ThemeTokenPath>();

  for (const path of Object.keys(tokens) as ThemeTokenPath[]) {
    visit(path, tokens, fallbackTokens, {
      cycles,
      stack: [],
      visited,
      visiting,
    });
  }

  return cycles;
};

type VisitContext = {
  cycles: ThemeTokenCycle[];
  stack: ThemeTokenPath[];
  visited: Set<ThemeTokenPath>;
  visiting: Set<ThemeTokenPath>;
};

const visit = (
  path: ThemeTokenPath,
  tokens: ThemeTokenIndex,
  fallbackTokens: ThemeTokenIndex,
  context: VisitContext
) => {
  if (context.visited.has(path)) {
    return;
  }

  if (context.visiting.has(path)) {
    context.cycles.push({
      path,
      chain: [...context.stack, path],
    });
    return;
  }

  const value = Object.hasOwn(tokens, path)
    ? tokens[path]
    : Object.hasOwn(fallbackTokens, path)
      ? fallbackTokens[path]
      : undefined;

  if (value === undefined) {
    return;
  }

  context.visiting.add(path);
  context.stack.push(path);

  const referencePath = extractReferencePath(value);

  if (referencePath) {
    visit(referencePath, tokens, fallbackTokens, context);
  }

  context.stack.pop();
  context.visiting.delete(path);
  context.visited.add(path);
};
