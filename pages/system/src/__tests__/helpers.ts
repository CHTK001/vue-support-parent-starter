/**
 * 组件测试共享桩（stub）工厂
 *
 * 说明：本目录下的单元测试统一使用 Vue Test Utils，把项目里的重型 ReXxx / el-*
 * 组件替换为轻量桩，从而只验证页面自身的渲染与交互逻辑，不依赖真实组件库。
 *
 * 关键约定：
 * - ReTable 桩：
 *   * 若传入 loader（函数），mounted 时调用一次，并暴露 reload() 方法（页面 onMounted 会再调一次）；
 *   * 若使用静态 :data，则 watch data 直接渲染行；
 *   * 渲染 rows，并对每个具名插槽提供 { row } 作用域，便于点击“操作列”按钮；
 *   * 复刻真实 ReTable 的三块外部可见结构，否则页面的搜索/工具栏内容在测试 DOM 里根本不存在：
 *     - `:search="{ filters, title, ... }"` 内置搜索区：`.re-table__search` 下的标题、
 *       每个过滤项（`.re-search-filter` 标签 + 输入框/下拉）以及 重置/搜索 两个按钮
 *       （点击行为对齐真实组件：搜索 = emit("search") + reload()，重置 = emit("search-reset")）；
 *     - `#toolbar` 具名插槽：渲染在 `.re-table__toolbar-row` 里（新增/发送消息/导出等业务按钮）；
 *     - `show-selection`：为每行渲染复选框并在变化时 emit("selection-change", rows)。
 */

import { inject, provide } from "vue";

export type Stub = Record<string, unknown>;

/**
 * el-dropdown 桩之间传递“命令派发”回调：
 * 真实组件里 el-dropdown-item 点击会把 command 冒泡给父 el-dropdown 的 @command，
 * 桩默认只会 $emit 给自身，页面挂在外层的 @command 收不到，因此用 provide/inject 补上这条链路。
 */
const DROPDOWN_COMMAND_KEY = "vtu-dropdown-command";

/** 渲染“操作列/状态列”等行级作用域插槽时需要用到的插槽名 */
function rowSlots(slotNames: string[]): string {
  return slotNames
    .map((n) => `          <slot name="${n}" :row="row" :$index="i" />`)
    .join("\n");
}

/**
 * ReTable 桩
 * @param rowSlotNames 需要按行渲染的具名作用域插槽（如 "action"、"status"、"name"）
 */
