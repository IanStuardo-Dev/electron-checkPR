import React from 'react';
import { useRepositorySource } from '../hooks/useAzurePullRequests';

type RepositorySourceValue = ReturnType<typeof useRepositorySource>;

const RepositorySourceContext = React.createContext<RepositorySourceValue | null>(null);

export function RepositorySourceProvider({ children }: { children: React.ReactNode }) {
  const value = useRepositorySource();

  return (
    <RepositorySourceContext.Provider value={value}>
      {children}
    </RepositorySourceContext.Provider>
  );
}

export function useRepositorySourceContext(): RepositorySourceValue {
  const value = React.useContext(RepositorySourceContext);

  if (!value) {
    throw new Error('useRepositorySourceContext debe usarse dentro de RepositorySourceProvider.');
  }

  return value;
}
