/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLocation } from 'react-router-dom';
import SystemModalContent from '@/renderer/components/settings/SettingsModal/contents/SystemModalContent';
import ComputerUseSettingsContent from '@/renderer/components/settings/SettingsModal/contents/ComputerUseSettingsContent';
import SettingsPageWrapper from './components/SettingsPageWrapper';

const SystemSettings: React.FC = () => {
  const location = useLocation();
  const isComputerUsePage = location.pathname === '/settings/computer-use';

  const content = (() => {
    if (isComputerUsePage) return <ComputerUseSettingsContent />;
    return <SystemModalContent />;
  })();

  return (
    <SettingsPageWrapper>{content}</SettingsPageWrapper>
  );
};

export default SystemSettings;
