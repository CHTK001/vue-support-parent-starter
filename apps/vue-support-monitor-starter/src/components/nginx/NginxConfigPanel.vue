<template>
  <div class="ngc">
    <div class="ngc-body">
      <!-- 左：配置文件列表 -->
      <aside class="ngc-side">
        <div class="ngc-side-head">
          <span>配置文件</span>
          <ReButton size="small" text :loading="filesLoading" @click="loadFiles">
            <template #icon><ReIcon name="Refresh" :size="12" /></template>
          </ReButton>
        </div>
        <div class="ngc-side-body">
          <div
            v-for="f in files"
            :key="f.path"
            class="ngc-file"
            :class="{ active: f.path === currentPath }"
            :title="f.path"
            @click="openFile(f.path)"
          >
            <ReIcon name="Document" :size="13" />
            <span class="ngc-filename">{{ shortName(f.path) }}</span>
            <span class="ngc-filedir">{{ shortDir(f.path) }}</span>
          </div>
          <ReEmptyState v-if="!files.length && !filesLoading" description="未发现 .conf 文件" />
        </div>
      </aside>

      <!-- 右：编辑区 -->
      <section class="ngc-main">
        <div class="ngc-bar">
          <span class="ngc-path mono" :title="currentPath">{{ currentPath || "请选择左侧配置文件" }}</span>
          <ReRadioGroup v-model="mode" size="small">
            <ReRadioButton value="FILE">文件模式</ReRadioButton>
            <ReRadioButton value="MODEL">表单模式</ReRadioButton>
          </ReRadioGroup>
        </div>

        <ReAlert
          v-if="mode === 'MODEL'"
          type="info"
          :title="modelHint"
          class="ngc-alert"
        />

        <div v-if="warnings.length" class="ngc-warns">
          <ReAlert
            v-for="(w, i) in warnings"
            :key="i"
            type="warning"
            :title="w"
          />
        </div>

        <!-- 文件模式 -->
        <div v-show="mode === 'FILE'" class="ngc-editor" v-loading="loading">
          <div class="ngc-gutter">
            <div v-for="n in lineCount" :key="n" class="ngc-lineno">{{ n }}</div>
          </div>
          <textarea
            v-model="content"
            class="ngc-textarea"
            spellcheck="false"
            placeholder="选择左侧配置文件后在此编辑"
            @input="markDirty"
          />
        </div>

        <!-- 表单模式 -->
        <div v-show="mode === 'MODEL'" class="ngc-model" v-loading="loading">
          <NginxModelForm
            v-if="parsed"
            :key="formKey"
            :node="parsed.root"
            :metas="metas"
            :show-help="showHelp"
            :patched-ids="patchedIds"
            :focus-id="focusNodePath"
            @patch="onPatch"
            @remove="onRemove"
            @add-directive="openAdd('directive', $event)"
            @add-block="openAdd('block', $event)"
          />
          <ReEmptyState v-else description="请先选择配置文件" />
        </div>

        <!-- 底部操作条 -->
        <div class="ngc-foot">
          <div class="ngc-opts">
            <ReSwitch v-model="optBackup" size="small" />
            <span class="ngc-opt-label">保存前备份</span>
            <ReSwitch v-model="optValidate" size="small" />
            <span class="ngc-opt-label">保存后自动校验</span>
            <ReSwitch v-model="optReload" size="small" />
            <span class="ngc-opt-label">校验通过后自动重载</span>
          </div>
          <div class="ngc-ops">
            <ReTag v-if="patchCount" size="small" type="warning">{{ patchCount }} 处改动</ReTag>
            <ReButton size="small" :disabled="!hasChange" :loading="previewing" @click="doPreview">
              <template #icon><ReIcon name="View" :size="13" /></template>
              预览
            </ReButton>
            <ReButton size="small" type="primary" :disabled="!hasChange" :loading="saving" @click="doSave">
              <template #icon><ReIcon name="Check" :size="13" /></template>
              保存
            </ReButton>
          </div>
        </div>
      </section>
    </div>

    <!-- 预览 / 保存结果 -->
    <ReDialog v-model="resultVisible" :title="resultTitle" width="820px" :height="560">
      <div v-if="result" class="ngc-result">
        <div class="ngc-result-head" :class="result.saved ? 'is-ok' : 'is-info'">
          <ReIcon :name="result.saved ? 'CircleCheck' : 'View'" :size="15" />
          <span>{{ result.message }}</span>
        </div>
        <ul v-if="result.steps.length" class="ngc-steps">
          <li v-for="(s, i) in result.steps" :key="i">{{ s }}</li>
        </ul>
        <div v-if="result.validateText && !result.validateOk" class="ngc-block">
          <div class="ngc-block-label">语法检查输出</div>
          <pre class="ngc-pre is-err">{{ result.validateText }}</pre>
        </div>
        <div v-if="diffLines.length" class="ngc-block">
          <div class="ngc-block-label">差异（共 {{ diffLines.length }} 行）</div>
          <pre class="ngc-pre"><span
            v-for="(l, i) in diffLines"
            :key="i"
            class="ngc-diff"
            :class="l.kind"
          >{{ l.text }}