export function makeReTableStub(rowSlotNames: string[] = []): Stub {
  const slots = rowSlots(rowSlotNames);
  return {
    name: "ReTable",
    // 注意：数组式 props 只允许字符串，需要类型转换（裸属性 show-selection）时必须用对象式
    props: {
      loader: { type: Function, default: undefined },
      columns: { type: Array, default: () => [] },
      data: { type: Array, default: () => [] },
      loading: { type: Boolean, default: false },
      pagination: { default: undefined },
      rowKey: { type: String, default: "" },
      params: { type: Object, default: () => ({}) },
      selection: { default: undefined },
      rowClassName: { default: undefined },
      search: { type: [Boolean, Object], default: false },
      searchModel: { type: Object, default: undefined },
      showSelection: { type: Boolean, default: false },
    },
    emits: [
      "selection-change",
      "row-click",
      "update:page",
      "update:pageSize",
      "update:searchModel",
      "search",
      "search-reset",
    ],
    data: () => ({ rows: [] as unknown[], selectedRows: [] as unknown[] }),
    computed: {
      /** search=true 或 search={...} 时返回配置对象；未开启搜索返回 null（与真实 searchEnabled 一致） */
      searchCfg(): Record<string, unknown> | null {
        const self = this as unknown as { search: unknown };
        if (self.search === true) return {};
        if (self.search && typeof self.search === "object") return self.search as Record<string, unknown>;
        return null;
      },
    },
    watch: {
      data: {
        immediate: true,
        handler(v: unknown) {
          const self = this as unknown as { loader?: unknown; rows: unknown[] };
          if (typeof self.loader !== "function") self.rows = (v as unknown[]) || [];
        },
      },
    },
    async mounted() {
      const self = this as unknown as { loader?: unknown; reload: () => Promise<void> };
      if (typeof self.loader === "function") await self.reload();
    },
    methods: {
      async reload() {
        const self = this as unknown as {
          loader?: (r: unknown) => Promise<{ data?: unknown[] }>;
          data?: unknown[];
          params?: Record<string, unknown>;
          searchModel?: Record<string, unknown>;
          rows: unknown[];
        };
        if (typeof self.loader === "function") {
          // 真实 ReTable 把 params 与“已应用的搜索条件”合并后交给 loader
          const merged = { ...(self.params ?? {}), ...(self.searchModel ?? {}) };
          const res = await self.loader({ page: 1, pageSize: 10, params: merged });
          self.rows = res?.data ?? [];
        } else {
          self.rows = self.data ?? [];
        }
      },
      /** 搜索区过滤项当前值 */
      filterValue(key: string): unknown {
        const self = this as unknown as { searchModel?: Record<string, unknown> };
        return self.searchModel?.[key] ?? "";
      },
      /** 过滤项输入：透传 update:searchModel（页面 v-model:search-model 依赖它） */
      onFilterChange(key: string, event: Event, filter?: { options?: Array<{ value: unknown }> }) {
        const self = this as unknown as {
          searchModel?: Record<string, unknown>;
          $emit: (e: string, v: unknown) => void;
        };
        const target = event.target as HTMLInputElement;
        let value: unknown = target.value;
        // el-select 真实行为：选中项回填的是绑定值本身（数字仍是数字），DOM 只有字符串，这里还原
        const raw = String(value);
        const hit = (filter?.options ?? []).find((o) => String(o.value) === raw);
        if (hit) value = hit.value;
        self.$emit("update:searchModel", { ...(self.searchModel ?? {}), [key]: value });
      },
      /** 点击“搜索”：与真实组件一致，先同步已应用条件再重新拉数据 */
      async onSearchClick() {
        const self = this as unknown as { $emit: (e: string) => void; reload: () => Promise<void> };
        self.$emit("search");
        await self.reload();
      },
      /** 点击“重置”：真实组件只 emit，由页面自己清空 query 并 reload */
      onResetClick() {
        const self = this as unknown as { $emit: (e: string) => void };
        self.$emit("search-reset");
      },
      isSelected(row: unknown): boolean {
        const self = this as unknown as { selectedRows: unknown[] };
        return self.selectedRows.includes(row);
      },
      /** 勾选/取消某一行 -> emit("selection-change", 选中行数组) */
      toggleRowSelect(row: unknown, event: Event) {
        const self = this as unknown as {
          selectedRows: unknown[];
          $emit: (e: string, rows: unknown[]) => void;
        };
        const checked = (event.target as HTMLInputElement).checked;
        const idx = self.selectedRows.indexOf(row);
        if (checked && idx < 0) self.selectedRows.push(row);
        if (!checked && idx >= 0) self.selectedRows.splice(idx, 1);
        self.$emit("selection-change", [...self.selectedRows]);
      },
    },
    template: `
      <div class="re-table-stub">
        <div v-if="searchCfg" class="re-table__search">
          <span class="re-table__search-title">{{ searchCfg.title || '搜索' }}</span>
          <div
            v-for="f in (searchCfg.filters || [])"
            :key="f.key"
            class="re-search-filter"
            :data-filter-key="f.key"
          >
            <span class="re-search-filter__label">{{ f.label }}</span>
            <select
              v-if="f.type === 'select'"
              class="re-search-filter__select"
              :value="filterValue(f.key)"
              @change="onFilterChange(f.key, $event, f)"
            >
              <option
                v-for="o in (f.options || [])"
                :key="o.value"
                :value="o.value"
              >{{ o.label }}</option>
            </select>
            <input
              v-else
              class="re-search-filter__input"
              :placeholder="f.placeholder"
              :value="filterValue(f.key)"
              @input="onFilterChange(f.key, $event)"
            />
          </div>
          <button
            v-if="searchCfg.showResetBtn !== false"
            type="button"
            class="re-search-btn re-search-reset-btn"
            @click="onResetClick"
          >重置</button>
          <button
            v-if="searchCfg.showSearchBtn !== false"
            type="button"
            class="re-search-btn re-search-query-btn"
            @click="onSearchClick"
          >搜索</button>
        </div>
        <div v-if="searchCfg || $slots.toolbar" class="re-table__toolbar-row">
          <div class="re-table__toolbar-left"><slot name="toolbar" /></div>
          <button
            v-if="searchCfg"
            type="button"
            class="re-table__toolbar-refresh"
            title="刷新"
            @click="reload"
          />
        </div>
        <div class="re-row" v-for="(row, i) in rows" :key="i">
          <label v-if="showSelection" class="re-row__select">
            <input
              type="checkbox"
              class="re-row__checkbox"
              :checked="isSelected(row)"
              @change="toggleRowSelect(row, $event)"
            />
          </label>
${slots}
        </div>
        <slot />
      </div>`,
  };
}

