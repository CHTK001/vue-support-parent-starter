/**
 * 登录页面主题配置
 * @author CH
 * @date 2025-12-12
 */

export interface LoginTheme {
  name: string;
  key: string;
  description: string;
  component: () => Promise<any>;
  preview?: string;
}

// 主题列表
export const loginThemes: LoginTheme[] = [
  {
    name: "默认",
    key: "default",
    description: "默认基础主题，简约居中卡片式布局",
    // @ts-ignore
    component: () => import("./default/index.vue"),
  },
  {
    name: "锦鲤",
    key: "koi",
    description: "锦鲤风格，动态光斑背景",
    // @ts-ignore
    component: () => import("./koi/index.vue"),
  },
];

// 节日主题（已停用，统一走 koi 主题）
export const festivalThemes: LoginTheme[] = [];

/**
 * 根据配置获取主题：当前固定返回 koi 主题。
 */
export const getLoginTheme = (): LoginTheme => {
  return loginThemes[0];
};