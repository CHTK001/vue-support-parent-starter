# Changelog

All notable changes to this project will be documented in this file.

## [2.2.4] - 2026-02-11

### Added
- **ScSelect**: Integrated `PositionLayout` for theme animation direction settings in `BaseSetting.vue`.
- **Theme Animation**: Added support for center-based animation directions (`top-center`, `bottom-center`, `left-center`, `right-center`) in `useThemeAnimation.ts`.

### Removed
- **Cyberpunk Theme**: Fully removed Cyberpunk theme and related assets to optimize bundle size and prevent style conflicts.

### Changed
- **BaseSetting**: Replaced text-based theme animation position selector with visual `ScSelect` PositionLayout grid.

## [2.2.3] - 2026-02-10

### Added
- **Theme Animation**:
  - Implemented View Transitions API based theme switch animation.
  - Added configurable animation directions (top-left, top-right, bottom-left, bottom-right, center, etc.).
  - Added "Random" animation mode and "Cursor" follower mode.
  - Integrated animation settings into `BaseSetting.vue`.
- **ScSelect**:
  - Added new `PositionLayout` for selecting 9-grid positions (top-left, center, bottom-right, etc.).
  - Added `ScSelect` integration for theme animation direction and performance monitor position settings.
- **Modern Tech Theme**:
  - Refined Modern Tech theme to resemble DataV style (Neon Cyan, Grid Background, Corner Accents).

### Changed
- **Dependencies**: Upgraded `@techui/scifi` to `^0.0.7-alpha.7`.
- **BaseSetting**: Replaced native `el-select` and custom position grid with `ScSelect` components for better consistency and maintainability.
- **SidebarFullScreen**: Replaced custom fullscreen implementation with native API to fix compatibility issues.
- **Message Center**: Enhanced UI with Stitch Design System tokens and hover effects.

### Fixed
- **Theme Switcher**: Fixed beta theme card event passing to ensure consistent animation behavior.

## [2.2.2] - 2026-02-09

### Fixed
- **Menu Animation**:
  - Resolved an issue where menu click animations were disabled by default.
  - Enabled `MenuAnimation` configuration by default in `PlatformConfigs` and global settings.
  - Fixed a CSS class selector typo (`.menu-animate` -> `.menu-animation`) in `SidebarItem.vue`.
  - Added menu animation toggle to `BaseSetting.vue` reset logic.
- **Lay-Tag**: 
  - Removed `transition-group` animation (tag-fade) to eliminate the "refresh-like" visual effect when clicking tags.
  - Removed `useDefer` sequential rendering logic to prevent tags from "appearing one by one" or flashing incorrect styles during load.
- **Sidebar Menu**: Enforced strict style consistency for subset menus (nested items) to match first-level menu styles. Added `!important` flags to background and text colors for both active and inactive states to prevent style inheritance issues.
- **ScDialog**: Fixed `dialogZIndexManager` export error in `useDialogZIndex.ts` to ensure proper z-index management for multiple dialogs.
- **Lay-Tag**: Fixed "Close All" context menu functionality to correctly activate the last remaining fixed tag (e.g., Home) instead of potentially failing to navigate or update the active state.
- **Menu Animation**: Fixed an issue where the menu content opening animation (Page Transition) was disabled by default due to a configuration mismatch. It now correctly respects the system default (Enabled).
- **Lay-Tag**: Fixed missing styles for `modern-item`, `card-item`, and `smart-item` theme modes. Added dedicated CSS classes with proper dimensions, hover effects, and close button adaptations to ensure buttons are visible and clickable across all themes (including Dark Mode support).
- **Fullscreen**: Replaced custom fullscreen implementation with `@vueuse/core`'s `useFullscreen` composable in `SidebarFullScreen.vue` to ensure cross-browser compatibility and fixed click propagation issues where the button was non-functional.
- **Lay-Navbar**: Resolved flickering issue when switching tabs by optimizing dynamic component rendering logic (removed unnecessary key binding).
- **Lay-Tag**: 
  - Fixed an issue where the `chrome-close-btn` was not displaying by correctly importing and using the `CloseIcon` from `@iconify-icons`.
  - **Chrome Style Beautification**: Enhanced the Chrome tab style with smoother background transitions, improved hover effects (light background on hover), and refined close button interactions (red background on hover for inactive tabs, semi-transparent white for active tabs).
