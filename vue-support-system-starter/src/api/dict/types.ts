/**
 * 字典类型查询参数
 */
export interface DictTypeQuery extends PageQuery {
	/**
	 * 关键字(字典类型名称/编码)
	 */
	keywords?: string;
}

/**
 * 字典类型分页对象
 */
export interface DictTypePageVO {
	/**
	 * 字典类型ID
	 */
	dictTypeId: number;
	/**
	 * 类型编码
	 */
	dictTypeCode: string;
	/**
	 * 类型名称
	 */
	dictTypeName: string;
	/**
	 * 状态(1:启用;0:禁用)
	 */
	dictTypeStatus?: number;
	/**
	 * 备注
	 */
	dictTypeRemark?: string;
}

/**
 * 字典分页项类型声明
 */
export type DictTypePageResult = PageResult<DictTypePageVO[]>;

/**
 * 字典表单类型声明
 */
export interface DictTypeForm {
	/**
	 * 字典类型ID
	 */
	dictTypeId?: number;
	/**
	 * 类型名称
	 */
	dictTypeName?: string;
	/**
	 * 类型编码
	 */
	dictTypeCode?: string;
	/**
	 * 类型状态：1:启用;0:禁用
	 */
	dictTypeStatus: number;
	/**
	 * 备注
	 */
	dictTypeRemark?: string;
}

/**
 * 字典查询参数
 */
export interface DictQuery extends PageQuery {
	/**
	 * 字典项名称
	 */
	dictName?: string;
	/**
	 * 字典类型编码
	 */
	dictTypeCode?: string;
	/**
	 * keywords
	 */
	keywords?: string;
}

/**
 * 字典分页对象
 */
export interface DictPageVO {
	/**
	 * 字典ID
	 */
	dictId?: number;
	/**
	 * 字典名称
	 */
	dictName?: string;
	/**
	 * 状态(1:启用;0:禁用)
	 */
	dictStatus?: number;
	/**
	 * 字典值
	 */
	dictValue?: string;
}

/**
 * 字典分页
 */
export type DictPageResult = PageResult<DictPageVO[]>;

/**
 * 字典表单
 */
export interface DictForm {
	/**
	 * 字典ID
	 */
	dictId?: number;
	/**
	 * 字典名称
	 */
	dictName?: string;
	/**
	 * 排序
	 */
	dictSort?: number;
	/**
	 * 状态(1:启用;0:禁用)
	 */
	dictStatus?: number;
	/**
	 * 类型编码
	 */
	dictTypeCode?: string;
	/**
	 * 值
	 */
	dictValue?: string;

	/**
	 * 备注
	 */
	dictRemark?: string;
}
