<template>
  <div class="global-sidebar flex flex-col h-full sidebar-transparent-bg overflow-hidden ">
    <!-- 导航菜单 -->
    <div class="px-2 py-2 space-y-0.5">
      <template v-for="(item, idx) in navItems" :key="item.key">
        <div v-if="item.section && (idx === 0 || navItems[idx - 1].section !== item.section)"
          class="px-2 pt-2 pb-0.5 text-[10px] font-semibold tracking-normal text-gray-400 dark:text-gray-500 select-none">
          {{ item.section }}
        </div>
        <div @click="handleNavClick(item.key)" role="button" :aria-label="item.label" :aria-current="currentActiveTab === item.key ? 'page' : undefined"
          class="nav-item flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-200 ease-in-out"
          :class="currentActiveTab === item.key
            ? 'nav-item-active bg-(--color-sidebar-bg-active) text-(--color-sidebar-text-active)'
            : 'text-(--color-text) hover:bg-(--color-sidebar-bg-hover) hover:text-(--color-sidebar-text-hover)'">
          <component :is="item.icon" class="w-4.5 h-4.5 shrink-0" />
          <span class="text-sm font-medium flex-1 truncate">{{ item.label }}</span>
          <!-- 模型未配齐徽标：进菜单前就告知「暂时不可用」，以及为什么（hover 看 tip）。
               仍允许点击进入 —— 页面里会写清差哪几项、去哪儿配，比一个点不动的菜单更有用。 -->
          <span v-if="item.badge" class="nav-item-badge" :title="item.badgeTip">{{ item.badge }}</span>
          <span v-if="item.shortcut"
            class="text-[10px] leading-none font-mono text-gray-400 dark:text-gray-500 select-none">
            {{ item.shortcut }}
          </span>
        </div>
      </template>
    </div>


    <!-- 会话列表区域 -->
    <div class="flex-1 overflow-hidden py-1">
      <ScrollContainer ref="scrollContainer" class="h-full max-h-full">
        <!-- 按分组展示会话 -->
        <div v-for="group in displayGroups" :key="group.id" class="mb-1">
          <!-- 分组标题栏 -->
          <div
            class="group-header flex items-center justify-between pl-1 pr-1 py-1 ml-1 mr-0.5 rounded-md cursor-pointer transition-colors duration-200 select-none group text-neutral-600 dark:text-neutral-200"
            @click="toggleGroupExpand(group.id)" @contextmenu.prevent="openGroupContextMenu($event, group)">
            <div class="flex items-center gap-1.5">
              <span class="relative w-4 h-4 shrink-0 flex items-center justify-center">
                <FolderOpen16Regular class="absolute inset-0 w-4 h-4 transition-opacity duration-200 group-hover:opacity-0 text-yellow-600" />
                <!-- <svg class="w-3.5 h-3.5 absolute inset-0 transition-opacity duration-200 group-hover:opacity-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
                </svg> -->
                <ChevronDown12Regular class="absolute inset-0 w-4 h-4 transition-all duration-200 opacity-0 group-hover:opacity-100"
                  :class="isGroupExpanded(group.id) ? '' : '-rotate-90'" />
              </span>
              <span class="text-sm font-medium">{{ group.name }}</span>
            </div>
            <div class="flex items-center gap-1">
              <!-- 新建会话 / 多选 -->
              <DropdownMenu @command="(cmd: string) => handleGroupPlusCommand(cmd, group)">
                <div
                  class="session-action-trigger p-0.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-700">
                  <Add12Regular class="w-2.5 h-2.5 text-gray-500 dark:text-gray-300" />
                </div>
                <template #dropdown>
                  <DropdownMenuItem command="new">
                    <Add12Regular class="w-3.5 h-3.5 mr-2 inline-block" />
                    新建会话
                  </DropdownMenuItem>
                </template>
              </DropdownMenu>
              <!-- 批量：与「+」并排的独立按钮，一键进入多选（原先藏在 + 的下拉里，多一层点击） -->
              <button type="button" class="session-action-trigger p-0.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-700"
                :class="{ 'is-multi-active': multiSelectMode }" title="批量" aria-label="批量"
                @click.stop="toggleMultiSelect">
                <CheckBoxOutlined class="w-2.5 h-2.5 text-gray-500 dark:text-gray-300" />
              </button>
            </div>
          </div>

          <!-- 分组内的会话列表 -->
          <div v-show="isGroupExpanded(group.id)" class="mt-0.5 space-y-0.5">
            <!-- 分组内无会话时显示空状态 -->
            <template v-if="getGroupSessions(group.id).length === 0 && !isLoadingGroup(group.id)">
              <div class="text-center text-gray-500 py-6 text-xs">
                {{ t('ui.sidebar.noTasks') }}
              </div>
            </template>
            <template v-else>
              <div v-for="session in getGroupSessions(group.id)" :key="session.id" class="session-wrap">
              <div
                class="session-item flex items-center gap-2 py-1.5 pr-1 pl-2 ml-1 mr-0.5  rounded-md cursor-pointer transition-all duration-200 ease-in-out group"
                :class="{
                  'session-item-active': !multiSelectMode && session.id === currentSessionId,
                  'session-item-inactive': !multiSelectMode && session.id !== currentSessionId,
                  'session-in-check': multiSelectMode,
                  'session-checked': multiSelectMode && isSelected(session)
                }" @click="onSessionClick(session)">
                <!-- 多选框 -->
                <el-checkbox v-if="multiSelectMode" class="ms-row-check shrink-0"
                  :model-value="isSelected(session)" tabindex="-1">
                  <span></span>
                </el-checkbox>
                <!-- 状态指示器：运行中时左侧显示旋转动画 -->
                <div v-else class="status-indicator w-3 h-3 shrink-0 flex items-center justify-center">
                  <el-icon v-if="getSessionWorking(session.id)" class="working-spin" size="12">
                    <Loading />
                  </el-icon>
                  <div v-else-if="getSessionUnread(session.id) && (session.id !== currentSessionId || windowHidden)"
                    class="w-1 h-1 rounded-full bg-red-500" />
                  <div v-else class="w-1 h-1 rounded-full bg-gray-400 opacity-50" />
                </div>

                <!-- 展开/收起：露出子会话、最近消息、元信息与操作 -->
                <button v-if="!multiSelectMode" type="button" class="session-expand-btn shrink-0"
                  :class="{ 'is-open': isSessionExpanded(session.id) }"
                  :title="isSessionExpanded(session.id) ? '收起' : '展开'"
                  :aria-expanded="isSessionExpanded(session.id)"
                  @click.stop="toggleSessionExpand(session)">
                  <el-icon size="12"><ChevronDown12Regular /></el-icon>
                </button>

                <div class="session-info flex-1 min-w-0 flex items-center">
                  <div class="session-title text-sm font-medium w-full">
                    {{ session.title }}
                  </div>
                </div>
                <div v-if="!multiSelectMode" class="session-actions shrink-0 relative min-w-5 h-full flex items-center">
                  <!-- 运行中：右侧显示前端计算的实时耗时（每秒刷新） -->
                  <span v-if="getSessionWorking(session.id)"
                    class="absolute right-0 top-1/2 -translate-y-1/2 text-xs font-medium text-blue-500 whitespace-nowrap">
                    {{ formatWorkingElapsed(session.id) }}
                  </span>
                  <!-- 最近一次执行耗时（非运行时灰显，当前会话也显示——完成即记录；hover 时隐藏，右对齐悬浮） -->
                  <span v-else-if="formatLastRun(session.id)"
                    class="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500 group-hover:hidden whitespace-nowrap">
                    {{ formatLastRun(session.id) }}
                  </span>
                  <!-- 最后活跃时间（无执行记录时回退，hover 时隐藏，右对齐悬浮） -->
                  <span v-else-if="session.id !== currentSessionId"
                    class="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500 group-hover:hidden whitespace-nowrap">
                    {{ formatLastActive(session.lastActiveAt || session.updatedAt) }}
                  </span>
                  <!-- 操作菜单（默认隐藏，hover 时显示） -->
                  <div
                    class="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex items-center"
                    :class="{ 'opacity-100': session.id === currentSessionId }">
                    <DropdownMenu @command="(cmd: string) => handleDropdownSelect(cmd, session)">
                      <div class="session-action-trigger">
                        <el-icon class="w-4 h-4">
                          <MoreHorizontal20Filled />
                        </el-icon>
                      </div>
                      <template #dropdown>
                        <DropdownMenuItem command="rename">
                          <Edit16Regular class="w-4 h-4 mr-2 inline-block" />
                          {{ t('ui.sidebar.rename') }}
                        </DropdownMenuItem>
                        <DropdownMenuItem command="move">
                          <Folder20Regular class="w-4 h-4 mr-2 inline-block" />
                          {{ t('ui.sidebar.moveToGroup') }}
                        </DropdownMenuItem>
                        <DropdownMenuItem command="archive">
                          <Archive20Regular class="w-4 h-4 mr-2 inline-block" />
                          {{ t('ui.sidebar.archive') }}
                        </DropdownMenuItem>
                        <DropdownMenuItem command="delete">
                          <Delete20Regular class="w-4 h-4 mr-2 inline-block" />
                          {{ t('ui.sidebar.delete') }}
                        </DropdownMenuItem>
                      </template>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              <!-- 会话展开详情：子会话 / 智能体、最近消息、元信息、操作 -->
              <div v-if="isSessionExpanded(session.id)" class="session-detail" @click.stop>
                <div v-if="sessionDetailLoading(session.id)" class="session-detail-loading">
                  <el-icon class="animate-spin" size="12"><Loading /></el-icon>
                  <span>加载中…</span>
                </div>
                <template v-else>
                  <!-- 子会话 / 智能体 -->
                  <div class="session-detail-section"
                    v-if="(sessionDetail(session.id)?.agents?.length || 0) + (sessionDetail(session.id)?.subSessions?.length || 0) > 0">
                    <div class="session-detail-label">子会话 / 智能体</div>
                    <div v-for="ag in (sessionDetail(session.id)?.agents || [])" :key="'ag-' + ag.agent_id"
                      class="session-detail-agent">
                      <span class="agent-role" :class="ag.role === 'master' ? 'is-master' : 'is-sub'">
                        {{ ag.role === 'master' ? '主' : '子' }}
                      </span>
                      <span class="agent-name">{{ ag.name || ag.agent_id }}</span>
                      <span class="agent-status" :class="'is-' + (ag.status || 'idle')">{{ ag.status || 'idle' }}</span>
                    </div>
                    <div v-for="sub in (sessionDetail(session.id)?.subSessions || [])" :key="'sub-' + sub.id"
                      class="session-detail-sub" @click="onSessionClick({ id: sub.id, title: sub.title })">
                      <span class="sub-title">{{ sub.title || sub.id }}</span>
                      <span class="sub-time">{{ formatLastActive(sub.updatedAt) }}</span>
                    </div>
                  </div>

                  <!-- 最近消息预览 -->
                  <div class="session-detail-section" v-if="sessionPreview(session)">
                    <div class="session-detail-label">最近消息</div>
                    <div class="session-detail-msg">{{ sessionPreview(session) }}</div>
                  </div>

                  <!-- 元信息 -->
                  <div class="session-detail-section">
                    <div class="session-detail-label">会话信息</div>
                    <div class="session-detail-meta">
                      <span>模型：{{ session.model || session.modelId || '默认' }}</span>
                      <span v-if="session.messageCount != null">消息：{{ session.messageCount }}</span>
                      <span v-if="session.lastActiveAt || session.updatedAt">
                        活跃：{{ formatLastActive(session.lastActiveAt || session.updatedAt) }}
                      </span>
                    </div>
                  </div>

                  <!-- 操作 -->
                  <div class="session-detail-actions">
                    <button type="button" class="detail-action" @click="handleDropdownSelect('rename', session)">重命名</button>
                    <button type="button" class="detail-action" @click="handleDropdownSelect('move', session)">移动</button>
                    <button type="button" class="detail-action" @click="handleDropdownSelect('archive', session)">归档</button>
                    <button type="button" class="detail-action is-danger" @click="handleDropdownSelect('delete', session)">删除</button>
                  </div>
                </template>
              </div>
              </div>

              <!-- 分组内加载更多 -->
              <div v-if="groupHasMoreSessions(group.id) || sessionGroupStore.loadingMoreGroupId === group.id"
                class="py-1 px-9 text-left">
                <div v-if="sessionGroupStore.loadingMoreGroupId === group.id"
                  class="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <el-icon class="animate-spin" size="14">
                    <Loading />
                  </el-icon>
                  <span>{{ t('ui.sidebar.loadingMore') }}</span>
                </div>
                <div v-else class="text-xs text-gray-400 cursor-pointer hover:text-blue-500 transition-colors"
                  @click="loadMoreForGroup(group.id)">
                  {{ t('ui.sidebar.loadMore') }}
                </div>
              </div>
            </template>
          </div>
        </div>
      </ScrollContainer>
    </div>

    <!-- 多选操作栏 -->
    <div v-if="multiSelectMode" class="ms-bar">
      <el-checkbox :model-value="allSelected" :indeterminate="someSelected" @change="toggleAll">
        全选
      </el-checkbox>
      <span class="ms-count">已选 {{ selectedSessionIds.length }} 项</span>
      <div class="ms-spacer"></div>
      <el-button size="small" round @click="exitMultiSelect">取消</el-button>
      <el-button size="small" type="danger" round :disabled="selectedSessionIds.length === 0"
        @click="handleBatchDelete">
        删除<template v-if="selectedSessionIds.length"> ({{ selectedSessionIds.length }})</template>
      </el-button>
    </div>

    <!-- 底部：头像 + 设置 -->
    <div class="px-3 py-1.5 flex items-center justify-between gap-2">
      <!-- 用户头像+名字 下拉 -->
      <el-dropdown trigger="hover" placement="top-start" @command="handleUserMenuCommand"
        popper-class="user-menu-dropdown" style="flex: 1 1 0%; min-width: 0;">
        <div
          class="flex items-center gap-2 p-1.5 rounded-lg cursor-pointer min-w-0 w-full hover:bg-(--color-sidebar-bg-hover) transition-all duration-200">
          <Avatar class="w-7 h-7 shrink-0" type="user" :round="true" :src="authStore.user?.avatarUrl"
            :name="authStore.user?.nickname || authStore.user?.username" />
          <span class="text-sm font-medium text-(--color-text) truncate min-w-0">
            {{ authStore.user?.nickname || authStore.user?.username || t('ui.sidebar.defaultUserName') }}
          </span>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <PersonOutlined class="w-4 h-4 mr-2" />
              {{ t('ui.sidebar.profile') }}
            </el-dropdown-item>
            <!-- 颜色主题：内联三态切换 -->
            <div class="px-5 py-2 flex items-center gap-2">
              <span class="text-sm text-gray-500 dark:text-gray-400 mr-1">{{ t('ui.sidebar.colorTheme') }}</span>
              <div class="flex items-center gap-0.5 p-0.5 rounded-md bg-gray-100 dark:bg-[#1a1b1e]">
                <button v-for="option in themeOptions" :key="option.value" @click="setTheme(option.value)"
                  class="px-2 py-1 rounded text-xs font-medium transition-all duration-200 flex items-center gap-1"
                  :class="themeMode === option.value
                    ? 'bg-white dark:bg-[#3a3b3f] text-gray-900 dark:text-[#e8e9ed] shadow-sm'
                    : 'text-gray-500 dark:text-[#8b8d95] hover:text-gray-700 dark:hover:text-[#c0c1c5]'">
                  <component :is="option.icon" class="w-3.5 h-3.5" />
                  {{ option.label }}
                </button>
              </div>
            </div>
            <el-dropdown-item command="settings">
              <Settings16Filled class="w-4 h-4 mr-2" />
              {{ t('ui.sidebar.settingsCenter') }}
            </el-dropdown-item>
            <el-dropdown-item command="logout" divided>
              <LogOutOutlined class="w-4 h-4 mr-2" />
              {{ t('ui.sidebar.logout') }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <!-- 设置 -->
      <LTooltip :content="t('ui.sidebar.settings')" placement="bottom">
        <!-- 纯图标按钮必须自带可访问名：tooltip 只在悬停时出现，屏幕阅读器与
             自动化验收都读不到它（实测 sweep 每个路由都记一条 no-accessible-name）。 -->
        <div role="button" :aria-label="t('ui.sidebar.settings')" @click="handleNavClick('setting')"
          class="flex items-center justify-center px-2.5 py-2 rounded-lg cursor-pointer transition-all duration-200 shrink-0"
          :class="currentActiveTab === 'setting'
            ? 'bg-(--color-sidebar-bg-active) text-(--color-sidebar-text-active)'
            : 'text-(--color-text-gray) hover:bg-(--color-sidebar-bg-hover) hover:text-(--color-sidebar-text-hover)'">
          <component :is="Settings16Filled" class="w-4 h-4" />
        </div>
      </LTooltip>
    </div>
  </div>

  <!-- 删除会话确认对话框 -->
  <LDialog v-model="deleteDialogVisible" :title="t('ui.sidebar.deleteSessionTitle')" width="500px" :close-on-click-modal="false">
    <div class="space-y-4">
      <p class="text-gray-700 dark:text-gray-300">
        {{ t('ui.sidebar.deleteSessionConfirm', { title: deleteSessionData?.title }) }}
      </p>
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
        <p class="text-sm text-red-600 dark:text-red-400">
          {{ t('ui.sidebar.deleteWarning') }}
        </p>
      </div>
      <el-checkbox v-model="deleteWorkspaceChecked" class="w-full">
        <div class="flex flex-col gap-1" style="white-space: normal; word-wrap: break-word; overflow-wrap: break-word;">
          <span class="font-medium">{{ t('ui.sidebar.deleteWorkspace') }}</span>
          <span class="text-xs text-gray-500 dark:text-gray-400" style="line-height: 1.5;">
            {{ t('ui.sidebar.deleteWorkspaceDesc') }}
          </span>
        </div>
      </el-checkbox>
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <el-button @click="deleteDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="danger" @click="confirmDeleteSession">{{ t('ui.sidebar.confirmDelete') }}</el-button>
      </div>
    </template>
  </LDialog>

  <!-- 移动会话到分组弹窗 -->
  <LDialog v-model="moveGroupDialogVisible" :title="t('ui.sidebar.selectGroup')" width="360px" :close-on-click-modal="false">
    <div class="space-y-1 py-2">
      <div v-for="(g) in moveGroupOptions" :key="g.value"
        class="flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 text-sm"
        :class="moveSelectedGroupId === g.value ? 'bg-(--color-sidebar-bg-active) text-(--color-sidebar-text-active)' : 'text-(--color-text-gray) hover:bg-(--color-sidebar-bg-hover) hover:text-(--color-sidebar-text-hover)'"
        @click="moveSelectedGroupId = g.value">
        <el-icon class="w-4 h-4">
          <Folder20Regular />
        </el-icon>
        <span>{{ g.label }}</span>
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <el-button @click="moveGroupDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="confirmMoveSession">{{ t('common.ok') }}</el-button>
      </div>
    </template>
  </LDialog>

  <!-- 分组右键菜单 -->
  <ContextMenu :visible="groupContextMenu.visible" :x="groupContextMenu.x" :y="groupContextMenu.y"
    :items="groupContextMenuItems" @close="closeGroupContextMenu" />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, markRaw } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useSessionStore } from '../stores/session'
