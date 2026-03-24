<template>
  <div class="settings-page">
    <h2>系统设置</h2>

    <el-tabs v-model="activeTab" class="settings-tabs">
      <!-- 通用设置 -->
      <el-tab-pane label="通用设置" name="general">
        <el-form :model="generalSettings" label-width="150px">
          <el-form-item label="语言">
            <el-select v-model="generalSettings.language">
              <el-option label="简体中文" value="zh-CN" />
              <el-option label="English" value="en-US" />
            </el-select>
          </el-form-item>

          <el-form-item label="主题">
            <el-select v-model="generalSettings.theme">
              <el-option label="浅色" value="light" />
              <el-option label="深色" value="dark" />
              <el-option label="自动" value="auto" />
            </el-select>
          </el-form-item>

          <el-form-item label="每页显示邮件数">
            <el-input-number
              v-model="generalSettings.pageSize"
              :min="10"
              :max="100"
              :step="10"
            />
          </el-form-item>

          <el-form-item label="自动刷新">
            <el-switch v-model="generalSettings.autoRefresh" />
            <span v-if="generalSettings.autoRefresh" class="ml-2">
              每 {{ generalSettings.refreshInterval }} 分钟
            </span>
          </el-form-item>

          <el-form-item
            v-if="generalSettings.autoRefresh"
            label="刷新间隔（分钟）"
          >
            <el-input-number
              v-model="generalSettings.refreshInterval"
              :min="1"
              :max="60"
            />
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 邮件设置 -->
      <el-tab-pane label="邮件设置" name="email">
        <el-form :model="emailSettings" label-width="150px">
          <el-form-item label="默认发件账户">
            <el-select v-model="emailSettings.defaultAccount">
              <el-option
                v-for="account in accounts"
                :key="account.id"
                :label="account.displayName"
                :value="account.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="发送后保存到">
            <el-select v-model="emailSettings.sentFolder">
              <el-option label="已发送" value="Sent" />
              <el-option label="草稿箱" value="Drafts" />
            </el-select>
          </el-form-item>

          <el-form-item label="自动保存草稿">
            <el-switch v-model="emailSettings.autoSaveDraft" />
          </el-form-item>

          <el-form-item label="显示HTML邮件">
            <el-switch v-model="emailSettings.showHtml" />
          </el-form-item>

          <el-form-item label="自动下载图片">
            <el-switch v-model="emailSettings.autoDownloadImages" />
          </el-form-item>

          <el-form-item label="邮件签名">
            <el-input
              v-model="emailSettings.signature"
              type="textarea"
              :rows="4"
              placeholder="在此输入您的邮件签名"
            />
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 通知设置 -->
      <el-tab-pane label="通知设置" name="notification">
        <el-form :model="notificationSettings" label-width="150px">
          <el-form-item label="桌面通知">
            <el-switch v-model="notificationSettings.desktop" />
          </el-form-item>

          <el-form-item label="声音提示">
            <el-switch v-model="notificationSettings.sound" />
          </el-form-item>

          <el-form-item label="新邮件通知">
            <el-switch v-model="notificationSettings.newEmail" />
          </el-form-item>

          <el-form-item label="仅重要邮件">
            <el-switch v-model="notificationSettings.importantOnly" />
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 安全设置 -->
      <el-tab-pane label="安全设置" name="security">
        <el-form :model="securitySettings" label-width="150px">
          <el-form-item label="自动锁定">
            <el-switch v-model="securitySettings.autoLock" />
            <span v-if="securitySettings.autoLock" class="ml-2">
              {{ securitySettings.lockTimeout }} 分钟后
            </span>
          </el-form-item>

          <el-form-item
            v-if="securitySettings.autoLock"
            label="锁定超时（分钟）"
          >
            <el-input-number
              v-model="securitySettings.lockTimeout"
              :min="1"
              :max="120"
            />
          </el-form-item>

          <el-form-item label="记住密码">
            <el-switch v-model="securitySettings.rememberPassword" />
          </el-form-item>

          <el-form-item label="加密存储">
            <el-switch v-model="securitySettings.encryptStorage" />
          </el-form-item>

          <el-form-item label="清除缓存">
            <el-button @click="clearCache">清除所有缓存</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 关于 -->
      <el-tab-pane label="关于" name="about">
        <div class="about-section">
          <h3>邮箱收发管理系统</h3>
          <p>版本: 1.0.0</p>
          <p>构建日期: 2026-03-18</p>
          <p>
            描述:
            一个功能完整的邮箱收发管理系统，支持多账户管理、邮件收发、模板管理等功能。
          </p>

          <el-divider />

          <h4>技术栈</h4>
          <ul>
            <li>Vue 3 + TypeScript</li>
            <li>Element Plus</li>
            <li>Pinia</li>
            <li>Spring Boot</li>
            <li>JavaFX</li>
          </ul>

          <el-divider />

          <h4>功能特性</h4>
          <ul>
            <li>✅ 多账户管理</li>
            <li>✅ 邮件收发</li>
            <li>✅ 草稿管理</li>
            <li>✅ 模板管理</li>
            <li>✅ 附件支持</li>
            <li>✅ 导入导出</li>
            <li>✅ Microsoft Graph API</li>
          </ul>
        </div>
      </el-tab-pane>
    </el-tabs>

    <div class="settings-footer">
      <el-button @click="resetSettings">重置</el-button>
      <el-button type="primary" @click="saveSettings">保存设置</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { accountApi, type EmailAccount } from "../../api/email";

