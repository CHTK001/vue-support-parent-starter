export interface JobPageGuideMedia {
  title: string;
  src: string;
  caption: string;
}

export interface JobPageGuideSection {
  key: string;
  title: string;
  description: string;
  bullets: string[];
  example?: string;
  media?: JobPageGuideMedia[];
}

export interface JobPageGuideDefinition {
  pageKey: string;
  title: string;
  summary: string;
  quickTips: string[];
  sections: JobPageGuideSection[];
}

const GUIDE_MEDIA = {
  list: {
    title: "任务列表页示意",
    src: "/guide-images/job-list-overview.png",
    caption: "任务列表页用于快速筛选任务、查看状态、进入配置和执行一次。",
  },
  log: {
    title: "任务日志页示意",
    src: "/guide-images/job-log-overview.png",
    caption: "日志页用于按时间、状态、执行器和环境定位执行记录与失败原因。",
  },
  basic: {
    title: "基础配置页示意",
    src: "/guide-images/job-basic-config.png",
    caption: "基础配置决定任务归属、执行器、运行模式和处理器名称。",
  },
  schedule: {
    title: "调度配置页示意",
    src: "/guide-images/job-schedule-config.png",
    caption: "调度配置页用于设置 Cron、固定频率和运行参数。",
  },
  advanced: {
    title: "高级策略页示意",
    src: "/guide-images/job-advanced-config.png",
    caption: "高级策略控制路由、过期补偿、阻塞策略、超时和重试。",
  },
} as const;

const PAGE_GUIDES: Record<string, JobPageGuideDefinition> = {
  info: {
    pageKey: "info",
    title: "任务列表使用指南",
    summary:
      "任务列表页主要负责查找、辨认和操作任务。建议先筛选，再看状态和调度信息，最后再进入编辑或执行。",
    quickTips: [
      "先按执行器和状态缩小范围，避免直接在全量列表里找任务。",
      "执行前先看调度类型、Cron 和运行环境，避免误触发。",
      "变更任务建议从列表进入编辑页，不要直接凭记忆修改。",
    ],
    sections: [
      {
        key: "filters",
        title: "先用搜索和筛选缩小范围",
        description:
          "顶部搜索框适合按任务名称和描述查找，任务组用于限制到具体执行器，任务状态用于快速区分运行中和已停止的任务。",
        bullets: [
          "批量排查时先选执行器，再配合状态筛选，定位会快很多。",
          "如果任务很多，优先通过关键词搜索业务名或处理器名。",
          "新任务创建入口放在右上角，列表页就是日常管理主入口。",
        ],
        example: "示例: 先选择 payment 执行器，再搜索 timeout 或 notify。",
        media: [GUIDE_MEDIA.list],
      },
      {
        key: "cards",
        title: "卡片上的信息决定你能不能安全操作",
        description:
          "每张任务卡都会同时展示状态、负责人、环境、调度类型、Cron 和运行模式。操作前先核对这些信息，避免对错环境或错任务动手。",
        bullets: [
          "绿色状态条表示任务在运行，红色表示已停止。",
          "调度类型和 Cron 可以直接判断任务是否为高频轮询或固定时点任务。",
          "任务类型会标出 BEAN 或脚本等模式，便于你判断后续该看哪类配置。",
        ],
        example: "示例: 运行中的 prod 任务，执行前必须确认是否允许手动触发。",
        media: [GUIDE_MEDIA.list, GUIDE_MEDIA.schedule],
      },
      {
        key: "actions",
        title: "操作菜单和底部按钮分别解决不同场景",
        description:
          "底部按钮偏高频操作，例如执行一次、启动和停止；右上角更多菜单用于编辑、复制、查看执行计划和历史日志。",
        bullets: [
          "想调整配置时走“编辑任务”，不要直接复制旧任务后再手工同步所有字段。",
          "执行计划用于验证 Cron 是否正确，改复杂表达式前最好先看一次。",
          "日志入口会带着任务上下文进入日志页，适合定位最近一次失败。",
        ],
        example: "示例: 改完 Cron 先看“执行计划”，确认下次触发时间再保存。",
        media: [GUIDE_MEDIA.list, GUIDE_MEDIA.basic, GUIDE_MEDIA.advanced],
      },
    ],
  },
  log: {
    pageKey: "log",
    title: "执行日志使用指南",
    summary:
      "日志页负责观察趋势、筛选历史记录和定位失败原因。建议先看趋势，再按时间和执行器过滤，最后打开详情或日志正文。",
    quickTips: [
      "先看近七日趋势，能快速判断是偶发失败还是持续异常。",
      "筛选时优先锁定执行器和时间范围，再看环境和状态。",
      "失败日志要同时看调度结果、耗时和错误信息，别只看一列。",
    ],
    sections: [
      {
        key: "trend",
        title: "趋势图先帮你判断问题规模",
        description:
          "页面顶部的近七日执行趋势会同时展示成功和失败数量，适合先判断问题是持续性、突发性，还是只在某个时间段出现。",
        bullets: [
          "如果失败曲线突然抬升，先核对最近发布、配置变更或外部依赖波动。",
          "成功和失败都下降时，要考虑调度是否根本没触发。",
          "趋势图适合做全局判断，具体定位还得结合下方表格。",
        ],
        media: [GUIDE_MEDIA.log],
      },
      {
        key: "filters",
        title: "筛选条件决定你看到的日志是否可信",
        description:
          "日志量大时必须先限定时间范围，再按状态、执行器和环境收敛范围，否则很容易把别的实例或旧日志当成本次问题。",
        bullets: [
          "时间范围建议先从最近 24 小时开始，再逐步扩大。",
          "执行器和环境要和任务所在实例对应，避免混入其他应用记录。",
          "清理日志之前先确认是否已经导出或完成排障，防止误删证据。",
        ],
        example: "示例: 先筛选最近 1 天 + payment 执行器 + prod 环境。",
        media: [GUIDE_MEDIA.log],
      },
      {
        key: "analysis",
        title: "定位失败要结合状态、耗时和详细日志",
        description:
          "表格中的调度结果、执行耗时和错误信息可以先做初步判断；如果仍不够，再打开详情或日志正文查看完整上下文。",
        bullets: [
          "红色结果标签表示触发或执行失败，优先点开详情确认返回码和上下文。",
          "耗时突然变长通常意味着外部依赖变慢、阻塞或重试。",
          "“查看日志”适合看完整输出，“查看详情”适合看结构化字段。",
        ],
        example: "示例: 先按失败筛选，再挑选最近一条耗时最高的记录进入详情。",
        media: [GUIDE_MEDIA.log, GUIDE_MEDIA.advanced],
      },
    ],
  },
};

export function getJobPageGuide(pageKey: string): JobPageGuideDefinition | null {
  return PAGE_GUIDES[pageKey] || null;
}