import { useSessionGroupStore } from '../stores/sessionGroup'
import { useModelConfigStore } from '../stores/modelConfig'
import { UNGROUPED_ID } from '../stores/session'
import { useTheme, type ThemeMode } from '../composables/useTheme'
import { usePopup } from '../composables/usePopup'
import { Avatar, ScrollContainer } from './ui'
import DropdownMenu from './ui/DropdownMenu.vue'
import DropdownMenuItem from './ui/DropdownMenuItem.vue'
import ContextMenu, { type ContextMenuItem } from './ui/ContextMenu.vue'
import LTooltip from './ui/LTooltip.vue'
import LDialog from '@/components/ui/LDialog.vue'
import { apiService } from '@/services/ApiService'
import { sessionAgentApi } from '@/services/javaApi'
import { isAdmin } from '@repo/core'
import type { SessionGroup } from '@/types/session'
import { ElMessageBox } from 'element-plus'

import {
  PersonOutlined,
  LogOutOutlined,
  CheckBoxOutlined,
} from '@vicons/material'

import {
  Bot20Regular,
  BookSearch20Regular,
  BrainCircuit20Regular,
  ContactCard20Regular,
  AddSquare20Regular,
  Add12Regular,
  ClockAlarm20Regular,
  Apps20Regular,
  Cloud20Regular,
  Edit16Regular,
  Delete20Regular,
  Folder20Regular,
  FolderOpen16Regular,
  Archive20Regular,
  ChevronDown12Regular,
  WeatherSunny20Regular,
  WeatherMoon20Filled,
  Desktop16Regular,
  Settings16Filled,
  DataBarVertical20Regular,
  PlugConnected20Regular,
  Image20Regular,
  Person20Regular,
  ImageSearch20Regular,
  Key20Regular,
  ChatMultiple24Regular,
} from '@vicons/fluent'
import { MoreHorizontal20Filled, Settings20Regular, Grid16Regular } from '@vicons/fluent'
import { Loading } from '@element-plus/icons-vue'


const isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const sessionStore = useSessionStore()
const sessionGroupStore = useSessionGroupStore()
const { themeMode, setTheme } = useTheme()

const { t } = useI18n()

const themeOptions = computed(() => [
  { label: t('ui.sidebar.themeLight'), value: 'light' as ThemeMode, icon: markRaw(WeatherSunny20Regular) },
  { label: t('ui.sidebar.themeDark'), value: 'dark' as ThemeMode, icon: markRaw(WeatherMoon20Filled) },
  { label: t('ui.sidebar.themeSystem'), value: 'system' as ThemeMode, icon: markRaw(Desktop16Regular) },
])
const { toast, prompt, confirm } = usePopup()

// 删除会话确认对话框状态
const deleteDialogVisible = ref(false)
const deleteSessionData = ref<any>(null)
const deleteWorkspaceChecked = ref(false)

// 移动会话到分组弹窗状态
const moveGroupDialogVisible = ref(false)
const moveGroupOptions = ref<{ label: string; value: string }[]>([])
const moveSelectedGroupId = ref('')
const moveTargetSession = ref<any>(null)

// ===== 多选（批量删除）模式 =====
const multiSelectMode = ref(false)
const selectedSessionIds = ref<string[]>([])

const isSelected = (session: any) => selectedSessionIds.value.includes(session.id)

const onSessionClick = (session: any) => {
  if (multiSelectMode.value) {
    toggleSelect(session)
    return
  }
  selectSession(session)
}
const toggleSelect = (session: any) => {
  const cur = selectedSessionIds.value
  selectedSessionIds.value = cur.includes(session.id)
    ? cur.filter((id) => id !== session.id)
    : [...cur, session.id]
}
const enterMultiSelect = () => {
  selectedSessionIds.value = []
  multiSelectMode.value = true
}
const exitMultiSelect = () => {
  multiSelectMode.value = false
  selectedSessionIds.value = []
}
const handleGroupPlusCommand = (cmd: string, group: any) => {
  if (cmd === 'new') openNewSession(group.id)
}
// 批量按钮：多选态下再次点击即退出，避免只能靠底部「取消」退出
const toggleMultiSelect = () => {
  if (multiSelectMode.value) exitMultiSelect()
  else enterMultiSelect()
}

