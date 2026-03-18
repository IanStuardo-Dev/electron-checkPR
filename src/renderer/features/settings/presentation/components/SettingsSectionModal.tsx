import React from 'react';
import { SettingsModal } from '../../../../ui/configuration/ConfigurationPrimitives';

interface SettingsSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  children: React.ReactNode;
  contentClassName?: string;
}

const SettingsSectionModal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  contentClassName = 'grid gap-4',
}: SettingsSectionModalProps) => (
  <SettingsModal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    description={description}
  >
    <div className={contentClassName}>
      {children}
    </div>
  </SettingsModal>
);

export default SettingsSectionModal;
