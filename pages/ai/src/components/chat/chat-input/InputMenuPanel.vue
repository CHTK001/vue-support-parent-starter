<!--
  输入区统一弹层（用户需求 2026-11-12）。

  <p>「+」此前打开的是 CommandPicker：一份候选清单里混着附件入口与指令；
  MCP 又是另一个独立按钮 + 另一个小弹层，宽度 300px 居中在按钮上。
  用户的三条意见对应这里的三处改动：</p>
  1. 指令、附件、MCP 收敛到同一个面板，MCP 不再是独立按钮；
  2. 面板宽度与输入卡整宽对齐（CustomPopover 的 matchAnchorWidth），
     不再是「浮在某个图标下面的一条小菜单」；
  3. 打开不等网络：数据由 ChatInput 在挂载时预取，本组件只负责展示，
     加载中的分区显示占位而不是空白。

  <p>键盘：搜索框自动聚焦；Enter 执行当前可见的第一条指令；Esc 关闭（由
  CustomPopover 统一处理）。所有行都是 button，Tab 可达，可选态用主色勾。</p>
-->
<template>
  <CustomPopover :show="visible" @update:show="(value) => emit('update:visible', value)" :anchor-el="anchorEl"
    match-anchor-width align="start" :offset="10" :max-height="540">
    <div class="im">
      <!-- 搜索：一个面板一个入口，指令 / 附件 / MCP 一起过滤 -->
      <div class="im__search">
        <el-icon size="15" class="im__search-icon">
          <Search24Regular />
        </el-icon>
        <input ref="searchRef" v-model="keyword" type="text" class="im__search-input"
          :placeholder="t('chat.input.menuSearchPlaceholder')" @keydown.enter.prevent="runFirstCommand" />
        <button v-if="keyword" type="button" class="im__search-clear" :aria-label="t('chat.input.menuClearSearch')"
          :title="t('chat.input.menuClearSearch')" @click="keyword = ''">
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4.4 4.4l7.2 7.2M11.6 4.4l-7.2 7.2" fill="none" stroke="currentColor" stroke-width="1.5"
              stroke-linecap="round" />
          </svg>
        </button>
        <kbd class="im__kbd">Esc</kbd>
      </div>

      <div class="im__body">
        <!-- 指令：内置动作 + 后端下发的技能 / 工具命令 -->
        <section class="im__section">
          <header class="im__head">
            <span class="im__title">{{ t('chat.input.menuSectionCommands') }}</span>
            <span v-if="filteredCommands.length" class="im__count">{{ filteredCommands.length }}</span>
          </header>
          <div v-if="loading && !commands.length" class="im__state">{{ t('chat.input.menuLoading') }}</div>
          <div v-else-if="!filteredCommands.length" class="im__state">{{ t('chat.input.menuNoCommand') }}</div>
          <div v-else class="im__list">
            <button v-for="command in filteredCommands" :key="`${command.name}-${command.label || ''}`" type="button"
              class="im-row" @click="emit('select-command', command)">
              <span class="im-row__icon" :class="`is-${iconKind(command)}`">
                <svg class="im-row__glyph" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"
                  stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path :d="COMMAND_ICON_PATHS[iconKind(command)]" />
                </svg>
              </span>
              <span class="im-row__body">
                <span class="im-row__name">{{ command.label || command.name }}</span>
                <span v-if="command.description" class="im-row__desc">{{ command.description }}</span>
              </span>
              <span v-if="command.builtin" class="im-row__tag">{{ t('chat.input.menuBuiltin') }}</span>
            </button>
          </div>
        </section>

        <!-- 附件：本机图片 / 文件 + 知识库 + 插件注册的附加连接 -->
        <section class="im__section">
          <header class="im__head">
            <span class="im__title">{{ t('chat.input.menuSectionAttach') }}</span>
          </header>
          <div class="im__list">
            <button type="button" class="im-row" @click="emit('select-image')">
              <span class="im-row__icon is-image">
                <svg class="im-row__glyph" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"
                  stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path :d="COMMAND_ICON_PATHS.image" />
                </svg>
              </span>
              <span class="im-row__body">
                <span class="im-row__name">{{ t('chat.input.uploadImage') }}</span>
                <span class="im-row__desc">{{ t('chat.input.menuUploadImageDesc') }}</span>
              </span>
            </button>
            <button type="button" class="im-row" @click="emit('select-file')">
              <span class="im-row__icon is-file">
                <svg class="im-row__glyph" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"
                  stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path :d="COMMAND_ICON_PATHS.file" />
                </svg>
              </span>
              <span class="im-row__body">
                <span class="im-row__name">{{ t('chat.input.uploadFile') }}</span>
                <span class="im-row__desc">{{ t('chat.input.menuUploadFileDesc') }}</span>
              </span>
            </button>

            <template v-if="filteredKnowledgeBases.length">
              <div class="im__subhead">{{ t('chat.input.knowledgeBase') }}</div>
              <button v-for="kb in filteredKnowledgeBases" :key="`kb-${kb.id}`" type="button"
                class="im-row im-row--check" :class="{ 'is-checked': selectedKbIds.includes(kb.id) }"
                :aria-pressed="selectedKbIds.includes(kb.id)" @click="emit('toggle-kb', kb.id)">
                <span class="im-check" :class="{ 'is-on': selectedKbIds.includes(kb.id) }" aria-hidden="true">
                  <svg viewBox="0 0 16 16">
                    <path d="M3.6 8.4l2.8 2.8 6-6.4" fill="none" stroke="currentColor" stroke-width="1.8"
                      stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
                <span class="im-row__body">
                  <span class="im-row__name">{{ kb.name }}</span>
                  <span v-if="kb.description" class="im-row__desc">{{ kb.description }}</span>
                </span>
              </button>
            </template>

            <template v-for="type in filteredAttachmentTypes" :key="`type-${type.id}`">
              <div class="im__subhead">{{ type.label }}</div>
              <button v-for="item in type._items || []" :key="`${type.id}-${item.id}`" type="button"
                class="im-row im-row--check"
                :class="{ 'is-checked': (selectedAttachments[type.id] || []).includes(item.id) }"
                :aria-pressed="(selectedAttachments[type.id] || []).includes(item.id)"
                @click="emit('toggle-attachment', type.id, item.id)">
                <span class="im-check"
                  :class="{ 'is-on': (selectedAttachments[type.id] || []).includes(item.id) }" aria-hidden="true">
                  <svg viewBox="0 0 16 16">
                    <path d="M3.6 8.4l2.8 2.8 6-6.4" fill="none" stroke="currentColor" stroke-width="1.8"
                      stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
                <span class="im-row__body">
                  <span class="im-row__name">{{ item.name }}</span>
                  <span v-if="item.description" class="im-row__desc">{{ item.description }}</span>
                </span>
              </button>
            </template>

            <div v-if="!keyword && !knowledgeBases.length && !attachmentTypes.length"
              class="im__state im__state--inline">
              {{ t('chat.input.noKnowledgeBase') }}
            </div>
          </div>
        </section>

        <!-- MCP：从独立按钮收进同一个面板；勾选即写回会话配置 -->
        <section v-if="showMcp" class="im__section">
          <header class="im__head">
            <span class="im__title">{{ t('chat.input.menuSectionMcp') }}</span>
            <span v-if="mcpSelectedIds.length" class="im__count is-primary">{{ mcpSelectedIds.length }}</span>
            <button v-if="mcpSelectedIds.length" type="button" class="im__head-action" @click="emit('clear-mcp')">
              {{ t('chat.input.menuMcpClear') }}
            </button>
          </header>
          <div v-if="mcpLoading && !mcpServers.length" class="im__state">{{ t('chat.input.menuLoading') }}</div>
          <div v-else-if="!filteredMcpServers.length" class="im__state">{{ t('chat.input.menuMcpEmpty') }}</div>
          <div v-else class="im__list">
            <div class="im__hint">{{ t('chat.input.menuMcpHint') }}</div>
            <button v-for="server in filteredMcpServers" :key="server.mcp_server_id" type="button"
              class="im-row im-row--check" :class="{ 'is-checked': mcpSelectedIds.includes(server.mcp_server_id) }"
              :aria-pressed="mcpSelectedIds.includes(server.mcp_server_id)"
              @click="emit('toggle-mcp', server.mcp_server_id)">
              <span class="im-check" :class="{ 'is-on': mcpSelectedIds.includes(server.mcp_server_id) }"
                aria-hidden="true">
                <svg viewBox="0 0 16 16">
                  <path d="M3.6 8.4l2.8 2.8 6-6.4" fill="none" stroke="currentColor" stroke-width="1.8"
                    stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
              <span class="im-row__body">
                <span class="im-row__name">{{ server.name }}</span>
                <span class="im-row__desc im-row__desc--mono">{{ transportLabel(server.transport) }}</span>
              </span>
            </button>
          </div>
        </section>
      </div>

      <footer class="im__foot">
        <span class="im__foot-hint">{{ t('chat.input.menuHintEnter') }} · {{ t('chat.input.menuHintEsc') }}</span>
        <span v-if="mcpSelectedIds.length" class="im__foot-state">
          {{ t('chat.input.menuMcpSelected', { count: mcpSelectedIds.length }) }}
        </span>
      </footer>
    </div>
  </CustomPopover>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElIcon } from 'element-plus';
