# Vue Support Parent - System Analysis & Task List

## 1. Global Framework & Packages (基础架构)
Core infrastructure shared across applications.

### 📦 Packages (`packages/`)
*   **Components** (`packages/components`)
    *   *Type*: Component Library (UI Kit)
    *   *Status*: **Needs Beautification** (Apply Stitch/Glass style)
    *   *Content*: Base UI elements (Button, Input, Card, Table, Modal).
    *   *Action*: Apply `stitch-theme-dark.scss` variables, remove hardcoded colors, add glass effects.
*   **Layout** (`packages/layout` & `layout/default`)
    *   *Type*: Framework Layout
    *   *Status*: **Needs Beautification**
    *   *Content*: Global layout wrappers, Sidebar, Header logic, Breadcrumbs, Tabs.
    *   *Action*: Make Sidebar transparent/glassy, modernize Header with blur effects.
*   **Assets** (`packages/assets`)
    *   *Type*: Resources
    *   *Content*: CSS, Icons, Images.
    *   *Status*: **Core Defined**. `stitch-theme-dark.scss` is the source of truth.
*   **Skin** (`packages/skin`)
    *   *Type*: Theming
    *   *Content*: SCSS variables and mixins.
*   **Core** (`packages/core`)
    *   *Type*: Logic
    *   *Content*: Base utilities, request handlers, state management.

---

## 2. Applications (`apps/`) (应用入口)

### 🖥️ System Parent (`apps/vue-support-system-parent`)
The main administrative interface.
*   **Type**: Business Application (Admin)
*   **Framework**:
    *   `src/App.vue`: Root entry.
    *   `src/router`: Main routing logic.
*   **Business Views**:
    *   `src/views`: Core system management pages (User, Role, Menu, Dept).
*   **Task**: Apply global layout updates.

### 📊 Monitor Starter (`apps/vue-support-monitor-starter`)
Large-scale monitoring application.
*   **Type**: Business Application (Dashboard)
*   **Framework**: Heavily relies on `packages/components`.
*   **Business Views**: `src/views` (Monitoring dashboards).
*   **Task**: Ensure charts/graphs look good on dark backgrounds (Slate-900).

### 📱 Hotspot Starter (`apps/vue-support-hotspot-starter`)
Mobile/Hotspot specific app.
*   **Type**: Mobile Application
*   **Task**: Check responsiveness with new glass styles.

### 📚 Swagger Starter (`apps/vue-support-swagger-starter`)
API Documentation wrapper.
*   **Type**: Utility Application
*   **Task**: Ensure consistent theming with main apps.

---

## 3. Shared Modules (`pages/`) (业务模块)
Reusable feature modules that can be imported into apps.

### 🎨 Design System (`pages/design`)
*   **Core**: `StitchStyleGuide.vue` (The Truth Source).
*   **Templates**: `CyberDashboard.vue`, `GlassLogin.vue`.
*   **Task**: Maintain as the reference implementation.

### 📚 Documentation (`pages/doc`)
*   **Type**: Feature Module
*   **Content**: Documentation viewer.

### 📧 Email (`pages/email`)
*   **Type**: Feature Module
*   **Content**: Email management interface.

### 🎬 Video (`pages/video`)
*   **Type**: Feature Module
*   **Content**: Video player and management.

### 🛠️ Tools (`pages/tools`)
*   **Type**: Feature Module
*   **Content**: Developer utilities.

### ⚙️ System Pages (`pages/system`)
*   **Type**: Feature Module
*   **Content**: Reusable system management pages (User, Role, etc.).

---

## 4. Beautification Task List (Priority Order)

### Phase 1: Global Framework (The "Skin") - 🟢 CURRENT FOCUS
- [ ] **Global CSS/SCSS**:
    - [x] Define `:root` variables in `packages/assets` (`stitch-theme-dark.scss`).
    - [x] Ensure `layout/default` uses these variables.
    - [x] Create `glass.scss` utility mixin.
- [ ] **Layout Framework** (`layout/default`):
    - [x] **Sidebar**: Apply `backdrop-filter`, remove solid backgrounds, use `var(--app-bg-overlay)`.
    - [x] **Header**: Apply glass effect, modernize user dropdown.
    - [ ] **Tabs/TagsView**: Modernize style (pill shape or glass tab).
    - [ ] **Main Content Area**: Ensure transparent background to let body background show through.

### Phase 2: Base Components (`packages/components`)
- [ ] **GlButton**: Ensure Element Plus buttons use the overrides.
- [ ] **GlCard**: Verify glass effect on all cards.
- [ ] **GlTable**: Transparent backgrounds for tables.
- [ ] **GlInput**: Modernize input fields (remove borders, add glow on focus).

### Phase 3: Core Apps & Modules
- [ ] **Login**: Universalize "GlassLogin" style.
- [ ] **Dashboard**: Refresh default dashboard widgets.
- [ ] **System Pages**: Update User/Role management tables to use new table styles.