</span></pre>
        </div>
      </div>
    </ReDialog>

    <!-- 新增指令 / 子块 -->
    <ReDialog v-model="addVisible" :title="addKind === 'block' ? '新增子块' : '新增指令'" width="520px" :height="400">
      <ReForm label-width="96px">
        <ReFormItem v-if="addKind === 'block'" label="区块类型">
          <ReSelect v-model="addName" filterable allow-create placeholder="如 location / upstream / if">
            <ReOption v-for="b in BLOCK_NAMES" :key="b" :value="b" :label="b" />
          </ReSelect>
        </ReFormItem>
        <ReFormItem v-else label="指令名">
          <ReSelect
            v-model="addName"
            filterable
            allow-create
            default-first-option
            placeholder="选择或直接输入指令名"
            @change="syncAddMeta"
          >
            <ReOption
              v-for="m in addCandidates"
              :key="m.name"
              :value="m.name"
              :label="`${m.name}${m.example ? '  例：' + m.example : ''}`"
            />
          </ReSelect>
          <div v-if="addMeta" class="ngc-addmeta">
            <div class="ngc-addmeta-desc">{{ addMeta.desc }}</div>
            <div v-if="addMeta.example" class="ngc-addmeta-eg">示例：{{ addMeta.example }}</div>
          </div>
        </ReFormItem>
        <ReFormItem v-if="addKind === 'block'" label="区块参数">
          <ReInput v-model="addHeadArg" placeholder="如 / 或 后端名" />
        </ReFormItem>
        <ReFormItem v-else-if="addMeta?.argType !== 'flag'" label="参数值">
          <ReInput v-model="addValue" :placeholder="addMeta?.example || '值'" />
        </ReFormItem>
      </ReForm>
      <template #footer>
        <ReButton @click="addVisible = false">取消</ReButton>
        <ReButton type="primary" :disabled="!addName" @click="confirmAdd">确定</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import NginxModelForm from "./NginxModelForm.vue";
import {
  applyNginxConfig,
  fetchNginxConfig,
  fetchNginxConfigFiles,
  fetchNginxConfigTree,
  fetchNginxDirectives,
  type NginxApplyResult,
  type NginxConfigFile,
  type NginxConfigNode,
  type NginxConfigParse,
  type NginxDirectiveMeta,
  type NginxPatch,
} from "../../nginx/api";

const props = defineProps<{
  /** 数据源 ID */
  datasourceId?: number;
  /** 新人模式：表单显示中文说明 */
  newbie: boolean;
  /** 需要定位的节点 id；非空时自动切到表单模式并展开定位链 */
  focusNodePath?: string | null;
}>();

const emit = defineEmits<{
  (e: "changed"): void;
  /** 定位完成后清空父级的 focusNodePath，避免下次打开还带着旧目标 */
  (e: "focus-consumed"): void;
}>();

/** 可新增的区块类型 */
const BLOCK_NAMES = ["location", "upstream", "if", "limit_except", "map", "types", "server"];

