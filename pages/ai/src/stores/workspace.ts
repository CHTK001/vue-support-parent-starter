// stores/workspace.ts
import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import { ref, computed } from 'vue'
import { apiService } from '@/services/ApiService'

const MAX_RECENT = 10

export type WorkspaceChoiceMode = 'auto' | 'public' | 'custom'

export interface WorkspaceChoice {
  mode: WorkspaceChoiceMode
  path: string | null
}

export const useWorkspaceStore = defineStore('workspace', () => {
  const recentWorkspaces = useStorage<string[]>('recentWorkspaces', [])
  const lastChoice = useStorage<WorkspaceChoice | null>('lastWorkspaceChoice', null, undefined, {
    serializer: {
      read: (v: any) => {
        if (!v) return null
        try { return JSON.parse(v) } catch { return null }
      },
      write: (v: any) => JSON.stringify(v),
    },
  })
  const baseDir = ref<string | null>(null)

  const recentList = computed(() => recentWorkspaces.value)

  function addRecent(path: string) {
    if (!path) return
    const trimmed = path.trim()
    if (!trimmed) return
    const list = recentWorkspaces.value.filter((p) => p !== trimmed)
    list.unshift(trimmed)
    if (list.length > MAX_RECENT) list.length = MAX_RECENT
    recentWorkspaces.value = list
  }

  function removeRecent(path: string) {
    recentWorkspaces.value = recentWorkspaces.value.filter((p) => p !== path)
  }

  let baseDirPromise: Promise<string | null> | null = null

  async function ensureBaseDir(): Promise<string | null> {
    if (baseDir.value) return baseDir.value
    if (baseDirPromise) return baseDirPromise
    baseDirPromise = (async () => {
      try {
        const response = await apiService.fetchWorkspaceBaseDir()
        baseDir.value = response.workspaceBaseDir
        return baseDir.value
      } catch (e) {
        console.error('Failed to fetch workspace base dir:', e)
        return null
      } finally {
        baseDirPromise = null
      }
    })()
    return baseDirPromise
  }

  function getPublicPath(): string | null {
    if (!baseDir.value) return null
    const normalized = baseDir.value.replace(/\\/g, '/')
    return normalized.endsWith('/') ? normalized + 'public' : normalized + '/public'
  }

  function setLastChoice(mode: WorkspaceChoiceMode, path: string | null) {
    lastChoice.value = { mode, path }
  }

  /**
   * 工作区根版本号。
   *
   * <p>会话的执行目录（项目）可以在会话页中途切换，而后端的文件树、SSE 监听与
   * 文件预览都跟着它走。侧栏只在「会话 ID 变化」时重载树，切换项目不会触发，
   * 于是树还指着旧目录。这里用一个自增版本号当进程内信号：谁改了工作目录就 bump，
   * 侧栏 watch 到就清空并按新根重载。</p>
   */
  const rootRevision = ref(0)

  function bumpRootRevision() {
    rootRevision.value += 1
  }

  function getLastChoice(): WorkspaceChoice | null {
    return lastChoice.value
  }

  return {
    recentList,
    baseDir,
    lastChoice,
    addRecent,
    removeRecent,
    ensureBaseDir,
    getPublicPath,
    setLastChoice,
    getLastChoice,
    rootRevision,
    bumpRootRevision,
  }
})
