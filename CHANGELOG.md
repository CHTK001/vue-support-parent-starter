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
