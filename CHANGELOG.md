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
- **BaseSetting**: Fixed "Maximum call stack size exceeded" error by removing invalid `require` call in `initializeTheme`.
- **Halloween Theme**: Removed redundant dark mode styles in `HoverNavigation.vue` to resolve conflicts with theme variables.

### Changed
- **Default Theme Light Style Overhaul**:
  - **Vertical Layout**: Implemented 8% opacity theme color background for active menu items (`DefaultSidebarItem.vue`).
  - **Header Styles**: Extracted `lay-header-style` mixin in `mixins.scss` for consistent header styling across layouts.
  - **Top Visuals**: Optimized `UserDropdown` and top bar elements with better spacing, hover effects, and consistent icon usage (`IconifyIconOnline`).
  - **Mobile Layout**: Refactored mobile styles into independent `mobile.scss` with `.lay-mobile` namespace to prevent style pollution.

