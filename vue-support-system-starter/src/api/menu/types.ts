import {MenuTypeEnum} from '@/enums/MenuTypeEnum';

/**
 * 菜单查询参数类型
 */
export interface MenuQuery {
	keywords?: string;
}

/**
 * 菜单视图对象类型
 */
export interface MenuVO {
	/**
	 * 子菜单
	 */
	children?: MenuVO[];
	/**
	 * 组件路径
	 */
	menuComponent?: string;
	/**
	 * ICON
	 */
	menuIcon?: string;
	/**
	 * 菜单ID
	 */
	menuId?: number;
	/**
	 * 菜单名称
	 */
	menuName?: string;
	/**
	 * 父菜单ID
	 */
	menuParentId?: number;
	/**
	 * 按钮权限标识
	 */
	menuPerm?: string;
	/**
	 * 跳转路径
	 */
	menuRedirect?: string;
	/**
	 * 路由名称
	 */
	menuRouteName?: string;
	/**
	 * 路由相对路径
	 */
	menuRoutePath?: string;
	/**
	 * 菜单排序(数字越小排名越靠前)
	 */
	menuSort?: number;
	/**
	 * 菜单类型
	 */
	menuType?: MenuTypeEnum;
	/**
	 * 菜单是否可见(1:显示;0:隐藏)
	 */
	menuVisible?: number;
}

/**
 * 菜单表单对象类型
 */
export interface MenuForm {
	/**
	 * 菜单ID
	 */
	menuId?: string;
	/**
	 * 父菜单ID
	 */
	menuParentId?: number;
	/**
	 * 菜单名称
	 */
	menuName?: string;
	/**
	 * 菜单是否可见(1:是;0:否;)
	 */
	menuVisible: number;
	menuIcon?: string;
	/**
	 * 排序
	 */
	menuSort: number;
	/**
	 * 组件路径
	 */
	menuComponent?: string;
	/**
	 * 路由路径
	 */
	menuPath?: string;
	/**
	 * 跳转路由路径
	 */
	menuRedirect?: string;

	/**
	 * 菜单类型
	 */
	menuType: MenuTypeEnum;

	/**
	 * 权限标识
	 */
	menuPerm?: string;
}
