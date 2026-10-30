/**
 * 环境桩：让 HostFormDialog 在 jsdom 里跑时不依赖后端与 router。
 */
vi.mock("../api", () => ({
  getHost: vi.fn().mockResolvedValue(undefined),
  listBoundIdentities: vi.fn().mockResolvedValue([]),
  bindIdentity: vi.fn().mockResolvedValue(undefined),
  saveHost: vi.fn().mockResolvedValue({ id: 1 }),
  testPrometheusHost: vi.fn().mockResolvedValue(undefined),
  fetchLocalAddress: vi.fn().mockResolvedValue(undefined),
  getIdentities: vi.fn().mockResolvedValue([]),
}));

vi.mock("@repo/core", () => ({
  message: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock("vue-router", () => ({
  useRouter: () => ({} as unknown as Record<string, unknown>),
}));
