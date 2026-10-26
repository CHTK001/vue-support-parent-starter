<script setup lang="ts">
/**
 * 数据库控制台的「日期 / 时间列」编辑器。
 *
 * <p><b>为什么要它</b>：时间列以前是普通文本框（格内编辑）或原生
 * {@code <input type="date">}（行弹窗）。前者的后果是「2026-10-26 12:00:00」
 * 得手敲，敲错格式就写进库或直接报错；后者连时分秒都选不了，
 * {@code DATETIME} / {@code TIME} 列根本没法正确录入。</p>
 *
 * <p><b>按列类型自动选形态</b>，调用方只给类型和当前值：</p>
 * <ul>
 *   <li>{@code DATE} / {@code DATETIME} / {@code TIMESTAMP} / {@code YEAR}
 *       → {@code ReDatePicker} 对应的 date / datetime / year 面板；</li>
 *   <li>{@code TIME} → {@code el-time-picker}（Element Plus 没有 Re 版时间选择器，
 *       这里直接用，与控制台里其它 {@code El*} 用法一致）。</li>
 * </ul>
 *
 * <p><b>取值规范化不在这里做</b>：{@code utils/dbTemporal.ts} 负责把数据库下发的
 * 各种形状（{@code T} 分隔、微秒、纯时间）收敛成 {@code value-format} 能解析的串。
 * 本组件只负责「选」和「交」；交回去的值已经是库能吃的格式，不再二次格式化。</p>
 *
 * <p><b>autoCommit 的含义</b>：格内编辑是「选完即保存」（提交 → 单元格退出编辑态），
 * 行弹窗是「选完先存进表单，点保存才写库」。同一个组件靠这个开关区分。</p>
 *
 * <p><b>没改动不提交</b>：只点开面板又点走，不该发一次 UPDATE 并提示「已更新」。
 * 所以提交前比对初值，相同就改发 cancel。</p>
 *
 * @author CH
 * @since 4.0.0.47
 */
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { ElTimePicker } from "element-plus";
import ReDatePicker from "@repo/ui/re-date-picker";
import {
  dbTemporalValueFormat,
  resolveTemporalKind,
  toTemporalPickerValue,
} from "../../utils/dbTemporal";

defineOptions({ name: "DbTemporalEditor", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    /** 列类型（数据库原样类型名，可能含长度 / 无符号 / 时区后缀） */
    type?: string;
    /** 当前值（数据库原样下发：字符串 / Date / null 都可能） */
    modelValue?: string | number | Date | null;
    /** 尺寸：格内编辑用小号，弹窗用默认 */
    size?: "large" | "default" | "small";
    /** 挂载后立刻聚焦并弹出面板（格内编辑） */
    autofocus?: boolean;
    /** 选完即提交（格内编辑）；关闭时只回写 modelValue，等调用方保存 */
    autoCommit?: boolean;
    /** 允许清空（清空即 NULL） */
    clearable?: boolean;
    /** 占位文本 */
    placeholder?: string;
  }>(),
  {
    type: "",
    modelValue: null,
    size: "default",
    autofocus: false,
    autoCommit: false,
    clearable: true,
    placeholder: "",
  },
);

const emit = defineEmits<{
  /** 回写值；清空时给 null（数据库里该列就是 NULL，不是空串） */
  (e: "update:modelValue", value: string | null): void;
  /** autoCommit 时：值已回写，请调用方保存 */
  (e: "commit"): void;
  /** 用户按 Esc、未改值离开，或本组件判断无事可做：放弃本次编辑 */
  (e: "cancel"): void;
}>();

/** 选择器实例暴露的方法（ReDatePicker 与 ElTimePicker 同形） */
interface PickerHandle {
  focus?: () => void;
  handleOpen?: () => void;
  handleClose?: () => void;
}