import { Search24Regular } from '@vicons/fluent';
import CustomPopover from '../../ui/CustomPopover.vue';
import { COMMAND_ICON_PATHS, resolveCommandIconKind } from './commandIcons';

const { t } = useI18n();

interface KnowledgeBaseOption {
  id: string;
  name: string;
  description?: string;
}

interface AttachmentTypeOption {
  id: string;
  label: string;
  icon?: string;
  pluginId?: string;
  _items?: Array<{ id: string; name: string; description?: string }>;
}

interface McpServerOption {
  mcp_server_id: string;
  name: string;
  transport?: any;
}

const props = defineProps<{
  visible: boolean;
  anchorEl: HTMLElement | null;
  /** 指令候选（内置动作 + 后端命令），打开时只读缓存，不阻塞 */
  commands: any[];
  /** 指令还在加载（首次打开且缓存为空） */
  loading?: boolean;
  knowledgeBases: KnowledgeBaseOption[];
  selectedKbIds: string[];
  attachmentTypes: AttachmentTypeOption[];
  selectedAttachments: Record<string, string[]>;
  /** 仅管理员可见 MCP 分区 */
  showMcp?: boolean;
  mcpServers: McpServerOption[];
  mcpLoading?: boolean;
  mcpSelectedIds: string[];
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  'select-command': [item: any];
  'select-image': [];
  'select-file': [];
  'toggle-kb': [kbId: string];
  'toggle-attachment': [typeId: string, itemId: string];
  'toggle-mcp': [serverId: string];
  'clear-mcp': [];
}>();