// 当前已加载（可见）的全部会话，用于全选
const allVisibleSessions = computed(() => {
  const out: any[] = []
  for (const g of displayGroups.value) {
    for (const s of getGroupSessions(g.id)) out.push(s)
  }
  return out
})
const allSelected = computed(
  () =>
    allVisibleSessions.value.length > 0 &&
    allVisibleSessions.value.every((s) => selectedSessionIds.value.includes(s.id)),
)
const someSelected = computed(
  () => selectedSessionIds.value.length > 0 && !allSelected.value,
)
const toggleAll = () => {
  selectedSessionIds.value = allSelected.value
    ? []
    : allVisibleSessions.value.map((s) => s.id)
}

// 批量删除选中会话
const handleBatchDelete = async () => {
  const ids = [...selectedSessionIds.value]
  if (ids.length === 0) return
  const ok = await confirm(
    '批量删除会话',
    `确定删除选中的 ${ids.length} 个会话吗？会话内所有消息将一并删除，且不可恢复。`,
    { type: 'error', confirmText: '删除' },
  )
  if (!ok) return
  try {
    const res = await apiService.batchDeleteSessions(ids)
    const deleted = new Set(ids)
    if (currentSessionId.value && deleted.has(currentSessionId.value)) {
      router.replace({ name: 'Chat', params: { sessionId: 'new-session' } })
    }
    ids.forEach((id) => {
      sessionStore.removeSession(id)
      sessionStore.clearSidebarState(id)
    })
    toast.success(`已删除 ${res?.deletedCount ?? ids.length} 个会话`)
    selectedSessionIds.value = []
  } catch (error) {
    console.error('批量删除失败:', error)
    toast.error('批量删除失败，请稍后重试')
  }
}

// 是否正在初始化加载
const isInitializing = ref(false)

// 分组右键菜单状态
const groupContextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  group: null as SessionGroup | null,
})

// 分组右键菜单项
const groupContextMenuItems = computed<ContextMenuItem[]>(() => {
  const group = groupContextMenu.value.group
  if (!group || group.id === UNGROUPED_ID) return []
  return [
    {
      label: t('ui.sidebar.rename'),
      icon: markRaw(Edit16Regular),
      onClick: () => handleRenameGroup(group),
    },
    {
      label: t('ui.sidebar.delete'),
      icon: markRaw(Delete20Regular),
      onClick: () => handleDeleteGroup(group),
    },
  ]
})

// 打开分组右键菜单
const openGroupContextMenu = (event: MouseEvent, group: SessionGroup) => {
  // 未分组只做右键菜单不做实际处理（不可重命名/删除）
  if (group.id === UNGROUPED_ID) return
  groupContextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    group,
  }
}

// 关闭分组右键菜单
const closeGroupContextMenu = () => {
  groupContextMenu.value.visible = false
  groupContextMenu.value.group = null
}

// 打开新建会话面板，指定分组
const openNewSession = (groupId: string) => {
  // 已在新会话页面时只更新 query 参数，不重新导航
  if (currentActiveTab.value === 'chat') {
    if (groupId === UNGROUPED_ID) {
      router.replace({ name: 'Chat', params: { sessionId: 'new-session' } })
    } else {
      router.replace({ name: 'Chat', params: { sessionId: 'new-session' }, query: { groupId } })
    }
    return
  }
  if (groupId === UNGROUPED_ID) {
    router.replace({ name: 'Chat', params: { sessionId: 'new-session' } })
  } else {
    router.replace({ name: 'Chat', params: { sessionId: 'new-session' }, query: { groupId } })
  }
}

// 导航项配置（根据用户设置过滤）
const navItems = computed(() => {
  const allItems = [
    {
      key: 'chat',
      label: '会话',
      icon: AddSquare20Regular,
      shortcut: isElectron ? 'Ctrl N' : 'Ctrl Alt N',
      alwaysShow: true
    },
    {
      key: 'characters',
      label: t('ui.sidebar.navCharacters'),
      icon: ContactCard20Regular,
      showKey: 'showCharactersMenu'
    },
    {
      key: 'tavern',
      label: '酒馆',
      icon: ChatMultiple24Regular,
      alwaysShow: true
    },
    {
      key: 'knowledge-base',
      label: t('ui.sidebar.navKnowledgeBase'),
      icon: BookSearch20Regular,
      showKey: 'showKnowledgeBaseMenu'
    },
    {
      key: 'plugins',
      label: t('ui.sidebar.navPlugins'),
      icon: Apps20Regular,
      showKey: 'showPluginsMenu'
    },
    {
      key: 'image-generate',
      label: '图像生成',
      icon: Image20Regular,
      section: '图像',
      alwaysShow: true
    },
    {
      key: 'face-search',
      label: '人脸识别',
      icon: Person20Regular,
      section: '图像',
      // 底库已按账号隔离（<工作目录>/<账号>/face/），每个账号管自己的库，
      // 因此不再标 adminOnly；后端 /v2/face/* 也已去掉 @Permission("admin")，
      // 未登录仍会被 requireUserId() 拒掉。
      // 注意：人脸「模型」配置是全局设置，仍只有管理员能改（不受此项影响）。
      // 底库的**管理**（列表/删除/登记）在「系统设置 → 底库 → 人脸底库」，
      // 本页只做识别/检索 —— 与「以图搜图（外侧） + 图像底库（设置内）」同一分工。
      // 检测/特征模型未配齐 → 菜单打「未配置」徽标（页面内会说明差哪几项、去哪儿配）
      // 注意：modelConfig 是 Pinia store 实例，getter 经 store 访问已自动解包，
      // 直接取布尔值即可；写 .value 会恒为 undefined（徽标永不消失）。
      badge: modelConfig.faceReady ? '' : '未配置',
      badgeTip: '人脸检测模型 / 人脸特征模型未配置，识别不可用',
    },
    {
      key: 'image-search',
      label: '以图搜图',
      icon: ImageSearch20Regular,
      section: '图像',
      // 底库已按账号隔离（<工作目录>/<账号>/imagesearch），每个账号管自己的库，
      // 因此不再标 adminOnly；后端 /v2/image-search/* 也已去掉 @Permission("admin")，
      // 未登录仍会被 requireUserId() 拒掉。
      // 图像特征模型未配置 → 菜单打「未配置」徽标（同上，store getter 已解包）
      badge: modelConfig.imageReady ? '' : '未配置',
      badgeTip: '图像特征模型未配置，以图搜图不可用',
    },
    {
      key: 'image-colorize',
      label: '图像上色',
      icon: Image20Regular,
      section: '图像',
      // 上色模型未配置 → 菜单打「未配置」徽标，页面内给出与以图搜图同口径的配置提示
      badge: modelConfig.colorizeReady ? '' : '未配置',
      badgeTip: '上色模型未配置，图像上色不可用',
    },
    {
      key: 'models',
      label: '模型管理',
      icon: BrainCircuit20Regular,
      section: 'AI 配置',
      showKey: 'showModelsMenu'
    },
    {
      key: 'usage',
      label: '用量管理',
      icon: DataBarVertical20Regular,
      // 独立分组：用量统计的是本账号的 token/费用消费，与「AI 配置」下的模型接入
      // 不是一类事。原先没有 section，会视觉上并进 AI 配置（用户反馈）。
      section: '用量统计',
      showKey: 'showUsageMenu'
    },
    {
      key: 'connectors',
      label: '连接器',
      icon: PlugConnected20Regular,
      showKey: 'showConnectorsMenu'
    },
    {
      key: 'scheduler',
      label: t('ui.sidebar.navScheduler'),
      icon: ClockAlarm20Regular,
      showKey: 'showSchedulerMenu',
      adminOnly: true
    },
  ]
  
  // 从 localStorage 读取菜单显示配置（默认全部显示）
  const menuSettings = JSON.parse(localStorage.getItem('menuDisplaySettings') || '{}')
  
  return allItems.filter(item => {
    if (item.alwaysShow) return true
    if (item.adminOnly && !isAdmin()) return false
    if (!item.showKey) return true
    return menuSettings[item.showKey] !== false
  })
})