/**
 * 选择器实例。
 *
 * <p>声明成 unknown 再断言：两个候选组件的实例类型不同（ReDatePicker 是
 * {@code @ts-nocheck} 的透传壳），模板 ref 直接标成联合类型会让 vue-tsc 判不兼容。</p>
 */
const pickerEl = ref<unknown>(null);

/**
 * 取选择器实例的方法集合。
 *
 * @returns 选择器句柄；未挂载时为 undefined
 */
function picker(): PickerHandle | undefined {
  return pickerEl.value as PickerHandle | undefined;
}

/** 选择器形态；类型不是日期时间类时为 null（调用方本不该渲染本组件） */
const kind = computed(() => resolveTemporalKind(props.type, props.modelValue));

/** TIME 列走 el-time-picker，其余走 ReDatePicker */
const isTimeOnly = computed(() => kind.value === "time");

/** ReDatePicker 的 type 取值（year / datetime / date 三选一） */
const datePanelType = computed<"year" | "datetime" | "date">(() => {
  const k = kind.value;
  return k === "year" ? "year" : k === "datetime" ? "datetime" : "date";
});

/** 选择器模型值（已规范化的字符串） */
const inner = ref<string>("");

/** 打开时的原值：没改动就离开时不该写一次库 */
const initial = ref<string>("");

/** 本次编辑是否已经结束：格内编辑提交后组件即将卸载，用它拦住重复提交 */
let settled = false;

/**
 * 把外部值同步进选择器。
 *
 * @param raw 数据库 / 表单里的原值
 */
function syncFrom(raw: unknown): void {
  inner.value = toTemporalPickerValue(kind.value ?? "date", raw);
  initial.value = inner.value;
}

syncFrom(props.modelValue);
watch(
  () => props.modelValue,
  raw => {
    // 只在外来值确实不同步时才覆盖本地值：提交后父级会把刚交上去的值回传，
    // 无条件 syncFrom 会把 initial 一并改写，进而影响「没改动不提交」的判断。
    const next = toTemporalPickerValue(kind.value ?? "date", raw);
    if (next !== inner.value) {
      syncFrom(raw);
    }
  },
);

onMounted(async () => {
  // 把规范化后的值回写给调用方。
  //
  // <p>必须做，否则「没动过这一列」的旧值会原样写回库：后端把 DATE / TIME /
  // TIMESTAMP / YEAR 序列化成 epoch 毫秒数，行弹窗的 rowForm 拿到的是
  // 1793376000000；用户只改了备注就点保存，UPDATE 会把该列写成这个整数。</p>
  //
  // <p>不触发 commit：只是把展示用的规范化值同步进表单，是否写库由用户点保存决定。</p>
  if (inner.value !== initial.value || props.modelValue !== inner.value) {
    emit("update:modelValue", inner.value === "" ? null : inner.value);
  }
  if (!props.autofocus) {
    return;
  }
  await nextTick();
  // 先聚焦再开面板：未聚焦时直接 handleOpen，EP 会在随后的 focus 事件里
  // 再判一次 automaticDropdown，展开时机不稳定。
  picker()?.focus?.();
  picker()?.handleOpen?.();
});

/**
 * 选择器回写：统一收敛成字符串（清空时 EP 给的是 null）。
 *
 * @param v 选择器回传值
 */
function onPickValue(v: unknown): void {
  inner.value = v === null || v === undefined ? "" : String(v);
}

/** 回写值并按需提交 */
function commit(): void {
  if (settled) {
    return;
  }
  // 格内编辑是「一次编辑 = 一次提交」，提交后组件即将卸载，用 settled 拦住重复提交；
  // 弹窗里同一次打开会反复改值，不能上锁，否则第二次选值就静默丢掉。
  if (props.autoCommit) {
    settled = true;
  }
  if (inner.value === initial.value) {
    // 没改动：不写库。格内编辑要退出编辑态，弹窗里则什么都不用做
    if (props.autoCommit) {
      picker()?.handleClose?.();
      emit("cancel");
    }
    return;
  }
  initial.value = inner.value;
  // 空串必须交成 null：日期列清空在库里是 NULL，写成 '' 会让 MySQL 报
  // 「Incorrect date value」、PG 直接类型不匹配。
  emit("update:modelValue", inner.value === "" ? null : inner.value);
  if (props.autoCommit) {
    // 关面板要显式做：本组件随后被卸载，留着可见的浮层会挂在 body 上
    picker()?.handleClose?.();
    emit("commit");
  }
}

