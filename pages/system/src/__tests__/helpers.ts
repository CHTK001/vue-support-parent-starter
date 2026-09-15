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
 *   * 渲染 rows，并对每个具名插槽提供 { row } 作用域，便于点击“操作列”按钮。
 */

export type Stub = Record<string, unknown>;

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
    props: [
      "loader",
      "columns",
      "data",
      "loading",
      "pagination",
      "rowKey",
      "params",
      "selection",
      "rowClassName",
    ],
    emits: ["selection-change", "row-click", "update:page", "update:pageSize"],
    data: () => ({ rows: [] as unknown[] }),
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
          rows: unknown[];
        };
        if (typeof self.loader === "function") {
          const res = await self.loader({ page: 1, pageSize: 10, params: self.params ?? {} });
          self.rows = res?.data ?? [];
        } else {
          self.rows = self.data ?? [];
        }
      },
    },
    template: `
      <div class="re-table-stub">
        <div class="re-row" v-for="(row, i) in rows" :key="i">
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
  template: '<button type="button" :disabled="disabled"><slot /></button>',
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
    ElFormItem: { template: "<div><slot /></div>", props: ["label", "required"] },
    ElRow: pass(),
    ElCol: pass(),
    ElDescriptions: { template: "<div><slot /></div>", props: ["column", "border", "labelStyle", "contentStyle"] },
    ElDescriptionsItem: { template: "<div><slot /></div>", props: ["label", "span"] },
    ElTabs: { template: "<div><slot /></div>", props: ["modelValue", "type"] },
    ElTabPane: { template: "<div><slot /></div>", props: ["label", "name"] },
    ElSegmented: { template: "<div />", props: ["modelValue", "options"] },
    ElTreeSelect: { template: "<select />", props: ["modelValue", "data", "props", "checkStrictly", "clearable", "placeholder"] },
    ElDropdown: { template: "<div><slot /><slot name='dropdown' /></div>", props: ["trigger"] },
    ElDropdownMenu: { template: "<div><slot /></div>" },
    ElDropdownItem: {
      template: "<div class='dropdown-item' @click='$emit(\"command\", command)'><slot /></div>",
      props: ["command", "icon", "disabled", "divided"],
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
    ElSwitch: { template: "<input type='checkbox' />", props: ["modelValue", "activeValue", "inactiveValue"] },
    ElInput: { template: "<input />", props: ["modelValue", "placeholder", "clearable"] },
    ElButton: { template: "<button><slot /></button>", props: ["type", "size", "link", "loading", "icon"] },
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

