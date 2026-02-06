# Changelog

All notable changes to this project will be documented in this file.

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

