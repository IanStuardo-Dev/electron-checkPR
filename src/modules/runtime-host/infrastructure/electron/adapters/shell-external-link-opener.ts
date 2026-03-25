import { shell } from 'electron';
import type { ExternalLinkOpenerPort } from '../../../application/repository-source/use-cases/repository-source.use-cases';

export function createShellExternalLinkOpener(): ExternalLinkOpenerPort {
  return {
    async openExternal(url) {
      await shell.openExternal(url);
    },
  };
}