/** ReSearch 桩：渲染默认插槽与 footer 插槽 */
export const ReSearchStub: Stub = {
  props: ["isExpanded", "is-expanded", "addText", "addButton"],
  emits: ["add"],
  template:
    '<div class="re-search-stub"><slot /><slot name="footer" /></div>',
};

/** ReButton 桩 */
export const ReButtonStub: Stub = {
  props: ["loading", "icon", "type", "disabled", "size", "plain", "link", "layout"],
  template: '<button type="button" :data-icon="icon" :disabled="disabled"><slot /></button>',
};

/** ReInput 桩 */
export const ReInputStub: Stub = {
  props: [
    "modelValue",
    "placeholder",
    "type",
    "disabled",
    "rows",
    "maxlength",
    "clearable",
    "showWordLimit",
    "layout",
  ],
  emits: ["update:modelValue", "change", "blur", "keyup"],
  template:
    '<span class="re-input-stub"><span class="ph">{{ placeholder }}</span><input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" /></span>',
};

/** ReSelect 桩 */
export const ReSelectStub: Stub = {
  props: ["modelValue", "placeholder", "data", "multiple", "clearable", "layout", "class"],
  emits: ["update:modelValue", "change"],
  template:
    '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value); $emit(\'change\', $event.target.value)"><option v-for="o in (data || [])" :key="o.value" :value="o.value">{{ o.label }}</option></select>',
};

/** ReSwitch 桩 */
export const ReSwitchStub: Stub = {
  props: ["modelValue", "model-value", "disabled", "layout", "activeValue", "inactiveValue"],
  emits: ["update:modelValue", "update:model-value"],
  template: '<input type="checkbox" :checked="!!modelValue" :disabled="disabled" />',
};

/** ReInputNumber 桩 */
export const ReInputNumberStub: Stub = {
  props: ["modelValue", "min", "controls", "layout", "class"],
  emits: ["update:modelValue", "change"],
  template: '<input type="number" :value="modelValue" />',
};

/** ReTag 桩 */
export const ReTagStub: Stub = {
  props: ["type", "effect", "size", "layout", "round"],
  template: '<span class="re-tag-stub"><slot /></span>',
};

/** ReDialog 桩：modelValue 为真时渲染内容，并提供“确定”按钮触发 ok 事件 */
export const ReDialogStub: Stub = {
  props: ["modelValue", "title", "width", "footerHidden", "footer-hidden", "okText", "confirmLoading"],
  emits: ["ok", "update:modelValue"],
  template:
    '<div class="re-dialog-stub" v-if="modelValue"><slot /><button type="button" class="dialog-ok" @click="$emit(\'ok\')">确定</button></div>',
};

/** ReDrawer 桩：modelValue 为真时渲染具名 content 插槽 */
export const ReDrawerStub: Stub = {
  props: ["modelValue", "title", "size", "footerHidden", "footer-hidden", "showWindowShell", "closeOnClickModal"],
  emits: ["update:modelValue", "cancel"],
  template: '<div class="re-drawer-stub" v-if="modelValue"><slot /><slot name="content" /></div>',
};

/**
 * element-plus 容器类组件的“透传插槽”桩集合。
 * 这些组件在页面里仅作布局，测试中只需把插槽内容渲染出来即可。
 */
