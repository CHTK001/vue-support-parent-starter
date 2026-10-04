<template>

  <!-- 输入区域 -->
  <div class="px-5 pb-2.5 w-full flex-1 flex flex-col items-center justify-center mb-20">
    <div class="w-full flex items-center justify-center mb-20">
      <div class="banner w-20 mb-4">
        <img :src="bannerPath" alt=""></img>
      </div>
      <h1 class="text-4xl mb-6 text-(--color-text) ml-5">
        <span class="typewriter-text">{{ displayedText }}</span>
        <span class="typewriter-cursor" :class="{ 'cursor-blink': isTypingComplete }"></span>
      </h1>
    </div>
    <!-- 已选角色 + 抽屉切换 -->
    <div class="w-full max-w-192 flex flex-col items-start mx-auto relative">
      <!-- 角色选择行 -->
      <div class="flex items-center justify-center gap-1.5 mb-4 text-sm text-(--color-text-gray) ml-4">
        <span>{{ t('chat.welcome.use') }}</span>
        <span v-if="currentCharacter"
          class="character-chip group cursor-pointer inline-flex items-center gap-1.5 px-2 py-0.5 rounded-(--size-dialog-rounded-radius) bg-(--color-surface) border border-(--color-surface-border) hover:bg-(--color-surface-hover) transition-colors"
          @click="goToCharacters">
          <Avatar :src="currentCharacter.avatarUrl" type="assistant" :name="currentCharacter.title"
            class="w-4 h-4 shrink-0 rounded overflow-hidden" />
          <span class="text-sm font-medium text-(--color-text)">{{ currentCharacter.title }}</span>
          <el-icon size="12"
            class="shrink-0 text-(--color-text-gray) group-hover:text-(--color-text) transition-colors">
            <ChevronRight24Regular />
          </el-icon>
        </span>
        <button v-else
          class="character-chip group cursor-pointer inline-flex items-center gap-1 px-2 py-0.5 rounded-(--size-dialog-rounded-radius) bg-(--color-surface) border border-(--color-surface-border) hover:bg-(--color-surface-hover) transition-colors"
          @click="goToCharacters">
          <el-icon size="14" class="text-(--color-text-gray) group-hover:text-(--color-text) transition-colors">
            <PersonAdd24Regular />
          </el-icon>
          <span class="text-sm font-medium text-(--color-text-gray) group-hover:text-(--color-text)">{{
            t('chat.welcome.selectCharacter') }}</span>
        </button>
        <span>{{ t('chat.welcome.startNewSession') }}</span>
      </div>
      <!-- 附加内容胶囊已并入 ChatInput 内部(与知识库标签同排),此处不再外置 -->
      <ChatInputToolbar :config="chatInputConfig" @config-change="handleConfigChange" />
      <div class="w-full relative z-30">
        <ChatInput v-model:value="inputMessage.content" :config="chatInputConfig" mode="create"
          :character-id="currentSession.characterId != null ? String(currentSession.characterId) : ''" @config-change="handleConfigChange"
          :buttons="chatInputButtons" :files="inputMessage.files" :streaming="false" @send="sendMessage" />
      </div>

    </div>
    <div>
      <!-- <div class="flex items-center justify-center mt-6">
        您也可以<span class="w-1"></span>
        <el-button type="primary" plain round @click="handleCreateSessionClick">直接创建会话
        </el-button>
      </div> -->
    </div>
  </div>

</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n()
import { useStorage } from "@vueuse/core"
import { apiService } from '@/services/ApiService';
import { usePopup } from "../../composables/usePopup";
import { useTitle } from "../../composables/useTitle";
import { useRouter, useRoute } from 'vue-router';
import { resolveBrandLogoLarge } from '@/utils/branding'
import { useWorkspaceStore } from '@/stores/workspace';
import { usePrefillInput } from '@/composables/usePrefillInput';
import { useSelectedCharacter } from '@/composables/useSelectedCharacter';
// 组件导入
import { ChatInput, Avatar } from "../ui";
import ChatInputToolbar from "./chat-input/ChatInputToolbar.vue";
import { ChevronRight24Regular, PersonAdd24Regular } from '@vicons/fluent'


// UI 组件导入
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core'

const breakpoints = useBreakpoints(breakpointsTailwind)

// 弹出层工具
const { notify } = usePopup();
const router = useRouter();
const route = useRoute();

// 响应式数据 - 类型化
const title = useTitle();

// 计算属性：Banner 图（取自 app.yaml 的 app.logoLargeUrl，内部已适配 Electron 资源前缀）
const bannerPath = computed(() => resolveBrandLogoLarge())

