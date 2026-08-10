export type SchedulerStrategy = "service-worker" | "web-worker" | "interval";

export interface SchedulerOptions {
  name: string;
  interval: number;
  onTick: () => void | Promise<void>;
  immediate?: boolean;
}

export interface Scheduler {
  start(): void;
  stop(): void;
  destroy(): void;
  readonly strategy: SchedulerStrategy;
}

export type SchedulerTickMessage = { type: "tick" };