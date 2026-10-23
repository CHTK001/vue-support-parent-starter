/**
 * 设计表列行模型：**唯一**的一份。
 *
 * <p>「新建表（设计表）」弹窗与数据库管理器的表结构网格此前各自定义了一份行模型与
 * 列清单，改一个另一个没跟上（最典型：弹窗有「小数位」，表结构网格没有）。
 * 现在两处都从本文件取 —— 行字段加一个，两处同时生效。</p>
 *
 * @author CH
 * @since 4.0.0.47
 */

/** 设计网格的一行，对应后端的一列 */
export interface DesignColumnRow {
  /** 行的稳定 key：列名可能留空、也可能重名，不能拿 name 当 key */
  key: number;
  /** 字段名 */
  name: string;
  /** 类型 */
  type: string;
  /** 长度（只对 typeNeedsSize 的类型有意义） */
  size: number | null;
  /** 小数位（只对 typeAllowsScale 的类型有意义） */
  scale: number | null;
  /** 可空 */
  nullable: boolean;
  /** 是否主键 */
  primaryKey: boolean;
  /** 是否自增 */
  autoIncrement: boolean;
  /** 默认值原文（交给后端按类型落） */
  defaultValue: string;
  /** 列注释 */
  comment: string;
  /** ENUM / SET 的取值文本，逗号分隔 */
  enumText: string;
}

/** 行 key 自增（数组里可能有多行同名/空名，key 必须唯一且稳定） */
let rowSeq = 0;

/**
 * 新建一行：默认 VARCHAR(255) 可空，是多数场景的起点。
 *
 * @param partial 覆盖项（预填源表列时用）
 * @return 新的设计行
 */
export const newDesignRow = (partial: Partial<DesignColumnRow> = {}): DesignColumnRow => ({
  key: ++rowSeq,
  name: "",
  type: "VARCHAR",
  size: 255,
  scale: null,
  nullable: true,
  primaryKey: false,
  autoIncrement: false,
  defaultValue: "",
  comment: "",
  enumText: "",
  ...partial,
});

/**
 * ENUM / SET 取值文本 → 列表（去空白、去空项）。
 *
 * @param text 逗号分隔的取值文本
 * @return 取值列表
 */
export const parseEnumValues = (text: string): string[] =>
  text
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
