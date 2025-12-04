<template>
  <div class="email-header">
    <div class="header-left">
      <IconifyIconOnline icon="ri:mail-line" class="email-icon" />
      <h2 class="email-title">邮箱控制�?/h2>
    </div>
    <div class="header-right">
      <el-button :icon="useRenderIcon('ri:refresh-line')" @click="handleRefresh">刷新</el-button>
      <!--<el-button type="primary" :icon="useRenderIcon('ri:add-line')" @click="handleCompose">撰写邮件</el-button>
      <el-button type="success" :icon="useRenderIcon('ri:cloud-line')" @click="handleCloudSync">云同�?/el-button>
      <el-button type="warning" :icon="useRenderIcon('ri:upload-cloud-line')" @click="handleCloudBackup">云备�?/el-button>-->
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { indexedDBProxy, message } from "@repo/utils";

// 定义props
const props = defineProps<{
  settingId?: number;
}>();

// 定义事件
const emit = defineEmits<{
  compose: [];
  refresh: [];
  cloudSync: [];
  cloudBackup: [];
  "menu-cleared": [];
  "cache-cleared": [];
}>();

// 清空IndexedDB中的菜单数据
async function clearMenuFromDB(settingId: number) {
  try {
    const menuKey = `email_menu_${settingId}`;
    await indexedDBProxy().removeItem(menuKey);
    console.log("[EmailHeader] 已清空IndexedDB中的菜单数据", { settingId });
    return true;
  } catch (error) {
    console.error("[EmailHeader] 清空IndexedDB菜单数据失败:", error);
    return false;
  }
}

// 清空IndexedDB中的邮件缓存数据
async function clearEmailCacheFromDB(settingId: number) {
  try {
    const EMAIL_CACHE_PREFIX = "email_cache";
    // 清理前几页的缓存（假设最多缓�?0页，支持多个文件夹）
    const folders = ["INBOX","收件�?, "草稿�?, "已发�?, "已删�?, "垃圾邮件", "病毒文件�?, "广告邮件", "订阅邮件"];
    const clearPromises = [];

    for (const folder of folders) {
      for (let page = 1; page <= 10; page++) {
        const cacheKey = `${EMAIL_CACHE_PREFIX}_${settingId}_${folder}_${page}`;
        clearPromises.push(indexedDBProxy().removeItem(cacheKey));
      }
      // 也清理文件夹级别的缓�?
      const folderCacheKey = `${EMAIL_CACHE_PREFIX}_folder_${settingId}_${folder}`;
      clearPromises.push(indexedDBProxy().removeItem(folderCacheKey));
    }

    await Promise.all(clearPromises);
    console.log("[EmailHeader] 已清空IndexedDB中的邮件缓存数据", { settingId });
    return true;
  } catch (error) {
    console.error("[EmailHeader] 清空IndexedDB邮件缓存数据失败:", error);
    return false;
  }
}

// 事件处理
function handleCompose() {
  emit("compose");
}

async function handleRefresh() {
  // 如果有settingId，先清空IndexedDB中的菜单数据和邮件缓存数�?
  if (props.settingId) {
    const menuCleared = await clearMenuFromDB(props.settingId);
    const cacheCleared = await clearEmailCacheFromDB(props.settingId);
  }
  message.success("刷新成功");
}

function handleCloudSync() {
  emit("cloudSync");
}

function handleCloudBackup() {
  emit("cloudBackup");
}
</script>

<style scoped>
.email-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.email-icon {
  font-size: 24px;
  color: #409eff;
}

.email-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-right {
  display: flex;
  gap: 12px;
}
</style>
