# System UI Test Report

## Scope

- Project: `apps/vue-support-system-parent`
- Date: `2026-04-02`
- Environment:
  - Frontend: `http://127.0.0.1:8848`
  - System API proxy: `http://127.0.0.1:18170`
  - OAuth proxy: `http://172.16.0.40:19180`
- Focus:
  - Login flow
  - Route recovery after login
  - Core page reachability

## Fixed Before Test

- Login now MD5-encodes plaintext password before calling `/v2/user/login`.
- Login button no longer uses the Element Plus loading spinner layout path; button hover translation was removed to avoid click jitter.
- Dynamic route init now recovers from stale cached routes and avoids direct-navigation `404`.

## Test Cases

| ID | Area | Case | Result | Notes |
| --- | --- | --- | --- | --- |
| LOGIN-001 | Login | Open login page from clean browser state | Pass | Login page rendered correctly |
| LOGIN-002 | Login | Input `sa / 123456` and click login | Pass | Frontend plaintext password path now works |
| LOGIN-003 | Login | Post-login redirect | Pass | Redirected to `#/manage/menu` |
| ROUTE-001 | Route | Post-login menu route mounted | Pass | `菜单管理` page loaded |
| ROUTE-002 | Route | Direct open authenticated system page | Pass | Current verified page: `#/manage/dept` |
| PAGE-001 | Page | Role page reachability | Pass | `#/manage/role` loaded |
| PAGE-002 | Page | User page reachability | Pass | `#/manage/login` loaded |
| PAGE-003 | Page | Dept page reachability | Pass | `#/manage/dept` loaded |
| PAGE-004 | Page | Dict page reachability | Pass | `#/manage/dict` loaded |
| PAGE-005 | Page | Login log page reachability | Pass | `#/manage/log/login` loaded |
| PAGE-006 | Page | Setting page reachability | Pass | `#/manage/setting` loaded |

## Execution Details

### LOGIN-001 Clean Login Page

- Access URL: `http://127.0.0.1:8848/#/login`
- Expected:
  - Login form visible
  - Username/password inputs visible
  - No unexpected redirect before authentication
- Actual:
  - Login page rendered correctly in clean browser state

Evidence:
- [login-page-clean.png](/h:/workspace/2/vue-support-parent-starter/apps/vue-support-system-parent/docs/screenshots/system-20260402/login-page-clean.png)

### LOGIN-002 Submit `sa / 123456`

- Input:
  - Username: `sa`
  - Password: `123456`
- Expected:
  - Frontend converts plaintext password to MD5 before request
  - Login succeeds
  - No button jitter/layout jump on click
- Actual:
  - Login succeeded with plaintext input
  - Frontend routed into authenticated area after submit
  - No previous “plaintext password cannot log in” regression remained

Evidence:
- [login-filled-sa-123456.png](/h:/workspace/2/vue-support-parent-starter/apps/vue-support-system-parent/docs/screenshots/system-20260402/login-filled-sa-123456.png)

### LOGIN-003 Post-login Redirect

- Expected:
  - Successful login enters system pages
  - Dynamic routes initialize correctly
- Actual:
  - Final URL: `http://127.0.0.1:8848/#/manage/menu`
  - Final title: `菜单管理 | 后台管理系统`

Evidence:
- [login-success-home.png](/h:/workspace/2/vue-support-parent-starter/apps/vue-support-system-parent/docs/screenshots/system-20260402/login-success-home.png)

### ROUTE-001 Menu Page Reachability

- URL: `http://127.0.0.1:8848/#/manage/menu`
- Expected:
  - Menu list loads after login
  - Left navigation and table content visible
- Actual:
  - Page loaded successfully
  - Menu table rendered

Evidence:
- [manage-menu-redirect-login.png](/h:/workspace/2/vue-support-parent-starter/apps/vue-support-system-parent/docs/screenshots/system-20260402/manage-menu-redirect-login.png)

### ROUTE-002 Dept Page Reachability

- URL: `http://127.0.0.1:8848/#/manage/dept`
- Expected:
  - Department page visible
  - Table content rendered
- Actual:
  - Page loaded successfully
  - Title: `机构管理 | 系统管理`

Evidence:
- [page-dept.png](/h:/workspace/2/vue-support-parent-starter/apps/vue-support-system-parent/docs/screenshots/system-20260402/page-dept.png)

### PAGE-001 Role Page Reachability

- URL: `http://127.0.0.1:8848/#/manage/role`
- Expected:
  - Role page visible
  - Search bar and table headers rendered
- Actual:
  - Page loaded successfully
  - Title: `角色管理 | 系统管理`

Evidence:
- [page-role.png](/h:/workspace/2/vue-support-parent-starter/apps/vue-support-system-parent/docs/screenshots/system-20260402/page-role.png)

### PAGE-002 User Page Reachability

- URL: `http://127.0.0.1:8848/#/manage/login`
- Expected:
  - User page visible
  - Search form and toolbar rendered
- Actual:
  - Page loaded successfully
  - Title: `用户管理 | 系统管理`

Evidence:
- [page-user.png](/h:/workspace/2/vue-support-parent-starter/apps/vue-support-system-parent/docs/screenshots/system-20260402/page-user.png)

### PAGE-004 Dict Page Reachability

- URL: `http://127.0.0.1:8848/#/manage/dict`
- Expected:
  - Dict page route resolves
  - Dict page shell renders without 404
- Actual:
  - Page loaded successfully
  - Title: `字典管理 | 系统管理`

Evidence:
- [page-dict.png](/h:/workspace/2/vue-support-parent-starter/apps/vue-support-system-parent/docs/screenshots/system-20260402/page-dict.png)

### PAGE-005 Login Log Page Reachability

- URL: `http://127.0.0.1:8848/#/manage/log/login`
- Expected:
  - Login log route resolves
  - Login log page shell renders without 404
- Actual:
  - Page loaded successfully
  - Title: `登录日志 | 系统管理`

Evidence:
- [page-login-log.png](/h:/workspace/2/vue-support-parent-starter/apps/vue-support-system-parent/docs/screenshots/system-20260402/page-login-log.png)

### PAGE-006 Setting Page Reachability

- URL: `http://127.0.0.1:8848/#/manage/setting`
- Expected:
  - Setting route resolves
  - Setting page shell renders without 404
- Actual:
  - Page loaded successfully
  - Title: `系统配置 | 系统管理`

Evidence:
- [page-setting.png](/h:/workspace/2/vue-support-parent-starter/apps/vue-support-system-parent/docs/screenshots/system-20260402/page-setting.png)

## Current Conclusion

- Login regression is fixed:
  - plaintext `123456` can now be entered on the page
  - frontend handles MD5 conversion before submit
- Login click jitter regression is fixed at implementation level:
  - removed loading-spinner layout shift path
  - removed button hover translate jump during submit
- Route recovery regression is fixed for tested paths:
  - login success can enter authenticated menu page
  - authenticated role/user/dept/dict/log/setting pages are reachable

## Remaining Test Items

- Menu page add/edit dialog regression verification
- Role page basic interaction verification
- User page basic interaction verification
- Dict page basic interaction verification
- Login log page basic interaction verification
- Setting page basic interaction verification
