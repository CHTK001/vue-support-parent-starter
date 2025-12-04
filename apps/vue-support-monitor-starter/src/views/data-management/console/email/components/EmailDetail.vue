<template>
  <div class="email-detail">
    <!-- 邮件详情 -->
    <div v-if="email" class="detail-area">
      <div class="detail-header">
        <div class="detail-subject">{{ email.subject }}</div>
        <div class="detail-actions">
        <!--
          <el-button
            size="small"
            :icon="useRenderIcon('ri:reply-line')"
            @click="handleReply"
            >回复</el-button
          >
          <el-button
            size="small"
            :icon="useRenderIcon('ri:reply-all-line')"
            @click="handleReplyAll"
            >全部回复</el-button
          >
          <el-button
            size="small"
            :icon="useRenderIcon('ri:share-forward-line')"
            @click="handleForward"
            >转发</el-button
          >
          <el-button
            size="small"
            :icon="useRenderIcon('ri:delete-bin-line')"
            @click="handleDelete"
            >删除</el-button
          >-->
        </div>
      </div>
      <div class="detail-info">
        <div class="sender-info">
          <div class="sender-avatar large">
            <IconifyIconOnline icon="ri:user-line" />
          </div>
          <div class="sender-details">
            <div class="sender-name">{{ email.from }}</div>
            <div class="sender-email">{{ email.senderEmail }}</div>
            <div class="email-time">{{ formatFullTime(email.sentDate) }}</div>
          </div>
        </div>
      </div>
      <!-- 附件区域 -->
      <div v-if="email.hasAttachment" class="detail-attachments">
        <div class="attachments-header">
          <IconifyIconOnline icon="ri:attachment-line" />
          <span>附件</span>
        </div>
        <div class="attachments-list">
          <div class="attachment-item">
            <IconifyIconOnline icon="ri:file-line" />
            <span class="attachment-name">附件文件.pdf</span>
            <span class="attachment-size">(2.3MB)</span>
            <el-button
              size="small"
              type="primary"
              link
              @click="downloadAttachment"
              >下载</el-button
            >
          </div>
        </div>
      </div>

      <div class="detail-content">
        <iframe 
          ref="emailContentFrame"
          class="email-body-iframe"
          :srcdoc="email.content"
          frameborder="0"
          sandbox="allow-same-origin"
        ></iframe>
      </div>
    </div>

    <!-- 默认状�?-->
    <div v-else class="welcome-area">
      <div class="welcome-content">
        <IconifyIconOnline icon="ri:mail-open-line" class="welcome-icon" />
        <h3>欢迎使用邮箱控制�?/h3>
        <p>选择左侧邮件查看详情，或点击撰写邮件开始写邮件</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";

// 定义接口
interface Email {
  id: number;
  form: string;
  to: string;
  senderEmail: string;
  subject: string;
  preview: string;
  content: string;
  sentDate: Date;
  read: boolean;
  starred: boolean;
  selected: boolean;
  hasAttachment: boolean;
  folder: string;
  tags: string[];
}

// 定义props
const props = defineProps<{
  email?: Email;
}>();

// 定义事件
const emit = defineEmits<{
  reply: [email: Email];
  "reply-all": [email: Email];
  forward: [email: Email];
  delete: [email: Email];
}>();

// 方法
function handleReply() {
  if (props.email) {
    emit("reply", props.email);
  }
}

function handleReplyAll() {
  if (props.email) {
    emit("reply-all", props.email);
  }
}

function handleForward() {
  if (props.email) {
    emit("forward", props.email);
  }
}

function handleDelete() {
  if (props.email) {
    emit("delete", props.email);
  }
}

