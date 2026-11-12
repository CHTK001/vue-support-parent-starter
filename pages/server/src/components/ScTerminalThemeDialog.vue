<script setup lang="ts">
/**
 * 终端配色设置面板。
 *
 * <p>字符终端在 iframe 里跑（{@code /ssh-direct.html}、{@code /telnet-direct.html}），
 * 配色写死在页面里就只能改代码。这个面板做五件事：</p>
 *
 * <ul>
 *   <li>从后台读当前配色（{@code GET /ms/server/terminal/theme}），保存写回后台；</li>
 *   <li>21 个键逐个可调（取色器 + 十六进制手输），另有整套预设；</li>
 *   <li>把当前配色存成命名预设（{@code /terminal/theme/presets}），之后一键套用或删除；</li>
 *   <li>导入 / 导出 JSON，兼容 Windows Terminal 的 scheme 与 iTerm2 配色；</li>
 *   <li>边调边把配色 postMessage 给正在跑的终端 —— 预览区只是示意，
 *       真正的观感用下面那块「模拟输出」看。</li>
 * </ul>
 *
 * <p>配色是平台级配置（server 模块没有「当前登录人」上下文），
 * 换机器、换浏览器都一样生效。</p>
 *
 * @author CH
 * @since 4.0.0.57
 */
import { computed, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  ANSI_BRIGHT_KEYS,
  ANSI_KEYS,
  DEFAULT_TERMINAL_THEME,
  TERMINAL_THEME_KEYS,
  TERMINAL_THEME_PRESETS,
  deleteTerminalPreset,
  getTerminalTheme,
  isValidHexColor,
  listTerminalPresets,
  normalizeTerminalTheme,
  parseThemeJson,
  saveTerminalPreset,
  saveTerminalTheme,
  updateTerminalPreset,
  type TerminalTheme,
  type TerminalThemeKey,
  type TerminalThemePreset,
} from "../api/terminalTheme";

const props = defineProps<{
  /** 是否显示 */
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  /** 边调边预览：外层把它转发给正在运行的终端 */
  (e: "preview", theme: TerminalTheme): void;
  /** 已保存（或已恢复默认）：外层记录下来，下次打开终端直接用 */
  (e: "saved", theme: TerminalTheme): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit("update:modelValue", v),
});

/** 当前编辑中的配色 */
const draft = ref<TerminalTheme>({ ...DEFAULT_TERMINAL_THEME });
/** 首次读取中 */
const loading = ref(false);
/** 保存中 */
const saving = ref(false);

/** 后台保存的自定义预设 */
const customPresets = ref<TerminalThemePreset[]>([]);
/** 预设读写中（存/删），避免连点 */
const presetBusy = ref(false);
/** 导入面板是否展开 */
const importOpen = ref(false);
/** 导入面板里的 JSON 文本 */
const importText = ref("");

/**
 * 分组定义：界面色 / ANSI 标准色 / ANSI 明亮色。
 *
 * <p>顺序与后端校验白名单一致；key 原样显示在标签下方，方便对脚本、
 * 对 xterm 的 {@code ITheme} 字段。</p>
 */
const GROUPS: { title: string; hint: string; rows: { key: TerminalThemeKey; label: string }[] }[] = [
  {
    title: "界面",
    hint: "底色、文字、光标与选中区域",
    rows: [
      { key: "background", label: "终端底色" },
      { key: "foreground", label: "终端文字" },
      { key: "cursor", label: "光标" },
      { key: "cursorAccent", label: "光标下文字" },
      { key: "selectionBackground", label: "选中底色" },
    ],
  },
  {
    title: "标准色",
    hint: "ANSI 0-7",
    rows: [
      { key: "black", label: "黑" },
      { key: "red", label: "红" },
      { key: "green", label: "绿" },
      { key: "yellow", label: "黄" },
      { key: "blue", label: "蓝" },
      { key: "magenta", label: "品红" },
      { key: "cyan", label: "青" },
      { key: "white", label: "白" },
    ],
  },
  {
    title: "明亮色",
    hint: "ANSI 8-15",
    rows: [
      { key: "brightBlack", label: "亮黑" },
      { key: "brightRed", label: "亮红" },
      { key: "brightGreen", label: "亮绿" },
      { key: "brightYellow", label: "亮黄" },
      { key: "brightBlue", label: "亮蓝" },
      { key: "brightMagenta", label: "亮品红" },
      { key: "brightCyan", label: "亮青" },
      { key: "brightWhite", label: "亮白" },
    ],
  },
];