// 当前激活的 tab（根据路由）
const currentActiveTab = computed(() => {
  const routeName = route.name as string
  if (routeName === 'Chat') {
    // 仅在新建会话时高亮"新建任务"，查看已有会话时不高亮
    const sessionId = route.params.sessionId
    const sessionIdStr = Array.isArray(sessionId) ? sessionId[0] : sessionId
    return sessionIdStr === 'new-session' ? 'chat' : ''
  }
  if (routeName === 'Characters') return 'characters'
  if (routeName === 'Bots') return 'bots'
  if (routeName === 'Tavern') return 'tavern'
  if (routeName === 'SystemSettings') {
    // 提供商 / 默认模型已从侧栏移除（仍可从「设置」页进入），
    // 因此这里统一回落到 'setting'，不再为已删除的菜单项保留高亮分支。
    return 'setting'
  }
  if (routeName === 'KnowledgeBase') return 'knowledge-base'
  if (routeName === 'Plugins') return 'plugins'
  if (routeName === 'Scheduler') return 'scheduler'
  if (routeName === 'ImageGenerate') return 'image-generate'
  if (routeName === 'FaceSearch') return 'face-search'
  if (routeName === 'ImageSearch') return 'image-search'
  if (routeName === 'ImageColorize') return 'image-colorize'
  if (routeName === 'Models') return 'models'
  if (routeName === 'AppKeys') return 'app-keys'
  if (routeName === 'ManufacturerKeys') return 'manufacturer-keys'
  if (routeName === 'Roles') return 'roles'
  if (routeName === 'Mcp') return 'mcp'
  if (routeName === 'Agents') return 'agents'
  if (routeName === 'Services') return 'services'
  if (routeName === 'Usage' || routeName === 'UsageSyncLogs') return 'usage'
  if (routeName === 'Skills') return 'skills'
  if (routeName === 'Capabilities') return 'capabilities'
  return ''
})

// 当前会话 ID
const currentSessionId = computed(() => {
  const sessionId = route.params.sessionId
  return Array.isArray(sessionId) ? sessionId[0] : sessionId
})

// 窗口隐藏状态（用于侧边栏未读徽标显示逻辑，SSE 事件由 useSessionEvents composable 统一管理）
const windowHidden = ref(false)

/**
 * 模型配置门禁（人脸识别 / 以图搜图「模型是否真的配过」）。
 *
 * <p>侧栏是这两个菜单的常驻入口，在这里统一加载一次合并视图，
 * 菜单上按门禁结果打「未配置」徽标 —— 用户点进去之前就知道不可用，
 * 而不是上传一张图之后才在后端报「模型未注册」。设置中心保存后调
 * {@link useModelConfigStore.refresh} 会让徽标即时消失。</p>
 */
const modelConfig = useModelConfigStore()
void modelConfig.load()

onMounted(() => {
  document.addEventListener('visibilitychange', () => {
    windowHidden.value = document.hidden
  })
})


/**
 * 判断指定分组是否正在加载
 */
const isLoadingGroup = (groupId: string) => {
  return sessionGroupStore.loadingMoreGroupId === groupId || isInitializing.value
}

// 展示的分组列表（包含虚拟的未分组）
const displayGroups = computed(() => {
  const groups = [...sessionGroupStore.sortedGroups]
  // 始终在最后添加未分组
  groups.push({
    id: UNGROUPED_ID,
    name: t('ui.sidebar.taskList'),
    userId: '',
    sortOrder: groups.length,
    createdAt: '',
    updatedAt: ''
  })
  return groups
})

// 获取分组内的会话（从 sessionStore 统一数据源获取）
const getGroupSessions = (groupId: string): any[] => {
  const groupIdParam = groupId === UNGROUPED_ID ? null : groupId
  return sessionStore.getSessionsByGroup(groupIdParam)
}

// 获取分组会话数量（从 sessionStore 统一数据源获取）
const getGroupSessionCount = (groupId: string): number => {
  const groupIdParam = groupId === UNGROUPED_ID ? null : groupId
  return sessionStore.getGroupTotal(groupIdParam)
}

// 分组是否展开
const isGroupExpanded = (groupId: string): boolean => {
  if (groupId === UNGROUPED_ID) {
    return sessionGroupStore.isExpanded(UNGROUPED_ID)
  }
  return sessionGroupStore.isExpanded(groupId)
}

// 切换分组展开/折叠
const toggleGroupExpand = (groupId: string): void => {
  sessionGroupStore.toggleExpand(groupId)
}

// ==================== 会话条目展开（子会话 / 智能体 / 预览 / 元信息 / 操作） ====================
// 展开态与详情缓存都放在组件内：详情按需懒加载，避免列表渲染时对每个会话都发请求。
const expandedSessionIds = ref<Set<string>>(new Set())
const sessionDetails = ref<Record<string, { agents: any[]; subSessions: any[] }>>({})
const sessionDetailLoadingIds = ref<Set<string>>(new Set())

/** 会话是否已展开 */
const isSessionExpanded = (sessionId: string | number): boolean =>
  expandedSessionIds.value.has(String(sessionId))

/** 会话展开详情（未加载时为空） */
const sessionDetail = (sessionId: string | number) =>
  sessionDetails.value[String(sessionId)]

/** 会话详情是否加载中 */
const sessionDetailLoading = (sessionId: string | number): boolean =>
  sessionDetailLoadingIds.value.has(String(sessionId))

/** 最近消息预览：会话对象自带字段，取不到则不展示该段 */
const sessionPreview = (session: any): string => {
  const raw = session?.lastMessage ?? session?.lastContent ?? session?.last_message
  if (raw == null) {
    return ''
  }
  const text = typeof raw === 'string' ? raw : (raw.content ?? '')
  return String(text).slice(0, 60)
}

/** 展开/收起某会话；首次展开时懒加载详情 */
const toggleSessionExpand = async (session: any): Promise<void> => {
  const id = String(session.id)
  const next = new Set(expandedSessionIds.value)
  if (next.has(id)) {
    next.delete(id)
    expandedSessionIds.value = next
    return
  }
  next.add(id)
  expandedSessionIds.value = next
  if (!sessionDetails.value[id]) {
    await loadSessionDetail(session)
  }
}

/**
 * 懒加载会话详情：已绑定智能体 + 子会话。
 *
 * 注意：这里**不再**调用 `/api/sessions/{id}/agents` 与 `/api/sessions/{id}/sub-sessions`。
 * 那两个接口后端从未实现（实测直连后端也是 404「资源不存在」，代理也是转发到同一个后端），
 * 原来每次展开会话都会稳定打出两个 404 —— 控制台噪声 + 两次无谓往返，
 * 而 Promise.allSettled 的兜底让功能「看起来正常」，实际永远拿不到数据。
 * 现在直接回落为空，展开区显示元信息与操作。
 *
 * 后端补上这两个接口后，把 sessionAgentApi.list / listSubSessions 接回来即可
 * （契约见 services/javaApi.ts 的 sessionAgentApi 注释）。
 */
const loadSessionDetail = async (session: any): Promise<void> => {
  const id = String(session.id)
  sessionDetailLoadingIds.value = new Set(sessionDetailLoadingIds.value).add(id)
  sessionDetails.value = { ...sessionDetails.value, [id]: { agents: [], subSessions: [] } }
  const done = new Set(sessionDetailLoadingIds.value)
  done.delete(id)
  sessionDetailLoadingIds.value = done
}

// 分组是否还有更多会话：
// 1) 后端明确说还有（hasMore）；2) 已加载数达到过一页的数量（指定数量）。
// 只有两个条件同时满足才显示「加载更多」——没数据、有多少全在眼前时都不显示。
const groupHasMoreSessions = (groupId: string): boolean => {
  if (!sessionStore.groupHasMore(groupId)) {
    return false
  }
  return getGroupSessionCount(groupId) >= SIDEBAR_PAGE_SIZE
}

