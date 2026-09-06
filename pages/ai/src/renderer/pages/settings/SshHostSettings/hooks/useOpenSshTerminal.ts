/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Message } from '@arco-design/web-react';
import { ipcBridge } from '@/common';
import type { IApiSshHost } from '@/common/adapter/ipcBridge';

/**
 * Open an interactive SSH terminal bound to a saved host, then jump to it.
 *
 * 直接调用后端 `/api/terminals`（body 带 `ssh_host_id`，开启真实 SSH PTY），
 * 成功后跳转 `/terminal/:id` 渲染 XtermView。与 `useOpenSshSession`（nomi agent 会话）
 * 不同，这里是纯交互式终端。
 */
export const useOpenSshTerminal = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return useCallback(
    async (host: IApiSshHost): Promise<boolean> => {
      try {
        const session = await ipcBridge.terminal.create.invoke({
          name: host.name,
          cwd: '',
          command: 'ssh',
          cols: 100,
          rows: 30,
          ssh_host_id: host.sshHostId,
        });
        if (!session?.terminal_id) {
          Message.error(t('ssh.newSessionFailed', { defaultValue: 'SSH 终端创建失败' }));
          return false;
        }
        await navigate(`/terminal/${session.terminal_id}`);
        return true;
      } catch (e) {
        Message.error(e instanceof Error ? e.message : String(e));
        return false;
      }
    },
    [navigate, t]
  );
};

export default useOpenSshTerminal;