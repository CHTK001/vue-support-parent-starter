/** 声明 vite 环境变量的类型（如果未声明则默认是determine） */
declare interface ViteEnv {
  VITE_PORT: number;
  VITE_PUBLIC_PATH: string;
  VITE_ROUTER_HISTORY: string;
  VITE_CDN: boolean;
  NODE_ENV: string;
  VITE_HIDE_HOME: string;
  VITE_COMPRESSION: ViteCompression;
  VITE_API_PREFIX: string;
  VITE_API_URL: string;
  [key: string]: any;
}

/** 压缩类型 */
declare type ViteCompression =
  | "none"
  | "gzip"
  | "brotli"
  | "both"
  | "gzip-clear"
  | "brotli-clear"
  | "both-clear";
