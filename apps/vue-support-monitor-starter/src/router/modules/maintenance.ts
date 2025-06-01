///
/// Copyright (c) 2019 Of Him Code Technology Studio
/// Jpom is licensed under Mulan PSL v2.
/// You can use this software according to the terms and conditions of the Mulan PSL v2.
/// You may obtain a copy of Mulan PSL v2 at:
/// 			http://license.coscl.org.cn/MulanPSL2
/// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
/// See the Mulan PSL v2 for more details.
///

import type { RouteConfigsTable } from "@repo/core";

const children = [
  {
    path: "/my-workspace",
    name: "my-workspace",
    component: () => import("@/views/maintenance/layout/my-workspace.vue"),
    meta: {
      title: "我的工作空间",
    },
  },
  {
    path: "/overview",
    name: "overview",
    component: () => import("@/views/maintenance/layout/overview.vue"),
    meta: {
      title: "概览",
    },
  },
  {
    path: "/node/list",
    name: "node-list",
    component: () => import("@/views/maintenance/node/list.vue"),
    meta: {
      title: "节点列表",
    },
  },
  {
    path: "/docker/list",
    name: "docker-list",
    component: () => import("@/views/maintenance/docker/list.vue"),
    meta: {
      title: "Docker 列表",
    },
  },
  {
    path: "/docker/swarm",
    name: "docker-swarm",
    component: () => import("@/views/maintenance/docker/swarm/list.vue"),
    meta: {
      title: "Docker Swarm 列表",
    },
  },

  {
    path: "/node/search",
    name: "node-search",
    component: () => import("@/views/maintenance/node/search.vue"),
    meta: {
      title: "节点搜索",
    },
  },
  {
    path: "/node/script-all",
    name: "node-script-list-all",
    component: () => import("@/views/maintenance/node/script-list.vue"),
    meta: {
      title: "节点脚本列表",
    },
  },
  {
    path: "/script/script-list",
    name: "script-list-all",
    component: () => import("@/views/maintenance/script/script-list.vue"),
    meta: {
      title: "脚本列表",
    },
  },
  {
    path: "/script/script-log",
    name: "script-log",
    component: () => import("@/views/maintenance/script/script-log.vue"),
    meta: {
      title: "脚本日志",
    },
  },

  {
    path: "/ssh",
    name: "node-ssh",
    component: () => import("@/views/maintenance/ssh/ssh.vue"),
    meta: {
      title: "节点 SSH",
    },
  },
  {
    path: "/ssh/command",
    name: "node-command",
    component: () => import("@/views/maintenance/ssh/command.vue"),
    meta: {
      title: "节点命令",
    },
  },
  {
    path: "/ssh/command-log",
    name: "node-command-log",
    component: () => import("@/views/maintenance/ssh/command-log.vue"),
    meta: {
      title: "节点命令日志",
    },
  },
  {
    path: "/dispatch/list",
    name: "dispatch-list",
    component: () => import("@/views/maintenance/dispatch/list.vue"),
    meta: {
      title: "调度列表",
    },
  },
  {
    path: "/dispatch/log",
    name: "dispatch-log",
    component: () => import("@/views/maintenance/dispatch/log.vue"),
    meta: {
      title: "调度日志",
    },
  },
  {
    path: "/dispatch/log-read",
    name: "dispatch-log-read",
    component: () => import("@/views/maintenance/dispatch/logRead.vue"),
    meta: {
      title: "调度日志读取",
    },
  },

  {
    path: "/monitor/list",
    name: "monitor-list",
    component: () => import("@/views/maintenance/monitor/list.vue"),
    meta: {
      title: "监控列表",
    },
  },
  {
    path: "/monitor/log",
    name: "monitor-log",
    component: () => import("@/views/maintenance/monitor/log.vue"),
    meta: {
      title: "监控日志",
    },
  },
  {
    path: "/monitor/operate-log",
    name: "monitor-operate-log",
    component: () => import("@/views/maintenance/monitor/operate-log.vue"),
    meta: {
      title: "监控操作日志",
    },
  },
  {
    path: "/repository/list",
    name: "repository-list",
    component: () => import("@/views/maintenance/repository/list.vue"),
    meta: {
      title: "仓库列表",
    },
  },
  {
    path: "/build/list-info",
    name: "build-list-info",
    component: () => import("@/views/maintenance/build/list-info.vue"),
    meta: {
      title: "构建列表信息",
    },
  },
  {
    path: "/build/history",
    name: "build-history",
    component: () => import("@/views/maintenance/build/history.vue"),
    meta: {
      title: "构建历史",
    },
  },
  {
    path: "/dispatch/white-list",
    name: "dispatch-white-list",
    component: () => import("@/views/maintenance/dispatch/white-list.vue"),
    meta: {
      title: "调度白名单",
    },
  },
  {
    path: "/script/env-list",
    name: "script-env-list",
    component: () => import("@/views/maintenance/script/env.vue"),
    meta: {
      title: "脚本环境列表",
    },
  },
  {
    path: "/tools/cron",
    name: "cron-tools",
    component: () => import("@/views/maintenance/tools/cron.vue"),
    meta: {
      title: "Cron 工具",
    },
  },
  {
    path: "/tools/network",
    name: "network-tools",
    component: () => import("@/views/maintenance/tools/network.vue"),
    meta: {
      title: "网络工具",
    },
  },
  {
    path: "/file-manager/file-storage",
    name: "file-storage",
    component: () => import("@/views/maintenance/file-manager/fileStorage/list.vue"),
    meta: {
      title: "文件存储",
    },
  },
  {
    path: "/file-manager/release-task",
    name: "file-storage-release-task",
    component: () => import("@/views/maintenance/file-manager/release-task/list.vue"),
    meta: {
      title: "发布任务",
    },
  },
  {
    path: "/file-manager/static-file-storage",
    name: "static-file-storage",
    component: () => import("@/views/maintenance/file-manager/staticFileStorage/list.vue"),
    meta: {
      title: "静态文件存储",
    },
  },
  {
    path: "/certificate/list",
    name: "/certificate-list",
    component: () => import("@/views/maintenance/certificate/list.vue"),
    meta: {
      title: "证书列表",
    },
  },
];

