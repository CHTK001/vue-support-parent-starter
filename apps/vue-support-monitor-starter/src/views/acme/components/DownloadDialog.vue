<script setup lang="ts">
import { computed, ref } from "vue";
import { message } from "@repo/core";
import { Document, Download, Key, Link, FolderOpened } from "@element-plus/icons-vue";
import { downloadCertFile, type AcmeCertificate } from "../../../api/acmeApi";
import { createZip } from "../../../utils/zip";

const props = defineProps<{
  modelValue: boolean;
  cert?: AcmeCertificate | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const downloading = ref(false);

async function handleDownload(fileType: "cert" | "key" | "chain"): Promise<void> {
  const certId = props.cert?.acmeCertId;
  if (!certId) return;
  downloading.value = true;
  try {
    const { fileName, content } = await downloadCertFile(certId, fileType);
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    message.success("已开始下载");
  } catch (e) {
    message.error(String((e as Error)?.message ?? e));
  } finally {
    downloading.value = false;
  }
}

/** 证书安全域名（通配符转 wildcard，避免文件名非法字符） */
const safeDomain = computed(() => String(props.cert?.acmeCertPrimaryDomain ?? "certificate").replace(/\*/g, "wildcard"));

/** 一键把证书/私钥/证书链打成一个 zip 下载 */
async function handleDownloadAll(): Promise<void> {
  const certId = props.cert?.acmeCertId;
  if (!certId) return;
  downloading.value = true;
  try {
    const [cert, key, chain] = await Promise.all([
      downloadCertFile(certId, "cert"),
      downloadCertFile(certId, "key"),
      downloadCertFile(certId, "chain"),
    ]);
    const bytes = async (b: Blob) => new Uint8Array(await b.arrayBuffer());
    const readme = [
      `域名: ${props.cert?.acmeCertPrimaryDomain ?? ""}`,
      "",
      "文件说明：",
      `  ${cert.fileName}  —— 证书（含中间证书的 PEM 链，Nginx ssl_certificate 用它）`,
      `  ${key.fileName}   —— 私钥（PEM，Nginx ssl_certificate_key 用它）`,
      `  ${chain.fileName} —— 证书链（含中间/根，用于需要完整链的场景）`,
      "",
      "用法（Nginx）：",
      "  ssl_certificate     /path/to/<域名>.crt;",
      "  ssl_certificate_key /path/to/<域名>.key;",
    ].join("\n");
    const zip = createZip([
      { name: cert.fileName, data: await bytes(cert.content) },
      { name: key.fileName, data: await bytes(key.content) },
      { name: chain.fileName, data: await bytes(chain.content) },
      { name: "README.txt", data: new TextEncoder().encode(readme) },
    ]);
    const url = URL.createObjectURL(zip);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeDomain.value}-certs.zip`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    message.success("已开始下载");
  } catch (e) {
    message.error(String((e as Error)?.message ?? e));
  } finally {
    downloading.value = false;
  }
}
</script>

<template>
  <el-dialog v-model="dialogVisible" title="下载证书" width="480px" append-to-body>
    <div class="dlg-tip">选择要下载的文件，证书链与私钥均为 PEM 格式。</div>
    <div class="dlg-list">
      <div class="dlg-item" @click="handleDownload('cert')">
        <el-icon><Document /></el-icon>
        <div class="dlg-main">
          <b>证书文件</b>
          <span>domain.crt，PEM 格式证书链</span>
        </div>
        <el-icon><Download /></el-icon>
      </div>
      <div class="dlg-item" @click="handleDownload('key')">
        <el-icon><Key /></el-icon>
        <div class="dlg-main">
          <b>私钥文件</b>
          <span>domain.key，PEM 格式私钥</span>
        </div>
        <el-icon><Download /></el-icon>
      </div>
      <div class="dlg-item" @click="handleDownload('chain')">
        <el-icon><Link /></el-icon>
        <div class="dlg-main">
          <b>证书链文件</b>
          <span>domain_chain.crt，含中间证书与根证书</span>
        </div>
        <el-icon><Download /></el-icon>
      </div>
    </div>
    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
      <el-button type="primary" :loading="downloading" @click="handleDownloadAll">
        <el-icon style="margin-right:4px"><FolderOpened /></el-icon>打包下载全部（zip）
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.dlg-tip {
  margin-bottom: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.dlg-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dlg-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;
}
.dlg-item:hover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.dlg-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.dlg-main b {
  font-size: 13px;
  color: var(--el-text-color-primary);
}
.dlg-main span {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>