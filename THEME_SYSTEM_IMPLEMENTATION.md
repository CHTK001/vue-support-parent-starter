# 系统配置对应主题皮肤功能完整实现指南

## 一、功能概述

本文档描述如何在系统中实现**登录页主题皮肤配置闭环**：

```
后端系统配置 (theme组) 
    ↓
ConfigStore 加载并写入 putConfig
    ↓
前端设置页可视化管理界面
    ↓
批量保存配置至后端
    ↓
首屏登录页按优先级应用主题
```

## 二、架构设计

### 2.1 数据模型

**配置组**：`theme`

| 键 | 可选值 | 含义 | 默认值 |
|---|--------|------|--------|
| `LoginTheme` | modern \| tech \| business \| random \| new-year \| spring-festival \| valentines-day \| mid-autumn \| national-day \| christmas | 登录页主题 | modern |
| `EnableFestivalTheme` | true \| false | 是否启用节日主题自动检测 | true |
| `EnableLoginThemeSwitcher` | true \| false | 登录页顶部是否显示主题切换器 | true |

### 2.2 优先级策略（登录页）

```
优先级从高到低：
1. 本地浏览器存储 (login-theme-preference)
2. 节日自动检测 (if EnableFestivalTheme=true)
3. 系统后端配置 (LoginTheme)
4. 默认主题 (modern)
```

**示例场景**：
- 用户手动选择了"春节"主题 → 保存到本地存储
- 12月15日，EnableFestivalTheme=true → 检测到圣诞期间，但本地存储优先，仍显示"春节"
- 用户清空本地存储 → 节日检测生效，自动显示"圣诞"
- 禁用 EnableFestivalTheme → 使用后端配置 LoginTheme

### 2.3 组件交互流

```
┌─────────────────────────────────────────────────────────────┐
│  后端数据库 (sys_setting)                                    │
│  ├─ group: theme                                            │
│  ├─ name: LoginTheme, value: modern                         │
│  ├─ name: EnableFestivalTheme, value: true                  │
│  └─ name: EnableLoginThemeSwitcher, value: true             │
└─────────────────────────────────────────────────────────────┘
                            ↓ (HTTP API)
┌─────────────────────────────────────────────────────────────┐
│  ConfigStore (packages/core/src/store/modules/ConfigStore)  │
│  ├─ load() → fetchSetting("theme")                          │
│  ├─ doRegister() → putConfig(name, value)                   │
│  └─ systemSetting["theme:LoginTheme"] = "modern"            │
└─────────────────────────────────────────────────────────────┘
        ↙ 供应用读取                   ↙ 供登录页读取
     ┌──────────────────────┬──────────────────────┐
     │                      │                      │
┌────┴──────────────────┐  │  ┌──────────────────┴────┐
│  设置页主题管理       │  │  │  登录页 (Login)      │
│  (pages/setting)      │  │  │  (packages/pages)    │
│  ├─ loadConfig()      │  │  │  ├─ getConfig()      │
│  │   fetchSetting     │  │  │  └─ getLoginTheme()  │
│  ├─ selectTheme()     │  │  └──────────────────────┘
│  └─ handleSave()      │  │
│     fetchUpdateBatch  │  │
└──────────────────────┘  │
                          ↓ localStorage
                    ┌────────────────┐
                    │ 浏览器本地存储 │
                    │login-theme...  │
                    └────────────────┘
```

## 三、核心实现要点

### 3.1 后端配置加载流程

**文件**: `packages/core/src/store/modules/ConfigStore.ts`

```typescript
// doRegister 方法中处理 theme 组配置
async doRegister(data) {
  data?.forEach((element) => {
    const key = element.sysSettingGroup + ":" + element.sysSettingName;
    // 关键：将后端配置写入 putConfig
    putConfig(element.sysSettingName, element.sysSettingValue);
    
    if (element.sysSettingGroup === "theme") {
      console.debug(`[ConfigStore] Theme setting loaded: ${element.sysSettingName} = ${element.sysSettingValue}`);
    }
  });
}
```

**关键点**：
- `putConfig()` 函数将配置写入全局配置对象
- 登录页的 `getConfig()` 可读取这些配置
- 添加 debug 日志便于定位问题

### 3.2 登录页配置读取

**文件**: `packages/pages/login/index.vue`

```typescript
// 查询配置（包括后端加载的）
const getThemeConfig = () => {
  const savedTheme = localStorageProxyObject.getItem(THEME_STORAGE_KEY);
  const configLoginTheme = getConfig("LoginTheme");
  const configFestival = getConfig("EnableFestivalTheme");
  const configThemeSwitcher = getConfig("EnableLoginThemeSwitcher");
  
  console.debug("[Login] Theme Config:", {
    savedTheme,
    configLoginTheme,
    configFestival,
    configThemeSwitcher,
  });
  
  return { savedTheme, configLoginTheme, configFestival, configThemeSwitcher };
};

// 按优先级选择主题
const themeConfig = themeConfigState.savedTheme || 
                    themeConfigState.configLoginTheme || 
                    "modern";

// 根据配置决定 ThemeComponent
const currentTheme = getLoginTheme(themeConfig, enableFestival);
const ThemeComponent = defineAsyncComponent(currentTheme.component);
```

