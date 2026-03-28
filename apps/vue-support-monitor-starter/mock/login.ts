import { defineFakeRoute } from "vite-plugin-fake-server/client";

const buildUserPayload = (role: "admin" | "common", username: string) => {
  const isAdmin = role === "admin";

  return {
    accessToken: `eyJhbGciOiJIUzUxMiJ9.${role}`,
    refreshToken: `eyJhbGciOiJIUzUxMiJ9.${role}Refresh`,
    expires: "2030/10/30 00:00:00",
    isRemembered: true,
    userInfo: {
      sysUserId: isAdmin ? 1 : 2,
      sysUserUsername: username,
      sysUserNickname: isAdmin ? "开发管理员" : "开发访客",
      sysUserPhone: "13800000000",
      sysUserEmail: `${username}@example.com`,
      avatar: isAdmin
        ? "https://avatars.githubusercontent.com/u/44761321"
        : "https://avatars.githubusercontent.com/u/52823142",
      tenantId: "monitor-dev",
      roles: [role],
      perms: isAdmin
        ? ["monitor:*:*", "manage:user:page", "manage:role:page"]
        : ["manage:user:page"],
    },
  };
};

export default defineFakeRoute([
  {
    url: "/monitor/api/v2/user/login",
    method: "post",
    response: ({ body }) => {
      const username = body?.username === "sa" ? "admin" : body?.username;

      if (username === "admin") {
        return {
          success: true,
          code: 200,
          data: buildUserPayload("admin", body?.username || "admin"),
        };
      }

      return {
        success: true,
        code: 200,
        data: buildUserPayload("common", username || "common"),
      };
    },
  },
  {
    url: "/monitor/api/v2/user/logout",
    method: "delete",
    response: () => ({
      success: true,
      code: 200,
      data: true,
    }),
  },
]);
