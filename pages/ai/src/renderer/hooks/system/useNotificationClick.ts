/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ConversationId } from '@/common/types/ids';

import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ipcBridge } from '@/common';
import { log } from "@repo/utils";

/**
 * Hook to listen for notification click events from main process.
 * Navigates to the corresponding conversation page when a notification is clicked.
 */
export const useNotificationClick = () => {
  const navigate = useNavigate();

  const handler = useCallback(
    (payload: { conversation_id?: ConversationId }) => {
      log.info('[useNotificationClick] Received notification click:', payload);
      if (payload.conversation_id) {
        // Navigate to the conversation page / 导航到会话页面
        log.info('[useNotificationClick] Navigating to conversation:', payload.conversation_id);
        void navigate(`/conversation/${payload.conversation_id}`);
      } else {
        log.warn(`[useNotificationClick] No conversation_id in payload`);
      }
    },
    [navigate]
  );

  useEffect(() => {
    log.info('[useNotificationClick] Registering notification click handler');
    return ipcBridge.notification.clicked.on(handler);
  }, [handler]);
};
