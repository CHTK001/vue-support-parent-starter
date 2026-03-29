import { unref } from "vue";
import type { OptionsType } from "./type";

export function normalizeSegmentedOptions(options: unknown): OptionsType[] {
  const resolvedOptions = unref(options as any);
  return Array.isArray(resolvedOptions) ? resolvedOptions : [];
}
