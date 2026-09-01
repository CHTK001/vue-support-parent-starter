import React, { useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import AppLoader from '@renderer/components/layout/AppLoader';
import VueLoginAdapter from '@renderer/components/vue-login/VueLoginAdapter';
import { useAuth } from '../../hooks/context/AuthContext';
import './LoginPage.css';

/**
 * 登录页 = 直接嵌入 koi（Vue）登录页，铺满整屏。
 *
 * 语言 / 暗色 / 登录样式切换全部由 koi 登录页自身的控件承担
 * （右上角 KoiLanguage / KoiDark / ReLoginStylePicker），
 * React 侧不再叠加标题、副标题、语言下拉等 chrome。
 */
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
    document.title = t('login.pageTitle');
  }, [t]);

  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  // Vue koi 登录成功（token 已写入 storage）→ React 标记已认证并跳转首页
  const handleVueLoginSuccess = useCallback(() => {
    markRef.current();
    void navigateRef.current('/guid', { replace: true });
  }, []);

  if (status === 'checking') {
    return <AppLoader />;
  }

  return (
    <div className='login-page login-page--vue'>
      <VueLoginAdapter appName='ai' onSuccess={handleVueLoginSuccess} />
    </div>
  );
};

export default LoginPage;
