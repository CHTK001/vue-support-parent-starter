<template>
  <div class="ngf" :style="{ '--ngf-depth': depth }">
    <!-- 区块标题行 -->
    <div
      v-if="node.block"
      class="ngf-blockhead"
      :class="{ 'is-focused': node.id === focusId }"
    >
      <ReIcon
        :name="collapsed ? 'CaretRight' : 'CaretBottom'"
        :size="13"
        class="ngf-caret"
        @click="collapsed = !collapsed"
      />
      <span class="ngf-blockname">{{ node.name }}</span>
      <!-- 区块头部参数可编辑：location 的路径、upstream 的名字都在这里 -->
      <ReInput
        v-if="node.headArg !== null || node.name === 'location' || node.name === 'upstream'"
        :model-value="node.headArg || ''"
        
        class="ngf-headarg"
        :placeholder="headPlaceholder"
        @change="onHeadArg"
      />
      <span class="ngf-lines mono">{{ node.startLine }}-{{ node.endLine }}</span>
      <!-- 指令 / 子块 / 删除：只留图标。
           原来带文字标签，标题行被撑得过长，区块名和行号被挤到换行；
           而这三个操作在图标上语义已经明确（+ / 文件夹+ / 垃圾桶），
           靠 title 提示补充说明即可。 -->
      <ReButton layout="square" icon="Plus" tip="给这个块加一条指令" @click="emit('add-directive')" />
      <ReButton layout="square" icon="FolderAdd" tip="给这个块加一层子块" @click="emit('add-block')" />
      <ReButton layout="square" type="danger" icon="Delete" tip="删除这个块" @click="emit('remove')" />
    </div>

    <!-- 子项 -->
    <div v-show="!collapsed" class="ngf-children">
      <!-- 空区块给出可操作的提示，而不是一片空白 -->
      <div v-if="!directives.length && !blocks.length" class="ngf-empty">
        这个块里还没有内容。点右上角「指令」加一条，或「子块」加一层。
      </div>

      <div v-for="(child, ci) in blocks" :key="child.id || `b${ci}`" class="ngf-item is-block">
        <NginxModelForm
          :node="child"
          :metas="metas"
          :depth="depth + 1"
          :show-help="showHelp"
          :patched-ids="patchedIds"
          :focus-id="focusId"
          @patch="onChildPatch"
          @remove="onChildRemove"
          @add-directive="onChildAdd(child, 'directive')"
          @add-block="onChildAdd(child, 'block')"
        />
      </div>

      <div v-for="(d, di) in directives" :key="d.id || `d${di}`" class="ngf-item is-directive">
        <div class="ngf-row">
          <div class="ngf-name" :title="d.meta?.desc || '未登记的指令，将按原样保存'">
            {{ d.name }}
            <ReTag v-if="d.meta?.required"  type="danger">必填</ReTag>
            <ReTag v-else-if="!d.known"  type="info">原样保留</ReTag>
          </div>
          <div class="ngf-control">
            <!-- 无参数开关：nginx 用 on / off / 注释掉 三态 -->
            <template v-if="d.meta?.argType === 'flag'">
              <ReSelect
                :model-value="flagValue(d.value)"
                
                class="ngf-flag"
                @change="onValue(d, $event)"
              >
                <ReOption value="on" label="on（启用）" />
                <ReOption value="off" label="off（关闭）" />
                <ReOption value="" label="注释掉" />
              </ReSelect>
            </template>

            <!-- 枚举 -->
            <template v-else-if="d.meta?.argType === 'enum' && d.meta.enumValues.length">
              <ReSelect
                :model-value="d.value"
                
                filterable
                allow-create
                default-first-option
                class="ngf-enum"
                @change="onValue(d, $event)"
              />
            </template>

            <!-- 纯数字 -->
            <template v-else-if="d.meta?.argType === 'number'">
              <ReInputNumber
                :model-value="Number(d.value)"
                
                controls-position="right"
                class="ngf-num"
                @change="onValue(d, $event)"
              />
            </template>

            <!-- 带单位：给后缀提示，避免用户写成 1048576 而不是 1m -->
            <template v-else-if="d.meta?.argType === 'size' || d.meta?.argType === 'duration'">
              <ReInput
                :model-value="d.value"
                
                class="ngf-sized"
                :placeholder="d.meta.example"
                @change="onValue(d, $event)"
              >
                <template #suffix>
                  <span class="ngf-unit">{{ d.meta.argType === 'size' ? '如 10m' : '如 60s' }}</span>
                </template>
              </ReInput>
            </template>

            <!-- 多行文本 -->
            <template v-else-if="d.meta?.argType === 'text'">
              <ReInput
                :model-value="d.value"
                type="textarea"
                :rows="3"
                class="ngf-text"
                @change="onValue(d, $event)"
              />
            </template>

            <!-- 其它一律文本；带占位示例降低上手成本 -->
            <template v-else>
              <ReInput
                :model-value="d.value"
                
                class="ngf-plain"
                :placeholder="d.meta?.example || '值'"
                @change="onValue(d, $event)"
              />
            </template>
          </div>
          <ReButton layout="square" type="danger" icon="Close" :tip="`删除指令 ${d.name}`" @click="emit('remove', d)" />
        </div>
        <!-- 中文说明 + 示例：新人模式的主要信息来源 -->
        <div v-if="showHelp && d.meta" class="ngf-help">
          <span class="ngf-help-desc">{{ d.meta.desc }}</span>
          <span v-if="d.meta.example" class="ngf-help-eg">示例：{{ d.meta.example }}</span>
        </div>
        <div v-else-if="!d.known" class="ngf-help is-unknown">
          <span>
            指令 <code>{{ d.name }}</code> 未登记在元数据表里（可能是第三方模块或版本较新）。可以正常编辑，保存时按原样写入。
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { NginxConfigNode, NginxDirectiveMeta, NginxPatch } from "../../api/nginx/api";

