/// <reference types="vite/client" />

declare module "virtual:news-data" {
  const newsData: Record<
    string,
    Array<{
      id: string;
      title: string;
      date: string;
      content: string;
    }>
  >;

  export default newsData;
}
