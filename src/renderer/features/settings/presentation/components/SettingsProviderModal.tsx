import React from 'react';
import type { RepositoryProviderDefinition } from '../../../../../types/repository';
import { RepositorySourceProviderCatalog } from '../../../repository-source';
import SettingsSectionModal from './SettingsSectionModal';
import type { SettingsProviderConnectionProps } from './SettingsProvider.types';

interface SettingsProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProvider: RepositoryProviderDefinition | null;
  connection: SettingsProviderConnectionProps;
}

const SettingsProviderModal = ({
  isOpen,
  onClose,
  activeProvider,
  connection,
}: SettingsProviderModalProps) => {
  return (
    <SettingsSectionModal
      isOpen={isOpen}
      onClose={onClose}
      title="Configuracion de provider"
      description="Selecciona la fuente principal del workspace y completa su conexion sin cargar la vista principal."
    >
      <RepositorySourceProviderCatalog
        activeProvider={activeProvider}
        {...connection}
      />
    </SettingsSectionModal>
  );
};

export default SettingsProviderModal;