/** 预览里那行 16 色小样 */
const PREVIEW_ANSI: TerminalThemeKey[] = [...ANSI_KEYS, ...ANSI_BRIGHT_KEYS];

/** 当前配色命中的预设（都命中不了就是「自定义」） */
const activePresetId = computed(() => {
  const hit = TERMINAL_THEME_PRESETS.find(p =>
    PREVIEW_ANSI.every(k => p.theme[k] === draft.value[k])
    && p.theme.background === draft.value.background
    && p.theme.foreground === draft.value.foreground
    && p.theme.cursor === draft.value.cursor
    && p.theme.cursorAccent === draft.value.cursorAccent
    && p.theme.selectionBackground === draft.value.selectionBackground);
  return hit?.id ?? "";
});

/**
 * 打开面板时重新读一次后台配色（可能刚被另一台机器改过）。
 */
async function reload(): Promise<void> {
  loading.value = true;
  try {
    draft.value = await getTerminalTheme();
  } catch (e) {
    // 接口挂了也要能用：退回默认配色，用户改完保存时会再报一次真实错误
    draft.value = { ...DEFAULT_TERMINAL_THEME };
    ElMessage.warning(`读取终端配色失败，已用默认配色：${(e as Error).message}`);
  } finally {
    loading.value = false;
  }
  void loadPresets();
}

/**
 * 读自定义预设。失败时留空：预设读不到不影响改色与保存。
 */
async function loadPresets(): Promise<void> {
  try {
    customPresets.value = await listTerminalPresets();
  } catch {
    customPresets.value = [];
  }
}

watch(
  () => props.modelValue,
  v => {
    if (v) void reload();
  },
  { immediate: true },
);

/**
 * 边改边把配色推给正在跑的终端（父组件转发 postMessage）。
 */
watch(
  draft,
  v => {
    if (!props.modelValue) return;
    emit("preview", { ...v });
  },
  { deep: true },
);

/**
 * 套用整套预设。
 *
 * @param theme 预设配色
 */
function applyPreset(theme: TerminalTheme): void {
  draft.value = { ...theme };
}

/**
 * 两套配色是否逐键相同（用于标识「当前命中哪个预设」）。
 *
 * @param a 配色一
 * @param b 配色二
 * @returns 完全相同返回 true
 */
function sameTheme(a: TerminalTheme, b: TerminalTheme): boolean {
  return TERMINAL_THEME_KEYS.every(k => a[k] === b[k]);
}

/** 当前配色的可读名字（命中内置预设就取它的名字，否则叫自定义配色），用作存预设时的默认名 */
function currentName(): string {
  const hit = TERMINAL_THEME_PRESETS.find(p => p.id === activePresetId.value);
  return hit ? hit.name : "自定义配色";
}

/**
 * 存为预设：把当前草稿写进后台，之后换机器、换浏览器都能一键套用。
 */
async function onSavePreset(): Promise<void> {
  let name = "";
  try {
    const res = await ElMessageBox.prompt("给这套配色起个名字，之后可在预设里一键套用", "存为预设", {
      inputValue: currentName(),
      inputPlaceholder: "例如：我的深色 / 生产环境",
      inputValidator: (v: string) => (v && v.trim() ? true : "名称不能为空"),
      confirmButtonText: "保存",
      cancelButtonText: "取消",
    });
    name = String(res.value ?? "").trim();
  } catch {
    return;
  }
  if (!name) return;
  presetBusy.value = true;
  try {
    const created = await saveTerminalPreset(name, draft.value);
    customPresets.value = [...customPresets.value, created];
    ElMessage.success(`已存为预设「${created.name}」`);
  } catch (e) {
    ElMessage.error(`存预设失败：${(e as Error).message}`);
  } finally {
    presetBusy.value = false;
  }
}

