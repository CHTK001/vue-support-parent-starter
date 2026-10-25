// stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { getMe, login as loginApi, syncUserPerm } from '@repo/core'
import { unwrapResult } from '@repo/utils'
import { t } from '@/locales'
import {
    api,
    cachedUserInfo,
    clearAuth,
    currentToken,
    hasToken,
    saveAuth,
} from '@/framework/context'
import type { User, LoginRequest } from '@/types/api'

/** 后端 /v2/user/me 契约（ReturnResult.data） */
interface MePayload {
    userId?: string
    username?: string
    nickname?: string
    readonly?: boolean
    roles?: string[]
}

/** 后端 /v2/user/login 契约（ReturnResult.data） */
interface LoginPayload extends MePayload {
    accessToken?: string
    refreshToken?: string
    user?: MePayload
    expires?: number
}

/**
 * 认证状态 Store
 *
 * 令牌与用户信息统一由框架 storage 持有（@repo/utils token 模块），请求侧的
 * Authorization 头与 401/403 跳登录由 @repo/core 的 http 拦截器负责，
 * 本 store 只做状态镜像与登录 / 登出 / 校验动作。
 */
export const useAuthStore = defineStore('auth', () => {
    // 状态：store 创建时立即从框架 storage 恢复，确保刷新后数据不丢失
    const user: Ref<User | null> = ref((cachedUserInfo<MePayload>() as User | null) ?? null)
    const token: Ref<string | null> = ref(currentToken() || null)

    // 免登录状态
    const autoLoginEnabled: Ref<boolean> = ref(false)

    // 计算属性：持有令牌才算已登录（路由守卫据此拦截）
    const isAuthenticated: ComputedRef<boolean> = computed(() => Boolean(token.value))

    // 定时验证定时器引用
    let refreshTimer: number | null = null
    const REFRESH_INTERVAL = 30 * 60 * 1000 // 30分钟

    /** 令牌与用户信息写入框架 storage（用户级存储前缀依赖 userId） */
    function remember(accessToken: string, profile: MePayload): void {
        const { roles, ...rest } = profile
        const profileWithRoles = { ...rest, roles: roles ?? [] }
        saveAuth(accessToken, profileWithRoles as unknown as Record<string, unknown>)
        // 关键：SPA 登录不会重新执行 createApp 的 syncUserPerm，需在此立即同步角色，
        // 否则 isAdmin() 读不到角色，MCP 等仅管理员入口在登录后不显示（刷新才恢复）
        syncUserPerm(profileWithRoles)
        token.value = accessToken
        user.value = rest as unknown as User
    }

    // Actions
    async function login(credentials: LoginRequest): Promise<boolean> {
        const payload = unwrapResult<LoginPayload>(
            await loginApi({ username: credentials.username, password: credentials.password }),
        )
        const accessToken = payload?.accessToken
        if (!accessToken) {
            throw new Error(t('common.auth.loginFailed'))
        }
        // ⚠️ 登录响应把角色放在与 user 平级的 roles 上
        // （{ accessToken, user: {userId...}, roles: ["SUPER_ADMIN","ADMIN"] }），
        // 而 user 对象本身不含 roles。只取 payload.user 会让存进 storage 的
        // roles 恒为 []，isAdmin() 判否 —— 管理员登录后被渠道管理这类 adminOnly
        // 页面挡在「仅管理员可访问」，要再刷新一次（走 /v2/user/me）才恢复。
        const profile: MePayload = { ...(payload.user ?? payload) }
        if (!profile.roles?.length && payload.roles?.length) {
            profile.roles = payload.roles
        }
        remember(accessToken, profile)
        startAuthRefreshTimer()
        return true
    }

    function logout(): void {
        // 通知后端登出，失败不阻断本地清理（令牌失效场景由拦截器跳转处理）
        void api.post('/user/logout').catch(() => undefined)
        clearAuth()
        token.value = null
        user.value = null
        stopAuthRefreshTimer()
    }

    /**
     * 页面刷新时初始化认证状态
     * 有令牌则异步验证有效性并刷新用户信息，无效时清除登录态
     */
    async function initializeAuth(): Promise<boolean> {
        if (!hasToken()) {
            token.value = null
            return false
        }
        token.value = currentToken()
        return checkAuth()
    }

    async function checkAuth(): Promise<boolean> {
        if (!hasToken()) return false
        try {
            const me = unwrapResult<MePayload>(await getMe(false))
            remember(currentToken(), me ?? {})
            if (refreshTimer === null) startAuthRefreshTimer()
            return true
        } catch (error: any) {
            // 只按传输层错误判断「暂不可达」：业务失败（HTTP 200 的 {code,msg}）不含
            // status/response，若一并放过会让失效令牌长期保留登录态
            const status = error?.response?.status ?? error?.status;
            const transportDown =
                (error?.isAxiosError === true && error?.response === undefined) ||
                (typeof error?.message === 'string'
                    && /timeout|ECONNABORTED|Network Error|Failed to fetch|Load failed/i.test(error.message)) ||
                status === 500 ||
                status === 502 ||
                status === 503 ||
                status === 504;
            if (transportDown) {
                // 后端不可达（未启动 / 网络中断）：保留登录态，等待下次验证
                console.warn('认证检查暂不可达，保留登录态:', error?.message ?? error);
                return true;
            }
            console.warn('认证检查失败:', error?.message ?? error);
            // 令牌被后端明确拒绝（含「未登录」）：清除登录态，由路由守卫跳登录页
            logout();
            return false;
        }
    }

    /**
     * 启动定时验证定时器，每30分钟验证一次token有效性
     */
    function startAuthRefreshTimer(): void {
        stopAuthRefreshTimer()
        refreshTimer = window.setInterval(() => {
            void checkAuth()
        }, REFRESH_INTERVAL)
    }

    /**
     * 停止定时验证定时器
     */
    function stopAuthRefreshTimer(): void {
        if (refreshTimer !== null) {
            window.clearInterval(refreshTimer)
            refreshTimer = null
        }
    }

    return {
        // 状态
        user,
        token,
        autoLoginEnabled,
        isAuthenticated,
        // Actions
        login,
        logout,
        initializeAuth,
        checkAuth,
    }
})
