# 节日主题深度定制 - 设计文档

## 技术架构

### 整体架构
```
festival-theme-customization/
├── composables/              # 组合式函数
│   ├── useFestivalDecoration.ts    # 装饰管理
│   ├── useFestivalAnimation.ts     # 动画控制
│   ├── useFestivalAudio.ts         # 音效管理
│   └── useFestivalParticles.ts     # 粒子系统
├── components/               # 节日装饰组件
│   ├── decorations/         # 装饰元素
│   │   ├── SpringFestival/  # 春节装饰
│   │   ├── Christmas/       # 圣诞装饰
│   │   └── Halloween/       # 万圣节装饰
│   ├── effects/             # 特效组件
│   │   ├── ParticleSystem.vue
│   │   ├── BackgroundEffect.vue
│   │   └── MouseTrail.vue
│   └── controls/            # 控制组件
│       └── FestivalSettings.vue
├── styles/                  # 节日样式
│   ├── festival-common.scss
│   ├── spring-festival-enhanced.scss
│   ├── christmas-enhanced.scss
│   └── halloween-enhanced.scss
└── utils/                   # 工具函数
    ├── particleEngine.ts
    ├── audioManager.ts
    └── decorationHelper.ts
```

## 模块设计

### 1. 节日装饰管理系统

#### 1.1 装饰配置接口
```typescript
interface FestivalDecoration {
  id: string;
  type: 'navbar' | 'sidebar' | 'footer' | 'avatar' | 'tag' | 'button' | 'card';
  theme: 'spring-festival' | 'christmas' | 'halloween';
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  elements: DecorationElement[];
  animation?: AnimationConfig;
  zIndex?: number;
}

interface DecorationElement {
  name: string;
  svg?: string;  // SVG 内容或 Data URL
  size: { width: number; height: number };
  offset: { x: number; y: number };
  animation?: string;
}
```

#### 1.2 useFestivalDecoration 组合函数
```typescript
export function useFestivalDecoration(componentType: string) {
  const { layoutTheme } = useLayout();
  const decorations = ref<FestivalDecoration[]>([]);
  
  // 根据主题加载装饰配置
  const loadDecorations = () => {
    const theme = layoutTheme.value.theme;
    decorations.value = getDecorationsForComponent(componentType, theme);
  };
  
  // 切换装饰显示/隐藏
  const toggleDecoration = (id: string, visible: boolean) => {
    // ...
  };
  
  return { decorations, loadDecorations, toggleDecoration };
}
```

### 2. 组件节日适配方案

#### 2.1 lay-navbar 节日装饰
**实现方式**：为 Default.vue 添加装饰层组件

**春节装饰**：
- 顶部灯笼串：使用 CSS 绘制，absolute 定位在顶部
- 福字装饰：SVG 图标，左右两侧
- 祥云背景：CSS 渐变 + 动画

**圣诞装饰**：
- 彩灯串：CSS 绘制彩色圆点，闪烁动画
- 雪花飘落：使用 ParticleSystem 组件
- 铃铛：SVG 图标，摇摆动画

**万圣节装饰**：
- 蜘蛛网：CSS 绘制，角落位置
- 南瓜灯：SVG 图标，闪烁动画
- 幽灵：CSS 绘制，飘动动画

**文件结构**：
```
lay-navbar/
├── themes/
│   ├── Default.vue (添加装饰层)
│   └── decorations/
│       ├── SpringFestivalNavbar.vue
│       ├── ChristmasNavbar.vue
│       └── HalloweenNavbar.vue
```

#### 2.2 lay-sidebar 节日风格
**实现方式**：为菜单项添加节日图标和 hover 特效

**技术方案**：
- 使用 `::before` 伪元素添加节日图标
- hover 时触发特效动画（烟花/雪花/蝙蝠）
- 激活态使用节日主题色边框

**样式示例**：
```scss
.lay-sidebar {
  &.spring-festival {
    .menu-item {
      &::before {
        content: '🧧'; // 红包图标
      }
      &:hover::after {
        // 烟花特效
        animation: firework 0.6s ease-out;
      }
    }
  }
}
```

#### 2.3 lay-footer 节日元素
**实现方式**：在版权信息区域添加节日祝福和装饰

**内容**：
- 春节：「恭贺新春」+ 鞭炮装饰
- 圣诞节：「圣诞快乐」+ 圣诞树装饰
- 万圣节：「万圣节快乐」+ 南瓜装饰

