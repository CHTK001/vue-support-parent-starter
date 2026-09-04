import classNames from 'classnames';
import React from 'react';
import { useLayoutContext } from '@/renderer/hooks/context/LayoutContext';
import { resolveExtensionAssetUrl, isDesktopShell } from '@/renderer/utils/platform';
import { type IExtensionSettingsTab } from '@/common/adapter/ipcBridge';
import { useExtensionSettingsTabs } from '@/renderer/hooks/system/useExtensionSettingsTabs';
import { Computer, Cpu, Puzzle, Server, System, LinkCloud, DatabaseConfig, ChartHistogram, Platte, Picture, TableFile } from '@icon-park/react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useExtI18n } from '@/renderer/hooks/system/useExtI18n';
import { BUILTIN_TAB_IDS } from './SettingsSider';
import { buildSettingsNavItems } from './settingsNavigation';
import './settings.css';

interface SettingsPageWrapperProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

type NavItem = { label: string; icon: React.ReactElement; path: string; id: string };

type TranslateFn = (key: string, options?: { defaultValue?: string }) => string;

export function getBuiltinSettingsNavItems(t: TranslateFn): NavItem[] {
  const builtinMap: Record<string, NavItem> = {
    'execution-engines': {
      id: 'execution-engines',
      label: t('settings.executionEngineHub.railTitle'),
      icon: <Cpu theme='outline' size='16' />,
      path: 'execution-engines',
    },
    'ssh-hosts': {
      id: 'ssh-hosts',
      label: t('ssh.title'),
      icon: <Server theme='outline' size='16' />,
      path: 'ssh-hosts',
    },
    system: { id: 'system', label: t('settings.system'), icon: <System theme='outline' size='16' />, path: 'system' },
    bots: {
      id: 'bots',
      label: t('settings.bots', { defaultValue: 'Bot 配置' }),
      icon: <Computer theme='outline' size='16' />,
      path: 'bots',
    },
    'computer-use': {
      id: 'computer-use',
      label: t('settings.computerUseNav'),
      icon: <Computer theme='outline' size='16' />,
      path: 'computer-use',
    },
    'ai-global': {
      id: 'ai-global',
      label: t('settings.aiGlobal', { defaultValue: 'AI 全局设置' }),
      icon: <LinkCloud theme='outline' size='16' />,
      path: 'ai-global',
    },
    'ai-rag': {
      id: 'ai-rag',
      label: t('settings.aiRag', { defaultValue: 'RAG 设置' }),
      icon: <DatabaseConfig theme='outline' size='16' />,
      path: 'ai-rag',
    },
    'ai-usage': {
      id: 'ai-usage',
      label: t('settings.aiUsage', { defaultValue: '用量设置' }),
      icon: <ChartHistogram theme='outline' size='16' />,
      path: 'ai-usage',
    },
    'workshop': {
      id: 'workshop',
      label: t('settings.workshop', { defaultValue: '工坊设置' }),
      icon: <Platte theme='outline' size='16' />,
      path: 'workshop',
    },
    'ocr': {
      id: 'ocr',
      label: t('settings.ocr', { defaultValue: 'OCR 文字识别' }),
      icon: <DatabaseConfig theme='outline' size='16' />,
      path: 'ocr',
    },
    'face': {
      id: 'face',
      label: t('settings.face', { defaultValue: '人脸识别' }),
      icon: <System theme='outline' size='16' />,
      path: 'face',
    },
    'image-recognition': {
      id: 'image-recognition',
      label: t('settings.imageRecognition', { defaultValue: '图片识别' }),
      icon: <Picture theme='outline' size='16' />,
      path: 'image-recognition',
    },
    'layout': {
      id: 'layout',
      label: t('settings.layout', { defaultValue: '布局识别' }),
      icon: <TableFile theme='outline' size='16' />,
      path: 'layout',
    },
  };

  return BUILTIN_TAB_IDS.map((id) => builtinMap[id]).filter(
    (item) => isDesktopShell() || item.id !== 'execution-engines'
  );
}

const SettingsPageWrapper: React.FC<SettingsPageWrapperProps> = ({ children, className, contentClassName }) => {
  const layout = useLayoutContext();
  const isMobile = layout?.isMobile ?? false;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useTranslation();

  const extensionTabs = useExtensionSettingsTabs();

  const { resolveExtTabName } = useExtI18n();

  const menuItems = React.useMemo(() => {
    const builtins = getBuiltinSettingsNavItems(t);

    const toNavItem = (tab: IExtensionSettingsTab): NavItem => {
      const resolvedIcon = resolveExtensionAssetUrl(tab.icon) || tab.icon;
      return {
        id: tab.id,
        label: resolveExtTabName(tab),
        icon: resolvedIcon ? (
          <img src={resolvedIcon} alt='' className='w-16px h-16px object-contain' />
        ) : (
          <Puzzle theme='outline' size='16' />
        ),
        path: `ext/${tab.id}`,
      };
    };

    // Insert extension tabs at their anchor, or (unanchored) at the end of the
    // "Application" group — before "about" — to keep them inside that group.
    return buildSettingsNavItems(builtins, extensionTabs, toNavItem).items;
  }, [t, extensionTabs, resolveExtTabName]);

  const containerClass = classNames(
    'settings-page-wrapper w-full min-h-full box-border overflow-y-auto',
    isMobile ? 'px-16px py-14px' : 'px-12px md:px-40px py-32px',
    className
  );

  const contentClass = classNames('settings-page-content mx-auto w-full md:max-w-1024px', contentClassName);

  return (
    <div className={containerClass}>
      {isMobile && (
        <div className='settings-mobile-top-nav'>
          {menuItems.map((item) => {
            const active = pathname.includes(`/settings/${item.path}`);
            return (
              <button
                key={item.path}
                type='button'
                className={classNames('settings-mobile-top-nav__item', {
                  'settings-mobile-top-nav__item--active': active,
                })}
                onClick={() => {
                  void navigate(`/settings/${item.path}`, { replace: true });
                }}
              >
                <span className='settings-mobile-top-nav__icon'>{item.icon}</span>
                <span className='settings-mobile-top-nav__label'>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
      <div className={contentClass}>{children}</div>
    </div>
  );
};

export default SettingsPageWrapper;
