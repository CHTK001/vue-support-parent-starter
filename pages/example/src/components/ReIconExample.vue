<template>
  <div class="reicon-example">
    <div class="example-section">
      <h3>在线图标 (IconifyIconOnline)</h3>
      <div class="example-box">
        <div class="icon-grid">
          <div v-for="(icon, index) in onlineIcons" :key="index" class="icon-item">
            <IconifyIconOnline :icon="icon" />
            <span class="icon-name">{{ icon }}</span>
          </div>
        </div>
      </div>
      <div class="example-code">
        <pre>&lt;IconifyIconOnline icon="ri:home-line" /&gt;</pre>
      </div>
    </div>

    <div class="example-section">
      <h3>图标尺寸</h3>
      <div class="example-box">
        <div class="icon-size-demo">
          <div class="size-item">
            <IconifyIconOnline icon="ri:user-line" style="font-size: 16px" />
            <span>16px</span>
          </div>
          <div class="size-item">
            <IconifyIconOnline icon="ri:user-line" style="font-size: 24px" />
            <span>24px</span>
          </div>
          <div class="size-item">
            <IconifyIconOnline icon="ri:user-line" style="font-size: 32px" />
            <span>32px</span>
          </div>
          <div class="size-item">
            <IconifyIconOnline icon="ri:user-line" style="font-size: 48px" />
            <span>48px</span>
          </div>
          <div class="size-item">
            <IconifyIconOnline icon="ri:user-line" style="font-size: 64px" />
            <span>64px</span>
          </div>
        </div>
      </div>
      <div class="example-code">
        <pre>&lt;IconifyIconOnline icon="ri:user-line" style="font-size: 32px;" /&gt;</pre>
      </div>
    </div>

    <div class="example-section">
      <h3>图标颜色</h3>
      <div class="example-box">
        <div class="icon-color-demo">
          <div class="color-item">
            <IconifyIconOnline icon="ri:heart-fill" style="color: #f56c6c; font-size: 32px" />
            <span>红色</span>
          </div>
          <div class="color-item">
            <IconifyIconOnline icon="ri:heart-fill" style="color: #409eff; font-size: 32px" />
            <span>蓝色</span>
          </div>
          <div class="color-item">
            <IconifyIconOnline icon="ri:heart-fill" style="color: #67c23a; font-size: 32px" />
            <span>绿色</span>
          </div>
          <div class="color-item">
            <IconifyIconOnline icon="ri:heart-fill" style="color: #e6a23c; font-size: 32px" />
            <span>黄色</span>
          </div>
          <div class="color-item">
            <IconifyIconOnline icon="ri:heart-fill" style="color: #909399; font-size: 32px" />
            <span>灰色</span>
          </div>
        </div>
      </div>
      <div class="example-code">
        <pre>&lt;IconifyIconOnline icon="ri:heart-fill" style="color: #409eff; font-size: 32px;" /&gt;</pre>
      </div>
    </div>

    <div class="example-section">
      <h3>图标选择器</h3>
      <div class="example-box">
        <div class="icon-selector-demo">
          <el-input v-model="iconSearch" placeholder="搜索图标" clearable>
            <template #prefix>
              <IconifyIconOnline icon="ri:search-line" />
            </template>
          </el-input>

          <div class="icon-list">
            <div v-for="(icon, index) in filteredIcons" :key="index" class="icon-list-item" @click="selectIcon(icon)">
              <IconifyIconOnline :icon="icon" />
              <span class="icon-list-name">{{ icon }}</span>
            </div>
          </div>

          <div class="selected-icon" v-if="selectedIcon">
            <h4>已选图标</h4>
            <div class="selected-icon-display">
              <IconifyIconOnline :icon="selectedIcon" style="font-size: 48px" />
              <div class="selected-icon-info">
                <p>图标名称: {{ selectedIcon }}</p>
                <el-button size="small" type="primary" @click="copyIconCode">
                  <IconifyIconOnline icon="ri:file-copy-line" />
                  复制代码
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="example-code">
        <pre>
&lt;!-- 图标选择器示例 --&gt;
&lt;IconifyIconOnline :icon="selectedIcon" /&gt;
        </pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { message } from "@repo/utils";

// 在线图标列表（示例）
const onlineIcons = [
  "ri:home-line",
  "ri:user-line",
  "ri:settings-line",
  "ri:notification-line",
  "ri:search-line",
  "ri:dashboard-line",
  "ri:file-list-line",
  "ri:calendar-line",
  "ri:message-2-line",
  "ri:chat-1-line",
  "ri:mail-line",
  "ri:folder-line",
  "ep:edit",
  "ep:delete",
  "ep:view",
  "ep:plus",
  "ep:minus",
  "ep:close",
  "ep:check",
  "ep:warning",
];

