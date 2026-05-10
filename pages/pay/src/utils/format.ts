export function formatCurrency(value?: number | string | null, precision = 2): string {
  const amount = Number(value ?? 0);
  return `¥${Number.isFinite(amount) ? amount.toFixed(precision) : "0.00"}`;
}

export function formatCurrency4(value?: number | string | null): string {
  return formatCurrency(value, 4);
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "-";
  return String(value).replace("T", " ");
}

export function normalizeTableResult<T>(records?: T[], total?: number) {
  return {
    data: records ?? [],
    total: Number(total ?? records?.length ?? 0),
  };
}

export function formatRefreshSeconds(value?: number): string {
  const seconds = Number(value || 0);
  if (!seconds) return "60 秒";
  if (seconds >= 60) {
    const minutes = seconds / 60;
    return `${Number.isInteger(minutes) ? minutes : minutes.toFixed(1)} 分钟`;
  }
  return `${seconds} 秒`;
}
