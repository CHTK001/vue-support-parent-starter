/** 临时探针：经根路径别名引入 theme 的布局组件，验证 vue-i18n 的模板类型增强是否生效 */
import type { Component } from "vue";

import LayoutDouble from "@repo/theme/koi/layouts/LayoutDouble/index.vue";
import LayoutColumns from "@repo/theme/koi/layouts/LayoutColumns/index.vue";
import Refresh from "@repo/theme/koi/layouts/components/Header/components/Refresh.vue";

export const probe: Component[] = [LayoutDouble, LayoutColumns, Refresh];
