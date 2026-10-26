/**
 * 组件模板元数据 —— 左侧参数面板 + 右侧代码生成的数据源
 *
 * PropField 描述一个可调参数（控件 + 默认值 + 代码片段生成）；
 * TemplateMeta 描述一个组件的全部参数、默认值插槽与代码生成器。
 */

/** 参数控件类型 */
export type PropFieldType = "string" | "number" | "boolean" | "select" | "json" | "dataset";

/** 选项（select 类型） */
export interface PropOption {
  label: string;
  value: string | number | boolean;
  /** 显示图标（el-icon 组件名，仅 square 布局使用） */
  icon?: string;
}

/**
 * 数据集选项（dataset 类型）
 *
 * <p>用来把「多个 json 输入框」压成一个 el-segmented：每一档代表一份完整示例数据，
 * 选中即把 {@link DatasetOption.values} 里的多个字段一次性写入参数状态。</p>
 *
 * <p>例：关系图的 nodes + edges 本来是两个 textarea，要手动贴 JSON；
 * 改成 dataset 后点一下「三国势力」就同时填好节点和边。</p>
 */
export interface DatasetOption {
  /** 分段按钮上的文字（尽量短，3-5 字） */
  label: string;
  /** 选中后要写入的字段值，键为 prop key（如 { nodes: [...], edges: [...] }） */
  values: Record<string, unknown>;
  /** 行为说明（选中后显示在下方，替代手动输入） */
  hint?: string;
}

/** 单个参数字段 */
export interface PropField {
  /** 字段名（prop key） */
  key: string;
  /** 中文标签 */
  label: string;
  /** 控件类型 */
  type: PropFieldType;
  /** 默认值 */
  default: unknown;
  /** 提示说明 */
  description?: string;
  /** 选项（select 专用） */
  options?: PropOption[];
  /** 数据集（dataset 专用）：每一档一次性写入多个字段 */
  datasets?: DatasetOption[];
  /**
   * 高级字段：默认折叠在「高级参数」里，展开后才显示输入控件。
   *
   * <p>用于那些「日常不需要手改、但排查时想看一眼」的字段（如关系图的 nodes / edges：
   * 平时用分段控件选示例数据即可，只有要试自定义结构时才展开改 JSON）。</p>
   */
  advanced?: boolean;
  /** 最小值（number 专用） */
  min?: number;
  /** 最大值（number 专用） */
  max?: number;
  /** 步进（number 专用） */
  step?: number;
  /** 是否为插槽（标记后渲染插槽输入区） */
  isSlot?: boolean;
  /**
   * 联动预设：键为被监听字段名（如 "layout"），
   * 当该字段改变时，本字段自动填充为对应布局的预设值。
   * 例：{ watch: "layout", presets: { card: [...], default: [...] } }
   */
  defaultBy?: { watch: string; presets: Record<string, unknown> };
}

/** 插槽定义（用于默认插槽内容编辑） */
export interface SlotDef {
  /** 插槽名 */
  name: string;
  /** 中文说明 */
  label: string;
  /** 默认文本 */
  defaultText: string;
}

/** 组件模板元数据 */
export interface TemplateMeta {
  /** 组件名（PascalCase） */
  name: string;
  /** 中文标题 */
  title: string;
  /** 一句话描述（首页卡片展示） */
  description?: string;
  /** 组件引用（懒加载） */
  component: () => Promise<{ default: import("vue").Component }>;
  /** 参数列表 */
  props: PropField[];
  /** 插槽定义 */
  slots?: SlotDef[];
  /** 是否使用 v-model（控制是否显示开关控件） */
  modelable?: boolean;
  /** v-model 默认值 */
  modelDefault?: boolean | string | number;
  /** 代码生成器（默认走通用生成） */
  generate?: (state: TemplateState) => string;
}

/** 调试页状态（参数面板绑定） */
export interface TemplateState {
  /** props 字段值映射 */
  values: Record<string, unknown>;
  /** 默认插槽文本（按插槽名分） */
  slots: Record<string, string>;
  /** v-model 绑定值 */
  model: boolean | string | number;
}

/** 根据 schema 创建初始状态 */
export function createInitialState(meta: TemplateMeta): TemplateState {
  const values: Record<string, unknown> = {};
  for (const field of meta.props) {
    values[field.key] = field.default;
    // dataset 档位：把数值型默认（如 nodes/edges）一并落到状态里。
    // 分段控件本身只认 label，不参与组件 props，所以额外写一份 key -> label，
    // 供代码生成器还原「用户选了哪一档」。
    if (field.type === "dataset" && field.datasets?.length) {
      const first = field.datasets[0];
      Object.assign(values, first.values);
    }
  }
  const slots: Record<string, string> = {};
  if (meta.slots) {
    for (const slot of meta.slots) {
      slots[slot.name] = slot.defaultText;
    }
  }
  return {
    values,
    slots,
    model: meta.modelDefault ?? false,
  };
}