const activeTab = ref("general");
const accounts = ref<EmailAccount[]>([]);

const generalSettings = ref({
});

const emailSettings = ref({
});

const notificationSettings = ref({
  importantOnly: false,
});

const securitySettings = ref({
});

const loadAccounts = async () => {
  try {
    const res: any = await accountApi.getAccountList();
    if (res.success) {
      accounts.value = res.data || [];
    }
  } catch (error) {
    console.error("加载账户列表失败", error);
  }
};

const loadSettings = () => {
  const saved = localStorage.getItem("email-settings");
  if (saved) {
    const settings = JSON.parse(saved);
    Object.assign(generalSettings.value, settings.general || {});
    Object.assign(emailSettings.value, settings.email || {});
    Object.assign(notificationSettings.value, settings.notification || {});
    Object.assign(securitySettings.value, settings.security || {});
  }
};

const saveSettings = () => {
  const settings = {
    general: generalSettings.value,
    email: emailSettings.value,
    notification: notificationSettings.value,
    security: securitySettings.value,
  };

  localStorage.setItem("email-settings", JSON.stringify(settings));
  ElMessage.success("设置保存成功");
};

const resetSettings = () => {
  generalSettings.value = {
    language: "zh-CN",
    theme: "light",
    pageSize: 20,
    autoRefresh: false,
    refreshInterval: 5,
  };

  emailSettings.value = {
    defaultAccount: "",
    sentFolder: "Sent",
    autoSaveDraft: true,
    showHtml: true,
    autoDownloadImages: false,
    signature: "",
  };

  notificationSettings.value = {
    desktop: false,
    sound: false,
    newEmail: true,
    importantOnly: false,
  };

  securitySettings.value = {
    autoLock: false,
    lockTimeout: 15,
    rememberPassword: true,
    encryptStorage: true,
  };

  ElMessage.info("设置已重置");
};

const clearCache = () => {
  localStorage.removeItem("email-drafts");
  localStorage.removeItem("email-cache");
  ElMessage.success("缓存已清除");
};

onMounted(() => {
  loadAccounts();
  loadSettings();
});
</script>

<style scoped>
.settings-page {
  padding: 20px;
  max-width: 800px;
}

.settings-page h2 {
  margin-bottom: 20px;
}

.settings-tabs {
  margin-bottom: 20px;
}

.settings-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.about-section {
  padding: 20px;
}

.about-section h3 {
  margin-bottom: 10px;
}

.about-section h4 {
  margin-top: 20px;
  margin-bottom: 10px;
}

.about-section ul {
  list-style: none;
  padding-left: 0;
}

.about-section ul li {
  padding: 5px 0;
}

.ml-2 {
  margin-left: 8px;
  color: #666;
  font-size: 14px;
}
</style>