// 更多图标列表
const moreIcons = [
  "ri:heart-fill",
  "ri:star-fill",
  "ri:bookmark-fill",
  "ri:thumb-up-fill",
  "ri:thumb-down-fill",
  "ri:flag-fill",
  "ri:shield-fill",
  "ri:lock-fill",
  "ri:unlock-fill",
  "ri:eye-fill",
  "ri:eye-off-fill",
  "ri:cloud-fill",
  "ri:cloud-off-fill",
  "ri:download-fill",
  "ri:upload-fill",
  "ri:send-plane-fill",
  "ri:refresh-fill",
  "ri:delete-bin-fill",
  "ri:save-fill",
  "ri:share-fill",
  "ep:info-filled",
  "ep:warning-filled",
  "ep:success-filled",
  "ep:error-filled",
  "ep:bell-filled",
  "ep:message-box-filled",
  "ep:guide-filled",
  "ep:help-filled",
  "ep:position-filled",
  "ep:circle-check-filled",
];

// 合并所有图标
const allIcons = [...onlineIcons, ...moreIcons];

// 图标搜索
const iconSearch = ref("");
const filteredIcons = computed(() => {
  if (!iconSearch.value) {
    return allIcons;
  }

  const keyword = iconSearch.value.toLowerCase();
  return allIcons.filter((icon) => icon.toLowerCase().includes(keyword));
});

// 选中的图标
const selectedIcon = ref("");

/**
 * 选择图标
 * @param {string} icon 图标名称
 */
const selectIcon = (icon) => {
  selectedIcon.value = icon;
};

/**
 * 复制图标代码
 */
const copyIconCode = () => {
  if (!selectedIcon.value) return;

  const code = `<IconifyIconOnline icon="${selectedIcon.value}" />`;

  // 复制到剪贴板
  navigator.clipboard
    .writeText(code)
    .then(() => {
      message("代码已复制到剪贴板", { type: "success" });
    })
    .catch(() => {
      message("复制失败，请手动复制", { type: "error" });
    });
};
</script>

<style scoped>
.reicon-example {
  padding: 20px;
}

.example-section {
  margin-bottom: 30px;
}

.example-section h3 {
  margin-bottom: 16px;
  font-weight: 600;
  font-size: 18px;
  position: relative;
  padding-left: 12px;
}

.example-section h3::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 18px;
  background-color: var(--el-color-primary);
  border-radius: 2px;
}

.example-box {
  margin-bottom: 16px;
  border: 1px solid #e6e6e6;
  border-radius: 6px;
  padding: 16px;
  background-color: #fff;
}

.example-code {
  border-radius: 6px;
  background-color: #283142;
  color: #fff;
  padding: 16px;
}

.example-code pre {
  margin: 0;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 16px;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 8px;
  border-radius: 4px;
  border: 1px solid #eaeaea;
  transition: all 0.3s;
  cursor: pointer;
}

.icon-item:hover {
  background-color: #f5f7fa;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.icon-item i {
  font-size: 24px;
  margin-bottom: 8px;
}

.icon-name {
  font-size: 12px;
  color: #606266;
  text-align: center;
  word-break: break-all;
}

.icon-size-demo,
.icon-color-demo {
  display: flex;
  align-items: center;
  gap: 32px;
  flex-wrap: wrap;
}

.size-item,
.color-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.icon-selector-demo {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.icon-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 12px;
  margin-top: 16px;
  max-height: 240px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.icon-list-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 8px;
  border-radius: 4px;
  border: 1px solid #eaeaea;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-list-item:hover {
  background-color: #f0f9ff;
  border-color: #409eff;
}

.icon-list-item i {
  font-size: 24px;
  margin-bottom: 8px;
}

.icon-list-name {
  font-size: 12px;
  color: #606266;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.selected-icon {
  margin-top: 16px;
  padding: 16px;
  border-radius: 4px;
  border: 1px dashed #dcdfe6;
  background-color: #f5f7fa;
}

.selected-icon h4 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 16px;
  color: #303133;
}

.selected-icon-display {
  display: flex;
  align-items: center;
  gap: 24px;
}

.selected-icon-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.selected-icon-info p {
  margin: 0;
  font-size: 14px;
  color: #606266;
}
</style>