**关键点**：
- 优先级：本地存储 > 后端配置 > 默认值
- 调试日志在浏览器控制台输出
- 异步加载主题组件避免首屏阻塞

### 3.3 设置页主题管理

**文件**: `pages/setting/src/layout/theme.vue`

```typescript
// 加载后端配置
const loadConfig = async () => {
  const { data } = await fetchSetting("theme"); // 获取 theme 组配置
  data.forEach((item) => {
    if (item.sysSettingName === "LoginTheme") {
      themeConfig.LoginTheme = item.sysSettingValue || "modern";
    } else if (item.sysSettingName === "EnableFestivalTheme") {
      themeConfig.EnableFestivalTheme = item.sysSettingValue === "true";
    }
  });
};

// 保存至后端
const handleSave = async () => {
  const settings = [
    {
      sysSettingName: "LoginTheme",
      sysSettingValue: themeConfig.LoginTheme,
      sysSettingGroup: "theme",
      sysSettingRemark: "登录页面主题",
    },
    {
      sysSettingName: "EnableFestivalTheme",
      sysSettingValue: themeConfig.EnableFestivalTheme.toString(),
      sysSettingGroup: "theme",
      sysSettingRemark: "是否启用节日主题",
    },
  ];
  
  await fetchUpdateBatchSetting(settings); // 批量保存
  message("保存成功，重新登录后生效", { type: "success" });
};
```

**关键点**：
- 使用 `fetchSetting("theme")` 查询配置
- 使用 `fetchUpdateBatchSetting()` 批量保存
- 提示用户"重新登录后生效"

### 3.4 主题组件加载

**文件**: `packages/pages/login/themes/index.ts`

```typescript
export const getLoginTheme = (
  themeKey: string = "modern",
  enableFestival: boolean = true
): LoginTheme => {
  // 1. 检查节日期间
  if (enableFestival) {
    const festivalTheme = detectFestivalTheme();
    if (festivalTheme) return festivalTheme;
  }
  
  // 2. 随机主题
  if (themeKey === "random") {
    const randomIndex = Math.floor(Math.random() * loginThemes.length);
    return loginThemes[randomIndex];
  }
  
  // 3. 查找指定主题
  let theme = loginThemes.find((t) => t.key === themeKey);
  if (!theme) theme = festivalThemes.find((t) => t.key === themeKey);
  
  return theme || loginThemes[0]; // 兜底 modern
};
```

**关键点**：
- 支持节日自动检测
- 支持 random 随机主题
- 完善的兜底策略

## 四、配置示例

### 4.1 application.yaml 默认配置

```yaml
# 登录页面主题配置
LoginTheme: modern
EnableFestivalTheme: true
EnableLoginThemeSwitcher: true
```

### 4.2 后端数据库配置

```sql
INSERT INTO sys_setting (
  sysSettingName, 
  sysSettingValue, 
  sysSettingGroup, 
  sysSettingRemark
) VALUES 
('LoginTheme', 'modern', 'theme', '登录页面主题'),
('EnableFestivalTheme', 'true', 'theme', '是否启用节日主题'),
('EnableLoginThemeSwitcher', 'true', 'theme', '是否显示主题切换器');
```

## 五、测试检查清单

### 5.1 后端配置加载

- [ ] 后端设置 theme 组配置
- [ ] ConfigStore.load() 正确调用 fetchSetting("theme")
- [ ] ConfigStore.doRegister() 将配置写入 putConfig
- [ ] 浏览器控制台看到 debug 日志：`[ConfigStore] Theme setting loaded`

### 5.2 设置页管理

- [ ] 进入"系统设置 → 主题管理"页面
- [ ] 正确加载后端配置（主题卡片和切换开关显示正确值）
- [ ] 修改主题并点击"保存配置"
- [ ] 看到成功提示："保存成功，重新登录后生效"
- [ ] 刷新页面配置不丢失（读取的仍是保存的值）

### 5.3 登录页优先级

**场景1：用户本地存储优先**
```
步骤：
1. 打开登录页，选择"春节"主题，保存到本地
2. 后端改为"tech"主题
3. 刷新登录页
预期：显示"春节"主题（本地存储优先）
验证：浏览器控制台看到 console.debug("[Login] Using theme: spring-festival")
```

**场景2：节日自动切换**
```
步骤：
1. 清空本地存储（localStorage.removeItem("login-theme-preference")）
2. EnableFestivalTheme=true
3. 在春节期间（1月20-2月20日），刷新登录页
预期：显示"春节"主题
验证：console.debug 显示 "Festival: true" 和 "spring-festival"
```

**场景3：后端配置生效**
```
步骤：
1. 清空本地存储和节日条件
2. 后端 LoginTheme=business
3. 刷新登录页
预期：显示"商务专业"主题
验证：console.debug 显示 configLoginTheme: "business"
```

