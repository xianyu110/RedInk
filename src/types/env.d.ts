/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_API_BASE_URL: string
  // 更多环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'file-saver' {
  export function saveAs(data: Blob, filename: string): void;
  export default saveAs;
}