const mode = ref<"FILE" | "MODEL">("FILE");
const showHelp = computed(() => props.newbie);

const files = ref<NginxConfigFile[]>([]);
const filesLoading = ref(false);
const currentPath = ref("");
const content = ref("");
const parsed = ref<NginxConfigParse | null>(null);
const metas = ref<Record<string, NginxDirectiveMeta>>({});
const metaList = ref<NginxDirectiveMeta[]>([]);
const patches = ref<NginxPatch[]>([]);
const loading = ref(false);
const saving = ref(false);
const previewing = ref(false);

const optBackup = ref(true);
const optValidate = ref(true);
const optReload = ref(false);

const result = ref<NginxApplyResult | null>(null);
const resultVisible = ref(false);

const addVisible = ref(false);
const addKind = ref<"directive" | "block">("directive");
const addName = ref("");
const addValue = ref("");
const addHeadArg = ref("");
const addParent = ref<NginxConfigNode | null>(null);

const warnings = computed(() => parsed.value?.warnings || []);

const patchCount = computed(() => patches.value.length);
const patchedIds = computed(() => new Set(patches.value.map(p => p.nodeId || "")));

const hasChange = computed(() =>
  mode.value === "FILE" ? content.value !== (parsed.value?.content ?? "") : patches.value.length > 0,
);

const resultTitle = computed(() => (result.value?.saved ? "保存结果" : "预览结果"));

const lineCount = computed(() => Math.max(content.value.split("\n").length, 1));

/** 定位目标变化时重建表单，使折叠状态按新目标重新计算 */
const formKey = computed(() => `${currentPath.value}#${props.focusNodePath || ""}`);

const modelHint = computed(() =>
  props.newbie
    ? "表单模式：左边是配置结构，每条指令都有中文说明。改完点「预览」看结果，确认无误再「保存」。没把握就用文件模式。"
    : "表单模式：只改动你动过的区块，其余内容逐字节保留。改完先「预览」确认。",
);

/** 指令候选：按当前作用域过滤，未登记的指令仍可手工输入 */
const addCandidates = computed(() => {
  const scope = addParent.value?.scope || "http";
  const inScope = metaList.value.filter(m => m.scopes.includes(scope));
  return inScope.length ? inScope : metaList.value;
});

const addMeta = computed(() => metas.value[addName.value] || null);

/** 差异行：文件模式前端本地对比，表单模式用后端返回的渲染结果对比 */
const diffLines = computed(() => {
  if (!result.value?.content) {
    return [];
  }
  const before = (parsed.value?.content ?? "").split("\n");
  const after = result.value.content.split("\n");
  const beforeSet = new Map<string, number>();
  before.forEach((l, i) => beforeSet.set(l, (beforeSet.get(l) || 0) + 1));
  const afterSet = new Map<string, number>();
  after.forEach(l => afterSet.set(l, (afterSet.get(l) || 0) + 1));
  const out: { kind: string; text: string }[] = [];
  before.forEach(l => {
    if ((afterSet.get(l) || 0) > 0) {
      afterSet.set(l, (afterSet.get(l) || 0) - 1);
    } else {
      out.push({ kind: "del", text: `- ${l}` });
    }
  });
  after.forEach(l => {
    if ((beforeSet.get(l) || 0) > 0) {
      beforeSet.set(l, (beforeSet.get(l) || 0) - 1);
    } else {
      out.push({ kind: "add", text: `+ ${l}` });
    }
  });
  return out.slice(0, 400);
});

async function loadFiles() {
  if (!props.datasourceId) {
    return;
  }
  filesLoading.value = true;
  try {
    files.value = (await fetchNginxConfigFiles(props.datasourceId)) || [];
  } catch (e) {
    ElMessage.error(`读取配置文件列表失败：${(e as Error).message}`);
  } finally {
    filesLoading.value = false;
  }
}

