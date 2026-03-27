import { defineFakeRoute } from "vite-plugin-fake-server/client";

export default defineFakeRoute([
  {
    url: "/system/api/v2/user/refresh-token",
    method: "post",
    response: ({ body }) => {
      if (body.refreshToken) {
        return {
          success: true,
          code: 200,
          data: {
            accessToken: "eyJhbGciOiJIUzUxMiJ9.systemRefresh",
            refreshToken: "eyJhbGciOiJIUzUxMiJ9.systemRefreshNext",
            expires: "2030/10/30 23:59:59",
            isRemembered: true,
            userInfo: {
              sysUserId: 1,
              sysUserUsername: "admin",
              sysUserNickname: "开发管理员",
              sysUserPhone: "13800000000",
              sysUserEmail: "admin@example.com",
              avatar: "https://avatars.githubusercontent.com/u/44761321",
              tenantId: "system-dev",
              roles: ["admin"],
              perms: ["system:*:*", "manage:user:page", "manage:role:page"],
            },
          },
        };
      }

      return {
        success: false,
        code: 401,
        data: {},
      };
    },
  },
]);
