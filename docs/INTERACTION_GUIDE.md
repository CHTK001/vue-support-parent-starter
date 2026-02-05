# Stitch MCP Interaction Guide

**Version:** 1.0.0
**Date:** 2026-02-05

This document outlines the interaction states and behaviors for components using the Stitch MCP Design System.

## 1. Navigation (NavDouble)

### Left Sidebar Items
- **Default State**:
  - Background: Transparent / `var(--el-bg-color)`
  - Icon Color: `var(--el-text-color-primary)` (Opacity 0.75)
  - Scale: 1.0

- **Hover State**:
  - Background: `var(--el-fill-color-light)` (Light Mode) / `rgba(255,255,255,0.08)` (Dark Mode)
  - Icon Color: `var(--el-color-primary)` (Theme Color)
  - Icon Background: `rgba(var(--el-color-primary-rgb), 0.1)`
  - Scale: 1.1 (Smooth transition 0.3s)
  - Cursor: Pointer

- **Active State**:
  - Background: `var(--el-color-primary)`
  - Icon Color: `#ffffff` (White)
  - Shadow: `0 4px 12px rgba(var(--el-color-primary-rgb), 0.4)`
  - Scale: 1.0 (No scale on active, stable)

### Collapse Button
- **Position**: Bottom of the left sidebar (inside container).
- **Interaction**:
  - Click: Toggles sidebar width (64px <-> Expanded).
  - Hover: Background highlights.

## 2. Layout Containers

### Content Area
- **Behavior**: Responsive width, fixed height (100% of parent minus headers).
- **Overflow**: Hidden (internal scrollbars used).
- **Scrollbars**: Custom thin scrollbars (`thin-scroller` class).

## 3. General Stitch Tokens

### Transitions
All interactive elements should use the Stitch standard transition:
```scss
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

### Radius
- **Small**: 4px (Buttons, Inputs)
- **Base**: 8px (Cards, Menu Items)
- **Large**: 16px (Modals, Containers)

### Shadows
- **Level 1 (Hover)**: `0 4px 16px rgba(0, 0, 0, 0.04)`
- **Level 2 (Active/Float)**: `0 8px 24px rgba(0, 0, 0, 0.12)`
