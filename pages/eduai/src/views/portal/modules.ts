/**
 * 学生端功能模块目录
 *
 * 三个学段的功能卡片不同（小学 6 个 / 初中 8 个 / 高中 8 个），
 * 这里集中维护「有哪些模块、叫什么、什么图标与配色」；
 * 学习进度不在这里 —— 进度来自后端 edu_student_progress，按 moduleCode 对上即可。
 *
 * moduleCode 是**稳定键**，一旦上线不要改名，否则已有的学习进度会对不上。
 */

/** 学段标识，与后端 edu_student.student_grade_level 一致 */
export type Stage = "PRIMARY" | "JUNIOR" | "SENIOR";

/** 一个功能模块 */
export interface PortalModule {
  /** 稳定编码，进度按它关联 */
  moduleCode: string;
  /** 卡片标题 */
  title: string;
  /** 卡片副标题（一句话说明） */
  subtitle: string;
  /** 卡片图标（emoji，与仓库其它页面风格一致） */
  icon: string;
  /** 图标底色（渐变起点） */
  color: string;
  /** 图标底色（渐变终点） */
  colorTo: string;
  /** 未完成项角标（小学端用；由学习进度推导，这里只给阈值口径） */
  badgeFromIncomplete?: boolean;
  /** 目标路由（后台配置 module_path 时优先用它；缺省时用内置映射） */
  route?: string;
}

/** 小学端：活泼可爱，6 个模块 */
export const PRIMARY_MODULES: PortalModule[] = [
  { moduleCode: "idiom-game", title: "成语消消乐", subtitle: "拼成语·练思维", icon: "🀄", color: "#3b82f6", colorTo: "#60a5fa", badgeFromIncomplete: true },
  { moduleCode: "fun-math", title: "趣味数学", subtitle: "口算闯关·玩中学", icon: "🔢", color: "#f59e0b", colorTo: "#fbbf24" },
  { moduleCode: "poetry", title: "诗词大会", subtitle: "背古诗·集诗词", icon: "📜", color: "#22c55e", colorTo: "#4ade80" },
  { moduleCode: "english-word", title: "英语单词", subtitle: "记单词·赢奖杯", icon: "🔤", color: "#a855f7", colorTo: "#c084fc", badgeFromIncomplete: true },
  { moduleCode: "science-lab", title: "科学小实验", subtitle: "动手做·探奥秘", icon: "🏆", color: "#06b6d4", colorTo: "#22d3ee", badgeFromIncomplete: true },
  { moduleCode: "story-book", title: "故事绘本", subtitle: "听故事·读绘本", icon: "📖", color: "#ec4899", colorTo: "#f472b6" },
  { moduleCode: "my-records", title: "我的答题", subtitle: "看批改·查得分", icon: "📝", color: "#0ea5e9", colorTo: "#38bdf8" },
  { moduleCode: "wrongbook", title: "错题本", subtitle: "错题重练·订正", icon: "🗂️", color: "#ef4444", colorTo: "#f87171" },
];

/** 初中端：简洁现代，8 个模块 */
export const JUNIOR_MODULES: PortalModule[] = [
  { moduleCode: "idiom-game", title: "成语消消乐", subtitle: "成语连连消消乐", icon: "🀄", color: "#2563eb", colorTo: "#3b82f6" },
  { moduleCode: "fun-math", title: "趣味数学", subtitle: "数学趣味闯关", icon: "🔢", color: "#f59e0b", colorTo: "#fbbf24" },
  { moduleCode: "poetry", title: "诗词大会", subtitle: "诗词积累与赏析", icon: "📜", color: "#22c55e", colorTo: "#4ade80" },
  { moduleCode: "english-word", title: "英语单词", subtitle: "词根词缀记单词", icon: "🔤", color: "#8b5cf6", colorTo: "#a78bfa" },
  { moduleCode: "physics-lab", title: "物理实验", subtitle: "力学电学实验", icon: "🧪", color: "#06b6d4", colorTo: "#22d3ee" },
  { moduleCode: "chemistry", title: "化学探秘", subtitle: "元素与反应探秘", icon: "⚗️", color: "#ef4444", colorTo: "#f87171" },
  { moduleCode: "history", title: "历史故事", subtitle: "朝代与人物故事", icon: "🏛️", color: "#eab308", colorTo: "#facc15" },
  { moduleCode: "geography", title: "地理探索", subtitle: "山川与气候探索", icon: "🗺️", color: "#0ea5e9", colorTo: "#38bdf8" },
  { moduleCode: "my-records", title: "我的答题", subtitle: "看批改·查得分", icon: "📝", color: "#0ea5e9", colorTo: "#38bdf8" },
  { moduleCode: "wrongbook", title: "错题本", subtitle: "错题重练·订正", icon: "🗂️", color: "#ef4444", colorTo: "#f87171" },
];

