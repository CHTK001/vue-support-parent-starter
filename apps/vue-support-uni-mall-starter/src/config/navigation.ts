import type { UniBottomNavItem } from "@layout/uni";

export const createMallBottomNav = (cartCount = 0): UniBottomNavItem[] => [
  {
    key: "home",
    label: "首页",
    shortLabel: "HM",
    path: "/pages/home/index"
  },
  {
    key: "category",
    label: "分类",
    shortLabel: "CT",
    path: "/pages/category/index"
  },
  {
    key: "cart",
    label: "购物车",
    shortLabel: "CR",
    path: "/pages/cart/index",
    badge: cartCount > 0 ? cartCount : undefined
  },
  {
    key: "profile",
    label: "我的",
    shortLabel: "ME",
    path: "/pages/profile/index"
  }
];
