/** ReScrollNav 暴露的能力（供 ref 类型标注） */
export type ReScrollNavExpose = {
  updateScrollState: () => void;
  scrollByDirection: (direction: "prev" | "next") => void;
  scrollToSelector: (selector: string) => void;
  scrollable: Readonly<{ value: boolean }>;
  canScrollPrev: Readonly<{ value: boolean }>;
  canScrollNext: Readonly<{ value: boolean }>;
};