// 角色数据
const characters = ref<any[]>([]);

// 模型数据
const models = ref<any[]>([]);

// const lastSelectedModelId = useStorage('lastSelectedModelId', '');
const lastModelConfig = useStorage<any>('lastModelConfig', {});
const lastSelectedCharacterId = useStorage('lastSelectedCharacterId', '');

// 用户手动选择的模型 ID（刷新页面后从 localStorage 恢复）
const userSelectedModelId = useStorage<string | null>('userSelectedModelId', null);

// 新增：用户上次选择的思考强度（刷新页面后从 localStorage 恢复）
const userSelectedThinkingEffort = useStorage<string>('userSelectedThinkingEffort', 'none');

// 新增：用户选择的知识库 ID 列表（刷新页面后从 localStorage 恢复）
const userSelectedKnowledgeBaseIds = useStorage<string[]>('userSelectedKnowledgeBaseIds', []);

const inputMessage = ref({
  content: "",
  files: []
});

// 打字机效果相关状态
const fullText = t('chat.welcome.greeting');
const displayedText = ref('');
const isTypingComplete = ref(false);
let typeTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 启动打字机效果
 * 逐字显示文本，完成后启动光标闪烁
 */
const startTypewriter = (): void => {
  let index = 0;
  displayedText.value = '';
  isTypingComplete.value = false;

  const typeNextChar = (): void => {
    if (index < fullText.length) {
      displayedText.value += fullText[index];
      index++;
      // 随机延迟 80-150ms，模拟自然打字节奏
      const delay = 80 + Math.random() * 70;
      typeTimer = setTimeout(typeNextChar, delay);
    } else {
      isTypingComplete.value = true;
    }
  };

  typeNextChar();
};

/**
 * 清理打字机定时器
 */
const clearTypewriterTimer = (): void => {
  if (typeTimer) {
    clearTimeout(typeTimer);
    typeTimer = null;
  }
};

// 计算属性
const currentSession = ref<any>({
  characterId: null,  // 必须绑定角色
  model_id: null,
  mcpServerIds: '',  // MCP 服务器选择（仅管理员）
  avatar_url: null,
  title: t('chat.welcome.newSession'),
  workspacePath: null,  // 工作目录路径，默认为 null 使用系统默认目录
  settings: {
    referencedKbs: userSelectedKnowledgeBaseIds.value,
    modelName: null,
    thinkingEffort: userSelectedThinkingEffort.value,
    runMode: 'normal',
    maxTokensLimit: null
  }
})

// const currentModel = computed(() => {
//   if (currentSession.value.model_id) {
//     const model = models.value.find(model => model.id === currentSession.value.model_id)
//     return model
//   }
//   return null
// });



// 当前选中的角色
const currentCharacter = computed(() => {
  if (currentSession.value.characterId) {
    return characters.value.find(c => c.id === currentSession.value.characterId);
  }
  return null;
});

// 系统默认模型（系统设置 → 默认模型 → runtime/default_model）
const systemDefaultModelId = ref<string | null>(null);

// 模型是否在本地可用列表中
const isModelAvailable = (id: string | null | undefined): boolean =>
  !!id && models.value.some(m => m.id === id);

// 兜底选择：优先可用的 agnes 文本模型，其次第一个非图片模型，最后第一个模型
const fallbackModelId = (): string | null => {
  if (models.value.length === 0) return null;
  const agnes = models.value.find(m => m.model && /^agnes-(?!image)/.test(m.model));
  if (agnes) return agnes.id;
  const text = models.value.find(m => m.model && !/image/.test(m.model));
  return (text || models.value[0]).id;
};

// 自动模式统一解析：用户手选 → 角色默认 → 系统默认 → 智能兜底
const resolveAutoModelId = (): string | null => {
  if (isModelAvailable(userSelectedModelId.value)) return userSelectedModelId.value;
  if (isModelAvailable(currentCharacter.value?.model_id)) return currentCharacter.value.model_id;
  if (isModelAvailable(systemDefaultModelId.value)) return systemDefaultModelId.value;
  return fallbackModelId();
};

// 当前使用的模型 ID
const currentModelId = computed(() => resolveAutoModelId());

// 加载系统默认模型
const loadSystemDefaultModel = async (): Promise<void> => {
  try {
    const resp = await apiService.fetchGroupSettings('runtime');
    const data = (resp?.data || resp || {}) as Record<string, any>;
    const v = data.default_model;
    systemDefaultModelId.value = v ? String(v) : null;
  } catch (error) {
    systemDefaultModelId.value = null;
  }
};

// 标记是否正在初始化，避免 watch 重复处理
const isInitializing = ref(false);