- **Halloween Theme**:
  - Fixed an issue where the top header (`lay-header`) would disappear in Hover Navigation mode by correctly applying the `lay-navbar` class to the theme component.
  - Resolved a visibility issue in Hover Navigation where secondary menu items were unreadable (all black) by replacing hardcoded colors with theme-adaptive CSS variables (`--hover-nav-menu-color`).
  - **Tool Bar Adaptation**: Fully adapted "Language" and "User Profile" dropdown menus to the Halloween theme, featuring deep purple backgrounds, pumpkin orange borders, and slime green hover effects.
  - **Message Center**: Fixed unadapted styles for the "Clear" and "View All" buttons in the message dropdown footer, ensuring they match the Halloween theme colors (Ghost White/Pumpkin Orange) and use a clean "Ghost Button" style without the pumpkin decoration.
   - **Button Styling**: Replaced all standard buttons with a "Pumpkin Head" style in the Halloween theme, featuring a pumpkin icon (🎃) and unique asymmetrical border radius. (Excluded link buttons to maintain text readability).
   - **System Settings**: 
     - Replaced the standard gear icon with a festive pumpkin icon (🎃) in the global toolbar when Halloween theme is active. Added a "lighting up" animation on hover where the pumpkin mouth glows.
     - Enhanced the System Settings panel with Halloween-specific header decorations and optimized styles, ensuring a distinct festive look separate from the default theme.
     - Deeply adapted Element Plus components (Switch, Slider, Radio, Segmented, InputNumber, Select) within the Halloween settings panel to match the Orange/Purple color scheme.
     - Fixed a critical issue where the Halloween tool bar component (`lay-tool/themes/Halloween.vue`) was missing, preventing proper theme switching.
   - **Festival Themes**:
     - Componentized System Settings panels for all festival themes (Spring Festival, Mid-Autumn, Christmas, Cyberpunk, New Year).
     - Implemented theme-specific deep adaptations for inner Element Plus components across all festival themes, ensuring a consistent and immersive visual experience (e.g., Red/Gold for Spring Festival, Neon for Cyberpunk).
   - **Hover Navigation**: Replaced the default "Favorites" icon with a festive pumpkin icon (🎃) in the Halloween theme.
   - **User Profile**:
     - **Avatar**: Componentized the user avatar into `LayAvatar`, enabling theme-specific decorations. Added a spinning spider-web border decoration for the Halloween theme.
     - **Dropdown**: Enhanced the User Dropdown to support deep theme customization. Implemented a semi-transparent purple background with pumpkin orange borders and shadow effects for the Halloween theme.
   - **Theme Provider**: Fixed a bug in `ThemeSkinProvider` where the `theme-halloween` class was not correctly removed when switching to other themes.
- **Cyberpunk Theme Optimization**:
  - **Performance**: Reduced GPU usage by optimizing CSS animations (using `transform`/`opacity` instead of `filter`), replacing `drop-shadow` with `box-shadow`, and implementing hardware acceleration for smoother rendering (60+ FPS).
  - **Style Adaptation**: Completed visual adaptation for all Element Plus components (Button, Input, Card, Dialog, Table, Pagination, etc.) with Cyberpunk styles (Neon Cyan/Magenta, Glitch effects, Grid backgrounds).
  - **Monitoring**: Added a built-in FPS Monitor (toggleable in System Settings) to track real-time rendering performance.
  - **Architecture**: Centralized Cyberpunk styles in global SCSS (`cyberpunk.scss`) for better maintainability and consistency.
  - **Settings**: Integrated FPS monitor toggle and Cyberpunk-specific settings into the System Settings panel, with local storage persistence.

### Changed
- **Message Center**:
  - **UI Overhaul**: Implemented glass morphism design (backdrop-filter, semi-transparent backgrounds) and hover animations for a modern look.
  - **Theme Adaptation**: Modularized theme styles into dedicated SCSS files (e.g., `_spring-festival.scss`) and integrated `stitch-lay-*` tokens to ensure adaptability to all festivals, theme styles (Light/Dark), and theme colors.
  - **Code Quality**: Removed inline style overrides and optimized scoped CSS for better maintainability.
- **Lay-Tag**:
  - **Removed Modern Style**: Completely removed the "Modern" tag style (`modern-item`) to streamline the UI options.
  - **Card Style Enhancement**: Added a theme-colored bottom bar to the active "Card" style tab for better visual indication.
  - **Chrome Style Beautification**: Added depth to the active "Chrome" tab using `z-index` and `drop-shadow` for a more distinct, layered look.
- **ScCard**:
  - **SVG Optimization**: Updated `Tech` layout corner decorations to use high-contrast primary theme colors with glow effects, resolving visibility issues.
- **Lay-Tag**:
  - **Fix**: Corrected the close button hover color in `glass-item` style to ensuring consistent theme coloring.

## [2.2.1] - 2026-02-08

