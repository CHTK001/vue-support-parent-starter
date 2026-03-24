/**
 * 菜单工具函数
 * @author CH
 * @version 1.0.0
 * @created 2025-01-14
 */

import { getConfig } from "@repo/config";

/**
 * 菜单新增标识相关工具函数
 */
export class MenuNewUtils {
  /**
   * 检查菜单是否应该显示新增标识
   * @param createTime 菜单创建时间
   * @param timeLimit 时间限制（小时），可选，默认从配置获取
   * @returns 是否显示新增标识
   */
  static shouldShowNewBadge(createTime?: string | Date, timeLimit?: number): boolean {
    const config = getConfig();
    
    // 检查全局配置是否启用新菜单显示
    if (!config.ShowNewMenu) {
      return false;
    }

    // 如果没有创建时间，不显示
    if (!createTime) {
      return false;
    }

    // 计算时间差
    const createTimeDate = new Date(createTime);
    const now = new Date();
    const diffHours = (now.getTime() - createTimeDate.getTime()) / (1000 * 60 * 60);
    
    // 获取时间限制配置（默认168小时，即7天）
    const limit = timeLimit || config.NewMenuTimeLimit || 168;
    
    // 如果在时间限制内，显示标识
    return diffHours <= limit;
  }

  /**
   * 为菜单项添加新增标识配置
   * @param menuItem 菜单项
   * @param createTime 创建时间
   * @param badgeType 标识类型
   * @param badgeText 自定义标识文本
   * @returns 更新后的菜单项
   */
  static addNewBadgeToMenu(
    menuItem: any,
    createTime: string | Date,
    badgeType: 'default' | 'primary' | 'success' | 'warning' | 'danger' = 'primary',
    badgeText?: string
  ): any {
    if (!menuItem.meta) {
      menuItem.meta = {};
    }

    menuItem.meta.createTime = createTime;
    menuItem.meta.badgeType = badgeType;
    
    if (badgeText) {
      menuItem.meta.badgeText = badgeText;
    }

    return menuItem;
  }

  /**
   * 批量为菜单列表添加新增标识
   * @param menuList 菜单列表
   * @param newMenusConfig 新菜单配置列表
   * @returns 更新后的菜单列表
   */
  static batchAddNewBadge(
    menuList: any[],
    newMenusConfig: Array<{
      path: string;
      createTime: string | Date;
      badgeType?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
      badgeText?: string;
    }>
  ): any[] {
    const configMap = new Map(
      newMenusConfig.map(config => [config.path, config])
    );

    function processMenu(menu: any): any {
      const config = configMap.get(menu.path);
      if (config) {
        menu = this.addNewBadgeToMenu(
          menu,
          config.createTime,
          config.badgeType,
          config.badgeText
        );
      }

      // 递归处理子菜单
      if (menu.children && menu.children.length > 0) {
        menu.children = menu.children.map((child: any) => processMenu.call(this, child));
      }

      return menu;
    }

    return menuList.map(menu => processMenu.call(this, menu));
  }

  /**
   * 获取新增标识的默认文本
   * @returns 默认标识文本
   */
  static getDefaultBadgeText(): string {
    const config = getConfig();
    return config.NewMenuText || 'new';
  }

  /**
   * 获取新增标识的时间限制
   * @returns 时间限制（小时）
   */
  static getTimeLimit(): number {
    const config = getConfig();
    return config.NewMenuTimeLimit || 168; // 默认7天
  }

  /**
   * 检查新增标识功能是否启用
   * @returns 是否启用
   */
  static isNewBadgeEnabled(): boolean {
    const config = getConfig();
    return config.ShowNewMenu || false;
  }
}

/**
 * 菜单新增标识装饰器
 * 用于在路由配置中快速添加新增标识
 */
export function withNewBadge(
  createTime: string | Date,
  badgeType: 'default' | 'primary' | 'success' | 'warning' | 'danger' = 'primary',
  badgeText?: string
) {
  return function(target: any) {
    return MenuNewUtils.addNewBadgeToMenu(target, createTime, badgeType, badgeText);
  };
}

/**
 * 创建带有新增标识的菜单项
 * @param menuConfig 菜单配置
 * @param createTime 创建时间
 * @param badgeType 标识类型
 * @param badgeText 自定义标识文本
 * @returns 菜单项
 */
export function createNewMenu(
  menuConfig: any,
  createTime: string | Date,
  badgeType: 'default' | 'primary' | 'success' | 'warning' | 'danger' = 'primary',
  badgeText?: string
): any {
  return MenuNewUtils.addNewBadgeToMenu(
    { ...menuConfig },
    createTime,
    badgeType,
    badgeText
  );
}

// 导出默认实例
export default MenuNewUtils;