**文件修改**：
```vue
<!-- lay-footer/index.vue -->
<template>
  <footer class="lay-footer" :class="themeClass">
    <div class="footer-content">
      <span class="copyright">{{ copyrightText }}</span>
      <FestivalGreeting v-if="isFestivalTheme" :theme="themeClass" />
    </div>
    <FestivalFooterDecoration :theme="themeClass" />
  </footer>
</template>
```

#### 2.4 ScButton 节日样式
**实现方式**：创建节日主题变体

**文件结构**：
```
packages/components/ScButton/
├── themes/
│   ├── SpringFestivalButton.vue
│   ├── ChristmasButton.vue
│   └── HalloweenButton.vue
```

**样式特点**：
- 春节：红包样式，金色光晕，点击烟花效果
- 圣诞节：礼物盒样式，雪花点缀，hover 摇晃
- 万圣节：南瓜样式，幽灵悬浮，点击闪烁

#### 2.5 ScCard 节日边框
**实现方式**：添加节日装饰边框和角标

**技术方案**：
- 使用 `::before/::after` 伪元素创建边框装饰
- 角标使用 absolute 定位
- 边框动画使用 CSS animation

### 3. Tag标签增强设计

#### 3.1 春节Tag增强
**装饰元素**：
- 鞭炮：左右两侧，CSS 绘制
- 祥云：激活态背景，SVG pattern
- 舞狮：hover 时显示，CSS 动画
- 烟花：点击触发，Canvas 绘制

**实现文件**：`lay-tag/themes/SpringFestivalTag.vue`

**关键代码**：
```vue
<template>
  <div class="spring-festival-tag">
    <div class="firecracker-left"></div>
    <BaseTag theme-class="spring-tag" @click="triggerFirework" />
    <div class="firecracker-right"></div>
    <canvas ref="fireworkCanvas" class="firework-canvas"></canvas>
  </div>
</template>
```

#### 3.2 圣诞Tag增强
**装饰元素**：
- 圣诞树：左侧图标，CSS 绘制
- 礼物盒：激活态显示，SVG
- 雪人：hover 时显示，CSS 动画
- 雪花：持续飘落，ParticleSystem

#### 3.3 万圣节Tag增强
**装饰元素**：
- 南瓜灯：左侧图标，CSS 绘制
- 幽灵：hover 时飘过，CSS 动画
- 蜘蛛网：激活态背景，SVG pattern
- 蝙蝠：随机飞过，CSS 动画

### 4. 头像装饰系统扩展

#### 4.1 多层装饰架构
```typescript
interface AvatarDecorationLayer {
  id: string;
  type: 'border' | 'hat' | 'badge' | 'accessory';
  zIndex: number;
  position: Position;
  element: DecorationElement;
  visible: boolean;
}

interface Position {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
}
```

#### 4.2 装饰组件设计
```vue
<!-- lay-avatar/index.vue -->
<template>
  <div class="lay-avatar" :class="themeClass">
    <img :src="src" :alt="alt" class="lay-avatar-img" />
    <DecorationLayer
      v-for="layer in decorationLayers"
      :key="layer.id"
      :layer="layer"
      :theme="themeClass"
    />
  </div>
</template>

<script setup lang="ts">
const { decorationLayers, updateLayer } = useAvatarDecoration();
</script>
```

#### 4.3 动态装饰切换
**实现方式**：
- 监听日期变化，自动切换装饰
- 使用 transition 组件实现淡入淡出
- 支持用户手动选择装饰

**代码示例**：
```typescript
export function useAvatarDecoration() {
  const decorationLayers = ref<AvatarDecorationLayer[]>([]);
  
  // 根据日期自动切换
  const autoSwitchDecoration = () => {
    const today = new Date();
    const daysToFestival = calculateDaysToFestival(today);
    
    if (daysToFestival <= 7) {
      // 节日前7天显示倒计时装饰
      addCountdownDecoration(daysToFestival);
    }
  };
  
  return { decorationLayers, autoSwitchDecoration };
}
```

#### 4.4 粒子系统设计
**技术方案**：使用 Canvas 实现粒子效果

**粒子类型**：
- 烟花粒子：爆炸效果，重力下落
- 雪花粒子：飘落效果，左右摇摆
- 落叶粒子：旋转下落，风力影响