/** 放弃编辑 */
function cancel(): void {
  if (settled) {
    return;
  }
  if (props.autoCommit) {
    settled = true;
    picker()?.handleClose?.();
    emit("cancel");
  }
}

/**
 * 键盘：Esc 放弃、Enter 提交。
 *
 * <p>监听的是 Element Plus 的 {@code keydown} 事件而不是根节点上的 {@code @keyup}：
 * 选择器根是 ElTooltip，属性会落到它身上而不是真正拿到焦点的 input，
 * 键盘事件不一定冒到那里。EP 内部把 input 的 keydown 原样 emit 出来了。</p>
 *
 * @param e 键盘事件
 */
function onKeydown(e: KeyboardEvent): void {
  if (e.key === "Escape") {
    e.stopPropagation();
    cancel();
  } else if (e.key === "Enter") {
    e.preventDefault();
    commit();
  }
}

/**
 * 面板展开 / 收起。
 *
 * <p><b>为什么提交信号是「面板关闭」而不是「输入框失焦」</b>：时间面板是
 * 点列表项选值的，鼠标按下那一刻输入框就先失焦了 —— 用 blur 提交会在点击
 * 落到列表项之前把面板关掉，表现为「点了没反应」。而 {@code visible-change}
 * 是面板自己的生命周期：选完值关闭、点空白关闭都会走到这里，
 * 两种情况都该结束这次编辑。</p>
 *
 * <p>关闭时若值没变，{@link commit} 内部会改发 cancel，所以「点开又点走」
 * 不会白发一次 UPDATE。</p>
 *
 * @param visible 面板是否可见
 */
function onVisibleChange(visible: boolean): void {
  if (!visible && props.autoCommit) {
    commit();
  }
}
</script>

<template>
  <!-- 外层 span 是「真正的盒子」：选择器根是 ElTooltip，类名落到哪里由它决定，
       用一层普通元素兜住，宽度与 scoped 样式才有确定的宿主。 -->
  <span class="dbt-editor">
    <!-- TIME 列：Element Plus 没有 Re 版时间选择器，直接用 -->
    <ElTimePicker
      v-if="isTimeOnly"
      ref="pickerEl"
      :model-value="inner"
      :size="size"
      :clearable="clearable"
      :placeholder="placeholder || '选择时间'"
      format="HH:mm:ss"
      value-format="HH:mm:ss"
      @update:model-value="onPickValue"
      @change="commit"
      @visible-change="onVisibleChange"
      @keydown="onKeydown"
    />
    <ReDatePicker
      v-else
      ref="pickerEl"
      :model-value="inner"
      :type="datePanelType"
      :size="size"
      :clearable="clearable"
      :placeholder="placeholder || '选择日期'"
      :value-format="dbTemporalValueFormat(datePanelType)"
      @update:model-value="onPickValue"
      @change="commit"
      @visible-change="onVisibleChange"
      @keydown="onKeydown"
    />
  </span>
</template>

<style scoped>
/* 选择器在表格格内要贴满整格；在弹窗里由表单容器决定宽度。
   Element Plus 给 .el-date-editor.el-input 定了 220px 固定宽，
   不覆盖就会在窄格里溢出、在弹窗里比别的输入框短一截。 */
.dbt-editor {
  display: block;
  width: 100%;
}
.dbt-editor :deep(.el-input),
.dbt-editor :deep(.el-date-editor) {
  width: 100%;
}
</style>
