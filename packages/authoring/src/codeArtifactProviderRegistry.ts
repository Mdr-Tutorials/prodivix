import type {
  AuthoringContext,
  CodeArtifact,
  CodeArtifactProvider,
} from './authoring.types';

export type CodeArtifactProviderRegistry = {
  register(provider: CodeArtifactProvider): void;
  unregister(providerId: string): void;
  listProviders(): CodeArtifactProvider[];
  listArtifacts(context: AuthoringContext): CodeArtifact[];
  getArtifact(id: string): CodeArtifact | null;
};

export const createCodeArtifactProviderRegistry =
  (): CodeArtifactProviderRegistry => {
    const providers = new Map<string, CodeArtifactProvider>();

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
      listArtifacts(context) {
        return Array.from(providers.values()).flatMap((provider) =>
          provider.listArtifacts(context)
        );
      },
      getArtifact(id) {
        for (const provider of providers.values()) {
          const artifact = provider.getArtifact(id);
          if (artifact) return artifact;
        }

        return null;
      },
    };
  };