### 5.4 切换器显示控制

- [ ] EnableLoginThemeSwitcher=true → 顶部显示主题切换器下拉菜单
- [ ] EnableLoginThemeSwitcher=false → 顶部隐藏主题切换器（只显示亮/暗模式和语言）

### 5.5 节日主题开关

- [ ] EnableFestivalTheme=false → 设置页节日主题卡片禁用（灰显）
- [ ] 尝试点击禁用的节日主题 → 显示警告提示
- [ ] EnableFestivalTheme=true → 节日主题卡片可点击

## 六、常见问题排查

### Q1: 登录页未读到后端配置

**症状**: console.debug 显示 configLoginTheme: undefined

**排查步骤**:
1. 检查后端是否保存了 theme 组配置：
   ```sql
   SELECT * FROM sys_setting WHERE sysSettingGroup = 'theme';
   ```
2. 检查 ConfigStore.load() 是否被调用：
   - 在 doRegister 中打印日志
   - 查看 browser devtools Network 是否有 `/v2/setting/list?sysSettingGroup=theme` 请求
3. 检查 getConfig() 是否工作：
   - 在登录页 console 执行 `getConfig("LoginTheme")`

### Q2: 设置页保存失败

**症状**: 点击"保存配置"无反应

**排查步骤**:
1. 检查 fetchUpdateBatchSetting 接口是否存在：
   - 后端是否有 `/v2/setting/updateBatch` 端点
2. 查看浏览器 Network 标签页是否有请求发出
3. 查看响应状态码（200 vs 4xx/5xx）
4. 检查 pages/setting/src/api/index.ts 中 fetchUpdateBatchSetting 定义

### Q3: 主题切换后页面不变

**症状**: 设置页选择新主题、保存成功，但登录页仍显示旧主题

**排查步骤**:
1. 确认是否真的"重新登录"了（需要注销并重新访问登录页）
2. 检查本地存储是否还有旧主题：
   ```javascript
   localStorage.getItem("login-theme-preference")
   ```
3. 如果有，清空它（登录页按优先级会读取后端配置）

### Q4: 节日主题未生效

**症状**: 12月15日后仍显示 LoginTheme 配置的主题

**排查步骤**:
1. 检查 EnableFestivalTheme 是否为 true
2. 检查本地存储中是否有已保存的主题
3. 查看 detectFestivalTheme() 的日期范围（需在 12月15-31日）
4. 如果日期是对的，可能是节日检测逻辑改过，检查 `themes/index.ts` 中的日期范围

## 七、文件清单

### 核心文件（已修改）

| 文件 | 变更内容 |
|-----|---------|
| `packages/core/src/store/modules/ConfigStore.ts` | 添加 theme 组日志 |
| `packages/pages/login/index.vue` | 增强配置读取和日志 |
| `pages/setting/src/layout/theme.vue` | 补全节日主题预览样式 |

### 依赖文件（无需修改）

| 文件 | 功能 |
|-----|------|
| `packages/pages/login/themes/index.ts` | 主题管理和节日检测 |
| `packages/pages/login/components/ThemeSwitcher.vue` | 主题切换器组件 |
| `pages/setting/src/api/index.ts` | API 接口定义 |
| `packages/config/src/setting/index.ts` | 全局默认配置 |

## 八、部署流程

1. **后端部署**
   - 更新数据库，插入 theme 组配置
   - 重启后端服务

2. **前端构建**
   ```bash
   cd apps/vue-support-system-parent
   pnpm install
   pnpm build
   ```

3. **前端部署**
   - 上传 dist 文件夹到服务器
   - 刷新浏览器缓存（Ctrl+Shift+Delete）

4. **验证**
   - 打开系统设置 → 主题管理页面
   - 修改配置并保存
   - 重新登录验证主题是否生效

## 九、性能优化

- ✅ 异步加载主题组件（defineAsyncComponent）
- ✅ 设置页本地缓存配置（避免频繁刷新）
- ✅ 登录页优先使用本地存储（减少网络请求）
- ✅ 节日检测使用静态日期范围（无数据库查询）

## 十、扩展建议

### 10.1 添加主题预设

在 `packages/pages/login/themes/index.ts` 中添加新主题：

```typescript
export const loginThemes: LoginTheme[] = [
  // 现有主题...
  {
    name: "自定义主题",
    key: "custom",
    description: "自定义主题描述",
    component: () => import("./custom/index.vue"),
  },
];
```

### 10.2 主题颜色自定义

在 theme 组添加配置：

```sql
INSERT INTO sys_setting (
  sysSettingName, 
  sysSettingValue, 
  sysSettingGroup
) VALUES 
('PrimaryColor', '#409EFF', 'theme'),
('BackgroundColor', '#FFFFFF', 'theme');
```

### 10.3 按用户/租户存储主题偏好

扩展 ConfigStore，按当前用户保存偏好。

---

**文档版本**: 1.0.0  
**最后更新**: 2025-12-13  
**维护者**: 开发团队