// 初始化加载所有分组的前N个会话（单次请求获取分组+各分组会话）
const loadSessions = async () => {
  isInitializing.value = true
  try {
    const pageSize = SIDEBAR_PAGE_SIZE
    const data = await apiService.fetchSidebarSessions(pageSize)

    // 设置分组列表
    sessionGroupStore.setGroups(data.groups || [])

    // 后端 groupId 为 null/缺省即未分组（Jackson 会直接丢掉 null 字段，只能用 == null 判）
    for (const gs of data.groupSessions || []) {
      const storeGroupId = gs.groupId == null ? UNGROUPED_ID : gs.groupId
      for (const session of gs.items || []) {
        sessionStore.setSession(session)
      }
      sessionStore.setLoadedCount(storeGroupId, gs.items?.length || 0)
      sessionStore.setHasMore(storeGroupId, gs.hasMore ?? ((gs.items?.length || 0) >= pageSize))

      // 同步流式状态
      for (const session of gs.items || []) {
        if (session.isStreaming) {
          sessionStore.syncStreamingState(session.id, true)
        }
      }
    }
  } catch (error) {
    console.error('获取对话列表失败:', error)
  } finally {
    isInitializing.value = false
  }
}

// 为指定分组加载更多会话
const loadMoreForGroup = async (groupId: string) => {
  if (sessionGroupStore.loadingMoreGroupId) return

  const currentSessions = getGroupSessions(groupId)
  const groupIdParam = groupId === UNGROUPED_ID ? null : groupId

  sessionGroupStore.setLoadingMore(groupId)
  try {
    // 用已加载数做 skip：后端按 skip/limit/分组过滤返回下一页，逐页追加。
    const data = await apiService.fetchSessions(currentSessions.length, SIDEBAR_PAGE_SIZE, groupIdParam)

    // 这一页可能一条都没有（会话刚被删光 / skip 越界）。必须照样把 hasMore 落成 false，
    // 否则「加载更多」会永远停在那里 —— 原实现把 setHasMore 放在
    // `data.items.length > 0` 分支里，空页直接跳过了状态更新（实测缺陷）。
    const received = data.items?.length ?? 0
    if (received > 0) {
      // 写入统一数据源
      for (const session of data.items) {
        sessionStore.setSession(session)
      }
      // 同步流式状态
      for (const session of data.items) {
        if (session.isStreaming) {
          sessionStore.syncStreamingState(session.id, true)
        }
      }
    }
    const loaded = currentSessions.length + received
    sessionStore.setLoadedCount(groupId, loaded)
    // 点击后必须真有数据才保留按钮：后端明确说没有（hasMore=false）
    // 或本页没拿满一页，都说明到底了，直接收起按钮。
    const serverHasMore = data.hasMore ?? (loaded < (data.total || 0))
    sessionStore.setHasMore(groupId, serverHasMore && received >= SIDEBAR_PAGE_SIZE)
  } catch (error) {
    console.error(`加载分组 ${groupId} 更多会话失败:`, error)
  } finally {
    sessionGroupStore.setLoadingMore(null)
  }
}

// 友好格式化最后活跃时间
const updateTick = ref(0)
let tickTimer: ReturnType<typeof setInterval> | null = null

/**
 * 运行中会话的实时耗时（前端计算：现在 - 运行开始时间，每秒刷新）。
 *
 * 起点是 session store 里记录的运行开始时间（working 置 true 的那一刻），
 * 刷新页面后同步到后端流式态时会按同步时刻重建起点（近似值）。
 */
/** 耗时格式化：不足 1 小时为 M:SS，超过为 H:MM:SS */
const formatElapsedSeconds = (seconds: number): string => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m)
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

const formatWorkingElapsed = (sessionId: string): string => {
  // 读取 tick 让 Vue 将其视为响应式依赖，实现每秒刷新
  void updateTick.value
  const start = sessionStore.getWorkingStartAt(sessionId)
  const seconds = start == null ? 0 : Math.max(0, Math.floor((Date.now() - start) / 1000))
  return formatElapsedSeconds(seconds)
}

/** 最近一次完成的执行耗时（无记录返回空串） */
const formatLastRun = (sessionId: string): string => {
  const ms = sessionStore.getLastRunMs(sessionId)
  return ms == null ? '' : formatElapsedSeconds(Math.floor(ms / 1000))
}

