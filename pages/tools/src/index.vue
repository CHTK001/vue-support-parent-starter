<template>
  <div class="tools-container system-container modern-bg">
    <!-- 当没有plugin参数时显示工具列表 -->
    <template v-if="!currentPlugin || currentPlugin == 1">
      <ScCard class="tools-header">
        <template #header>
          <div class="card-header">
            <span>在线工具箱</span>
            <div class="search-box">
              <ScInput v-model="searchText" placeholder="搜索工具" clearable>
                <template #prefix>
                  <IconifyIconOnline icon="ep:search" />
                </template>
              </ScInput>
            </div>
          </div>
        </template>
        <div class="tools-description">
          <p>这里提供了各种实用的在线工具，点击卡片可以使用对应的功能。</p>
        </div>
      </ScCard>

      <ScCard class="tools-content">
        <ScTable
          layout="card"
          ref="tableRef"
          :data="toolsList"
          :params="{}"
          :col-size="4"
          :row-size="10"
        >
          <template #default="{ row }">
            <div class="tool-card" @click="openTool(row)">
              <div class="tool-icon">
                <IconifyIconOnline :icon="row.icon" />
              </div>
              <div class="tool-info">
                <h3 class="tool-name">{{ row.name }}</h3>
                <p class="tool-desc">{{ row.description }}</p>
              </div>
            </div>
          </template>
        </ScTable>
      </ScCard>
    </template>

    <!-- 当有plugin参数时显示对应的工具组件 -->
    <template v-else>
      <ScCard class="plugin-container">
        <template #header>
          <div class="plugin-header">
            <ScButton type="primary" text @click="backToList">
              <IconifyIconOnline icon="ep:back" />
              返回工具列表
            </ScButton>
            <span class="plugin-title">{{
              currentToolInfo?.name || "工具详情"
            }}</span>
          </div>
        </template>
        <component v-if="dynamicComponent" :is="dynamicComponent" />
        <el-result
          v-else-if="loadError"
          icon="error"
          :title="loadError"
          sub-title="请检查路径是否正确"
        >
          <template #extra>
            <ScButton type="primary" @click="backToList"
              >返回工具列表</el-button
            >
          </template>
        </el-result>
        <div v-else class="loading-container">
          <el-skeleton :rows="10" animated />
        </div>
      </ScCard>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

// 初始化路由
const router = useRouter();
const route = useRoute();

// 搜索文本
const searchText = ref("");

// 当前插件名称
const currentPlugin = computed(() => route.query.id);

// 动态组件和错误状态
const dynamicComponent = ref(null);
const loadError = ref(null);

// 返回工具列表
const backToList = () => {
  router.push({ path: `/tools/index`, query: { id: 1 } });
};

/**
 * 打开工具页面
 * @param {Object} tool 工具信息
 */
const openTool = (tool) => {
  router.push({ path: `/tools/index`, query: { id: tool.path } });
};

