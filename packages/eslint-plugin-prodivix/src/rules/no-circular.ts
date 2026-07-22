import type { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'detect circular dependencies in PIR modules',
    },
    messages: {
      circular: 'Circular dependency detected in module graph: {{ chain }}',
    },
  },

  create(): Rule.RuleListener {
    return {};
  },
};

export = rule;
