/**
 * 文件管理路由配置
 * @author CH
 * @date 2024-12-09
 * @version 1.0.0
 */
import { $t } from "@repo/config";

export default [
  {
    path: "/file-manager",
    name: "fileManager",
    meta: {
      icon: "ri:folder-open-line",
      title: "文件管理",
      showLink: true,
      rank: 9,
    },
    children: [
      {
        path: "/file/manager",
        name: "fileManagerIndex",
        component: () => import("@repo/system/SystemFileSystem"),
        meta: {
          icon: "ri:file-list-3-line",
          title: "文件存储",
          showLink: true,
          showParent: true,
        },
      },
    ],
  },
];