// 监听角色变化，当角色切换时重置为角色默认模型
watch(() => currentSession.value.characterId, (newCharId, oldCharId) => {
  // 如果是初始化阶段，跳过处理（由 loadCharacters 直接设置）
  if (isInitializing.value) {
    return;
  }

  if (newCharId && newCharId !== oldCharId) {
    // 角色切换时，使用三级回退逻辑选择模型
    const newCharacter = characters.value.find(c => c.id === newCharId);
    if (newCharacter) {
      // 角色有推荐模型时清空用户手选，再统一解析
      if (newCharacter.model_id) {
        userSelectedModelId.value = null;
      }
      let selectedModelId: string | null = resolveAutoModelId();

      // 设置模型 ID
      if (selectedModelId) {
        currentSession.value.model_id = selectedModelId;
      }

      // 切换角色时，重置会话设置
      currentSession.value.settings = {
        ...(currentSession.value.settings || {}),
      };

      // 更新本地存储的配置信息
      if (selectedModelId) {
        lastModelConfig.value = {
          ...lastModelConfig.value,
          modelId: selectedModelId
        };
      }
    }
  }
});

// Props & Emits - 类型化
const props = defineProps<{
  session?: any;
}>();

// @ts-ignore - emit 类型定义
const emit = defineEmits<{
  'update:session': [session: any]
  'create-session': [sessionData: any, messageData?: any]
}>();


const chatInputButtons = computed(() => {
  return {
    tokensButton: false,
  }
})

// 加载模型列表
const loadModels = async (): Promise<void> => {
  try {
    const response = await apiService.fetchModels();
    // 提取所有启用的模型，并映射字段
    (response.items || []).forEach(provider => {
      const availableModels = provider.models?.filter((m: any) => m.enabled).map((m: any) => ({
        ...m,
        id: m.id,
        name: m.model
      })) || [];
      models.value.push(...availableModels);
    });
  } catch (error) {
    console.error('获取模型列表失败:', error);
    notify.error(t('common.error.loadFailed'), error);
  }
};

// 加载角色列表
const loadCharacters = async (): Promise<void> => {
  try {
    const response = await apiService.fetchCharacters();
    characters.value = response.items || [];

    // 优先使用上次选择的角色
    if (characters.value.length > 0) {
      // 设置初始化标志，防止 watch 干扰
      isInitializing.value = true;

      // 会话默认角色固定为内置「通用」角色（code=general-assistant，或名称含「通用」），
      // 不再跟随「上次选择」——否则默认会落到上一次用过的任意角色上。
      const savedCharacter = characters.value.find(c => String(c.id) === String(lastSelectedCharacterId.value));
      const genericCharacter = characters.value.find(c =>
        String(c.code || '').toLowerCase() === 'general-assistant'
        || /通用/.test(String(c.title || c.name || '')));
      const targetCharacter = genericCharacter || savedCharacter || characters.value[0];

      if (targetCharacter) {
        currentSession.value.characterId = targetCharacter.id;

        // 统一自动解析确定模型 ID
        let selectedModelId: string | null = resolveAutoModelId();

        // 设置模型 ID
        if (selectedModelId) {
          currentSession.value.model_id = selectedModelId;
        }

        // 设置会话配置
        currentSession.value.settings = {
          ...currentSession.value.settings,
        };

        // 同步更新 lastModelConfig，确保一致性
        if (selectedModelId) {
          lastModelConfig.value = {
            ...lastModelConfig.value,
            modelId: selectedModelId
          };
        }
      }

      // 初始化完成，恢复 watch 监听
      isInitializing.value = false;
    }
  } catch (error) {
    console.error('获取角色列表失败:', error);
    notify.error(t('common.error.loadFailed'), error);
    // 即使出错也要恢复标志
    isInitializing.value = false;
  }
};

// 选择角色（从抽屉中选择）
const handleCharacterSelect = (character: any): void => {
  currentSession.value.characterId = character.id;
  lastSelectedCharacterId.value = character.id;

  // 切换角色时统一解析模型
  if (character.model_id) {
    userSelectedModelId.value = null;
  }
  let selectedModelId: string | null = resolveAutoModelId();

  if (selectedModelId) {
    currentSession.value.model_id = selectedModelId;
  }

  currentSession.value.settings = {
    ...(currentSession.value.settings || {}),
  };

  if (selectedModelId) {
    lastModelConfig.value = {
      ...lastModelConfig.value,
      modelId: selectedModelId
    };
  }
};

const handleCharacterSelectById = (characterId: string): void => {
  const character = characters.value.find(c => c.id === characterId);
  if (character) handleCharacterSelect(character);
};

