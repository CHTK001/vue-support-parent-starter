import { $t } from "@repo/config";

export default [
  {
    path: "/project-system",
    name: "projectSystem",
    meta: {
      icon: "ep:monitor",
      title: "项目管理",
      showLink: true,
      rank: 1,
    },
    children: [
      {
        path: "/project",
        name: "project",
        component: async () => {
          const { ProjectIndex } = await import("@pages/project");
          return ProjectIndex;
        },
        meta: {
          icon: "line-md:bell-twotone-loop",
          title: "项目管理",
          showLink: true,
          showParent: true,
        },
      },
    ],
  },
];
