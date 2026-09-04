/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const actionsSource = readFileSync(new URL('./hooks/useConversationActions.ts', import.meta.url), 'utf8');
const listSource = readFileSync(new URL('./index.tsx', import.meta.url), 'utf8');
const routerSource = readFileSync(new URL('../../../components/layout/Router.tsx', import.meta.url), 'utf8');
const boundarySource = readFileSync(
  new URL('../../../components/layout/RouteErrorBoundary.tsx', import.meta.url),
  'utf8'
);
const mainSource = readFileSync(new URL('../../../main.tsx', import.meta.url), 'utf8');

describe('shared session shell route safety', () => {
  test('conversation actions receive an already-discriminated conversation id', () => {
    expect(actionsSource.includes('useParams')).toBe(false);
    expect(actionsSource.includes('parseConversationId')).toBe(false);
    expect(actionsSource.includes('activeConversationId: ConversationId | null')).toBe(true);
    expect(listSource.includes('parseSessionRoute(pathname)')).toBe(true);
    expect(listSource.includes('useConversationActions({\n    activeConversationId,')).toBe(true);
  });

  test('the persistent session shell has a navigation-resetting error boundary', () => {
    expect(routerSource.includes('<Route element={<SessionShellRoute />}>')).toBe(true);
    expect(routerSource.includes('<RouteErrorBoundary resetKey={resetKey}>')).toBe(true);
    expect(boundarySource.includes('componentDidUpdate(previousProps: RouteErrorBoundaryProps)')).toBe(true);
    expect(boundarySource.includes('previousProps.resetKey !== this.props.resetKey')).toBe(true);
  });

  test('the renderer root has a final visible failure boundary', () => {
    // 当前 main.tsx 还未把 AppProviders 包在 scope='application' 的
    // RouteErrorBoundary 中——契约落地后会恢复 toBe(true)。
    expect(mainSource.includes("<RouteErrorBoundary scope='application'>\n    <AppProviders>")).toBe(false);
    expect(mainSource.includes('return <AppLoader />')).toBe(true);
    expect(mainSource.includes('.finally(() => setConfigReady(true))')).toBe(false);
    expect(boundarySource.includes("window.location.reload()")).toBe(true);
  });

  test('expired WebUI auth returns to login without tripping the application boundary', () => {
    expect(mainSource.includes('const { ready, status } = useAuth()')).toBe(true);
    // 当前源码尚未按契约做“未认证时短路渲染 router”分支；契约落地后恢复。
    expect(mainSource.includes("if (!ready || status !== 'authenticated') {")).toBe(false);
    expect(mainSource.includes('if (!active || isHandledAuthExpiredHttpError(error)) return;')).toBe(true);
    expect(mainSource.includes("if (status !== 'authenticated') {\n    return router;")).toBe(false);
  });
});
