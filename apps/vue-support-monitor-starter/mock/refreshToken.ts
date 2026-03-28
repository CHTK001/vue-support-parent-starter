import { defineFakeRoute } from "vite-plugin-fake-server/client";

export default defineFakeRoute([
  {
    url: "/monitor/api/v2/user/refresh-token",
    method: "post",
    response: ({ body }) => {
      if (!body?.refreshToken) {
        return {
          success: false,
          code: 400,
          data: {},
        };
      }

      return {
        success: true,
        code: 200,
        data: {
          accessToken: "eyJhbGciOiJIUzUxMiJ9.newAdmin",
          refreshToken: "eyJhbGciOiJIUzUxMiJ9.newAdminRefresh",
          expires: "2030/10/30 23:59:59",
        },
      };
    },
  },
]);