**核心类**：
```typescript
class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  
  update(deltaTime: number) {
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.vy += 0.1; // 重力
    this.life -= deltaTime;
  }
  
  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, 2, 2);
  }
}

class ParticleSystem {
  particles: Particle[] = [];
  
  emit(x: number, y: number, count: number) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y));
    }
  }
  
  update(deltaTime: number) {
    this.particles = this.particles.filter(p => p.life > 0);
    this.particles.forEach(p => p.update(deltaTime));
  }
  
  draw(ctx: CanvasRenderingContext2D) {
    this.particles.forEach(p => p.draw(ctx));
  }
}
```

### 5. 全局节日氛围

#### 5.1 背景特效系统
**实现方式**：创建全屏 Canvas 组件

**文件**：`components/effects/BackgroundEffect.vue`

**特效类型**：
- 春节：烟花爆炸（随机位置）、灯笼飘动（正弦波）、红包雨（下落）
- 圣诞节：雪花飘落（密集）、圣诞树生长（动画）、礼物掉落（随机）
- 万圣节：蝙蝠飞行（贝塞尔曲线）、幽灵飘动（正弦波）、南瓜滚动（旋转）

**性能优化**：
- 使用 requestAnimationFrame
- 粒子数量限制（最多200个）
- 离屏渲染优化
- 节流更新（60fps）

#### 5.2 音效系统设计
**实现方式**：使用 Web Audio API

**文件**：`composables/useFestivalAudio.ts`

**音效类型**：
- 背景音乐：循环播放，音量可调
- 交互音效：点击、hover 触发
- 特效音效：烟花、铃铛、鞭炮

**音频管理**：
```typescript
export function useFestivalAudio() {
  const audioContext = new AudioContext();
  const sounds = new Map<string, AudioBuffer>();
  const volume = ref(0.5);
  const muted = ref(false);
  
  // 加载音效
  const loadSound = async (name: string, url: string) => {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    sounds.set(name, audioBuffer);
  };
  
  // 播放音效
  const playSound = (name: string) => {
    if (muted.value) return;
    const buffer = sounds.get(name);
    if (!buffer) return;
    
    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    
    source.buffer = buffer;
    gainNode.gain.value = volume.value;
    
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    source.start();
  };
  
  return { loadSound, playSound, volume, muted };
}
```

**音效文件**：
- 使用 Base64 编码嵌入（小于10KB）
- 或使用 CDN 加载（大于10KB）
- 格式：MP3（兼容性好）

#### 5.3 页面过渡动画
**实现方式**：使用 Vue Router 的 transition

**文件**：`layout/default/src/transitions/festival-transitions.scss`

**过渡效果**：
- 春节：烟花爆炸过渡
- 圣诞节：雪花飘落过渡
- 万圣节：幽灵飘过过渡

**代码示例**：
```scss
.spring-festival-enter-active,
.spring-festival-leave-active {
  transition: all 0.5s ease;
}

.spring-festival-enter-from {
  opacity: 0;
  transform: scale(0.8);
  filter: blur(10px);
}

.spring-festival-leave-to {
  opacity: 0;
  transform: scale(1.2);
  filter: blur(10px);
}
```

#### 5.4 鼠标特效
**实现方式**：监听 mousemove 事件，绘制轨迹

**文件**：`components/effects/MouseTrail.vue`

**特效类型**：
- 春节：金色星光轨迹
- 圣诞节：雪花轨迹
- 万圣节：幽灵轨迹

**实现代码**：
```typescript
export function useMouseTrail(theme: string) {
  const trail = ref<TrailPoint[]>([]);
  
  const onMouseMove = (e: MouseEvent) => {
    trail.value.push({
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
      theme
    });
    
    // 保留最近50个点
    if (trail.value.length > 50) {
      trail.value.shift();
    }
  };
  
  onMounted(() => {
    window.addEventListener('mousemove', onMouseMove);
  });
  
  onUnmounted(() => {
    window.removeEventListener('mousemove', onMouseMove);
  });
  
  return { trail };
}
```

### 6. 其他组件节日适配

#### 6.1 表单组件适配
**实现方式**：在主题 SCSS 中添加表单组件样式

**文件**：`themes/spring-festival-enhanced.scss`