// 工具列表
const tools = [
  {
    name: "JSON格式化",
    path: "json",
    icon: "ri:code-box-line",
    description: "JSON数据格式化、校验、美化工具",
    tags: ["开发工具", "数据处理"],
  },
  {
    name: "Base64编解码",
    path: "base64",
    icon: "ri:file-code-line",
    description: "Base64编码与解码转换工具",
    tags: ["编码转换", "开发工具"],
  },
  {
    name: "进制转换器",
    path: "base-converter",
    icon: "ri:scales-2-line",
    description: "二进制、八进制、十进制、十六进制互相转换",
    tags: ["数学工具", "进制转换"],
  },
  {
    name: "正则表达式测试",
    path: "regex",
    icon: "ri:asterisk",
    description: "正则表达式在线测试验证工具",
    tags: ["开发工具", "文本处理"],
  },
  {
    name: "二维码生成器",
    path: "qrcode",
    icon: "ri:qr-code-line",
    description: "在线生成和解析二维码",
    tags: ["二维码", "图像工具"],
  },
  {
    name: "AES加解密",
    path: "aes",
    icon: "ri:lock-password-line",
    description: "AES加密与解密工具",
    tags: ["加密解密", "安全工具"],
  },
  {
    name: "JWT解析",
    path: "jwt",
    icon: "ri:key-2-line",
    description: "JSON Web Token解析与验证工具",
    tags: ["开发工具", "Web工具"],
  },
  {
    name: "Cron表达式生成器",
    path: "crontab",
    icon: "ri:time-line",
    description: "Cron定时任务表达式生成与测试工具",
    tags: ["开发工具", "时间工具"],
  },
  {
    name: "时间戳转换",
    path: "time",
    icon: "ri:calendar-check-line",
    description: "时间戳与日期格式相互转换工具",
    tags: ["时间工具", "日期转换"],
  },
  {
    name: "单位换算器",
    path: "unit-converter",
    icon: "ri:ruler-2-line",
    description: "长度、面积、体积、重量等单位换算工具",
    tags: ["换算工具", "数学工具"],
  },
  {
    name: "IP地址查询",
    path: "ip",
    icon: "ri:global-line",
    description: "IP地址归属地查询与IP信息解析",
    tags: ["网络工具", "IP工具"],
  },
  {
    name: "IP子网计算器",
    path: "ip-calculator",
    icon: "ri:divide-line",
    description: "IP地址子网划分与CIDR计算工具",
    tags: ["网络工具", "IP工具"],
  },
  {
    name: "PostMan",
    path: "postman",
    icon: "ri:send-plane-line",
    description: "在线API接口测试工具",
    tags: ["开发工具", "接口测试"],
  },
  {
    name: "SQL参数化处理",
    path: "sql-params",
    icon: "ri:database-2-line",
    description: "SQL语句参数化与格式化工具",
    tags: ["开发工具", "数据库工具"],
  },
  {
    name: "文本差异对比",
    path: "text-diff",
    icon: "ri:file-list-3-line",
    description: "对比两段文本的差异",
    tags: ["文本工具", "对比工具"],
  },
  {
    name: "十六进制编辑器",
    path: "hexedit",
    icon: "ri:file-code-line",
    description: "十六进制数据查看与编辑工具",
    tags: ["开发工具", "二进制工具"],
  },
  {
    name: "随机数生成器",
    path: "random-generator",
    icon: "ri:shuffle-line",
    description: "生成各种格式的随机数据",
    tags: ["开发工具", "测试工具"],
  },
  {
    name: "XML格式化",
    path: "xml",
    icon: "ri:file-xml-line",
    description: "XML数据格式化与校验工具",
    tags: ["开发工具", "数据处理"],
  },
  {
    name: "VIP视频解析",
    path: "vip",
    icon: "ri:video-line",
    description: "在线VIP视频解析工具",
    tags: ["视频工具", "媒体工具"],
  },
  {
    name: "电视直播",
    path: "tv",
    icon: "ri:tv-line",
    description: "在线电视直播源播放工具",
    tags: ["视频工具", "媒体工具"],
  },
  {
    name: "键盘按键检测",
    path: "keycode",
    icon: "ri:keyboard-line",
    description: "检测键盘按键值与按键代码",
    tags: ["开发工具", "硬件工具"],
  },
  {
    name: "火星文转换器",
    path: "martian",
    icon: "ri:alien-line",
    description: "汉字与火星文互相转换工具",
    tags: ["文本工具", "趣味工具"],
  },
  {
    name: "表情包生成器",
    path: "meme",
    icon: "ri:emotion-laugh-line",
    description: "在线表情包制作工具",
    tags: ["图像工具", "趣味工具"],
  },
  {
    name: "图片压缩工具",
    path: "image-compressor",
    icon: "ri:image-edit-line",
    description: "在线图片压缩与优化工具",
    tags: ["图像工具", "文件处理"],
  },
  {
    name: "Markdown编辑器",
    path: "markdown",
    icon: "ri:markdown-line",
    description: "在线Markdown编辑与预览工具",
    tags: ["文本工具", "编辑器"],
  },
  {
    name: "CSS代码美化",
    path: "css-beautify",
    icon: "ri:css3-line",
    description: "CSS代码格式化与美化工具",
    tags: ["开发工具", "前端工具"],
  },
  {
    name: "颜色选择器",
    path: "color-picker",
    icon: "ri:palette-line",
    description: "颜色选择与转换工具",
    tags: ["设计工具", "前端工具"],
  },
  {
    name: "密码生成器",
    path: "password-generator",
    icon: "ri:shield-keyhole-line",
    description: "安全密码生成与强度检测工具",
    tags: ["安全工具", "实用工具"],
  },
  {
    name: "计算器",
    path: "calculator",
    icon: "ri:calculator-line",
    description: "功能强大的科学计算器",
    tags: ["数学工具", "实用工具"],
  },
  {
    name: "番茄工作法",
    path: "pomodoro",
    icon: "ri:timer-line",
    description: "专注时间管理的番茄工作法计时器",
    tags: ["效率工具", "时间管理"],
  },
  {
    name: "汉字拼音转换",
    path: "pinyin",
    icon: "ri:translate",
    description: "汉字转拼音、注音工具",
    tags: ["文本工具", "语言工具"],
  },
];

