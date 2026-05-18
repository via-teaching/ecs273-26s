/// <reference types="vite/client" />

declare module "virtual:stock-news" {
  const newsFiles: Array<{
    path: string;
    content: string;
  }>;

  export default newsFiles;
}