**样式覆盖**：
```scss
html[data-skin="spring-festival"] {
  .el-input__wrapper {
    border-color: rgba(255, 215, 0, 0.4);
    
    &:hover {
      border-color: rgba(255, 215, 0, 0.6);
      box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
    }
    
    &.is-focus {
      border-color: #dc143c;
      box-shadow: 0 0 12px rgba(220, 20, 60, 0.4);
    }
  }
  
  .el-checkbox__inner {
    border-color: #ffd700;
    
    &:hover {
      border-color: #dc143c;
    }
  }
  
  .el-checkbox__input.is-checked .el-checkbox__inner {
    background-color: #dc143c;
    border-color: #dc143c;
    
    &::after {
      border-color: #ffd700;
    }
  }
}
```

#### 6.2 消息通知适配
**实现方式**：覆盖 ElNotification 样式

**样式示例**：
```scss
html[data-skin="spring-festival"] {
  .el-notification {
    background: linear-gradient(135deg, rgba(220, 20, 60, 0.1) 0%, rgba(255, 215, 0, 0.1) 100%);
    border: 2px solid rgba(255, 215, 0, 0.4);
    box-shadow: 0 4px 16px rgba(220, 20, 60, 0.3);
    
    &::before {
      content: '🧧';
      position: absolute;
      top: 10px;
      left: 10px;
      font-size: 24px;
    }
  }
}
```

#### 6.3 对话框适配
**实现方式**：覆盖 ElDialog 样式

**装饰元素**：
- 标题栏添加节日图标
- 边框使用节日主题色
- 背景添加节日纹理

#### 6.4 加载动画
**实现方式**：创建节日主题 Loading 组件

**文件结构**：
```
components/loading/
├── SpringFestivalLoading.vue  # 灯笼旋转
├── ChristmasLoading.vue       # 雪花旋转
└── HalloweenLoading.vue       # 南瓜旋转
```

**动画实现**：
```vue
<!-- SpringFestivalLoading.vue -->
<template>
  <div class="spring-festival-loading">
    <div class="lantern"></div>
    <div class="loading-text">加载中...</div>
  </div>
</template>

<style scoped>
.lantern {
  width: 60px;
  height: 80px;
  background: linear-gradient(135deg, #dc143c 0%, #a00000 100%);
  border-radius: 50% 50% 40% 40%;
  animation: swing 1.5s ease-in-out infinite;
}

@keyframes swing {
  0%, 100% { transform: rotate(-10deg); }
  50% { transform: rotate(10deg); }
}
</style>
```

## 性能优化策略

### 1. 按需加载
- 装饰组件使用 defineAsyncComponent 懒加载
- 音效文件按需加载，不预加载
- 粒子系统仅在需要时初始化

### 2. 渲染优化
- 使用 CSS transform 代替 top/left 动画
- 使用 will-change 提示浏览器优化
- 使用 requestAnimationFrame 控制动画帧率
- 粒子数量限制，超出自动清理

### 3. 内存管理
- 组件卸载时清理事件监听
- Canvas 离屏时停止渲染
- 音效播放完毕后释放资源
- 装饰元素使用对象池复用

### 4. 用户控制
- 提供装饰开关，用户可关闭
- 提供性能模式，减少特效
- 提供音效开关，可静音
- 自动检测设备性能，降级处理

## 兼容性方案

### 浏览器兼容
- 使用 CSS 变量 fallback
- Canvas API 降级为 CSS 动画
- Web Audio API 降级为 HTML5 Audio
- 使用 Autoprefixer 自动添加前缀

### 响应式适配
- 移动端减少粒子数量
- 平板端简化装饰元素
- 小屏幕隐藏部分装饰
- 使用媒体查询适配不同尺寸

### 深色模式
- 所有装饰元素适配深色模式
- 颜色使用 CSS 变量，自动切换
- 阴影和光晕效果调整透明度

## 测试策略

### 单元测试
- 测试装饰管理函数
- 测试粒子系统逻辑
- 测试音效管理功能

### 集成测试
- 测试主题切换流程
- 测试装饰显示/隐藏
- 测试动画触发时机

### 性能测试
- 测试页面加载时间
- 测试动画帧率
- 测试内存占用
- 测试CPU使用率

### 兼容性测试
- 测试主流浏览器
- 测试不同屏幕尺寸
- 测试深色/浅色模式
- 测试低性能设备
