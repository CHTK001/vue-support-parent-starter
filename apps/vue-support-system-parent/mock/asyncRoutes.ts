import { defineFakeRoute } from "vite-plugin-fake-server/client";

const homeMenu = {
  path: "/",
  name: "Home",
  redirect: "/home",
  meta: {
    title: "工作台",
    icon: "ep:home-filled",
    rank: 0,
  },
  children: [
    {
      path: "/home",
      name: "home",
      component: "/home/index",
      meta: {
        title: "工作台",
        icon: "ep:home-filled",
        showLink: true,
      },
    },
  ],
};

export default defineFakeRoute([
  {
    url: "/system/api/v2/user/menu",
    method: "get",
    response: () => {
      return {
        success: true,
        code: 200,
        data: [homeMenu],
      };
    },
  },
]);
