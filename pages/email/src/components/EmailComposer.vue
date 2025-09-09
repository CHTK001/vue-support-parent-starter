<script setup>
import { ref, computed, watch } from "vue";
import { IconifyIconOnline } from "@iconify/vue";

const props = defineProps({
  accounts: {
    type: Array,
    required: true,
  },
  selectedAccountId: {
    type: String,
    default: "",
  },
  mode: {
    type: String,
    default: "compose", // compose, reply, replyAll, forward
    validator: (value) => ["compose", "reply", "replyAll", "forward"].includes(value),
  },
  originalEmail: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["close", "send", "save-draft", "discard"]);

// 邮件表单数据
const emailForm = ref({
  emailSubject: "",
  emailContent: "",
  emailSender: {
    emailName: "",
    emailAddress: "",
    emailAvatar: "",
  },
  emailRecipients: {
    emailTo: [],
    emailCc: [],
    emailBcc: [],
  },
  emailAttachments: [],
  emailAccountId: props.selectedAccountId,
});

// 显示抄送/密送
const showCc = ref(false);
const showBcc = ref(false);

// 文件上传引用
const fileInput = ref(null);

// 获取当前选中的账户
const selectedAccount = computed(() => {
  return props.accounts.find((account) => account.emailAccountId === emailForm.value.emailAccountId) || props.accounts[0];
});

// 监听账户变化，更新发件人信息
watch(
  () => emailForm.value.emailAccountId,
  (newAccountId) => {
    const account = props.accounts.find((acc) => acc.emailAccountId === newAccountId);
    if (account) {
      emailForm.value.emailSender = {
        emailName: account.emailAccountName,
        emailAddress: account.emailAccountAddress,
        emailAvatar: account.emailAccountAvatar,
      };
    }
  },
  { immediate: true }
);

// 监听模式和原始邮件，初始化表单
watch(
  [() => props.mode, () => props.originalEmail],
  ([newMode, newOriginalEmail]) => {
    if (newOriginalEmail) {
      // 根据不同模式设置不同的初始值
      if (newMode === "reply") {
        emailForm.value.emailSubject = `回复：${newOriginalEmail.emailSubject}`;
        emailForm.value.emailRecipients.emailTo = [
          {
            emailName: newOriginalEmail.emailSender.emailName,
            emailAddress: newOriginalEmail.emailSender.emailAddress,
          },
        ];
        emailForm.value.emailContent = `<br><br><p>------------------ 原始邮件 ------------------</p>
        <p>发件人：${newOriginalEmail.emailSender.emailName} &lt;${newOriginalEmail.emailSender.emailAddress}&gt;</p>
        <p>日期：${new Date(newOriginalEmail.emailDate).toLocaleString("zh-CN")}</p>
        <p>主题：${newOriginalEmail.emailSubject}</p>
        <br>
        ${newOriginalEmail.emailContent}`;
      } else if (newMode === "replyAll") {
        emailForm.value.emailSubject = `回复：${newOriginalEmail.emailSubject}`;
        // 添加原始发件人到收件人
        emailForm.value.emailRecipients.emailTo = [
          {
            emailName: newOriginalEmail.emailSender.emailName,
            emailAddress: newOriginalEmail.emailSender.emailAddress,
          },
        ];
        // 添加原始收件人到收件人（排除自己）
        if (newOriginalEmail.emailRecipients.emailTo) {
          newOriginalEmail.emailRecipients.emailTo.forEach((recipient) => {
            if (recipient.emailAddress !== selectedAccount.value.emailAccountAddress) {
              emailForm.value.emailRecipients.emailTo.push(recipient);
            }
          });
        }
        // 添加原始抄送到抄送（排除自己）
        if (newOriginalEmail.emailRecipients.emailCc) {
          emailForm.value.emailRecipients.emailCc = newOriginalEmail.emailRecipients.emailCc.filter((recipient) => recipient.emailAddress !== selectedAccount.value.emailAccountAddress);
          if (emailForm.value.emailRecipients.emailCc.length > 0) {
            showCc.value = true;
          }
        }
        emailForm.value.emailContent = `<br><br><p>------------------ 原始邮件 ------------------</p>
        <p>发件人：${newOriginalEmail.emailSender.emailName} &lt;${newOriginalEmail.emailSender.emailAddress}&gt;</p>
        <p>日期：${new Date(newOriginalEmail.emailDate).toLocaleString("zh-CN")}</p>
        <p>主题：${newOriginalEmail.emailSubject}</p>
        <br>
        ${newOriginalEmail.emailContent}`;
      } else if (newMode === "forward") {
        emailForm.value.emailSubject = `转发：${newOriginalEmail.emailSubject}`;
        emailForm.value.emailRecipients.emailTo = [];
        // 复制原始附件
        if (newOriginalEmail.emailAttachments) {
          emailForm.value.emailAttachments = [...newOriginalEmail.emailAttachments];
        }
        emailForm.value.emailContent = `<br><br><p>------------------ 转发邮件 ------------------</p>
        <p>发件人：${newOriginalEmail.emailSender.emailName} &lt;${newOriginalEmail.emailSender.emailAddress}&gt;</p>
        <p>日期：${new Date(newOriginalEmail.emailDate).toLocaleString("zh-CN")}</p>
        <p>主题：${newOriginalEmail.emailSubject}</p>
        <br>
        ${newOriginalEmail.emailContent}`;
      }
    } else {
      // 新邮件，重置表单
      emailForm.value.emailSubject = "";
      emailForm.value.emailContent = "";
      emailForm.value.emailRecipients.emailTo = [];
      emailForm.value.emailRecipients.emailCc = [];
      emailForm.value.emailRecipients.emailBcc = [];
      emailForm.value.emailAttachments = [];
    }
  },
  { immediate: true }
);

// 添加收件人
const addRecipient = (type, value) => {
  if (!value) return;

  // 简单的邮箱验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    ElMessage.warning("请输入有效的邮箱地址");
    return;
  }

  const recipient = {
    emailName: value.split("@")[0],
    emailAddress: value,
  };

  if (type === "to") {
    emailForm.value.emailRecipients.emailTo.push(recipient);
  } else if (type === "cc") {
    emailForm.value.emailRecipients.emailCc.push(recipient);
  } else if (type === "bcc") {
    emailForm.value.emailRecipients.emailBcc.push(recipient);
  }

  // 清空输入框
  return "";
};