function formatFullTime(time: Date) {
  return time?.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function parseEmailContent(content: string): string {
  if (!content) return "";

  // 检查是否为multipart/alternative类型
  if (content.includes("Content-Type: multipart/alternative")) {
    return parseMultipartAlternativeContent(content);
  }

  // 如果内容已经是HTML格式，进行样式隔离处�?
  if (content.includes("<") && content.includes(">")) {
    return sanitizeHtmlContent(content);
  }

  // 将纯文本转换为HTML格式，并转换链接
  return (
    content
      .replace(/\n/g, "<br>")
      .replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;")
      .replace(/  /g, "&nbsp;&nbsp;")
      // 转换HTTP/HTTPS链接为可点击链接
      .replace(
        /(https?:\/\/[^\s<>"']+)/gi,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
      )
      // 转换邮箱地址为可点击链接
      .replace(
        /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
        '<a href="mailto:$1">$1</a>'
      )
  );
}

// 解析multipart/alternative邮件内容
function parseMultipartAlternativeContent(content: string): string {
  try {
    // 查找HTML部分
    const htmlMatch = content.match(
      /Content-Type: text\/html[\s\S]*?\n\n([\s\S]*?)(?=\n--)/i
    );
    if (htmlMatch && htmlMatch[1]) {
      return sanitizeHtmlContent(htmlMatch[1].trim());
    }

    // 如果没有HTML部分，查找纯文本部分
    const textMatch = content.match(
      /Content-Type: text\/plain[\s\S]*?\n\n([\s\S]*?)(?=\n--)/i
    );
    if (textMatch && textMatch[1]) {
      const textContent = textMatch[1].trim();
      // 转换链接
      return (
        textContent
          .replace(/\n/g, "<br>")
          .replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;")
          .replace(/  /g, "&nbsp;&nbsp;")
          // 转换HTTP/HTTPS链接为可点击链接
          .replace(
            /(https?:\/\/[^\s<>"']+)/gi,
            '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
          )
          // 转换邮箱地址为可点击链接
          .replace(
            /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
            '<a href="mailto:$1">$1</a>'
          )
      );
    }
  } catch (error) {
    console.warn("解析multipart/alternative邮件内容失败:", error);
  }

  // 如果解析失败，返回原始内�?
  return content.replace(/\n/g, "<br>");
}

// 清理和隔离HTML内容，防止样式污�?
function sanitizeHtmlContent(htmlContent: string): string {
  // 移除可能影响全局样式的标签和属�?
  let sanitized = htmlContent
    // 移除style标签
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    // 移除link标签（CSS链接�?
    .replace(/<link[^>]*>/gi, "")
    // 移除script标签
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    // 移除内联style属性中可能影响全局的样�?
    .replace(
      /style\s*=\s*["'][^"']*(?:position\s*:\s*(?:fixed|absolute)|z-index\s*:|top\s*:|left\s*:|right\s*:|bottom\s*:)[^"']*["']/gi,
      ""
    )
    // 移除可能的CSS导入
    .replace(/@import[^;]+;/gi, "")
    // 移除html、head、body标签
    .replace(/<\/?(?:html|head|body)[^>]*>/gi, "")
    // 移除meta标签
    .replace(/<meta[^>]*>/gi, "")
    // 移除title标签
    .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, "");

  // 转换现有链接，确保在新窗口打开
  sanitized = sanitized.replace(
    /<a([^>]*href=["'][^"']+["'][^>]*)>/gi,
    (match, attrs) => {
      if (!attrs.includes("target=")) {
        attrs += ' target="_blank" rel="noopener noreferrer"';
      }
      return `<a${attrs}>`;
    }
  );

  // 转换HTML内容中未被标记的纯文本链�?
  // 注意：需要避免转换已经在<a>标签内的链接
  sanitized = sanitized.replace(
    /(?!<a[^>]*>)(https?:\/\/[^\s<>"']+)(?![^<]*<\/a>)/gi,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // 转换HTML内容中未被标记的邮箱地址
  sanitized = sanitized.replace(
    /(?!<a[^>]*>)([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?![^<]*<\/a>)/gi,
    '<a href="mailto:$1">$1</a>'
  );

  return sanitized;
}

function downloadAttachment() {
  // 这里应该调用下载附件的API
  console.log("下载附件");
}
</script>

<style scoped>
.email-detail {
  flex: 1;
  background: #fff;
  display: flex;
  flex-direction: column;
}

/* 邮件详情区域 */
.detail-area {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e4e7ed;
  background: #fafafa;
}

.detail-subject {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.detail-actions {
  display: flex;
  gap: 8px;
}

.detail-info {
  padding: 16px 24px;
  border-bottom: 1px solid var(--el-border-color);
}

.sender-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sender-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
   color: var(--el-text-color-primary);
}

.sender-avatar.large {
  width: 48px;
  height: 48px;
  font-size: 20px;
}

.sender-details {
  flex: 1;
}

.sender-details .sender-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.sender-details .sender-email {
  font-size: 14px;
   color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.sender-details .email-time {
  font-size: 12px;
  color: #c0c4cc;
}

/* 附件区域 */
.detail-attachments {
  padding: 16px 24px;
  border-bottom: 1px solid var(--el-border-color);
  background: #fafafa;
}

.attachments-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 12px;
}

.attachments-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  font-size: 14px;
}

.attachment-name {
  flex: 1;
  color: var(--el-text-color-primary);
}

.attachment-size {
   color: var(--el-text-color-primary);
  font-size: 12px;
}

.detail-content {
  flex: 1;
  max-width: 1200px;
  padding: 24px;
  overflow-y: auto;
}

.email-body {
  max-height: 600px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  /* 样式隔离 - 防止邮件HTML内容影响全局样式 */
  position: relative;
  isolation: isolate;
  contain: layout style;
  overflow: hidden;
  word-wrap: break-word;
  word-break: break-word;
}

/* 重置邮件内容中的所有样式，防止污染全局 */
.email-body :deep(*) {
  /* 重置定位相关属�?*/
  position: static !important;
  z-index: auto !important;
  top: auto !important;
  left: auto !important;
  right: auto !important;
  bottom: auto !important;
  transform: none !important;

  /* 重置尺寸相关属�?*/
  max-width: 100% !important;
  max-height: none !important;

  /* 重置字体相关属�?*/
  font-family: inherit !important;

  /* 防止溢出 */
  overflow: visible !important;
  overflow-x: hidden !important;
}

/* 邮件内容基础样式 */
.email-body :deep(p) {
  margin: 0 0 12px 0 !important;
  padding: 0 !important;
  line-height: 1.6 !important;
}

.email-body :deep(h1),
.email-body :deep(h2),
.email-body :deep(h3),
.email-body :deep(h4),
.email-body :deep(h5),
.email-body :deep(h6) {
  margin: 16px 0 8px 0 !important;
  padding: 0 !important;
  font-weight: 600 !important;
  line-height: 1.4 !important;
}

.email-body :deep(h1) {
  font-size: 24px !important;
}
.email-body :deep(h2) {
  font-size: 20px !important;
}
.email-body :deep(h3) {
  font-size: 18px !important;
}
.email-body :deep(h4) {
  font-size: 16px !important;
}
.email-body :deep(h5) {
  font-size: 14px !important;
}
.email-body :deep(h6) {
  font-size: 12px !important;
}

.email-body :deep(ul),
.email-body :deep(ol) {
  margin: 12px 0 !important;
  padding-left: 20px !important;
}

.email-body :deep(li) {
  margin-bottom: 4px !important;
  padding: 0 !important;
}

.email-body :deep(a) {
  color: #409eff !important;
  text-decoration: underline !important;
  word-break: break-all !important;
}

.email-body :deep(a:hover) {
  color: #66b1ff !important;
}

.email-body :deep(img) {
  max-width: 100% !important;
  height: auto !important;
  display: block !important;
  margin: 8px 0 !important;
  border-radius: 4px !important;
}

.email-body :deep(table) {
  width: 100% !important;
  max-width: 100% !important;
  border-collapse: collapse !important;
  margin: 12px 0 !important;
  font-size: 14px !important;
}

.email-body :deep(th),
.email-body :deep(td) {
  padding: 8px 12px !important;
  border: 1px solid #e4e7ed !important;
  text-align: left !important;
  vertical-align: top !important;
}

.email-body :deep(th) {
  background-color: #f5f7fa !important;
  font-weight: 600 !important;
}

.email-body :deep(blockquote) {
  margin: 12px 0 !important;
  padding: 12px 16px !important;
  border-left: 4px solid #409eff !important;
  background-color: #f0f9ff !important;
  font-style: italic !important;
}

.email-body :deep(pre) {
  background-color: #f5f7fa !important;
  border: 1px solid #e4e7ed !important;
  border-radius: 4px !important;
  padding: 12px !important;
  margin: 12px 0 !important;
  overflow-x: auto !important;
  font-family: "Courier New", monospace !important;
  font-size: 13px !important;
  line-height: 1.4 !important;
}

.email-body :deep(code) {
  background-color: #f5f7fa !important;
  border: 1px solid #e4e7ed !important;
  border-radius: 2px !important;
  padding: 2px 4px !important;
  font-family: "Courier New", monospace !important;
  font-size: 13px !important;
}

.email-body :deep(hr) {
  border: none !important;
  border-top: 1px solid #e4e7ed !important;
  margin: 16px 0 !important;
}

/* 防止邮件内容中的样式影响布局 */
.email-body :deep(div),
.email-body :deep(span) {
  display: inline !important;
}

.email-body :deep(div) {
  display: block !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* 欢迎区域 */
.welcome-area {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.welcome-content {
  text-align: center;
   color: var(--el-text-color-primary);
}

.welcome-icon {
  font-size: 64px;
  margin-bottom: 16px;
  color: #ddd;
}

.welcome-content h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #606266;
}

.welcome-content p {
  margin: 0;
  font-size: 14px;
}

/* 邮件内容iframe样式 */
.email-body-iframe {
  width: 100%;
  height: 100%;
  min-height: 400px;
  border: none;
  background: #fff;
}

/* 滚动条样�?*/
.detail-content::-webkit-scrollbar {
  width: 6px;
}

.detail-content::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.detail-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.detail-content::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>
