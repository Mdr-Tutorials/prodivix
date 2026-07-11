import type {
  AuthoringContext,
  CodeScope,
  CodeSymbol,
  CodeSymbolProvider,
} from './authoring.types';

export type CodeSymbolProviderRegistry = {
  register(provider: CodeSymbolProvider): void;
  unregister(providerId: string): void;
  listProviders(): CodeSymbolProvider[];
  listSymbols(context: AuthoringContext): CodeSymbol[];
  listScopes(context: AuthoringContext): CodeScope[];
  getSymbol(id: string): CodeSymbol | null;
};

export const createCodeSymbolProviderRegistry =
  (): CodeSymbolProviderRegistry => {
    const providers = new Map<string, CodeSymbolProvider>();

    return {
      register(provider) {
        providers.set(provider.id, provider);
      },
      unregister(providerId) {
        providers.delete(providerId);
      },
      listProviders() {
        return Array.from(providers.values());
      },
      listSymbols(context) {
        return Array.from(providers.values()).flatMap((provider) =>
          provider.listSymbols(context)
        );
      },
      listScopes(context) {
        return Array.from(providers.values()).flatMap((provider) =>
          provider.listScopes(context)
        );
      },
      getSymbol(id) {
        for (const provider of providers.values()) {
          const symbol = provider.getSymbol(id);
          if (symbol) return symbol;
        }

        return null;
      },
    };
  };