const management = [
  {
    path: "/system/overview",
    name: "system-overview",
    component: () => import("@/views/maintenance/system/overview.vue"),
    meta: {
      title: "概览",
    },
  },
  {
    path: "/system/assets/machine-list",
    name: "system-machine-list",
    component: () => import("@/views/maintenance/system/assets/machine/machine-list.vue"),
    meta: {
      title: "节点列表",
    },
  },
  {
    path: "/system/assets/ssh-list",
    name: "system-machine-ssh-list",
    component: () => import("@/views/maintenance/system/assets/ssh/ssh-list.vue"),
    meta: {
      title: "节点 SSH 列表",
    },
  },
  {
    path: "/system/assets/docker-list",
    name: "system-machine-docker-list",
    component: () => import("@/views/maintenance/system/assets/docker/list.vue"),
    meta: {
      title: "节点 Docker 列表",
    },
  },
  {
    path: "/system/assets/repository-list",
    name: "system-global-repository",
    component: () => import("@/views/maintenance/repository/global-repository.vue"),
    meta: {
      title: "全局仓库",
    },
  },
  {
    path: "/system/assets/script-library",
    name: "system-script-library",
    component: () => import("@/views/maintenance/system/assets/script-library/script-library.vue"),
    meta: {
      title: "脚本库",
    },
  },
  {
    path: "/user/permission-group",
    name: "permission-group",
    component: () => import("@/views/maintenance/user/permission-group.vue"),
    meta: {
      title: "权限组",
    },
  },
  {
    path: "/user/list",
    name: "user-list",
    component: () => import("@/views/maintenance/user/index.vue"),
    meta: {
      title: "用户列表",
    },
  },
  {
    path: "/operation/log",
    name: "operation-log",
    component: () => import("@/views/maintenance/user/operation-log.vue"),
    meta: {
      title: "操作日志",
    },
  },
  {
    path: "/user/login-log",
    name: "user-login-log",
    component: () => import("@/views/maintenance/user/user-login-log.vue"),
    meta: {
      title: "用户登录日志",
    },
  },
  // 工作空间
  {
    path: "/system/workspace",
    name: "system-workspace",
    component: () => import("@/views/maintenance/system/workspace.vue"),
    meta: {
      title: "工作空间",
    },
  },
  {
    path: "/system/global-env",
    name: "global-env",
    component: () => import("@/views/maintenance/system/global-env.vue"),
    meta: {
      title: "全局环境",
    },
  },
  {
    path: "/system/mail",
    name: "system-mail",
    component: () => import("@/views/maintenance/system/mail.vue"),
    meta: {
      title: "邮件配置",
    },
  },
  {
    path: "/system/oauth-config",
    name: "oauth-config",
    component: () => import("@/views/maintenance/system/oauth-config.vue"),
    meta: {
      title: "OAuth 配置",
    },
  },
  {
    path: "/system/cache",
    name: "system-cache",
    component: () => import("@/views/maintenance/system/cache.vue"),
    meta: {
      title: "缓存",
    },
  },
  {
    path: "/system/log",
    name: "system-log",
    component: () => import("@/views/maintenance/system/log.vue"),
    meta: {
      title: "日志",
    },
  },
  {
    path: "/system/upgrade",
    name: "system-upgrade",
    component: () => import("@/views/maintenance/system/upgrade.vue"),
    meta: {
      title: "升级",
    },
  },
  {
    path: "/system/config",
    name: "system-config",
    component: () => import("@/views/maintenance/system/config.vue"),
    meta: {
      title: "配置",
    },
  },
  {
    path: "/system/ext-config",
    name: "ext-config",
    component: () => import("@/views/maintenance/system/ext-config.vue"),
    meta: {
      title: "扩展配置",
    },
  },
  // 数据库备份
  {
    path: "/system/backup",
    name: "system-backup",
    component: () => import("@/views/maintenance/system/backup.vue"),
    meta: {
      title: "数据库备份",
    },
  },
  {
    // Jpom 为开源软件，请基于开源协议用于商业用途
    // 二次修改不可删除或者修改版权，否则可能承担法律责任
    // 擅自修改或者删除版权信息有法律风险，请尊重开源协议，不要擅自修改版本信息，否则可能承担法律责任。
    path: "/about",
    name: "about",
    component: () => import("@/views/maintenance/layout/about.vue"),
    meta: {
      title: "关于",
    },
  },
];
export default [
  {
    path: "/management",
    name: "management",
    component: () => import("@/views/maintenance/layout/index.vue"),
    meta: {
      title: "运维监控",
    },
    children: children.map((item: any) => {
      const props = item.props || {};
      props.routerUrl = item.path;
      item.props = props;
      return item;
    }),
  },
  {
    path: "/install",
    name: "install",
    component: () => import("@/views/maintenance/login/install.vue"),
    meta: {
      title: "安装",
    },
  },
  {
    path: "/full-terminal",
    name: "full-terminal",
    component: () => import("@/views/maintenance/ssh/full-terminal.vue"),
    meta: {
      title: "全屏终端",
    },
  },
  {
    path: "/ssh-tabs",
    name: "ssh-tabs",
    component: () => import("@/views/maintenance/ssh/ssh-tabs.vue"),
    meta: {
      title: "SSH 标签",
    },
  },
  {
    path: "/404",
    name: "404",
    component: () => import("@/views/maintenance/404/index.vue"),
    meta: {
      title: "404",
    },
  },

  {
    path: "/prohibit-access",
    name: "ipAccess",
    component: () => import("@/views/maintenance/layout/ipAccess.vue"),
    meta: {
      title: "IP 访问限制",
    },
  },
  {
    path: "/system/management",
    name: "sys-management",
    component: () => import("@/views/maintenance/layout/management.vue"),
    meta: {
      title: "系统管理",
    },
    children: management.map((item: any) => {
      const props = item.props || {};
      props.routerUrl = item.path;
      props.mode = "management";
      item.props = props;
      //
      const meta = item.meta || {};
      meta.mode = props.mode;
      item.meta = meta;
      return item;
    }),
  },
] satisfies Array<RouteConfigsTable>;