const iconKind = resolveCommandIconKind;

const searchRef = ref<HTMLInputElement | null>(null);
const keyword = ref('');

/** 打开即聚焦搜索框并清空上次输入；关闭时也清空，避免下次打开还带着过滤词 */
watch(() => props.visible, (visible) => {
  if (visible) {
    keyword.value = '';
    nextTick(() => searchRef.value?.focus());
  } else {
    keyword.value = '';
  }
});

const normalizedKeyword = computed(() => keyword.value.trim().toLowerCase());

/**
 * 是否命中检索词。
 *
 * @param fields 参与匹配的字段（名称 / 描述 / 传输方式）
 * @returns 无检索词时恒为 true
 */
function matches(...fields: Array<string | undefined>): boolean {
  const query = normalizedKeyword.value;
  if (!query) return true;
  return fields.some((field) => String(field || '').toLowerCase().includes(query));
}

const filteredCommands = computed(() =>
  (props.commands || []).filter((item: any) => matches(item?.label, item?.name, item?.description)),
);

const filteredKnowledgeBases = computed(() =>
  (props.knowledgeBases || []).filter((kb) => matches(kb.name, kb.description)),
);

/**
 * 附加连接按类型分组过滤：类型标题本身命中时保留组内全部条目，
 * 否则只留下条目名命中的项。标题与条目都不命中就整组隐藏。
 */
const filteredAttachmentTypes = computed(() => {
  const query = normalizedKeyword.value;
  return (props.attachmentTypes || [])
    .map((type) => {
      // 类型标题命中时保留组内全部条目；否则只留条目名命中的那些
      const typeHit = !!query && matches(type.label);
      const items = (type._items || []).filter(
        (item) => !query || typeHit || matches(item.name, item.description),
      );
      return { ...type, _items: items };
    })
    .filter((type) => (type._items || []).length > 0 || (!!query && matches(type.label)));
});

const filteredMcpServers = computed(() =>
  (props.mcpServers || []).filter((server) =>
    matches(server.name, transportLabel(server.transport)),
  ),
);

/**
 * MCP 传输方式的一行说明。
 *
 * @param transport 后端回传的 transport 配置
 * @returns 可读文本
 */
function transportLabel(transport: any): string {
  if (!transport) return t('chat.input.menuMcpNoTransport');
  if (transport.type === 'stdio') return `stdio · ${transport.command || ''}`;
  return `${String(transport.type || '').toUpperCase()} · ${transport.url || ''}`;
}

/** 搜索框回车：执行当前可见的第一条指令（与斜杠弹层的 Enter 口径一致） */
function runFirstCommand() {
  const first = filteredCommands.value[0];
  if (first) emit('select-command', first);
}
</script>

<style scoped>
/* 面板本体：宽度由 CustomPopover 跟随输入卡，这里只管内部排版。
   颜色全部走 --el-* 主题令牌，换肤自动跟随；不要写死 hex。 */
.im {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* ── 搜索行 ── */
.im__search {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 2px 2px 4px;
  padding: 0 8px;
  height: 34px;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-light);
}

.im__search-icon {
  flex: none;
  color: var(--el-text-color-secondary);
}

.im__search-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  line-height: 1.4;
  color: var(--el-text-color-primary);
}

.im__search-input::placeholder {
  color: var(--el-text-color-placeholder);
}

.im__search-input:focus-visible {
  box-shadow: none;
}

