import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/renderer/services/i18n';
import { useNavigate } from 'react-router-dom';
import AppLoader from '@renderer/components/layout/AppLoader';
import VueLoginAdapter from '@renderer/components/vue-login/VueLoginAdapter';
import { useAuth } from '../../hooks/context/AuthContext';
import { getConfig } from '@repo/config';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { status, markAuthenticated } = useAuth();
  const navigateRef = useRef(navigate);
  const markRef = useRef(markAuthenticated);
  navigateRef.current = navigate;
  markRef.current = markAuthenticated;

  useEffect(() => {
    document.body.classList.add('login-page-active');
    return () => {
      document.body.classList.remove('login-page-active');
    };
  }, []);

  useEffect(() => {
    // login.pageTitle 是 "{{appTitle}} - 登录" 形式；appTitle 来自 app.yaml
    // （经 loadConfig → envToConfig → getConfig().app.title 注入）。
    // 不在 i18n 资源中硬编码品牌名，避免「组件名变即要改翻译表」。
    const appTitle = getConfig()?.app?.title ?? 'NomiFun';
    document.title = t('login.pageTitle', { appTitle });
  }, [t]);

  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  // Vue koi 登录成功（token 已写入 storage）→ React 标记已认证并跳转首页
  const handleVueLoginSuccess = useCallback(() => {
    markRef.current();
    void navigateRef.current('/guid', { replace: true });
  }, []);

  const supportedLanguages = useMemo<{ code: string; label: string }[]>(
    () => [
      { code: 'zh-CN', label: '简体中文' },
      { code: 'en-US', label: 'English' },
    ],
    []
  );

  const handleLanguageChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLanguage = event.target.value;
    changeLanguage(nextLanguage).catch((error: Error) => {
      console.error('Failed to change language:', error);
    });
  }, []);

  if (status === 'checking') {
    return <AppLoader />;
  }

  return (
    <div className='login-page'>
      <div className='login-page__card login-page__card--vue'>
        <label className='login-page__lang-select-wrapper' htmlFor='lang-select'>
          <select
            id='lang-select'
            className='login-page__lang-select'
            value={i18n.language}
            onChange={handleLanguageChange}
          >
            {supportedLanguages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </label>

        <div className='login-page__header'>
          <h1 className='login-page__title'>{t('login.brand')}</h1>
          <p className='login-page__subtitle'>{t('login.subtitle')}</p>
        </div>

        <VueLoginAdapter appName='ai' onSuccess={handleVueLoginSuccess} />
      </div>
    </div>
  );
};

export default LoginPage;