// 移除收件人
const removeRecipient = (type, index) => {
  if (type === "to") {
    emailForm.value.emailRecipients.emailTo.splice(index, 1);
  } else if (type === "cc") {
    emailForm.value.emailRecipients.emailCc.splice(index, 1);
  } else if (type === "bcc") {
    emailForm.value.emailRecipients.emailBcc.splice(index, 1);
  }
};

// 上传附件
const uploadAttachment = () => {
  fileInput.value.click();
};

// 处理文件选择
const handleFileChange = (event) => {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  Array.from(files).forEach((file) => {
    const attachment = {
      emailAttachmentId: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      emailAttachmentName: file.name,
      emailAttachmentSize: file.size,
      emailAttachmentType: file.type,
      emailAttachmentUrl: URL.createObjectURL(file),
      file, // 保存原始文件对象，用于实际上传
    };

    emailForm.value.emailAttachments.push(attachment);
  });

  // 重置文件输入，允许重复选择相同文件
  event.target.value = null;
};

// 移除附件
const removeAttachment = (index) => {
  const attachment = emailForm.value.emailAttachments[index];
  if (attachment.file) {
    URL.revokeObjectURL(attachment.emailAttachmentUrl);
  }
  emailForm.value.emailAttachments.splice(index, 1);
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes < 1024) {
    return bytes + " B";
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + " KB";
  } else {
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }
};

// 发送邮件
const sendEmail = () => {
  // 验证表单
  if (emailForm.value.emailRecipients.emailTo.length === 0) {
    ElMessage.warning("请至少添加一个收件人");
    return;
  }

  if (!emailForm.value.emailSubject) {
    ElMessage.warning("请输入邮件主题");
    return;
  }

  // 发送邮件
  emit("send", { ...emailForm.value });
};