/**
 * 更新一套预设：改名 + 用当前草稿覆盖它的颜色。
 *
 * <p>改名与覆盖合成一个动作：用户想改的通常就是「这套预设现在应该是这样」，
 * 分开做只会多一次点击；确认文案里会写清两件事都会发生。</p>
 *
 * @param preset 要更新的预设
 */
async function onUpdatePreset(preset: TerminalThemePreset): Promise<void> {
  let name = "";
  try {
    const res = await ElMessageBox.prompt(
      `「${preset.name}」将改名为下面的名字，并用当前配色覆盖它的颜色`,
      "更新预设",
      {
        inputValue: preset.name,
        inputPlaceholder: "预设名称",
        inputValidator: (v: string) => (v && v.trim() ? true : "名称不能为空"),
        confirmButtonText: "更新",
        cancelButtonText: "取消",
      },
    );
    name = String(res.value ?? "").trim();
  } catch {
    return;
  }
  if (!name) return;
  presetBusy.value = true;
  try {
    const updated = await updateTerminalPreset(preset.id, name, draft.value);
    customPresets.value = customPresets.value.map(p => (p.id === updated.id ? updated : p));
    ElMessage.success(`预设已更新为「${updated.name}」`);
  } catch (e) {
    ElMessage.error(`更新预设失败：${(e as Error).message}`);
  } finally {
    presetBusy.value = false;
  }
}

/**
 * 删除一套自定义预设（只删预设，当前生效配色不受影响）。
 *
 * @param preset 要删的预设
 */
async function onDeletePreset(preset: TerminalThemePreset): Promise<void> {
  try {
    await ElMessageBox.confirm(
      `删除预设「${preset.name}」？当前保存的配色不受影响。`,
      "删除预设",
      { confirmButtonText: "删除", cancelButtonText: "取消", type: "warning" },
    );
  } catch {
    return;
  }
  try {
    await deleteTerminalPreset(preset.id);
    customPresets.value = customPresets.value.filter(p => p.id !== preset.id);
    ElMessage.success("预设已删除");
  } catch (e) {
    ElMessage.error(`删除失败：${(e as Error).message}`);
  }
}

/**
 * 导出：把当前配色复制成 JSON，方便贴到别的机器或存进文档。
 */
async function onExport(): Promise<void> {
  const json = JSON.stringify(normalizeTerminalTheme(draft.value), null, 2);
  try {
    await navigator.clipboard.writeText(json);
    ElMessage.success("配色 JSON 已复制到剪贴板");
  } catch {
    // 非安全上下文（http 域名）时 clipboard 不可用：弹出来让人手动复制
    await ElMessageBox.alert(json, "配色 JSON（手动复制）", { confirmButtonText: "关闭" })
      .catch(() => undefined);
  }
}

/**
 * 应用导入的 JSON：只覆盖能识别的颜色键，其余保持当前草稿。
 */
function onApplyImport(): void {
  try {
    const picked = parseThemeJson(importText.value);
    draft.value = { ...draft.value, ...picked };
    importOpen.value = false;
    importText.value = "";
    ElMessage.success(`已导入 ${Object.keys(picked).length} 个颜色，点「保存」后生效`);
  } catch (e) {
    ElMessage.error(`导入失败：${(e as Error).message}`);
  }
}

/**
 * 取色器回写。
 *
 * <p>不用 {@code v-model}：ElColorPicker 的 {@code update:modelValue} 类型是
 * {@code string | null}（点「清空」时给 null），直接 v-model 到一个
 * {@code Record<..., string>} 的字段上会被 vue-tsc 判成 string|null 不可赋值。
 * 清空（null）保持原色不变，宁可不清也不留一个空色值给后端。</p>
 *
 * @param key 颜色键
 * @param value 取色器给的颜色（可能为 null）
 */
function onPick(key: TerminalThemeKey, value: string | null): void {
  if (!value || !isValidHexColor(value)) return;
  draft.value = { ...draft.value, [key]: value.toLowerCase() };
}