const formatLastActive = (dateStr: string | null | undefined): string => {
  if (!dateStr) return ''
  // 读取 tick 让 Vue 将其视为响应式依赖，实现定时刷新
  void updateTick.value
  const now = Date.now()
  const diff = now - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}m`
  return t('ui.sidebar.earlier')
}

// 侧边栏每页条数（指定数量）：加载更多只在「超过该数量」时才显示。
const getSidebarPageSize = (): number => (window.innerHeight > 1080 ? 15 : 10)
const SIDEBAR_PAGE_SIZE = getSidebarPageSize()

// 侧边栏状态辅助方法
const getSessionUnread = (sessionId: string): boolean => {
  return sessionStore.getSidebarFlag(sessionId, 'unread')
}

const getSessionWorking = (sessionId: string): boolean => {
  return sessionStore.getSidebarFlag(sessionId, 'working')
}

// 选择会话
const selectSession = (session: any) => {
  // 进入会话时标记为已读
  sessionStore.setSidebarFlag(session.id, 'unread', false)
  router.replace({ name: 'Chat', params: { sessionId: session.id } })
}

// 处理导航点击
const handleNavClick = async (tab: string) => {
  if (tab === 'chat') {
    router.replace({ name: 'Chat', params: { sessionId: 'new-session' } })
  } else if (tab === 'characters') {
    router.replace({ name: 'Characters' })
  } else if (tab === 'tavern') {
    router.replace({ name: 'Tavern' })
  } else if (tab === 'bots') {
    router.replace({ name: 'Bots' })
  } else if (tab === 'setting') {
    router.replace({ name: 'SystemSettings' })
  } else if (tab === 'knowledge-base') {
    router.replace({ name: 'KnowledgeBase' })
  } else if (tab === 'plugins') {
    router.replace({ name: 'Plugins' })
  } else if (tab === 'scheduler') {
    router.replace({ name: 'Scheduler' })
  } else if (tab === 'image-generate') {
    router.replace({ name: 'ImageGenerate' })
  } else if (tab === 'face-search') {
    // 点击菜单时再等一次合并视图，避免侧栏首次加载未完成时误判为未配置
    await modelConfig.load()
    if (!modelConfig.faceReady) {
      toast.warning('人脸识别未启用：请先到「系统设置 → 默认模型 → 人脸识别」配置检测模型与特征模型')
      return
    }
    router.replace({ name: 'FaceSearch' })
  } else if (tab === 'image-search') {
    // 以图搜图同口径：点击时才拿最新配置，配置后不需要刷新页面
    await modelConfig.load()
    if (!modelConfig.imageReady) {
      toast.warning('以图搜图未启用：请先到「系统设置 → 默认模型 → 以图搜图」配置图像特征模型')
      return
    }
    router.replace({ name: 'ImageSearch' })
  } else if (tab === 'image-colorize') {
    // 同口径：点击时才拿最新配置，配置后不需要刷新页面
    await modelConfig.load()
    if (!modelConfig.colorizeReady) {
      toast.warning('图像上色未启用：请先到「系统设置 → 默认模型 → 图片识别」配置上色模型')
      return
    }
    router.replace({ name: 'ImageColorize' })
  } else if (tab === 'models') {
    router.replace({ name: 'Models' })
  } else if (tab === 'app-keys') {
    router.replace({ name: 'AppKeys' })
  } else if (tab === 'manufacturer-keys') {
    router.replace({ name: 'ManufacturerKeys' })
  } else if (tab === 'roles') {
    router.replace({ name: 'Roles' })
  } else if (tab === 'mcp') {
    router.replace({ name: 'Mcp' })
  } else if (tab === 'agents') {
    router.replace({ name: 'Agents' })
  } else if (tab === 'services') {
    router.replace({ name: 'Services' })
  } else if (tab === 'usage') {
    router.replace({ name: 'Usage' })
  } else if (tab === 'connectors') {
    router.replace({ name: 'Connectors' })
  } else if (tab === 'skills') {
    router.replace({ name: 'Skills' })
  } else if (tab === 'capabilities') {
    router.replace({ name: 'Capabilities', params: { pipeline: 'text-to-image' } })
  }
}

// 处理会话下拉菜单选择
const handleDropdownSelect = (command: string, session: any) => {
  if (command === 'rename') {
    handleRenameSession(session)
  } else if (command === 'move') {
    handleMoveSession(session)
  } else if (command === 'archive') {
    handleArchiveSession(session)
  } else if (command === 'delete') {
    handleDeleteSession(session)
  }
}

/**
 * 归档会话
 */
const handleArchiveSession = async (session: any) => {
  const confirmed = await confirm(t('ui.sidebar.archiveTitle'), t('ui.sidebar.archiveConfirm', { title: session.title }), {
    type: 'info',
    confirmText: t('ui.sidebar.archive'),
    cancelText: t('common.cancel')
  })
  if (!confirmed) return

  try {
    const result = await apiService.archiveSession(session.id, true)
    if (result.success) {
      // 从 sessionStore 中删除（不再展示在侧边栏）
      sessionStore.removeSession(session.id)
      sessionStore.clearSidebarState(session.id)
      // 如果归档的是当前会话，跳转到新建会话页面
      if (currentSessionId.value === session.id) {
        router.replace({ name: 'Chat', params: { sessionId: 'new-session' } })
      }
      toast.success(t('ui.sidebar.archived'))
    }
  } catch (error: any) {
    console.error('归档失败:', error)
    toast.error(error?.response?.data?.message || t('ui.sidebar.archiveFailed'))
  }
}

/**
 * 移动会话到分组
 */
const handleMoveSession = (session: any) => {
  // 构建分组选项，顺序与侧边栏一致
  const groupOptions = sessionGroupStore.groups.map(g => ({
    label: g.name,
    value: g.id
  }))
  groupOptions.push({ label: t('ui.sidebar.ungrouped'), value: UNGROUPED_ID })

  moveGroupOptions.value = groupOptions
  moveTargetSession.value = session
  moveSelectedGroupId.value = session.groupId || UNGROUPED_ID
  moveGroupDialogVisible.value = true
}

/**
 * 确认移动会话到分组
 */
const confirmMoveSession = async () => {
  try {
    const session = moveTargetSession.value
    if (!session) return

    const targetGroupId = moveSelectedGroupId.value
    const groupIdToSet = targetGroupId === UNGROUPED_ID ? null : targetGroupId

    // 调用API更新
    await apiService.updateSession(session.id, { groupId: groupIdToSet })

    // 更新统一数据源中的分组ID
    sessionStore.moveSession(session.id, groupIdToSet)

    toast.success(t('ui.sidebar.moved'))
    moveGroupDialogVisible.value = false
    moveTargetSession.value = null
  } catch (error) {
    console.error('移动会话失败:', error)
    toast.error(t('ui.sidebar.moveFailed'))
  }
}

/**
 * 重命名分组
 */
const handleRenameGroup = async (group: any) => {
  try {
    const result = await prompt(t('ui.sidebar.renameGroupTitle'), {
      placeholder: t('ui.sidebar.inputGroupName'),
      defaultValue: group.name
    })

    if (result && result !== group.name) {
      const success = await sessionGroupStore.updateGroup(group.id, result)
      if (success) {
        toast.success(t('ui.sidebar.groupRenamed'))
      }
    }
  } catch (error) {
    console.error('重命名分组失败:', error)
    toast.error(t('ui.sidebar.renameGroupFailed'))
  }
}

/**
 * 删除分组
 */
const handleDeleteGroup = async (group: any) => {
  try {
    const confirmed = await confirm(t('ui.sidebar.deleteGroupTitle'), t('ui.sidebar.deleteGroupConfirm', { name: group.name }), {
      type: 'warning',
      confirmText: t('common.delete'),
      cancelText: t('common.cancel')
    })

    if (confirmed) {
      // 将该分组下的所有会话移到未分组（统一数据源中批量更新）
      const sessionsToMove = sessionStore.getSessionsByGroup(group.id)
      for (const s of sessionsToMove) {
        s.groupId = null
      }

      // 删除分组
      const success = await sessionGroupStore.deleteGroup(group.id)
      if (success) {
        toast.success(t('ui.sidebar.groupDeleted'))
      }
    }
  } catch (error) {
    console.error('删除分组失败:', error)
    toast.error(t('ui.sidebar.deleteGroupFailed'))
  }
}

/**
 * 重命名会话
 * 显示输入新名称的提示框，更新会话标题
 */
const handleRenameSession = async (session: any) => {
  try {
    const result = await prompt(t('ui.sidebar.renameSessionTitle'), {
      placeholder: t('ui.sidebar.inputSessionName'),
      defaultValue: session.title
    })

    if (result) {
      const newTitle = result

      // 更新对话数据
      const updatedSession = {
        title: newTitle
      }

      // 调用 API 更新对话
      await apiService.updateSession(session.id, updatedSession)

      // 更新统一数据源中的标题
      sessionStore.updateSessionTitle(session.id, newTitle)

      toast.success(t('ui.sidebar.sessionRenamed'))
    }
  } catch (error) {
    console.error('重命名对话失败:', error)
    toast.error(t('ui.sidebar.renameSessionFailed'))
  }
}

/**
 * 删除会话
 * 显示确认删除的提示框，删除会话后从列表中移除
 */
const handleDeleteSession = async (session: any) => {
  // 显示自定义删除确认对话框
  deleteSessionData.value = session
  deleteWorkspaceChecked.value = false
  deleteDialogVisible.value = true
}

/**
 * 确认删除会话
 */
const confirmDeleteSession = async () => {
  try {
    const session = deleteSessionData.value
    if (!session) return

    // 如果勾选了删除工作目录，进行二次确认
    if (deleteWorkspaceChecked.value) {
      const secondConfirm = await ElMessageBox({
        title: t('ui.sidebar.importantWarning'),
        message: t('ui.sidebar.workspaceDeleteWarning'),
        type: 'error',
        showCancelButton: true,
        confirmButtonText: t('ui.sidebar.confirmDelete'),
        cancelButtonText: t('common.cancel'),
        distinguishCancelAndClose: true,
        customClass: 'workspace-delete-warning'
      }).then(() => true).catch(() => false)

      if (!secondConfirm) {
        // 用户取消了二次确认，不执行删除
        return
      }
    }

    // 传递 deleteWorkspace 参数
    await apiService.deleteSession(session.id, deleteWorkspaceChecked.value)

    // 如果删除的是当前会话，自动切换到相邻会话
    if (currentSessionId.value === session.id) {
      router.replace({ name: 'Chat', params: { sessionId: 'new-session' } })
    }
    sessionStore.removeSession(session.id)
    sessionStore.clearSidebarState(session.id)
    toast.success(t('ui.sidebar.sessionDeleted'))

    // 关闭对话框
    deleteDialogVisible.value = false
    deleteSessionData.value = null
  } catch (error) {
    console.error('删除对话失败:', error)
    toast.error(t('ui.sidebar.deleteSessionFailed'))
  }
}

// 处理用户菜单命令
const handleUserMenuCommand = (command: string) => {
  if (command === 'profile') {
    router.replace({ name: 'SystemSettings', params: { tab: 'profile' } })
  } else if (command === 'settings') {
    router.replace({ name: 'SystemSettings' })
  } else if (command === 'logout') {
    confirm(t('ui.sidebar.logoutTitle'), t('ui.sidebar.logoutConfirm'), {
      type: 'warning',
      confirmText: t('common.ok'),
      cancelText: t('common.cancel')
    }).then((confirmed) => {
      if (confirmed) {
        authStore.logout()
        router.replace({ name: 'Login' })
      }
    })
  }
}

// 初始化加载会话
watch(() => authStore.isAuthenticated, (isAuth) => {
  if (isAuth) {
    loadSessions()
  }
}, { immediate: true })

onMounted(() => {
  // 最后活跃时间每分钟刷新；运行中耗时每秒刷新（两者共用 updateTick）
  tickTimer = setInterval(() => {
    updateTick.value++
  }, 1_000)
})


// 组件卸载时清理
onUnmounted(() => {
  if (tickTimer !== null) {
    clearInterval(tickTimer)
    tickTimer = null
  }
})
</script>

<style scoped>
/* 令牌口径：本文件的 --color-* 多半是 refactor.css 里真实存在的令牌（明暗各一份），
   可以继续用；需要收敛的是手写半透明蒙版、魔法圆角与写死时长。
   遮罩渐变里的 rgba(0,0,0,.65) 是 mask 的「不透明度阶梯」，不是颜色，必须保留。 */

/* 会话项样式 */
.session-title {
  overflow: hidden;
  white-space: nowrap;
  /* 渐变遮罩自然淡出：fade 宽约半字符，紧贴右侧时间文本/按钮；mask 作用于自身 alpha，不依赖背景色，兼容壁纸/毛玻璃背景 */
  -webkit-mask-image: linear-gradient(to right,
    black 0%,
    black calc(100% - 6px),
    rgba(0, 0, 0, 0.65) calc(100% - 3px),
    transparent 100%);
  mask-image: linear-gradient(to right,
    black 0%,
    black calc(100% - 6px),
    rgba(0, 0, 0, 0.65) calc(100% - 3px),
    transparent 100%);
}

.session-item-inactive {
  color: var(--color-text);
}

.session-item-inactive:hover {
  background-color: var(--color-sidebar-bg-hover);
  color: var(--color-sidebar-text-hover);
}

.session-item-active {
  background-color: var(--color-sidebar-bg-active);
  color: var(--color-sidebar-text-active);
}


.session-actions {
  margin-left: auto;
}

/* 运行中会话：左侧旋转动画（与加载更多共用 Loading 图标） */
.working-spin {
  color: var(--el-color-primary);
  animation: working-rotate 1s linear infinite;
}

@keyframes working-rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.session-action-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  /* 原值 0.25rem（= 4px）→ xs 档 */
  border-radius: var(--el-radius-xs, 4px);
  cursor: pointer;
  transition: background-color var(--el-transition-duration-fast, 0.2s) ease;
}

/* 原值 rgba(0,0,0,.05) / 暗色下 #383a40 → 悬停底色令牌，两侧都由 refactor.css 给值 */
.session-action-trigger:hover {
  background-color: var(--el-fill-color-light);
}

/* 批量按钮的多选激活态：与 nav-item-active 同一套令牌，多选进行中一眼可见 */
.session-action-trigger.is-multi-active {
  background-color: var(--el-color-primary-light-9, var(--el-fill-color-light));
  color: var(--el-color-primary);
}

/* 菜单「未配置」徽标：人脸识别 / 以图搜图的模型没配齐时打在标签右侧。
   取告警语义色（而非主色）——它是「此功能暂不可用」的提示，不是选中态；
   尺寸压到 10px、与标签之间留 4px，不与 shortcut 的等宽字体混在一起。 */
.nav-item-badge {
  flex-shrink: 0;
  padding: 1px 5px;
  border-radius: 999px;
  font-size: 10px;
  line-height: 14px;
  font-weight: 600;
  color: var(--el-color-warning-dark-2, #b88230);
  background: var(--el-color-warning-light-8, #faecd8);
}

/* 空状态 */
.empty-state-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 滚动条样式 */
:deep(.el-scrollbar__bar) {
  opacity: 0.6;
  transition: opacity var(--el-transition-duration-fast, 0.2s);
}

:deep(.el-scrollbar__bar:hover) {
  opacity: 1;
}

/* 状态指示器样式 */
.status-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ===== 多选（批量删除）模式 ===== */
.ms-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  /* 不换行：flex-wrap 会先折行、根本不触发收缩，实测会从 50px 涨到 88px 两行。
     这里改成「计数可压缩 + 按钮恒定」，保证始终单行且不越界：
     空间不够时由「已选 N 项」省略号收尾，而不是把删除按钮顶出边框。 */
  margin: 0 8px 6px;
  padding: 8px 10px;
  /* 原值 12px → lg 档 */
  border-radius: var(--el-radius-lg, 12px);
  border: 1px solid color-mix(in srgb, var(--el-color-danger) 25%, var(--color-surface-border, transparent));
  background: var(--color-surface, transparent);
}
.ms-count {
  font-size: 12px;
  color: var(--color-text-gray);
  white-space: nowrap;
  /* 唯一允许被压缩的元素：空间不足时省略号收尾，而不是把按钮顶出边框 */
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* 两个操作按钮不参与压缩，「删除 (N)」再长也不变形 */
.ms-bar :deep(.el-button) { flex-shrink: 0; }
.ms-spacer { flex: 1 1 0; min-width: 0; }
.ms-row-check { pointer-events: none; }
.ms-row-check :deep(.el-checkbox__label) { display: none; }
.session-in-check { padding-left: 8px; }
.session-checked {
  background: color-mix(in srgb, var(--el-color-danger) 12%, transparent);
}

/* ============================================================================
   无障碍增强：给「可点但不可 Tab 聚焦」的非按钮元素补焦点环。
   模板里 div/span + @click 的可点元素（导航项、分组头、会话行、主题切换、
   设置入口、分组选择项）都没有 tabindex，本轮不改模板（结构不动），
   故这里只保证 :focus-visible 时视觉不缺失，键盘可达性属待办（见交付报告）。
   优先用 outline 而不是 box-shadow：侧边栏各项 hover 时会换底色，
   box-shadow 焦点环与 hover 态互斥会闪烁。
   ============================================================================ */
.nav-item:focus-visible,
.group-header:focus-visible,
.session-item:focus-visible,
.session-action-trigger:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: -2px;
}

/* 尊重系统「减少动态效果」偏好。
   注：nav-item / session-item / group-header 的过渡写在模板的 Tailwind 类上
   （transition-all / transition-colors + duration-200），与本文件的 scoped
   选择器同权重，媒体查询里再写一遍才能覆盖。 */
@media (prefers-reduced-motion: reduce) {
  .session-action-trigger,
  :deep(.el-scrollbar__bar) {
    transition: none;
  }

  .nav-item,
  .group-header,
  .session-item,
  .session-action-trigger {
    transition: none;
  }
}

/* ==================== 会话条目展开 ==================== */
.session-expand-btn {
  width: 16px;
  height: 16px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-text-disabled, #b8bcc5);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  transition: transform 0.18s ease, color 0.18s ease;
}
.session-expand-btn:hover {
  color: var(--color-text, #303133);
}
.session-expand-btn.is-open {
  transform: rotate(180deg);
}

.session-detail {
  margin: 2px 0 6px 26px;
  padding: 8px 10px;
  border-left: 2px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 0 6px 6px 0;
  background: var(--el-fill-color-light, #f5f7fa);
  font-size: 12px;
}
.session-detail-loading {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-text-gray, #909399);
}
.session-detail-section + .session-detail-section {
  margin-top: 8px;
}
.session-detail-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-gray, #909399);
  margin-bottom: 4px;
}
.session-detail-agent {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 0;
}
.agent-role {
  flex-shrink: 0;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
}
.agent-role.is-master {
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
}
.agent-role.is-sub {
  color: var(--el-color-info);
  background: var(--el-color-info-light-9);
}
.agent-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-text);
}
.agent-status {
  flex-shrink: 0;
  font-size: 10px;
  color: var(--color-text-disabled, #b8bcc5);
}
.agent-status.is-running {
  color: var(--el-color-primary);
}
.agent-status.is-done {
  color: var(--el-color-success);
}
.agent-status.is-error {
  color: var(--el-color-danger);
}

.session-detail-sub {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 0 3px 4px;
  cursor: pointer;
  border-radius: 4px;
}
.session-detail-sub:hover {
  background: var(--el-fill-color, #f0f2f5);
}
.sub-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-text);
}
.sub-time {
  flex-shrink: 0;
  font-size: 10px;
  color: var(--color-text-disabled, #b8bcc5);
}

.session-detail-msg {
  color: var(--color-text-gray, #909399);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.session-detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  color: var(--color-text-gray, #909399);
}

.session-detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
.detail-action {
  padding: 2px 8px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 4px;
  background: transparent;
  color: var(--color-text-gray, #606266);
  font-size: 11px;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
}
.detail-action:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}
.detail-action.is-danger:hover {
  border-color: var(--el-color-danger);
  color: var(--el-color-danger);
}
</style>