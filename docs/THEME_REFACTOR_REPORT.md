# Theme System Refactoring & Dark Mode Fix Report

## 1. Overview
This update introduces a comprehensive **"Overall Style" Configuration System**, replacing the binary "Dark/Light" toggle with an extensible Semantic Token architecture. This ensures scalable theming and consistency across all components.

## 2. Key Changes

### 2.1 Architecture Upgrade
*   **Old**: Hardcoded `isDark` checks and `:global(.dark)` CSS overrides.
*   **New**: `ThemeManager` + Semantic CSS Variables (`--theme-*`).
    *   **Theme Schema**: Defined in `src/types/theme-schema.ts`.
    *   **Registry**: `src/utils/theme-manager.ts` handles dynamic style injection.
    *   **Semantic Tokens**: `packages/assets/style/semantic-tokens.scss` defines the interface.

### 2.2 Semantic Token Mapping Table
| New Semantic Token | Old Hardcoded Value (Light) | Old Hardcoded Value (Dark) | Description |
| :--- | :--- | :--- | :--- |
| `--theme-surface-navbar` | `rgba(255,255,255,0.8)` | `rgba(15,23,42,0.8)` | Navigation bar background with opacity |
| `--theme-border-base` | `rgba(0,0,0,0.05)` | `#334155` | General borders |
| `--theme-surface-primary` | `#ffffff` | `#0f172a` | Page background |
| `--theme-text-primary` | `#1e293b` | `#f8fafc` | Primary text color |

### 2.3 Component Fix: `Default.vue`
**Issue**: The wrapper `<div>` at line 6 had hardcoded color values and manual dark mode selectors.
**Fix**: Refactored to use `var(--theme-surface-navbar)` and `var(--theme-border-base)`.

**Code Diff**:
```scss
// Before
.default-wrapper {
  --default-navbar-bg: rgba(255, 255, 255, 0.8);
  :deep(.default-navbar) { ... }
}
:global(.dark) .default-wrapper {
  --default-navbar-bg: rgba(15, 23, 42, 0.8);
}

// After
.default-wrapper {
  --default-navbar-bg: var(--theme-surface-navbar, rgba(255, 255, 255, 0.8));
  // No explicit .dark block needed; handled by ThemeManager
}
```

## 3. Verification & Visual Regression Testing

### 3.1 Test Scenarios
1.  **Default Light Style**:
    *   Navbar Background: White (0.8 opacity).
    *   Text: Slate-900.
2.  **Default Dark Style**:
    *   Navbar Background: Slate-900 (0.8 opacity).
    *   Text: Slate-50.
3.  **Dynamic Switching**:
    *   Invoke `themeManager.setStyle('default-dark')`.
    *   Verify `--theme-surface-navbar` updates instantly.

### 3.2 Visual Confirmation
*   **Light Mode**: Verified crisp white background with blur.
*   **Dark Mode**: Verified deep blue-grey background (`#0f172a`) matching the global dark theme, fixing the previous inconsistency where it might have been black or incorrect grey.

## 4. Next Steps
*   Migrate remaining layout components (`Sidebar`, `TagsView`) to use `--theme-*` tokens.
*   Expose `ThemeManager` in the Settings UI to allow users to pick "Styles" beyond just Light/Dark.
