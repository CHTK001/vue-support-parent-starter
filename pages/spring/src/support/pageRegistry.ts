import type { Component } from "vue";
import JobConsolePage from "../views/job/JobConsolePage.vue";
import PaymentConsolePage from "../views/payment/PaymentConsolePage.vue";

export interface SpringPageDefinition {
  key: string;
  title: string;
  description: string;
  eyebrow: string;
  outputDir: string;
  component: Component;
}

export const springPageDefinitions: SpringPageDefinition[] = [
  {
    key: "job-console",
    title: "Job Control Console",
    description: "在 Spring 模块内直接管理命名空间任务、调度表达式、远程分发和执行日志。",
    eyebrow: "Scheduler Starter",
    outputDir: "job-console",
    component: JobConsolePage,
  },
  {
    key: "payment-console",
    title: "Payment Operations Console",
    description: "在 Spring 模块内直接查看回调诊断、调度任务、通知异常与最近日志。",
    eyebrow: "Payment Starter",
    outputDir: "payment-console",
    component: PaymentConsolePage,
  },
];

export function getSpringPageDefinition(
  key: string,
): SpringPageDefinition | undefined {
  return springPageDefinitions.find((item) => item.key === key);
}
