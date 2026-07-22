import type { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'disallow unused PIR variables',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      unused: 'Variable "{{ name }}" is declared but never used.',
    },
  },

  create(context): Rule.RuleListener {
    return {
      'Program:exit'() {
        for (const scope of context.sourceCode.scopeManager.scopes) {
          for (const variable of scope.variables) {
            const declaration = variable.defs.find(
              (definition) => definition.type === 'Variable'
            );
            const identifier = variable.identifiers[0];
            if (declaration && identifier && variable.references.length === 0) {
              context.report({
                node: identifier,
                messageId: 'unused',
                data: { name: variable.name },
              });
            }
          }
        }
      },
    };
  },
};

export = rule;
