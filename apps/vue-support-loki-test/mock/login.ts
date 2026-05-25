import { defineFakeRoute } from "vite-plugin-fake-server/client";

export default defineFakeRoute([
  {
    url: "/login",
    method: "post",
    response: () => {
      return {
        success: true,
        data: {
          avatar: "",
          username: "admin",
          nickname: "Loki测试",
          roles: ["admin"],
          accessToken: "mock-token-loki",
          refreshToken: "mock-refresh-loki",
          expires: "2030/12/31 00:00:00"
        }
      };
    }
  }
]);