// 前往助手页面切换角色
const goToCharacters = (): void => {
  router.push({ name: 'Characters' });
};

// ========== ChatInput 配置管理 ==========

/**
 * ChatInput 组件的配置对象（计算属性）
 * 与 handleConfigChange 中的处理逻辑一一对应，方便对照维护
 */
const chatInputConfig = computed(() => ({
  // 模型 ID
  modelId: currentModelId.value,

  // 思考强度
  thinkingEffort: currentSession.value?.settings?.thinkingEffort || 'none',

  // Token 上限（会话级别独立配置）
  maxTokensLimit: currentSession.value?.settings?.maxTokensLimit ?? null,

  // 知识库 IDs
  knowledgeBaseIds: currentSession.value?.settings?.referencedKbs || [],

  // 运行模式
  runMode: currentSession.value?.settings?.runMode || 'normal',

  // 工作目录路径
  workspacePath: currentSession.value?.workspacePath || null,

  // 分组 ID
  groupId: currentSession.value?.groupId || null,

  // 附件
  attachments: currentSession.value?.settings?.attachments || {},

  // MCP 服务器选择（仅管理员，ChatInput 内部按管理员身份决定是否显示入口）
  mcpServerIds: currentSession.value?.mcpServerIds || '',

  // 角色级默认能力（深度思考 / 在线检索），进入会话即预置
  defaultThink: currentCharacter.value?.settings?.capabilities?.defaultThink === true,
  defaultSearch: currentCharacter.value?.settings?.capabilities?.defaultSearch === true,
}));

/**
 * 处理 ChatInput 配置变更
 * 与 chatInputConfig 计算属性中的字段一一对应
 */
const handleConfigChange = (config: any): void => {
  // 处理模型 ID 变更
  if (typeof config.modelId !== 'undefined') {
    currentSession.value.model_id = config.modelId;
    // 用户手动切换模型，保存到本地存储
    console.log('保存用户手动切换的模型:', config.modelId);
    userSelectedModelId.value = config.modelId;
  }

  // 处理思考强度变更
  if (typeof config.thinkingEffort !== 'undefined') {
    currentSession.value.settings.thinkingEffort = config.thinkingEffort;
    // 保存到 localStorage，实现持久化
    userSelectedThinkingEffort.value = config.thinkingEffort;
    console.log('保存 thinkingEffort 到会话和本地存储:', config.thinkingEffort);
  }

  // 处理 Token 上限（会话级别独立配置）
  if (typeof config.maxTokensLimit !== 'undefined') {
    currentSession.value.settings.maxTokensLimit = config.maxTokensLimit;
  }

  // 处理知识库选择
  if (typeof config.knowledgeBaseIds !== 'undefined') {
    currentSession.value.settings = { ...(currentSession.value.settings || {}), referencedKbs: config.knowledgeBaseIds };
    // 保存到 localStorage，实现持久化
    userSelectedKnowledgeBaseIds.value = config.knowledgeBaseIds;
    console.log('保存知识库选择到本地存储:', config.knowledgeBaseIds);
  }

  // 处理工作目录路径
  if (typeof config.workspacePath !== 'undefined') {
    currentSession.value.workspacePath = config.workspacePath;
    console.log('保存 workspacePath 到会话:', config.workspacePath);
  }

  // 处理运行模式变更
  if (typeof config.runMode !== 'undefined') {
    currentSession.value.settings.runMode = config.runMode;
    console.log('保存 runMode 到会话:', config.runMode);
  }

  // 处理分组选择
  if (typeof config.groupId !== 'undefined') {
    currentSession.value.groupId = config.groupId;
    console.log('保存 groupId 到会话:', config.groupId);
  }

  // 处理附件
  if (typeof config.attachments !== 'undefined') {
    if (!currentSession.value.settings) currentSession.value.settings = {};
    currentSession.value.settings.attachments = config.attachments;
  }

  // 处理 MCP 服务器选择（仅管理员可写）
  if (typeof config.mcpServerIds !== 'undefined') {
    currentSession.value.mcpServerIds = config.mcpServerIds;
  }
};

// 前往角色管理页面

const workspaceStore = useWorkspaceStore()
const { consumePrefill } = usePrefillInput()
const { consumeSelectedCharacter } = useSelectedCharacter()

