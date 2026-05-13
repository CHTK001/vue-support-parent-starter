// Stub: @techui/locales wrapper to provide default export
// @techui/scifi expects `import Wi from "@techui/locales"` but the actual
// package has no exports (side-effects only via tLang.register()).

// Re-export original side-effect behavior
import "@techui/locales";

// Provide empty default export for @techui/scifi compatibility
const locales = {};
export default locales;