/**
 * 手输十六进制颜色：合法才写回，否则提示并保持原值。
 *
 * @param key 颜色键
 * @param event 输入事件
 */
function onHexInput(key: TerminalThemeKey, event: Event): void {
  const input = event.target as HTMLInputElement;
  const value = input.value.trim();
  if (!isValidHexColor(value)) {
    ElMessage.warning(`颜色格式不对：${value || "(空)"}（只接受 #rgb / #rrggbb / #rrggbbaa）`);
    input.value = draft.value[key];
    return;
  }
  draft.value = { ...draft.value, [key]: value.toLowerCase() };
}

/**
 * 恢复默认配色：只把草稿重置成默认值，点「保存」才写回后台。
 *
 * <p>以前这里直接调 {@code POST /reset} 落库并立即生效：一次误点就把手工调好的
 * 21 个颜色全部覆盖，而且「取消」也救不回来（库里已经是默认值了）。改成草稿语义后
 * 它和其它改动一致：取消 = 放弃，保存 = 生效。</p>
 */
function onReset(): void {
  draft.value = { ...DEFAULT_TERMINAL_THEME };
  ElMessage.info("已重置为默认配色，点「保存」后生效");
}

/**
 * 保存配色。
 */
async function onSave(): Promise<void> {
  saving.value = true;
  try {
    const theme = await saveTerminalTheme(draft.value);
    draft.value = { ...theme };
    emit("saved", { ...normalizeTerminalTheme(theme) });
    visible.value = false;
    ElMessage.success("终端配色已保存");
  } catch (e) {
    ElMessage.error(`保存失败：${(e as Error).message}`);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <ReDialog v-model="visible" title="终端配色" width="760px" append-to-body>
    <div class="tt-body">
      <!-- 预设与搬家：存一套自己的配色、导进来、导出去 -->
      <div class="tt-tools">
        <button type="button" class="tt-btn" :disabled="loading || presetBusy" @click="onSavePreset">
          存为预设
        </button>
        <button type="button" class="tt-btn" :disabled="loading" @click="importOpen = !importOpen">
          {{ importOpen ? "收起导入" : "导入" }}
        </button>
        <button type="button" class="tt-btn" :disabled="loading" @click="onExport">导出</button>
        <span class="tt-tools-hint">预设与配色都存后台，换机器也还在</span>
      </div>

      <!-- 导入：本页导出的 JSON、Windows Terminal 的 scheme 都能贴；iTerm2 的 plist 会被明确拒绝 -->
      <div v-if="importOpen" class="tt-import">
        <textarea
          v-model="importText"
          class="tt-import-box"
          spellcheck="false"
          placeholder="粘贴配色 JSON：background / foreground / black…brightWhite（Windows Terminal 的 cursorColor 也认）；iTerm2 的 .itermcolors 是 XML，需先转 JSON"
        />
        <div class="tt-import-foot">
          <span class="tt-tools-hint">只覆盖能识别的颜色键，其余保持当前值</span>
          <span class="tt-foot-spacer" />
          <button type="button" class="tt-btn" @click="importOpen = false; importText = ''">取消</button>
          <button type="button" class="tt-btn tt-btn--primary" @click="onApplyImport">应用</button>
        </div>
      </div>

      <!-- 预设：先给一个体面的起点，再逐色微调 -->
      <div class="tt-presets">
        <button
          v-for="p in TERMINAL_THEME_PRESETS"
          :key="p.id"
          type="button"
          class="tt-preset"
          :class="{ 'is-active': activePresetId === p.id }"
          :style="{ background: p.theme.background, color: p.theme.foreground }"
          :title="`套用预设：${p.name}`"
          @click="applyPreset(p.theme)"
        >
          <span class="tt-preset-name">{{ p.name }}</span>
          <span class="tt-preset-dots">
            <i :style="{ background: p.theme.red }" />
            <i :style="{ background: p.theme.green }" />
            <i :style="{ background: p.theme.yellow }" />
            <i :style="{ background: p.theme.blue }" />
          </span>
        </button>
        <!-- 自己存的预设：和内置预设同一排，点即套用，× 删除 -->
        <button
          v-for="p in customPresets"
          :key="p.id"
          type="button"
          class="tt-preset is-custom"
          :class="{ 'is-active': sameTheme(p.theme, draft) }"
          :style="{ background: p.theme.background, color: p.theme.foreground }"
          :title="`套用预设：${p.name}`"
          @click="applyPreset(p.theme)"
        >
          <span class="tt-preset-name">{{ p.name }}</span>
          <span class="tt-preset-dots">
            <i :style="{ background: p.theme.red }" />
            <i :style="{ background: p.theme.green }" />
            <i :style="{ background: p.theme.yellow }" />
          </span>
          <span class="tt-preset-op" title="改名并用当前配色覆盖" @click.stop="onUpdatePreset(p)">✎</span>
          <span class="tt-preset-op" title="删除该预设" @click.stop="onDeletePreset(p)">×</span>
        </button>
        <span v-if="!activePresetId && !customPresets.some(p => sameTheme(p.theme, draft))" class="tt-preset-custom">自定义</span>
      </div>

      <div v-if="loading" class="tt-loading">正在读取后台配色…</div>

      <!-- 真实观感：用当前配色渲染一段假输出，含 16 色、选区与光标 -->
      <div
        class="tt-preview"
        :style="{ background: draft.background, color: draft.foreground, opacity: loading ? 0.5 : 1 }"
        aria-label="配色预览"
      >
        <div class="tt-line">
          <span :style="{ color: draft.green }">admin@web-01</span>:<span :style="{ color: draft.blue }">~/app</span>$
          ls --color=auto
        </div>
        <div class="tt-line tt-swatches">
          <span v-for="k in PREVIEW_ANSI" :key="k" :style="{ color: draft[k] }" :title="k">Aa</span>
        </div>
        <div class="tt-line">
          总计 32K
          <span :style="{ background: draft.selectionBackground, color: draft.foreground }">drwxr-xr-x</span>
          <span class="tt-cursor" :style="{ background: draft.cursor, color: draft.cursorAccent }">_</span>
        </div>
      </div>

      <!-- 逐色编辑：界面色 / 标准色 / 明亮色 -->
      <div v-for="group in GROUPS" :key="group.title" class="tt-group">
        <div class="tt-group-head">
          <span class="tt-group-title">{{ group.title }}</span>
          <span class="tt-group-hint">{{ group.hint }}</span>
        </div>
        <div class="tt-rows">
          <div v-for="row in group.rows" :key="row.key" class="tt-row">
            <span class="tt-row-label">
              <span class="tt-row-name">{{ row.label }}</span>
              <code class="tt-row-key">{{ row.key }}</code>
            </span>
            <el-color-picker
              :model-value="draft[row.key]"
              size="small"
              @update:model-value="(v: string | null) => onPick(row.key, v)"
            />
            <input
              class="tt-hex"
              type="text"
              spellcheck="false"
              maxlength="9"
              :value="draft[row.key]"
              :aria-label="`${row.label} 十六进制值`"
              @change="onHexInput(row.key, $event)"
            />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="tt-foot">
        <button type="button" class="tt-btn" :disabled="saving || loading"
                title="把配色重置为默认值，点「保存」后才写回后台"
                @click="onReset">恢复默认</button>
        <span class="tt-foot-spacer" />
        <button type="button" class="tt-btn" :disabled="saving" @click="visible = false">取消</button>
        <button type="button" class="tt-btn tt-btn--primary" :disabled="saving || loading" @click="onSave">
          {{ saving ? "保存中…" : "保存" }}
        </button>
      </div>
    </template>
  </ReDialog>
</template>

<style scoped>
.tt-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ===== 预设 ===== */
.tt-presets {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.tt-preset {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xs, 4px);
  font-size: 12px;
  cursor: pointer;
  outline: none;
  transition: border-color var(--el-transition-duration-fast, 0.2s) ease;
}
.tt-preset.is-active {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-primary) 18%, transparent);
}
.tt-preset:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.tt-preset-dots {
  display: inline-flex;
  gap: 3px;
}
.tt-preset-dots i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.tt-preset-custom {
  font-size: 11.5px;
  color: var(--p-text-3, var(--el-text-color-placeholder));
}
.tt-preset.is-custom {
  padding-right: 6px;
}
.tt-preset-op {
  display: inline-grid;
  place-items: center;
  width: 16px;
  height: 16px;
  margin-left: 2px;
  border-radius: 50%;
  font-size: 12px;
  line-height: 1;
  opacity: 0.55;
  cursor: pointer;
}
.tt-preset-op:hover {
  opacity: 1;
  background: color-mix(in srgb, currentColor 18%, transparent);
}