/** 高中端：专业克制，8 个模块 */
export const SENIOR_MODULES: PortalModule[] = [
  { moduleCode: "idiom-game", title: "成语消消乐", subtitle: "成语专项", icon: "🀄", color: "#2563eb", colorTo: "#3b82f6" },
  { moduleCode: "math-special", title: "数学专项", subtitle: "函数与导数", icon: "📦", color: "#f59e0b", colorTo: "#fbbf24" },
  { moduleCode: "chinese-reading", title: "语文阅读", subtitle: "现代文阅读", icon: "📄", color: "#22c55e", colorTo: "#4ade80" },
  { moduleCode: "english-listening", title: "英语听力", subtitle: "听力精练", icon: "🎧", color: "#2563eb", colorTo: "#60a5fa" },
  { moduleCode: "physics-mechanics", title: "物理力学", subtitle: "受力与运动", icon: "🧭", color: "#8b5cf6", colorTo: "#a78bfa" },
  { moduleCode: "chemistry-topic", title: "化学专题", subtitle: "反应原理", icon: "⚗️", color: "#06b6d4", colorTo: "#22d3ee" },
  { moduleCode: "biology-lab", title: "生物实验", subtitle: "实验与探究", icon: "🔬", color: "#ef4444", colorTo: "#f87171" },
  { moduleCode: "wrong-drill", title: "错题集训", subtitle: "错题重练", icon: "🗂️", color: "#eab308", colorTo: "#facc15" },
  { moduleCode: "my-records", title: "我的答题", subtitle: "看批改·查得分", icon: "📝", color: "#0ea5e9", colorTo: "#38bdf8" },
  { moduleCode: "wrongbook", title: "错题本", subtitle: "错题重练·订正", icon: "🗂️", color: "#ef4444", colorTo: "#f87171" },
];

/**
 * 学段归一化：把「PRIMARY / primary / 小学」等写法统一成 {@link Stage}。
 *
 * <p>后端已归一化下发的 stage，但库里存量数据可能是中文（管理员手填班级学段），
 * 前端再兜一层，避免 {@code stage === "PRIMARY"} 判不中而落到其它学段版式
 * （实测：小学学生因此显示了高中版式）。</p>
 *
 * @param v 原始学段值
 * @returns 归一化后的学段；无法识别或缺省时按小学处理
 */
export function normalizeStage(v?: string | null): Stage {
  const raw = (v ?? "").trim();
  const upper = raw.toUpperCase();
  if (upper === "PRIMARY" || raw === "小学") {
    return "PRIMARY";
  }
  if (upper === "JUNIOR" || raw === "初中" || raw === "初级中学") {
    return "JUNIOR";
  }
  if (upper === "SENIOR" || raw === "高中" || upper === "UNIVERSITY" || raw === "大学") {
    return "SENIOR";
  }
  return "PRIMARY";
}

/**
 * 按学段取模块目录
 *
 * <p>返回**副本**：调用方（学生端「全部功能」）会往里追加后台配置的模块，
 * 直接返回常量数组会把追加结果留在模块级常量上，跨调用污染内置目录。</p>
 *
 * @param stage 学段
 * @returns 该学段的模块列表（新数组）
 */
export function modulesOf(stage?: string | null): PortalModule[] {
  switch (stage) {
    case "PRIMARY":
      return [...PRIMARY_MODULES];
    case "SENIOR":
      return [...SENIOR_MODULES];
    case "JUNIOR":
      return [...JUNIOR_MODULES];
    default:
      return [...PRIMARY_MODULES];
  }
}

/**
 * 学段中文名
 *
 * @param stage 学段
 * @returns 中文名
 */
export function stageLabel(stage?: string | null): string {
  switch (stage) {
    case "PRIMARY":
      return "小学";
    case "JUNIOR":
      return "初中";
    case "SENIOR":
      return "高中";
    default:
      return "小学";
  }
}

/**
 * 某模块的进度（0-100）
 *
 * @param rows 后端返回的进度行
 * @param moduleCode 模块编码
 * @returns 0-100；没有记录时为 0
 */
export function progressOf(rows: { moduleCode: string; progress: number }[] | undefined, moduleCode: string): number {
  const hit = (rows ?? []).find((r) => r.moduleCode === moduleCode);
  return hit ? Math.max(0, Math.min(100, hit.progress ?? 0)) : 0;
}
