/**
 * SkillsSettingsPage — top-level Skills capability. The market surface has
 * moved to the settings page (/settings/skills): this page keeps only the
 * installed-skills library. A legacy ?tab=market deep link now redirects to
 * the settings market page.
 */
import { Tabs } from '@arco-design/web-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useSearchParams } from 'react-router-dom';
import HubPageShell from '@/renderer/components/layout/HubPageShell';
import SkillsHubSettings from './SkillsHubSettings';

const SkillsSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  // Legacy market deep link → settings market page.
  if (searchParams.get('tab') === 'market') {
    return <Navigate to='/settings/skills' replace />;
  }

  return (
    <HubPageShell
      title={t('settings.skillsHub.title', { defaultValue: 'Skills Hub' })}
      subtitle={t('settings.skillsHub.description', {
        defaultValue: 'Manage independent Agent Skill packages that any preset can reference.',
      })}
      maxWidthClass='md:max-w-1200px'
    >
      <SkillsHubSettings />
    </HubPageShell>
  );
};

export default SkillsSettingsPage;