const props = withDefaults(
  defineProps<{
    /** 当前区块节点 */
    node: NginxConfigNode;
    /** 指令元数据表，name -> meta */
    metas: Record<string, NginxDirectiveMeta>;
    /** 嵌套深度，用于左侧缩进 */
    depth?: number;
    /** 是否显示中文说明（新人模式开，标准模式关） */
    showHelp?: boolean;
    /** 已被本轮改动过的节点 id */
    patchedIds?: Set<string>;
    /** 需要定位到的节点 id；其祖先链会自动展开并高亮 */
    focusId?: string | null;
  }>(),
  {
    depth: 0,
    showHelp: true,
    patchedIds: () => new Set<string>(),
    focusId: null,
  },
);

const emit = defineEmits<{
  (e: "patch", patch: NginxPatch): void;
  (e: "remove", node?: NginxConfigNode): void;
  (e: "add-directive", parent?: NginxConfigNode): void;
  (e: "add-block", parent?: NginxConfigNode): void;
}>();

/** 默认展开；存在定位目标时，只展开目标所在的那条链，其余折叠，避免大文件一打开就糊满屏 */
const collapsed = ref(!props.focusId || !onFocusPath(props.node.id, props.focusId));

/**
 * 判断本节点是否位于定位目标的祖先链上。
 *
 * <p>节点 id 是路径式（{@code 0/1/0}），因此「是祖先」等价于「是目标 id 的前缀」。
 * 没有定位目标时返回 true，表示全部展开。</p>
 *
 * @param id      本节点 id
 * @param focusId 定位目标 id
 * @returns 是否应展开
 */
function onFocusPath(id: string | null, focusId: string | null): boolean {
  if (!focusId || !id) {
    return true;
  }
  return focusId === id || focusId.startsWith(`${id}/`);
}

/** 子区块与叶子指令分开渲染，区块在上、指令在下，与手写配置的阅读顺序一致 */
const blocks = computed(() => props.node.children.filter(c => c.block));
const directives = computed(() => props.node.children.filter(c => !c.block));

const headPlaceholder = computed(() => {
  if (props.node.name === "location") {
    return "路径前缀，如 / 或 /api/，支持 = ^ ~ ~* 前缀";
  }
  if (props.node.name === "upstream") {
    return "上游名，proxy_pass 里用 http://这个名字 引用";
  }
  return "区块参数";
});

/** 开关的三态归一：空串代表「注释掉」 */
function flagValue(v: string): string {
  return v === "on" || v === "off" ? v : "";
}

function onHeadArg(val: unknown) {
  const text = val === null || val === undefined ? "" : String(val);
  if (text === (props.node.headArg || "")) {
    return;
  }
  emit("patch", {
    nodeId: props.node.id,
    op: "UPDATE",
    name: props.node.name,
    headArg: text,
  });
}

/**
 * 指令值变更。
 *
 * <p>刻意收 {@code unknown}：同一个处理函数要接住 ReSelect 的字符串、
 * ReInputNumber 的数字或 undefined、以及自研输入组件的其它形态，统一在函数内归一为文本。</p>
 *
 * @param d   指令节点
 * @param val 新值
 */
function onValue(d: NginxConfigNode, val: unknown) {
  const text = val === null || val === undefined ? "" : String(val);
  if (text === d.value) {
    return;
  }
  emit("patch", { nodeId: d.id, op: "UPDATE", name: d.name, value: text });
}

/** 子组件冒上来的补丁原样转发 */
function onChildPatch(p: NginxPatch) {
  emit("patch", p);
}

function onChildRemove(d?: NginxConfigNode) {
  if (d && d.id) {
    emit("remove", d);
  }
}

function onChildAdd(parent: NginxConfigNode, kind: "directive" | "block") {
  if (kind === "directive") {
    emit("add-directive", parent);
  } else {
    emit("add-block", parent);
  }
}
</script>

