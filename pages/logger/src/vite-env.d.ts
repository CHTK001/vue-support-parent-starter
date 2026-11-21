/// <reference types="vite/client" />

/** createVite 注入的环境变量（见 turbo/vite/createVite.ts 的 define） */
interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