### Added
- **Component Theme Adaptation**:
  - **ScCard**: Full support for Stitch Design System theme tokens. Adapted all layouts (Default, Compact, Media, Panel-3D, etc.) to support adaptive light/dark modes and semantic colors.
  - **ScTable**: Adapted table components (TableView, CardView, etc.) and plugins (Pagination, ContextMenu) to use semantic theme tokens, removing hardcoded element-plus variables.
  - **ScDialog**: Enhanced taskbar and dialog styles with semantic theme tokens and glass morphism effects.
- **Documentation**:
  - Created `ScCard/README.md` with detailed usage and layout examples.
  - Updated `ScTable/README.md` and `ScDialog/README.md` to reflect new theme capabilities.

### Fixed
- **Style Consistency**: Replaced hardcoded `--el-*` variables with `--stitch-lay-*` tokens in ScCard, ScTable, and ScDialog for better dark mode compatibility.
- **SASS Compilation**: Fixed syntax errors in `ScCard/layouts/Compact.vue` and `ScTable/components/CardView.vue`.
- **Theme Variants**: Corrected theme variant mappings (e.g., danger -> error) in ScTable column settings to match the design system.

## [2.2.0] - 2026-02-05

### Added
- **Halloween Theme Adaptation (MCP Compliant)**:
  - **Core Components**: Full theme adaptation for `lay-navbar`, `lay-sidebar`, `lay-tag`, `lay-footer`, `lay-search`, `lay-setting`, and `lay-panel`.
  - **Visual Identity**: Implemented "Pumpkin & Ghost" design system with standardized color tokens:
    - Primary: Pumpkin Orange (#ff7518)
    - Background: Deep Purple Gradients (#2c003e -> #1a0026)
    - Accent: Ghost Green (#76ff03)
  - **Interactive Elements**:
    - Floating bat/ghost animations in sidebar items.
    - Creepster font integration for headers.
    - Custom pumpkin/ghost icons for menu items.
  - **Architecture**:
    - Standardized Theme Context Protocol using `useThemeComponent` hook for lazy-loading theme modules.
    - Implemented strictly typed Theme Keys in `types/theme.ts`.
    - Added Unit Tests (`HalloweenTheme.spec.ts`) to verify theme resolution and protocol compliance.
  - **Navigation Modes**: Verified support for all 6 layout modes (Vertical, Horizontal, Mix, Double, Hover, Mobile).

### Fixed
- **Theme System**:
  - **White Theme Consistency**: Unified active menu styles for the Default Light Theme across all layouts (Vertical, Horizontal, Mix, Hover, Popup). Enforced `Background: --el-color-primary` (Blue) and `Text: White` for active states, resolving inconsistencies where some menus remained white.
  - **BaseSidebarItem**: Removed conflicting text color overrides in `BaseSidebarItem` and enforced theme-specific active styles in `DefaultSidebarItem` to ensure correct "Blue Background + White Text" rendering in light mode.
  - **Hover Navigation**: Fixed background color issue in `HoverNavigation.vue` where the active state was not correctly applying the theme color in light mode.
  - **Festival Theme**: Optimized auto-switch logic to strictly fallback to `Default` theme during non-festival periods.
- **System Page**: Fixed blur effect on hover for feature cards in `pages/system/src/index.vue` by removing the `scale` transform.
- **BaseSetting**: Fixed "Maximum call stack size exceeded" error by removing invalid `require` call in `initializeTheme`.
- **Layout System**: Fixed `lay-header` height calculation issue where `lay-tag` was ignored, causing content overlap. Updated `lay-header` to use auto-height and implemented dynamic content height calculation based on `headerHeight` (60px/102px).
- **Halloween Theme**: Removed redundant dark mode styles in `HoverNavigation.vue` to resolve conflicts with theme variables.

### Changed
- **Default Theme Light Style Overhaul**:
  - **Vertical Layout**: Implemented 8% opacity theme color background for active menu items (`DefaultSidebarItem.vue`).
  - **Header Styles**: Extracted `lay-header-style` mixin in `mixins.scss` for consistent header styling across layouts.
  - **Top Visuals**: Optimized `UserDropdown` and top bar elements with better spacing, hover effects, and consistent icon usage (`IconifyIconOnline`).
  - **Mobile Layout**: Refactored mobile styles into independent `mobile.scss` with `.lay-mobile` namespace to prevent style pollution.
- **Visual Enhancements**:
  - **Lay-Tag**: 
    - Beautified with rounded corners, shadows, and refined hover effects.
    - Added `tag-fade` transition animation for smoother tag addition/removal.
    - Fixed right-side function buttons to stay permanently anchored to the right.
  - **Navigation Active Styles**: Standardized all navigation (Hover, Double, Custom) active states to use **Tinted Background + Theme Color Text** instead of Solid Background + White Text, ensuring better visual consistency and theme adherence.

