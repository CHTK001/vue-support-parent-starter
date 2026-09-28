<template>
  <div class="home-page">
    <!-- 顶部欢迎条 -->
    <el-card shadow="never" class="welcome">
      <div class="flex items-center justify-between">
        <div>
          <div class="welcome-title">教育 AI 工作台</div>
          <div class="welcome-sub">题库 · AI 组卷 · AI 阅卷 · 知识库 · 错题库 · 考试管理</div>
        </div>
        <div class="health-badge">
          <el-tag :type="health.available ? 'success' : 'warning'" effect="dark">
            <el-icon class="mr-1"><CircleCheck v-if="health.available" /><Warning v-else /></el-icon>
            AI {{ health.available ? '已启用' : '未启用' }}
          </el-tag>
          <el-tag :type="health.queueConnected ? 'success' : 'info'" effect="plain" class="ml-2">
            队列 {{ health.queueType }} {{ health.queueConnected ? '已连接' : '未连接' }}
          </el-tag>
        </div>
      </div>
    </el-card>

    <!-- 6 大能力卡片 -->
    <div class="card-grid mt-4">
      <!-- 卡片本身可点：补 role/tabindex 让键盘能聚焦，:focus-visible 的焦点环才有意义 -->
      <div
        v-for="card in cards"
        :key="card.path"
        class="cap-card"
        role="button"
        tabindex="0"
        @click="go(card.path)"
        @keydown.enter="go(card.path)"
      >
        <div class="cap-icon" :style="{ background: card.gradient }">
          <el-icon :size="36"><component :is="card.icon" /></el-icon>
        </div>
        <div class="cap-body">
          <div class="cap-title">{{ card.title }}</div>
          <div class="cap-desc">{{ card.desc }}</div>
          <div class="cap-tags">
            <el-tag v-for="t in card.tags" :key="t"  effect="plain" round>{{ t }}</el-tag>
          </div>
        </div>
        <el-icon class="cap-arrow"><ArrowRight /></el-icon>
      </div>
    </div>

    <!-- AI 健康详情 -->
    <el-card shadow="never" class="mt-4">
      <template #header>
        <div class="flex items-center gap-2">
          <el-icon><Monitor /></el-icon>
          <span class="font-semibold">AI 健康详情</span>
          <el-button link  @click="loadHealth">刷新</el-button>
        </div>
      </template>
      <el-descriptions :column="3" border >
        <el-descriptions-item label="AI 总开关">{{ health.enabled ? '启用' : '禁用' }}</el-descriptions-item>
        <el-descriptions-item label="Provider">{{ health.provider || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Model">{{ health.model || '-' }}</el-descriptions-item>
        <el-descriptions-item label="可用">{{ health.available ? '是' : '否 (回退字符串匹配)' }}</el-descriptions-item>
        <el-descriptions-item label="队列类型">{{ health.queueType }}</el-descriptions-item>
        <el-descriptions-item label="队列连接">{{ health.queueConnected ? 'OK' : '未连接' }}</el-descriptions-item>
        <el-descriptions-item label="已注册 Provider" :span="3">
          <el-tag v-for="p in (health.registeredProviders ?? [])" :key="p"  class="mr-1">{{ p }}</el-tag>
          <span v-if="!health.registeredProviders?.length" class="text-el-text-secondary">无</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import {
  ArrowRight,
  CircleCheck,
  Warning,
  Monitor,
  Notebook,
  MagicStick,
  Reading,
  DataAnalysis,
  Warning as WarningIcon,
  Document,
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { eduaiApi } from '../api/eduaiApi';

const router = useRouter();

interface Health {
  enabled: boolean;
  provider: string;
  model: string;
  available: boolean;
  queueType: string;
  queueConnected: boolean;
  registeredProviders: string[];
}

const health = reactive<Health>({
  enabled: false,
  provider: '',
  model: '',
  available: false,
  queueType: 'unknown',
  queueConnected: false,
  registeredProviders: [],
});

interface CapCard {
  path: string;
  title: string;
  desc: string;
  tags: string[];
  icon: any;
  gradient: string;
}

const cards: CapCard[] = [
  {
    path: '/edu/question',
    title: '题库管理',
    desc: '题目录入、批量导入、多维度筛选与审核',
    tags: ['CRUD', '导入', '审核'],
    icon: Notebook,
    gradient: 'linear-gradient(135deg, #5B8FF9, #5AD8A6)',
  },
  {
    path: '/edu/paper',
    title: 'AI 组卷',
    desc: '根据知识点、难度、题型智能生成试卷',
    tags: ['AI', '自动出题'],
    icon: MagicStick,
    gradient: 'linear-gradient(135deg, #9270CA, #5B8FF9)',
  },
  {
    path: '/edu/marking',
    title: 'AI 阅卷',
    desc: '主观题自动批改，客观题秒级判分',
    tags: ['异步', 'AI'],
    icon: Reading,
    gradient: 'linear-gradient(135deg, #FF9D4D, #F6BD16)',
  },
  {
    path: '/edu/knowledge',
    title: '知识库',
    desc: '知识点树形管理 + 文档向量检索',
    tags: ['树形', '语义检索'],
    icon: DataAnalysis,
    gradient: 'linear-gradient(135deg, #5AD8A6, #5B8FF9)',
  },
  {
    path: '/edu/wrongbook',
    title: '错题库',
    desc: '错题自动收集，复习卷与掌握度跟踪',
    tags: ['聚合', '复习'],
    icon: WarningIcon,
    gradient: 'linear-gradient(135deg, #F6BD16, #FF9D4D)',
  },
  {
    path: '/edu/exam',
    title: '考试管理',
    desc: '考试创建、班级分发、阅卷闭环',
    tags: ['CRUD', '闭环'],
    icon: Document,
    gradient: 'linear-gradient(135deg, #6DC8EC, #5B8FF9)',
  },
];

const go = (path: string) => router.push(path);

const loadHealth = async () => {
  try {
    const res: any = await eduaiApi.aiHealth();
    Object.assign(health, {
      enabled: !!res?.enabled,
      provider: res?.provider ?? '',
      model: res?.model ?? '',
      available: !!res?.available,
      queueType: res?.queueType ?? 'unknown',
      queueConnected: !!res?.queueConnected,
      registeredProviders: Array.isArray(res?.registeredProviders) ? res.registeredProviders : [],
    });
  } catch (e) {
    ElMessage.warning('AI 健康信息获取失败: ' + (e instanceof Error ? e.message : String(e)));
  }
};

onMounted(loadHealth);
</script>

<style scoped>
.home-page {
  height: 100%;
  overflow-y: auto;
}
.welcome :deep(.el-card__body) {
  padding: 18px 20px;
}
.welcome-title {
  font-size: 20px;
  font-weight: 600;
}
.welcome-sub {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}
.health-badge {
  display: flex;
  align-items: center;
}
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}
.cap-card {
  position: relative;
  background: var(--el-bg-color);
  border-radius: var(--el-radius-lg, 12px);
  padding: 18px;
  cursor: pointer;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
  transition:
    transform var(--el-transition-duration-fast, 0.2s) ease,
    box-shadow var(--el-transition-duration-fast, 0.2s) ease;
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid var(--el-border-color-lighter);
}
.cap-card:hover {
  transform: translateY(-2px);
  /* 浮起反馈是 koi 唯一允许的卡片投影；原来用的是纯黑 8%，
     这里用 --el-color-black 8% 等价还原，不改成主色，保持原有中性观感 */
  box-shadow: 0 8px 24px color-mix(in srgb, var(--el-color-black) 8%, transparent);
}
.cap-card:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.cap-icon {
  width: 64px;
  height: 64px;
  /* 原 14px，最近档 12px（lg） */
  border-radius: var(--el-radius-lg, 12px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-color-white);
  flex-shrink: 0;
}
.cap-body {
  flex: 1;
  min-width: 0;
}
.cap-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}
.cap-desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
}
.cap-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.cap-arrow {
  color: var(--el-text-color-secondary);
  font-size: 18px;
}

/* ============ 无障碍：尊重系统「减少动态效果」偏好 ============ */
@media (prefers-reduced-motion: reduce) {
  .cap-card {
    transition: none;
  }
  /* 位移也是动效：关掉后 :hover 只剩投影反馈 */
  .cap-card:hover {
    transform: none;
  }
}
</style>