<style scoped lang="scss">
.ngf {
  display: flex;
  flex-direction: column;
}

.ngf-blockhead {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  border-radius: 6px;

  /* 由站点页签跳转过来时高亮目标块，让用户一眼看到要改的是哪一个 */
  &.is-focused {
    background: var(--brand-50);
    box-shadow: inset 2px 0 0 var(--brand-500);
    padding-left: 6px;
  }
}

.ngf-caret {
  cursor: pointer;
  color: var(--text-secondary);
}

.ngf-blockname {
  flex: 0 0 auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--brand-500);
  white-space: nowrap;
}

/* 区块头参数：固定一段可用宽度，不写死也不自由伸缩。
   写死 220px 会在窄面板里把「指令/子块/删除」挤出可视区；
   但改成 flex:1 又会让它在宽面板里铺满整行，把三个按钮顶到最右、
   删除按钮直接被裁掉（实测截图就是这个现象）。
   所以：按需伸缩 + 封顶 260px，两头都不越界。 */
.ngf-headarg {
  flex: 0 1 auto;
  width: 240px;
  max-width: 260px;
  min-width: 80px;
}

/* 行号：靠 auto margin 顶到最右，但必须 flex:none，
   否则它会参与伸缩被压扁，数字只显示半截 */
.ngf-lines {
  flex: 0 0 auto;
  font-size: 11px;
  color: var(--text-tertiary);
  margin-left: auto;
  white-space: nowrap;
}

.ngf-children {
  padding-left: 18px;
  border-left: 1px dashed var(--border-subtle);
  margin-left: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ngf-item {
  border-radius: 6px;

  &.is-directive:hover {
    background: var(--bg-fill);
  }
}

.ngf-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 6px 3px 0;
  /* 强制单行：默认 flex-wrap 是 nowrap，这里写出来是为了让意图显式——
     控件一旦折到下一行，视觉上就跟「多了一条指令」无法区分了。 */
  flex-wrap: nowrap;
}

/* 指令名：按内容宽度排布、整体不换行。
   原来写死 190px + ellipsis，指令名稍长就被截成「proxy_pass…」，得悬停才能看全，
   而这里是编辑配置、名字必须一眼可读。改成「按需取宽、必要时压缩」：
   flex-basis auto 让短名字不浪费空间，max-width 兜住长名字不会把右侧控件挤没。 */
.ngf-name {
  flex: 0 1 auto;
  min-width: 96px;
  max-width: 40%;
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12.5px;
  color: var(--text-primary);
  /* 名字是主要信息：宽度不够时压缩它，而不是换行 */
  white-space: nowrap;
  overflow: hidden;
}

.ngf-control {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
}

/* 选择/数字框统一不换行。数字框一旦被折到下一行，
   上下两条指令的输入框会错位叠在一起，看着像控件坏了。 */
.ngf-flag,
.ngf-enum,
.ngf-num {
  flex: 0 0 160px;
  width: 160px;
  white-space: nowrap;
}

.ngf-sized,
.ngf-plain,
.ngf-text {
  flex: 1 1 auto;
  min-width: 0;
}

/* 行尾操作按钮给固定方形尺寸。
   不加约束时 ReButton 的 text 按钮宽度由内容撑，而 icon 是 svg，
   在 flex 行里被挤到接近 0 宽就整个看不见了——「图标没显示」就是这个原因。 */
.ngf-row :deep(.el-button),
.ngf-blockhead :deep(.el-button) {
  flex: 0 0 auto;
  width: 24px;
  min-width: 24px;
  height: 24px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* 图标再兜一层：svg 默认可压缩，这里禁止被压扁 */
.ngf-row :deep(.el-button .el-icon),
.ngf-blockhead :deep(.el-button .el-icon) {
  flex: 0 0 auto;
  width: 13px;
  height: 13px;
}

.ngf-unit {
  font-size: 11px;
  color: var(--text-tertiary);
  white-space: nowrap;
}

.ngf-help {
  display: flex;
  flex-direction: column;
  gap: 2px;
  /* 左内边距与 .ngf-row 内边距对齐（原 196px 是跟着写死的 190px 指令名列算的，
     指令名列改成按内容伸缩后这里再写死就会和上方内容错位）。
     用 padding-left 只做视觉缩进，宽度交由内容。 */
  padding: 0 6px 6px 8px;
  font-size: 11.5px;
  line-height: 1.55;
  color: var(--text-secondary);

  &.is-unknown {
    color: var(--text-tertiary);
  }

  code {
    padding: 0 4px;
    border-radius: 3px;
    background: var(--bg-fill);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  }
}

.ngf-help-eg {
  color: var(--text-tertiary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.ngf-empty {
  padding: 8px 10px;
  font-size: 12px;
  color: var(--text-tertiary);
}
</style>