.im__search-clear {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  border-radius: var(--el-radius-full, 999px);
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
}

.im__search-clear:hover {
  background: var(--el-fill-color);
  color: var(--el-text-color-primary);
}

.im__search-clear svg {
  width: 12px;
  height: 12px;
}

.im__kbd {
  flex: none;
  padding: 0 5px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xs, 4px);
  background: var(--el-bg-color-overlay);
  color: var(--el-text-color-placeholder);
  font-family: inherit;
  font-size: 10px;
  line-height: 16px;
}

/* ── 分区：宽窗三列、窄窗自动落成两列 / 一列 ── */
.im__body {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(232px, 1fr));
  align-items: start;
  gap: 2px 12px;
  padding: 2px;
  min-width: 0;
}

.im__section {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* 列与列之间用极淡的竖线分层：三栏并排时没有它，标题会看起来是一整行 */
.im__section + .im__section {
  border-left: 1px solid var(--el-border-color-extra-light, var(--el-border-color-lighter));
  padding-left: 12px;
}

@media (max-width: 560px) {
  .im__section + .im__section {
    border-left: none;
    padding-left: 0;
    border-top: 1px solid var(--el-border-color-extra-light, var(--el-border-color-lighter));
    margin-top: 4px;
    padding-top: 4px;
  }
}

.im__head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px 2px;
  min-height: 22px;
}

.im__title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--el-text-color-secondary);
  user-select: none;
}

.im__count {
  min-width: 16px;
  padding: 0 5px;
  border-radius: var(--el-radius-full, 999px);
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  font-size: 10px;
  line-height: 15px;
  text-align: center;
}

.im__count.is-primary {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.im__head-action {
  margin-left: auto;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  cursor: pointer;
}

.im__head-action:hover {
  color: var(--el-color-primary);
}

.im__list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  max-height: 300px;
  overflow-y: auto;
  padding-bottom: 2px;
}

.im__subhead {
  padding: 6px 8px 2px;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--el-text-color-placeholder);
  user-select: none;
}

.im__hint {
  padding: 2px 8px 4px;
  font-size: 10.5px;
  line-height: 1.5;
  color: var(--el-text-color-placeholder);
}

.im__state {
  padding: 10px 8px 12px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.im__state--inline {
  padding-top: 4px;
}

/* ── 行 ── */
.im-row {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 6px 8px;
  border: none;
  border-radius: var(--el-radius-md, 8px);
  background: transparent;
  text-align: left;
  cursor: pointer;
  outline: none;
  transition: background-color var(--el-transition-duration-fast, 0.2s) ease;
}

.im-row:hover {
  background: var(--el-fill-color-light);
}

.im-row:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.im-row.is-checked {
  background: color-mix(in srgb, var(--el-color-primary) 7%, transparent);
}

.im-row__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  flex: none;
  border-radius: var(--el-radius-md, 8px);
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.im-row__glyph {
  width: 15px;
  height: 15px;
}

.im-row__icon.is-image {
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
}

.im-row__icon.is-knowledge {
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
}

.im-row__icon.is-model {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.im-row__icon.is-skill {
  color: var(--el-color-info);
  background: var(--el-color-info-light-9);
}

.im-row__icon.is-session {
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
}

.im-row__icon.is-compress {
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}

.im-row__body {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1;
}

.im-row__name {
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1.5;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.im-row__desc {
  font-size: 10.5px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.im-row__desc--mono {
  font-family: var(--font-mono, "SF Mono", Consolas, monospace);
}

.im-row__tag {
  flex: none;
  padding: 0 6px;
  border-radius: var(--el-radius-full, 999px);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 10px;
  line-height: 16px;
}

/* 多选项的勾：未选是空心环，选中是主色实底 + 白勾 */
.im-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex: none;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-xs, 4px);
  color: transparent;
  transition: background-color var(--el-transition-duration-fast, 0.2s) ease,
    border-color var(--el-transition-duration-fast, 0.2s) ease;
}

.im-check svg {
  width: 12px;
  height: 12px;
}

.im-check.is-on {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary);
  color: var(--el-color-white, #fff);
}

/* ── 页脚 ── */
.im__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
  padding: 6px 10px 2px;
  border-top: 1px solid var(--el-border-color-extra-light, var(--el-border-color-lighter));
  font-size: 10.5px;
  color: var(--el-text-color-placeholder);
}

.im__foot-state {
  color: var(--el-color-primary);
}

/* 滚动条：与列表同一套细条口径 */
.im__list::-webkit-scrollbar {
  width: 6px;
}

.im__list::-webkit-scrollbar-track {
  background: transparent;
}

.im__list::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: var(--el-radius-full, 9999px);
}

@media (prefers-reduced-motion: reduce) {
  .im-row,
  .im-check {
    transition: none;
  }
}
</style>
