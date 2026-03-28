import { defineFakeRoute } from "vite-plugin-fake-server/client";

const permissionRouter = {
  path: "/permission",
  meta: {
    title: "menus.purePermission",
    icon: "ep:lollipop",
    rank: 10,
  },
  children: [
    {
      path: "/permission/page/index",
      name: "PermissionPage",
      meta: {
        title: "menus.purePermissionPage",
        roles: ["admin", "common"],
      },
    },
    {
      path: "/permission/button/index",
      name: "PermissionButton",
      meta: {
        title: "menus.purePermissionButton",
        roles: ["admin", "common"],
        auths: [
          "permission:btn:add",
          "permission:btn:edit",
          "permission:btn:delete",
        ],
      },
    },
  ],
};

export default defineFakeRoute([
  {
    url: "/monitor/api/v2/user/menu",
    method: "get",
    response: () => ({
      success: true,
      code: 200,
      data: [permissionRouter],
    }),
  },
]);