/* ===== 工具条（存预设 / 导入 / 导出） ===== */
.tt-tools {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.tt-tools-hint {
  font-size: 11px;
  color: var(--p-text-3, var(--el-text-color-placeholder));
}

/* ===== 导入面板 ===== */
.tt-import {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-lighter, transparent);
}
.tt-import-box {
  width: 100%;
  min-height: 96px;
  padding: 8px;
  font: 12px/1.5 Consolas, Menlo, monospace;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-blank, transparent);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xs, 4px);
  outline: none;
  resize: vertical;
}
.tt-import-box:focus {
  border-color: var(--el-color-primary);
}
.tt-import-foot {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ===== 预览 ===== */
.tt-preview {
  padding: 10px 12px;
  border-radius: var(--el-radius-md, 8px);
  border: 1px solid var(--el-border-color-lighter);
  font: 12.5px/1.7 Consolas, Menlo, "Courier New", monospace;
  transition: opacity var(--el-transition-duration-fast, 0.2s) ease;
  overflow: hidden;
}
.tt-line {
  white-space: pre-wrap;
  word-break: break-all;
}
.tt-swatches {
  display: flex;
  gap: 6px;
  margin: 2px 0;
  font-weight: 600;
}
.tt-cursor {
  margin-left: 2px;
  padding: 0 1px;
}

/* ===== 分组与逐色行 ===== */
.tt-group-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 6px;
}
.tt-group-title {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--p-text-1, var(--el-text-color-primary));
}
.tt-group-hint {
  font-size: 11px;
  color: var(--p-text-3, var(--el-text-color-secondary));
}
.tt-rows {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(228px, 1fr));
  gap: 6px 14px;
}
.tt-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.tt-row-label {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}
.tt-row-name {
  font-size: 12px;
  color: var(--p-text-2, var(--el-text-color-regular));
}
.tt-row-key {
  font: 10.5px/1.3 Consolas, Menlo, monospace;
  color: var(--p-text-3, var(--el-text-color-placeholder));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tt-hex {
  width: 82px;
  padding: 3px 6px;
  font: 12px/1.4 Consolas, Menlo, monospace;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-blank, transparent);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xs, 4px);
  outline: none;
}
.tt-hex:focus {
  border-color: var(--el-color-primary);
}

.tt-loading {
  font-size: 12px;
  color: var(--p-text-3, var(--el-text-color-secondary));
}

/* ===== 底部按钮 ===== */
.tt-foot {
  display: flex;
  align-items: center;
  gap: 8px;
}
.tt-foot-spacer {
  flex: 1;
}
.tt-btn {
  padding: 5px 14px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: transparent;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xs, 4px);
  cursor: pointer;
  outline: none;
  transition:
    color var(--el-transition-duration-fast, 0.2s) ease,
    border-color var(--el-transition-duration-fast, 0.2s) ease,
    background-color var(--el-transition-duration-fast, 0.2s) ease;
}
.tt-btn:hover:not(:disabled) {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
}
.tt-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.tt-btn:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.tt-btn--primary {
  color: var(--el-color-white);
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
}
.tt-btn--primary:hover:not(:disabled) {
  color: var(--el-color-white);
  background: var(--el-color-primary-light-3);
  border-color: var(--el-color-primary-light-3);
}

@media (prefers-reduced-motion: reduce) {
  .tt-btn,
  .tt-preset,
  .tt-preview {
    transition: none;
  }
}
</style>
