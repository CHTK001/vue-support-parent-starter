export interface SkillInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  path: string;
  enabled: boolean;
  author?: string;
  version?: string;
}

export const SKILL_CATEGORIES = [
  { id: "all", name: "全部" },
  { id: "code", name: "代码" },
  { id: "search", name: "搜索" },
  { id: "ui", name: "UI" },
  { id: "data", name: "数据" },
  { id: "devops", name: "运维" },
  { id: "other", name: "其他" }
] as const;

export const BUILTIN_SKILLS: SkillInfo[] = [
  {
    id: "agent-browser",
    name: "agent-browser",
    description: "Browser automation CLI for AI agents",
    category: "ui",
    path: "~/.agents/skills/agent-browser/SKILL.md",
    enabled: true,
    author: "MiMoCode",
    version: "1.0.0"
  },
  {
    id: "code-refactoring",
    name: "code-refactoring",
    description: "Simplify and refactor code while preserving behavior",
    category: "code",
    path: "~/.agents/skills/code-refactoring/SKILL.md",
    enabled: true,
    author: "MiMoCode",
    version: "1.0.0"
  },
  {
    id: "code-review",
    name: "code-review",
    description: "审查代码变更，优先发现缺陷、回归和缺失测试",
    category: "code",
    path: "~/.agents/skills/code-review/SKILL.md",
    enabled: true,
    author: "MiMoCode",
    version: "1.0.0"
  },
  {
    id: "bug-hunt",
    name: "bug-hunt",
    description: "复现并定位问题，给出最小修复和验证路径",
    category: "code",
    path: "~/.agents/skills/bug-hunt/SKILL.md",
    enabled: true,
    author: "MiMoCode",
    version: "1.0.0"
  },
  {
    id: "frontend-design",
    name: "frontend-design",
    description: "Create distinctive, production-grade frontend interfaces",
    category: "ui",
    path: "~/.agents/skills/frontend-design/SKILL.md",
    enabled: true,
    author: "MiMoCode",
    version: "1.0.0"
  },
  {
    id: "ui-ux-pro-max",
    name: "ui-ux-pro-max",
    description: "UI/UX design intelligence with 50 styles and 21 palettes",
    category: "ui",
    path: "~/.agents/skills/0-ui-ux-pro-max/SKILL.md",
    enabled: true,
    author: "MiMoCode",
    version: "1.0.0"
  },
  {
    id: "playwright-master",
    name: "playwright-master",
    description: "Browser automation expert - E2E tests, web scraping, UI testing",
    category: "ui",
    path: "~/.agents/skills/playwright-master/SKILL.md",
    enabled: true,
    author: "MiMoCode",
    version: "1.0.0"
  },
  {
    id: "web-search",
    name: "web-search",
    description: "Web search and content extraction with Tavily and Exa",
    category: "search",
    path: "~/.agents/skills/web-search/SKILL.md",
    enabled: true,
    author: "MiMoCode",
    version: "1.0.0"
  },
  {
    id: "imagegen",
    name: "imagegen",
    description: "Generate or edit raster images with AI",
    category: "data",
    path: "~/.codex/skills/.system/imagegen/SKILL.md",
    enabled: true,
    author: "Codex",
    version: "1.0.0"
  },
  {
    id: "skill-creator",
    name: "skill-creator",
    description: "Guide for creating effective skills",
    category: "code",
    path: "~/.codex/skills/.system/skill-creator/SKILL.md",
    enabled: true,
    author: "Codex",
    version: "1.0.0"
  },
  {
    id: "tmux",
    name: "tmux",
    description: "Remote-control tmux sessions for interactive CLIs",
    category: "devops",
    path: "~/.agents/skills/tmux/SKILL.md",
    enabled: true,
    author: "MiMoCode",
    version: "1.0.0"
  },
  {
    id: "pua",
    name: "pua",
    description: "Forces high-agency exhaustive problem-solving with PUA pressure",
    category: "other",
    path: "~/.agents/skills/pua/SKILL.md",
    enabled: true,
    author: "MiMoCode",
    version: "1.0.0"
  }
];
