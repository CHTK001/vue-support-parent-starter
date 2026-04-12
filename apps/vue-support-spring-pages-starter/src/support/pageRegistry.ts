export interface SpringPageDefinition {
  key: string;
  title: string;
  description: string;
  eyebrow: string;
  outputDir: string;
}

export const springPageDefinitions: SpringPageDefinition[] = [
  {
    key: "job-console",
    title: "Job Control Console",
    description:
      "在 Spring 模块内直接管理命名空间任务、调度表达式、远程分发和执行日志。",
    eyebrow: "Scheduler Starter",
    outputDir: "job-console",
  },
  {
    key: "payment-console",
    title: "Payment Operations Console",
    description:
      "在 Spring 模块内直接查看回调诊断、调度任务、通知异常与最近日志。",
    eyebrow: "Payment Starter",
    outputDir: "payment-console",
  },
  {
    key: "proxy-console",
    title: "Proxy Orchestration Console",
    description:
      "在 Spring 模块内直接管理代理实例状态、过滤链编排和最近运行日志。",
    eyebrow: "Proxy Starter",
    outputDir: "proxy-console",
  },
  {
    key: "spider-console",
    title: "Spider Console",
    description:
      "在 Spring 模块内直接维护爬虫任务、节点编排、XPath 可视化和数据库输出表结构。",
    eyebrow: "Spider Starter",
    outputDir: "spider-console",
  },
  {
    key: "strategy-console",
    title: "Strategy Console",
    description:
      "在 Spring 模块内直接维护限流策略，并查看策略运行指标与最近限流记录。",
    eyebrow: "Strategy Starter",
    outputDir: "strategy-console",
  },
  {
    key: "sync-data-console",
    title: "Sync Data Console",
    description:
      "在 Spring 模块内直接管理同步任务、基础表、监控告警和 SPI 连通性。",
    eyebrow: "Sync Data Starter",
    outputDir: "sync-data-console",
  },
];

export function getSpringPageDefinition(
  key: string,
): SpringPageDefinition | undefined {
  return springPageDefinitions.find((item) => item.key === key);
}
