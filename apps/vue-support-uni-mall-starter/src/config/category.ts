export const getCategoryPagePath = (categoryId?: string): string => {
  switch (categoryId) {
    case "desk":
      return "/pages/category/desk";
    case "travel":
      return "/pages/category/travel";
    case "wellness":
      return "/pages/category/wellness";
    case "kitchen":
    default:
      return "/pages/category/index";
  }
};
