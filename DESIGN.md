# Design System: Vue Support Parent Starter

## 1. Visual Theme & Atmosphere
The default design language is **"Modern Glassmorphic,"** characterized by high transparency, blur effects, and subtle gradients. The interface feels lightweight and layered, utilizing `backdrop-filter` to create depth between content and overlaying navigation elements.

*   **Atmosphere:** Airy, Clean, Professional, Translucent.
*   **Key Texture:** Frosted Glass (`backdrop-filter: blur(20px)`).
*   **Depth Strategy:** Multi-layered soft shadows combined with linear gradients to define edges without harsh borders.
*   **Theming:** Supports a robust "Skin" system (`data-skin`) allowing complete visual overhauls (e.g., "Spring Festival", "Cyberpunk") while maintaining the core layout structure.

## 2. Color Palette & Roles

### Semantic Colors (Element Plus Derived)
*   **Primary Action:** `var(--el-color-primary)` - Used for active states, links, and primary buttons.
*   **Primary Light:** `var(--el-color-primary-light-3)` to `var(--el-color-primary-light-1)` - Used for gradients and hover states.
*   **Primary Dark:** `var(--el-color-primary-dark-2)` - Used for active state gradients.

### Interface Colors (Default Theme)
*   **Glass Background:** `rgba(255, 255, 255, 0.95)` to `rgba(255, 255, 255, 0.98)` - Main background for Sidebar and Navbar to achieve the frosted effect.
*   **Text Primary:** `var(--app-text-primary)` - Main content text.
*   **Active Menu Text:** `var(--pure-menu-active-text-color)` - Text color for selected menu items.
*   **Border/Divider:** `rgba(0, 0, 0, 0.05)` to `rgba(0, 0, 0, 0.08)` - Subtle separation lines.
*   **Shadow:** `rgba(0, 0, 0, 0.03)` to `rgba(0, 0, 0, 0.06)` - Soft, multi-step shadows for elevation.

## 3. Typography Rules
*   **Base Font Size:** `14px` (Standard for menu items).
*   **Letter Spacing:** `0.3px` (Adds slight breathability to navigation text).
*   **Font Weights:**
    *   **Regular:** Standard text.
    *   **Medium (500):** Active sub-menu titles.
*   **Interaction:** Text colors transition smoothly (`0.3s cubic-bezier`) on hover.

## 4. Component Stylings

### Navigation Sidebar (`.sidebar-container`)
*   **Shape:** Rectangular container with `8px` rounded corners for internal menu items.
*   **Background:** Vertical Linear Gradient (`180deg`) from 95% to 98% white opacity + Blur(12px).
*   **Menu Items:**
    *   **Normal:** Transparent background, `padding: 0 16px`.
    *   **Hover:** Moves right (`translateX(2px)`), drops a soft shadow (`0 2px 8px rgba(0,0,0,0.05)`).
    *   **Active:**
        *   Features a **Left Accent Bar**: `4px` wide, gradient (Light-3 -> Primary -> Dark-2), rounded-right corners.
        *   **Animation:** `pulseGlow` effect on the accent bar.
        *   **Background:** Transparent (relying on the accent bar) or Solid Primary (in sub-menus).

### Top Navbar (`.default-navbar`)
*   **Structure:** Flex row (`height: 48px`), content aligned center.
*   **Surface:** High blur (`20px`), high opacity white (`0.95`).
*   **Elevation:** Bottom border (`1px solid`) + distinct shadow hierarchy (1px, 2px, 4px, 8px layers).
*   **Decoration:** Optional bottom gradient line to enhance separation from the page content.

### Buttons & Interactive Elements
*   **Transitions:** All interactive elements use `transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)` for fluid motion.
*   **Feedback:** Hover states often involve slight translation and shadow expansion.

## 5. Layout Principles
*   **Z-Indexing:** Fixed headers and sidebars float above content with calculated z-indices.
*   **Responsive Adaptation:** The system uses `data-skin` attributes to conditionally load heavy CSS overrides, ensuring the base layout remains lightweight.
*   **Spacing:**
    *   Menu Items: `margin: 4px 8px` (Creates a "floating" pill effect rather than full-width blocks).
    *   Navbar: `border-bottom` defines the vertical rhythm.