export function elementPlusLayoutStubs(): Record<string, Stub> {
  const pass = (extra: Record<string, unknown> = {}): Stub => ({
    template: "<div><slot /></div>",
    ...extra,
  });
  return {
    ElCard: pass(),
    ElForm: { template: "<form><slot /></form>", props: ["model", "labelWidth", "labelPosition"] },
    ElFormItem: { template: "<div class='el-form-item-stub'><span v-if='label' class='el-form-item-stub__label'>{{ label }}</span><slot /></div>", props: ["label", "required"] },
    ElRow: pass(),
    ElCol: pass(),
    ElDescriptions: { template: "<div><slot /></div>", props: ["column", "border", "labelStyle", "contentStyle"] },
    ElDescriptionsItem: { template: "<div><slot /></div>", props: ["label", "span"] },
    ElTabs: { template: "<div><slot /></div>", props: ["modelValue", "type"] },
    ElTabPane: { template: "<div><slot /></div>", props: ["label", "name"] },
    ElSegmented: { template: "<div />", props: ["modelValue", "options"] },
    ElTreeSelect: { template: "<select />", props: ["modelValue", "data", "props", "checkStrictly", "clearable", "placeholder"] },
    ElDropdown: {
      template: "<div class='dropdown-stub'><slot /><slot name='dropdown' /></div>",
      props: ["trigger"],
      emits: ["command"],
      setup(_props: unknown, ctx: { emit: (e: string, ...args: unknown[]) => void }) {
        provide(DROPDOWN_COMMAND_KEY, (cmd: unknown) => ctx.emit("command", cmd));
        return {};
      },
    },
    ElDropdownMenu: { template: "<div><slot /></div>" },
    ElDropdownItem: {
      template: "<div class='dropdown-item' @click='vtuItemClick'><slot /></div>",
      props: ["command", "icon", "disabled", "divided"],
      emits: ["command"],
      setup(props: { command?: unknown }, ctx: { emit: (e: string, ...args: unknown[]) => void }) {
        const dispatch = inject<((cmd: unknown) => void) | undefined>(DROPDOWN_COMMAND_KEY, undefined);
        return {
          vtuItemClick: () => {
            ctx.emit("command", props.command);
            dispatch?.(props.command);
          },
        };
      },
    },
    ElAvatar: { template: "<span><slot /></span>", props: ["size", "src"] },
    ElIcon: { template: "<i><slot /></i>", props: ["size", "color"] },
    ElTable: { template: "<div><slot /></div>", props: ["data", "border", "stripe", "size", "vLoading"] },
    // 不渲染 #default="{ row }" 作用域插槽，避免无 row 上下文时求值报错
    ElTableColumn: { template: "<div />", props: ["prop", "label", "width", "minWidth", "type", "align", "fixed"] },
    ElCheckboxGroup: { template: "<div><slot /></div>", props: ["modelValue"] },
    ElCheckbox: { template: "<label><input type='checkbox' /><slot /></label>", props: ["value", "checked"] },
    ElRadioGroup: { template: "<div><slot /></div>", props: ["modelValue"] },
    ElRadio: { template: "<label><input type='radio' /><slot /></label>", props: ["value", "label"] },
    ElAlert: { template: "<div><slot /><template v-if='title'>{{ title }}</template></div>", props: ["title", "type", "closable", "showIcon"] },
    ElScrollbar: { template: "<div><slot /></div>", props: ["maxHeight"] },
    ElTree: { template: "<div />", props: ["data", "props", "nodeKey", "showCheckbox", "defaultCheckedKeys", "defaultExpandedKeys", "expandOnClickNode"] },
    ElSwitch: {
      template: '<input type="checkbox" :checked="modelValue === activeValue" />',
      props: { modelValue: { default: false }, activeValue: { default: true }, inactiveValue: { default: false } },
    },
    ElInput: { template: "<input />", props: ["modelValue", "placeholder", "clearable"] },
    ElButton: {
      template: '<button type="button" :data-icon="icon" :title="title"><slot /></button>',
      props: ["type", "size", "link", "loading", "icon", "text", "title", "disabled"],
    },
    ElTag: { template: "<span><slot /></span>", props: ["type", "effect", "size"] },
    ElPagination: { template: "<div />", props: ["total", "pageSize"] },
    ElEmpty: { template: "<div><slot /></div>", props: ["description"] },
    ElDivider: { template: "<hr />" },
  };
}

/**
 * 等待组件挂载后的异步链路（loader / 弹窗 / 响应式更新）全部完成。
 * 组件内的 loader 是多层 await（mockResolvedValue），单靠一次 microtask flush
 * 不足以让表格行渲染，因此额外让出一个 macrotask。
 */
export async function settle(wrapper: {
  vm: { $nextTick: () => Promise<void> };
}): Promise<void> {
  await wrapper.vm.$nextTick();
  await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
  await wrapper.vm.$nextTick();
}

