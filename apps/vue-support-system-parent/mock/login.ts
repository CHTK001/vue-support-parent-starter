import { defineFakeRoute } from "vite-plugin-fake-server/client";

const buildUserPayload = (role: "admin" | "common") => {
  const isAdmin = role === "admin";

  return {
    accessToken: `eyJhbGciOiJIUzUxMiJ9.${role}`,
    refreshToken: `eyJhbGciOiJIUzUxMiJ9.${role}Refresh`,
    expires: "2030/10/30 00:00:00",
    isRemembered: true,
    userInfo: {
      sysUserId: isAdmin ? 1 : 2,
      sysUserUsername: role,
      sysUserNickname: isAdmin ? "开发管理员" : "开发访客",
      sysUserPhone: "13800000000",
      sysUserEmail: `${role}@example.com`,
      avatar: isAdmin
        ? "https://avatars.githubusercontent.com/u/44761321"
        : "https://avatars.githubusercontent.com/u/52823142",
      tenantId: "system-dev",
      roles: [role],
      perms: isAdmin
        ? ["system:*:*", "manage:user:page", "manage:role:page"]
        : ["manage:user:page"],
    },
  };
};

export default defineFakeRoute([
  {
    url: "/system/api/v2/user/login",
    method: "post",
    response: ({ body }) => {
      if (body.username === "admin") {
        return {
          success: true,
          code: 200,
          data: buildUserPayload("admin"),
        };
      }

      return {
        success: true,
        code: 200,
        data: buildUserPayload("common"),
      };
    },
  },
  {
    url: "/system/api/v2/user/logout",
    method: "delete",
    response: () => ({
      success: true,
      code: 200,
      data: true,
    }),
  },
]);
