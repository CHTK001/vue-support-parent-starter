/**
 * 表 / 字段下拉选项映射（纯函数，无 IO）。
 *
 * <p>刻意独立成文件而不放在 api/index.ts：本包 api 入口会 import ./request，
 * 而后者依赖 @repo/utils / @repo/config（fetch、token、配置中心）——
 * node --test 里 import 不了。把这两条纯映射拆出来，才能直接进单元测试。</p>
 *
 * <p>中文显示口径（全站一份）：**有注释显示中文、没有注释显示真实名**。
 * 反过来做（没注释就留空）会得到一个点进去才知道是哪个表的空下拉；
 * 编造中文更糟 —— 用户会照着一个不存在的名字去对业务。</p>
 *
 * @author CH
 * @since 4.0.0.46
 */

/** 表元数据（与后端 SchemaTableVO 对齐） */
export interface SchemaTable {
  name: string;
  comment: string | null;
  type: string | null;
}

/** 列元数据（与后端 SchemaColumnVO 对齐） */
export interface SchemaColumn {
  name: string;
  label: string | null;
  typeName: string | null;
  primaryKey?: boolean | null;
}

/** ReSelect 选项：只声明用得到的字段，index 签名留给 card/table 布局的额外字段 */
export interface SelectOption {
  value: string;
  label: string;
  /** 副标题：真实名 + 类型 */
  description: string;
  [key: string]: unknown;
}

/**
 * 取可读的中文名：注释去空白后非空才用，否则回退真实名。
 *
 * @param remark 注释（可能为 null / 空串 / 纯空白）
 * @param name   真实表名或字段名
 * @returns 展示用的名字
 */
function displayName(remark: string | null | undefined, name: string): string {
  const text = (remark ?? "").trim();
  return text ? text : name;
}

/**
 * 表下拉选项：label=中文备注（无则表名），subtitle=表名·类型。
 *
 * @param tables 表元数据
 * @returns 下拉选项
 */
export function toTableOptions(tables: SchemaTable[]): SelectOption[] {
  return (tables ?? []).map(item => ({
    value: item.name,
    label: displayName(item.comment, item.name),
    description: item.type ? `${item.name} · ${item.type}` : item.name,
    /** 真实表名：label 只是展示用备注，下游取值仍要真实名 */
    table: item.name,
    comment: item.comment,
    type: item.type,
  }));
}

/**
 * 字段下拉选项：label=中文备注（无则字段名），subtitle=字段名·类型。
 *
 * @param columns 列元数据
 * @returns 下拉选项
 */
export function toColumnOptions(columns: SchemaColumn[]): SelectOption[] {
  return (columns ?? []).map(item => ({
    value: item.name,
    label: displayName(item.label, item.name),
    description: item.typeName ? `${item.name} · ${item.typeName}` : item.name,
    /** 真实字段名：同上，label 只是展示用备注 */
    field: item.name,
    comment: (item.label ?? "").trim() || null,
    type: item.typeName,
    primaryKey: item.primaryKey ?? null,
  }));
}