async function openFile(path: string) {
  if (!props.datasourceId) {
    return;
  }
  currentPath.value = path;
  patches.value = [];
  loading.value = true;
  try {
    const [text, tree] = await Promise.all([
      fetchNginxConfig(props.datasourceId, path),
      fetchNginxConfigTree(props.datasourceId, path),
    ]);
    content.value = text || "";
    parsed.value = tree;
    // 带了定位目标就切到表单模式，否则用户会停在文本编辑器里找那一段
    if (props.focusNodePath) {
      mode.value = "MODEL";
    }
    if (tree.warnings?.length) {
      ElMessage.warning(`配置有 ${tree.warnings.length} 处需要注意的地方`);
    }
  } catch (e) {
    content.value = "";
    parsed.value = null;
    ElMessage.error(`读取配置失败：${(e as Error).message}`);
  } finally {
    loading.value = false;
    if (props.focusNodePath) {
      await nextTick();
      scrollToFocus();
      emit("focus-consumed");
    }
  }
}

/** 把定位到的区块滚到可视区中部 */
function scrollToFocus() {
  const el = document.querySelector(".ngc-model .ngf-blockhead.is-focused");
  if (el instanceof HTMLElement) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

async function loadMetas() {
  if (metaList.value.length) {
    return;
  }
  try {
    const list = (await fetchNginxDirectives()) || [];
    metaList.value = list;
    const map: Record<string, NginxDirectiveMeta> = {};
    list.forEach(m => (map[m.name] = m));
    metas.value = map;
  } catch {
    // 元数据拿不到时表单退化为通用文本输入，不阻塞编辑
  }
}

function markDirty() {
  /* 文件模式直接以 content 与原始内容比较得出 hasChange，无需额外状态 */
}

function onPatch(p: NginxPatch) {
  const i = patches.value.findIndex(x => x.nodeId === p.nodeId && x.op === p.op);
  if (i >= 0) {
    // 同一节点的同类操作只保留最后一次，避免补丁列表无限增长
    patches.value[i] = p;
  } else {
    patches.value.push(p);
  }
  if (p.op === "REMOVE") {
    patches.value = patches.value.filter(x => x.nodeId !== p.nodeId);
  }
}

function onRemove(node?: NginxConfigNode) {
  if (!node?.id) {
    return;
  }
  onPatch({ nodeId: node.id, op: "REMOVE" });
}

function openAdd(kind: "directive" | "block", parent?: NginxConfigNode) {
  addKind.value = kind;
  addParent.value = parent || null;
  addName.value = "";
  addValue.value = "";
  addHeadArg.value = "";
  addVisible.value = true;
  loadMetas();
}

function syncAddMeta() {
  const m = metas.value[addName.value];
  if (m?.example) {
    addValue.value = m.example;
  }
}

function confirmAdd() {
  const targetId = addParent.value?.id ?? null;
  if (addKind.value === "block") {
    onPatch({ nodeId: targetId, op: "ADD", name: addName.value, headArg: addHeadArg.value });
  } else {
    onPatch({ nodeId: targetId, op: "ADD", name: addName.value, value: addValue.value });
  }
  addVisible.value = false;
}

async function doPreview() {
  if (!props.datasourceId || !currentPath.value) {
    return;
  }
  previewing.value = true;
  try {
    result.value = await applyNginxConfig({
      datasourceId: props.datasourceId,
      path: currentPath.value,
      mode: mode.value,
      content: mode.value === "FILE" ? content.value : undefined,
      patches: mode.value === "MODEL" ? patches.value : undefined,
      dryRun: true,
    });
    resultVisible.value = true;
  } catch (e) {
    ElMessage.error(`预览失败：${(e as Error).message}`);
  } finally {
    previewing.value = false;
  }
}

async function doSave() {
  if (!props.datasourceId || !currentPath.value) {
    return;
  }
  saving.value = true;
  try {
    result.value = await applyNginxConfig({
      datasourceId: props.datasourceId,
      path: currentPath.value,
      mode: mode.value,
      content: mode.value === "FILE" ? content.value : undefined,
      patches: mode.value === "MODEL" ? patches.value : undefined,
      backup: optBackup.value,
      validate: optValidate.value,
      reload: optReload.value,
    });
    resultVisible.value = true;
    if (result.value.saved) {
      ElMessage.success(result.value.message);
      patches.value = [];
      if (mode.value === "FILE") {
        content.value = result.value.content;
      }
      await openFile(currentPath.value);
      emit("changed");
    } else {
      ElMessage.warning(result.value.message);
    }
  } catch (e) {
    ElMessage.error(`保存失败：${(e as Error).message}`);
  } finally {
    saving.value = false;
  }
}

function shortName(p: string): string {
  return p.split("/").pop() || p;
}

function shortDir(p: string): string {
  const parts = p.split("/");
  parts.pop();
  return parts.slice(-2).join("/");
}

watch(
  () => props.datasourceId,
  async id => {
    files.value = [];
    parsed.value = null;
    content.value = "";
    patches.value = [];
    if (id) {
      await loadMetas();
      await loadFiles();
    }
  },
  { immediate: true },
);

defineExpose({ loadFiles, openFile, doPreview, doSave, hasChange, openAdd, metas, addCandidates });
</script>

<style scoped lang="scss">
.ngc {
  height: 100%;
  min-height: 0;
}

.ngc-body {
  display: flex;
  gap: 12px;
  height: 100%;
  min-height: 0;
}

/* 左侧文件列表 */
.ngc-side {
  width: 250px;
  flex: none;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-lg, 12px);
  overflow: hidden;
}