onMounted(() => {
  title.value = t('chat.welcome.pageTitle');
  // 先加载模型列表、系统默认模型，再加载角色列表
  Promise.all([loadModels(), loadSystemDefaultModel(), loadCharacters()]).then(() => {
    // 角色列表加载完成后，检查是否有跨页面传递的预选角色
    const preSelectedId = consumeSelectedCharacter();
    if (preSelectedId) {
      const character = characters.value.find(c => String(c.id) === String(preSelectedId));
      if (character) {
        handleCharacterSelect(character);
      }
    }
  }).catch(error => {
    console.error('初始化数据失败:', error);
  });
  // 启动打字机效果
  startTypewriter();
  // 从 query 参数恢复分组预选
  const groupId = route.query.groupId;
  if (groupId && typeof groupId === 'string') {
    currentSession.value.groupId = groupId;
  }
  // 根据上次选择初始化工作目录
  initWorkspacePath()
  // 消费跨页面预填文本（如定时任务页"在对话中创建"）
  const prefill = consumePrefill()
  if (prefill) {
    inputMessage.value.content = prefill
  }
});

async function initWorkspacePath() {
  await workspaceStore.ensureBaseDir()
  const publicPath = workspaceStore.getPublicPath()
  const lastChoice = workspaceStore.getLastChoice()

  if (!lastChoice) {
    // 无记录 → 默认公共目录
    if (publicPath) {
      currentSession.value.workspacePath = publicPath
      workspaceStore.addRecent(publicPath)
    }
    return
  }

  if (lastChoice.mode === 'auto') {
    currentSession.value.workspacePath = null
    return
  }

  if (lastChoice.mode === 'public') {
    if (publicPath) {
      currentSession.value.workspacePath = publicPath
      workspaceStore.addRecent(publicPath)
    }
    return
  }

  if (lastChoice.mode === 'custom' && lastChoice.path) {
    // 检查路径是否仍在最近列表中
    if (workspaceStore.recentList.includes(lastChoice.path)) {
      currentSession.value.workspacePath = lastChoice.path
    } else {
      // 路径不在列表中 → 回退到公共目录
      if (publicPath) {
        currentSession.value.workspacePath = publicPath
        workspaceStore.addRecent(publicPath)
      }
    }
    return
  }

  // 兜底
  if (publicPath) {
    currentSession.value.workspacePath = publicPath
    workspaceStore.addRecent(publicPath)
  }
}

// 监听 groupId 查询参数变化（已在新建面板时点击其他分组的情况）
watch(() => route.query.groupId, (newGroupId) => {
  if (newGroupId && typeof newGroupId === 'string') {
    currentSession.value.groupId = newGroupId;
  } else {
    currentSession.value.groupId = null;
  }
});

onUnmounted(() => {
  clearTypewriterTimer();
});

const autoTitle = (content?: string): string => {
  const c = typeof content === 'string' ? content : inputMessage.value.content;
  if (c && c.trim().length > 0) {
    return c.trim().substring(0, 20);
  }
  return t('chat.welcome.newSession')
}

const sendMessage = async (payload?: any): Promise<void> => {
  if (!currentSession.value.characterId) {
    notify.error(t('common.createFailed'), t('chat.welcome.createFailedNoCharacter'));
    return;
  }
  // 优先使用 payload 中已剥离技能徽标的干净正文，避免 [/skill:...] 污染消息与标题
  const cleanContent = typeof payload?.content === 'string' ? payload.content : inputMessage.value.content;
  const skillNames = Array.isArray(payload?.skillNames) ? payload.skillNames : [];
  emit("create-session", {
    characterId: currentSession.value.characterId,
    modelId: currentModelId.value,
    mcpServerIds: currentSession.value.mcpServerIds || '',
    title: autoTitle(cleanContent),
    settings: currentSession.value.settings,
    workspacePath: currentSession.value.workspacePath || null,
    groupId: currentSession.value.groupId || null
  }, {
    content: cleanContent,
    files: inputMessage.value.files || [],
    knowledgeBaseIds: currentSession.value.settings?.referencedKbs || [],
    think: typeof payload?.think === 'boolean' ? payload.think : false,
    search: typeof payload?.search === 'boolean' ? payload.search : false,
    skillNames,
  });
}


// 设置操作

</script>

<style scoped>
/* 创建会话页：输入区域不透明，消除与工具栏负边距重叠时的半透明穿透 */
:deep(.input-area) {
  background: var(--color-input-bg) !important;
  backdrop-filter: none !important;
  backdrop-saturate: unset !important;
}

/* 打字机光标样式 */
.typewriter-cursor {
  display: inline-block;
  width: 3px;
  height: 1em;
  background-color: currentColor;
  margin-left: 2px;
  vertical-align: text-bottom;
  opacity: 1;
  position: relative;
  top: -4px;
}

/* 光标闪烁动画 */
.cursor-blink {
  animation: blink 1s step-end infinite;
}

@keyframes blink {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0;
  }
}
</style>