// 过滤后的工具列表
const toolsList = computed(() => {
  if (!searchText.value) {
    return tools;
  }

  const keyword = searchText.value.toLowerCase();
  return tools.filter(
    (item) =>
      item.name.toLowerCase().includes(keyword) ||
      item.description.toLowerCase().includes(keyword) ||
      (item.tags &&
        item.tags.some((tag) => tag.toLowerCase().includes(keyword)))
  );
});

// 获取当前工具信息
const currentToolInfo = computed(() => {
  if (!currentPlugin.value) return null;
  return tools.find((tool) => tool.path === currentPlugin.value);
});

// 加载插件组件
const loadPluginComponent = async () => {
  if (!currentPlugin.value || currentPlugin.value == 1) return;

  try {
    loadError.value = null;
    dynamicComponent.value = null;
    // 动态导入插件组件
    const module = await import(`./plugins/${currentPlugin.value}.vue`);
    dynamicComponent.value = module.default;
  } catch (error) {
    console.error("加载工具插件失败:", error);
    loadError.value = `无法加载工具: ${currentPlugin.value}`;
  }
};

// 监听路由参数变化
watch(
  () => route.query.id,
  () => {
    loadPluginComponent();
  },
  { immediate: true }
);

onMounted(() => {
  console.log("工具箱已加载");
  if (currentPlugin.value) {
    loadPluginComponent();
  }
});
</script>

<style scoped lang="scss">
.tools-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  background-color: var(--el-bg-color);
  border-radius: 12px;
}

.tools-header {
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--el-border-color-lighter);
  overflow: hidden;

  :deep(.el-card__header) {
    background: linear-gradient(
      135deg,
      var(--el-color-primary-light-9) 0%,
      var(--el-bg-color-overlay) 100%
    );
    border-bottom: 1px solid var(--el-border-color-lighter);
    padding: 20px 24px;
  }

  :deep(.el-card__body) {
    padding: 16px 24px;
  }
}

.plugin-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--el-border-color-lighter);
  overflow: hidden;

  :deep(.el-card__header) {
    background: linear-gradient(
      135deg,
      var(--el-color-primary-light-9) 0%,
      var(--el-bg-color-overlay) 100%
    );
    border-bottom: 1px solid var(--el-border-color-lighter);
    padding: 16px 24px;
  }

  :deep(.el-card__body) {
    padding: 24px;
    flex: 1;
    overflow: auto;
  }
}

.tools-content {
  flex: 1;
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--el-border-color-lighter);

  :deep(.el-card__body) {
    padding: 20px;
  }
}

.card-header,
.plugin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header span,
.plugin-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.search-box {
  width: 320px;

  :deep(.el-input__wrapper) {
    border-radius: 8px;
    transition: all 0.2s ease;

    &:hover {
      box-shadow: 0 0 0 1px var(--el-color-primary-light-5) inset;
    }
  }
}

.tools-description {
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
  font-size: 14px;
}

.tool-card {
  height: 100%;
  padding: 24px;
  border-radius: 12px;
  background-color: var(--el-bg-color-overlay);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--el-border-color-lighter);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.tool-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  border-color: var(--el-color-primary-light-5);
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-9) 0%,
    var(--el-bg-color-overlay) 100%
  );
}

.tool-icon {
  width: 64px;
  height: 64px;
  font-size: 32px;
  margin-bottom: 16px;
  color: var(--el-color-white);
  background: linear-gradient(
    135deg,
    var(--el-color-primary) 0%,
    var(--el-color-primary-light-3) 100%
  );
  border-radius: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 8px 16px rgba(var(--el-color-primary-rgb), 0.3);
  transition: all 0.3s ease;
}

.tool-card:hover .tool-icon {
  transform: rotate(10deg) scale(1.1);
  box-shadow: 0 12px 24px rgba(var(--el-color-primary-rgb), 0.4);
}

.tool-info {
  text-align: center;
}

.tool-name {
  font-size: 16px;
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  transition: color 0.2s ease;
}

.tool-card:hover .tool-name {
  color: var(--el-color-primary);
}

.tool-desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

.loading-container {
  padding: 24px;
}

:deep(.el-button--text) {
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    transform: translateX(-2px);
  }
}
</style>