.ngc-side-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  font-size: 13px;
  font-weight: 600;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
}

.ngc-side-body {
  flex: 1;
  overflow: auto;
}

.ngc-file {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--el-border-color-extra-light);

  &:hover {
    background: var(--el-color-primary-light-9);
  }

  &.active {
    background: var(--el-color-primary-light-8);
    color: var(--el-color-primary);
  }
}

.ngc-filename {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ngc-filedir {
  margin-left: auto;
  font-size: 10.5px;
  color: var(--el-text-color-placeholder);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 90px;
  direction: rtl;
}

/* 右侧编辑区 */
.ngc-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-lg, 12px);
  overflow: hidden;
}

.ngc-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
}

.ngc-path {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ngc-alert {
  margin: 8px 12px 0;
}

.ngc-warns {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 12px 0;
}

/* 文件编辑器 */
.ngc-editor {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
}

.ngc-gutter {
  flex: none;
  padding: 12px 6px 12px 10px;
  background: var(--el-fill-color-light);
  border-right: 1px solid var(--el-border-color-lighter);
  overflow: hidden;
  user-select: none;
}

.ngc-lineno {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--el-text-color-placeholder);
  text-align: right;
}

.ngc-textarea {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  resize: none;
  padding: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12.5px;
  line-height: 1.6;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
}

/* 表单模式 */
.ngc-model {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px 14px;
}

/* 底部操作条 */
.ngc-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 8px 12px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
}

.ngc-opts {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.ngc-opt-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-right: 8px;
}

.ngc-ops {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 结果展示 */
.ngc-result {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ngc-result-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  border-radius: var(--el-border-radius-base, 6px);
  font-size: 13px;

  &.is-ok {
    color: var(--el-color-success);
    background: var(--el-color-success-light-9);
  }

  &.is-info {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}

.ngc-steps {
  margin: 0;
  padding-left: 20px;
  font-size: 12.5px;
  line-height: 1.8;
  color: var(--el-text-color-regular);
}

.ngc-block-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.ngc-pre {
  margin: 0;
  padding: 10px 12px;
  max-height: 260px;
  overflow: auto;
  border-radius: var(--el-border-radius-base, 6px);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-all;

  &.is-err {
    color: var(--el-color-danger);
  }
}

.ngc-diff {
  display: block;

  &.add {
    color: var(--el-color-success);
    background: color-mix(in srgb, var(--el-color-success) 10%, transparent);
  }

  &.del {
    color: var(--el-color-danger);
    background: color-mix(in srgb, var(--el-color-danger) 10%, transparent);
  }
}

.ngc-addmeta {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.ngc-addmeta-eg {
  color: var(--el-text-color-placeholder);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
</style>
