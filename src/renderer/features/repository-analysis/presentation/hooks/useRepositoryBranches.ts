import React from 'react';
import type { RepositoryBranch } from '../../../../../types/repository';
import { fetchBranches } from '../../../repository-source';
import type { SavedConnectionConfig } from '../../../repository-source';

export function useRepositoryBranches({
  config,
  isConnectionReady,
  repositoryId,
}: {
  config: SavedConnectionConfig;
  isConnectionReady: boolean;
  repositoryId: string;
}) {
  const [branches, setBranches] = React.useState<RepositoryBranch[]>([]);
  const [branchName, setBranchName] = React.useState('');
  const [isLoadingBranches, setIsLoadingBranches] = React.useState(false);
  const [branchError, setBranchError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!config.provider || !isConnectionReady || !repositoryId) {
      setBranches([]);
      setBranchName('');
      return;
    }

    const activeConfig = {
      ...config,
      repositoryId,
      project: repositoryId,
    };

    setIsLoadingBranches(true);
    setBranchError(null);
    void fetchBranches(activeConfig)
      .then((nextBranches) => {
        setBranches(nextBranches);
        const defaultBranch = nextBranches.find((branch) => branch.isDefault)?.name || nextBranches[0]?.name || '';
        setBranchName(defaultBranch);
      })
      .catch((nextError) => {
        setBranches([]);
        setBranchName('');
        setBranchError(nextError instanceof Error ? nextError.message : 'No fue posible cargar las ramas.');
      })
      .finally(() => {
        setIsLoadingBranches(false);
      });
  }, [config, isConnectionReady, repositoryId]);

  return {
    branches,
    branchName,
    setBranchName,
    isLoadingBranches,
    branchError,
  };
}
