import React, { useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import AppLoader from '@renderer/components/layout/AppLoader';
import VueLoginAdapter from '@renderer/components/vue-login/VueLoginAdapter';
import { useAuth } from '../../hooks/context/AuthContext';
import { getConfig } from '@repo/config';

/**
 * 登录页 —— 整页即 koi 登录页。
 *
 * React 侧仅保留全屏挂载点，koi 登录页（Vue）自己负责铺满视口与全部视觉
 * （品牌区 / 语言切换 / 明暗模式 / 8 种风格 / 登录表单）。避免两套登录 UI
 * 叠加导致「两个登录页」重叠。
 */
const LoginPage: React.FC = () => {
  const { t } = useTranslation();
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
    const appTitle = getConfig()?.app?.title ?? 'NomiFun';
    document.title = t('login.pageTitle', { appTitle });
  }, [t]);

  // Vue koi 登录成功（token 已写入 storage）→ React 标记已认证并跳转首页
  const handleVueLoginSuccess = useCallback(() => {
    markRef.current();
    void navigateRef.current('/guid', { replace: true });
  }, []);

  if (status === 'checking') {
    return <AppLoader />;
  }

  return (
    <div className='login-page login-page--koi-full'>
      <VueLoginAdapter onSuccess={handleVueLoginSuccess} />
    </div>
  );
};

export default LoginPage;