// 保存草稿
const saveDraft = () => {
  emit("save-draft", { ...emailForm.value });
};

// 丢弃邮件
const discardEmail = () => {
  emit("discard");
};

// 关闭编辑器
const closeComposer = () => {
  emit("close");
};
</script>

<template>
  <div class="email-composer">
    <div class="email-composer__header">
      <div class="email-composer__title">
        {{ mode === "compose" ? "写邮件" : mode === "reply" ? "回复" : mode === "replyAll" ? "回复全部" : "转发" }}
      </div>
      <div class="email-composer__actions">
        <el-button type="primary" @click="sendEmail">发送</el-button>
        <el-button @click="saveDraft">保存草稿</el-button>
        <el-button @click="discardEmail">丢弃</el-button>
        <el-button type="text" circle @click="closeComposer">
          <IconifyIconOnline icon="ri:close-line" />
        </el-button>
      </div>
    </div>

    <div class="email-composer__body">
      <!-- 发件人选择 -->
      <div class="email-composer__field">
        <div class="email-composer__label">发件人</div>
        <div class="email-composer__input">
          <el-select v-model="emailForm.emailAccountId" class="email-composer__account-select">
            <el-option v-for="account in accounts" :key="account.emailAccountId" :label="`${account.emailAccountName} <${account.emailAccountAddress}>`" :value="account.emailAccountId">
              <div class="email-composer__account-option">
                <img :src="account.emailAccountAvatar" :alt="account.emailAccountName" class="email-composer__account-avatar" />
                <div class="email-composer__account-info">
                  <div class="email-composer__account-name">{{ account.emailAccountName }}</div>
                  <div class="email-composer__account-address">{{ account.emailAccountAddress }}</div>
                </div>
              </div>
            </el-option>
          </el-select>
        </div>
      </div>

      <!-- 收件人 -->
      <div class="email-composer__field">
        <div class="email-composer__label">收件人</div>
        <div class="email-composer__input">
          <el-tag v-for="(recipient, index) in emailForm.emailRecipients.emailTo" :key="index" closable @close="removeRecipient('to', index)" class="email-composer__tag"> {{ recipient.emailName }} &lt;{{ recipient.emailAddress }}&gt; </el-tag>
          <el-input placeholder="输入邮箱地址并按回车添加" @keyup.enter="(e) => (e.target.value = addRecipient('to', e.target.value))" class="email-composer__recipient-input" />
        </div>
      </div>

      <!-- 抄送和密送切换 -->
      <div class="email-composer__cc-bcc" v-if="!showCc || !showBcc">
        <span v-if="!showCc" @click="showCc = true" class="email-composer__cc-bcc-toggle">添加抄送</span>
        <span v-if="!showBcc" @click="showBcc = true" class="email-composer__cc-bcc-toggle">添加密送</span>
      </div>

      <!-- 抄送 -->
      <div class="email-composer__field" v-if="showCc">
        <div class="email-composer__label">抄送</div>
        <div class="email-composer__input">
          <el-tag v-for="(recipient, index) in emailForm.emailRecipients.emailCc" :key="index" closable @close="removeRecipient('cc', index)" class="email-composer__tag"> {{ recipient.emailName }} &lt;{{ recipient.emailAddress }}&gt; </el-tag>
          <el-input placeholder="输入邮箱地址并按回车添加" @keyup.enter="(e) => (e.target.value = addRecipient('cc', e.target.value))" class="email-composer__recipient-input" />
        </div>
      </div>

      <!-- 密送 -->
      <div class="email-composer__field" v-if="showBcc">
        <div class="email-composer__label">密送</div>
        <div class="email-composer__input">
          <el-tag v-for="(recipient, index) in emailForm.emailRecipients.emailBcc" :key="index" closable @close="removeRecipient('bcc', index)" class="email-composer__tag"> {{ recipient.emailName }} &lt;{{ recipient.emailAddress }}&gt; </el-tag>
          <el-input placeholder="输入邮箱地址并按回车添加" @keyup.enter="(e) => (e.target.value = addRecipient('bcc', e.target.value))" class="email-composer__recipient-input" />
        </div>
      </div>

      <!-- 主题 -->
      <div class="email-composer__field">
        <div class="email-composer__label">主题</div>
        <div class="email-composer__input">
          <el-input v-model="emailForm.emailSubject" placeholder="请输入邮件主题" />
        </div>
      </div>

      <!-- 正文 -->
      <div class="email-composer__content">
        <el-input v-model="emailForm.emailContent" type="textarea" :rows="12" placeholder="请输入邮件正文" />
      </div>

      <!-- 附件 -->
      <div class="email-composer__attachments" v-if="emailForm.emailAttachments.length > 0">
        <div class="email-composer__attachments-title">附件 ({{ emailForm.emailAttachments.length }})</div>
        <div class="email-composer__attachments-list">
          <div v-for="(attachment, index) in emailForm.emailAttachments" :key="attachment.emailAttachmentId" class="email-composer__attachment">
            <div class="email-composer__attachment-icon">
              <IconifyIconOnline
                :icon="
                  attachment.emailAttachmentType.includes('image')
                    ? 'ri:image-line'
                    : attachment.emailAttachmentType.includes('pdf')
                      ? 'ri:file-pdf-line'
                      : attachment.emailAttachmentType.includes('word')
                        ? 'ri:file-word-line'
                        : attachment.emailAttachmentType.includes('excel') || attachment.emailAttachmentType.includes('sheet')
                          ? 'ri:file-excel-line'
                          : 'ri:file-line'
                "
              />
            </div>
            <div class="email-composer__attachment-info">
              <div class="email-composer__attachment-name">{{ attachment.emailAttachmentName }}</div>
              <div class="email-composer__attachment-size">{{ formatFileSize(attachment.emailAttachmentSize) }}</div>
            </div>
            <div class="email-composer__attachment-actions">
              <el-button type="danger" text size="small" @click="removeAttachment(index)">
                <IconifyIconOnline icon="ri:delete-bin-line" />
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部工具栏 -->
      <div class="email-composer__toolbar">
        <div class="email-composer__toolbar-left">
          <el-button @click="uploadAttachment">
            <IconifyIconOnline icon="ri:attachment-2" />
            <span>添加附件</span>
          </el-button>
          <input type="file" ref="fileInput" @change="handleFileChange" multiple style="display: none" />
        </div>
        <div class="email-composer__toolbar-right">
          <el-button type="primary" @click="sendEmail">发送</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.email-composer {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid var(--el-border-color-light);
  }

  &__title {
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__actions {
    display: flex;
    gap: 8px;
  }

  &__body {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
  }

  &__field {
    display: flex;
    margin-bottom: 16px;
  }

  &__label {
    width: 80px;
    font-size: 14px;
    color: var(--el-text-color-regular);
    padding-top: 8px;
  }

  &__input {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  &__account-select {
    width: 100%;
  }

  &__account-option {
    display: flex;
    align-items: center;
  }

  &__account-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    margin-right: 8px;
  }

  &__account-info {
    flex: 1;
  }

  &__account-name {
    font-size: 14px;
    color: var(--el-text-color-primary);
  }

  &__account-address {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__tag {
    margin-right: 8px;
    margin-bottom: 8px;
  }

  &__recipient-input {
    flex: 1;
    min-width: 200px;
  }

  &__cc-bcc {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
  }

  &__cc-bcc-toggle {
    font-size: 14px;
    color: var(--el-color-primary);
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }

  &__content {
    margin-bottom: 24px;
  }

  &__attachments {
    margin-bottom: 24px;

    &-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      margin-bottom: 12px;
    }

    &-list {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
  }

  &__attachment {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    background-color: var(--el-fill-color-light);
    border-radius: 6px;
    width: calc(50% - 6px);

    &-icon {
      font-size: 20px;
      color: var(--el-text-color-secondary);
      margin-right: 8px;
    }

    &-info {
      flex: 1;
      min-width: 0;
    }

    &-name {
      font-size: 14px;
      color: var(--el-text-color-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &-size {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  &__toolbar {
    display: flex;
    justify-content: space-between;
    padding-top: 16px;
    border-top: 1px solid var(--el-border-color-light);
  }
}
</style>
