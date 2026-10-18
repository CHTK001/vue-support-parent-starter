<!--
  临时验证页（验证完删除）：ReFilePicker 新增能力 —— 数量/类型限制、右键菜单、预览集成。

  <p>用内存假文件系统当 loader，所以不依赖后端；页面上的「在第一行触发右键」按钮
  会派发一次真实的 contextmenu 事件，用来在没有右键自动化能力的浏览器面板里把菜单打开。</p>
-->
<template>
  <div class="picker-lab">
    <h1 class="picker-lab__title">ReFilePicker 新增能力验证（临时页）</h1>

    <section class="picker-lab__block">
      <h2>1. 完整右键菜单：全部开关打开 + 全部回调 + 预览通道（limit=3）</h2>
      <div class="picker-lab__row">
        <button data-lab="open-full" @click="open.full = true">打开选择器</button>
        <button data-lab="ctx-first" @click="rightClickFirstRow">在第一行触发右键</button>
      </div>
      <ReFilePicker
        v-model="open.full"
        title="完整右键菜单"
        multiple
        :limit="3"
        :loader="loader"
        :context-menu="allOn"
        :preview-url="previewUrl"
        :create-dir="onCreateDir"
        :rename-item="onRename"
        :remove-items="onRemove"
        :upload-files="onUpload"
        :download-items="onDownload"
        @select="(items) => push(`select: ${items.map((i) => i.name).join(', ')}`)"
        @preview="(item) => push(`preview 事件: ${item.name}`)"
      />
    </section>

    <section class="picker-lab__block">
      <h2>2. 数量限制（limit=2）+ 类型限制（accept="dir,.csv"）</h2>
      <div class="picker-lab__row">
        <button data-lab="open-limited" @click="open.limited = true">打开选择器</button>
        <button data-lab="ctx-first" @click="rightClickFirstRow">在第一行触发右键</button>
      </div>
      <ReFilePicker v-model="open.limited" title="限制数量与类型" multiple :limit="2" accept="dir,.csv" :loader="loader" />
    </section>

    <section class="picker-lab__block">
      <h2>3. 默认右键开关（不传 contextMenu：只应有 刷新 / 属性）</h2>
      <div class="picker-lab__row">
        <button data-lab="open-basic" @click="open.basic = true">打开选择器</button>
        <button data-lab="ctx-first" @click="rightClickFirstRow">在第一行触发右键</button>
      </div>
      <ReFilePicker v-model="open.basic" title="默认右键" :loader="loader" />
    </section>

    <pre class="picker-lab__log" data-lab="log">{{ log.join("\n") || "（暂无操作记录）" }}</pre>
  </div>
</template>

<script setup lang="ts">
/**
 * 临时验证页：不接后端，文件系统与文件操作都在内存里演一遍，
 * 只为把「右键菜单 / 属性 / 预览 / 数量与类型限制 / 落盘回调」在真实浏览器里跑一遍。
 */
import { reactive, ref } from "vue";
import ReFilePicker from "@repo/ui/re-file-picker";
import type {
  FilePickerContextMenuOptions,
  FilePickerItem,
} from "@repo/ui/re-file-picker";

interface MockNode {
  key: string;
  name: string;
  isDir: boolean;
  size?: number;
  updatedAt?: number;
}

const stamp = Date.now();

const file = (key: string, size: number, minutesAgo = 5): MockNode => ({
  key,
  name: key.split("/").pop() ?? key,
  isDir: false,
  size,
  updatedAt: stamp - minutesAgo * 60_000,
});

const dir = (key: string): MockNode => ({
  key,
  name: key.split("/").pop() ?? key,
  isDir: true,
  updatedAt: stamp - 60 * 60_000,
});

/** 内存假文件系统：key = 绝对目录，值 = 该目录下的条目 */
const fs: Record<string, MockNode[]> = {
  "/": [dir("/data"), dir("/docs"), file("/readme.md", 2048), file("/notes.pdf", 51_200)],
  "/data": [
    dir("/data/sub"),
    file("/data/order.csv", 1024, 2),
    file("/data/users.csv", 4096, 30),
    file("/data/archive.zip", 65_536, 90),
    file("/data/photo.png", 8192, 1),
  ],
  "/data/sub": [file("/data/sub/inner.csv", 128, 3)],
  "/docs": [file("/docs/guide.md", 333, 300)],
};

const open = reactive({ full: false, limited: false, basic: false });
const log = ref<string[]>([]);
const push = (line: string): void => {
  log.value = [line, ...log.value].slice(0, 12);
};

const allOn: FilePickerContextMenuOptions = {
  refresh: true,
  properties: true,
  preview: true,
  newFolder: true,
  rename: true,
  remove: true,
  upload: true,
  download: true,
};

/** 假 loader：按目录返回条目（带一点延迟，能看到 loading 态） */
const loader = async (path: string): Promise<MockNode[]> => {
  await new Promise((resolve) => setTimeout(resolve, 120));
  return fs[path] ?? [];
};

const parentOf = (key: string): string => key.slice(0, key.lastIndexOf("/")) || "/";

const onCreateDir = async (target: string, name: string): Promise<void> => {
  const list = (fs[target] ??= []);
  list.push(dir(`${target === "/" ? "" : target}/${name}`));
  push(`新建文件夹: ${target} / ${name}`);
};

const onRename = async (item: FilePickerItem, newName: string): Promise<void> => {
  const parent = parentOf(item.key);
  const list = fs[parent] ?? [];
  const index = list.findIndex((node) => node.key === item.key);
  if (index >= 0) {
    list[index] = {
      ...list[index],
      name: newName,
      key: `${parent === "/" ? "" : parent}/${newName}`,
    };
  }
  push(`重命名: ${item.name} → ${newName}`);
};

const onRemove = async (items: FilePickerItem[]): Promise<void> => {
  items.forEach((item) => {
    const parent = parentOf(item.key);
    fs[parent] = (fs[parent] ?? []).filter((node) => node.key !== item.key);
    delete fs[item.key];
  });
  push(`删除: ${items.map((item) => item.name).join(", ")}`);
};

const onUpload = async (target: string, files: File[]): Promise<void> => {
  const list = (fs[target] ??= []);
  files.forEach((item) => list.push(file(`${target === "/" ? "" : target}/${item.name}`, item.size)));
  push(`上传到 ${target}: ${files.map((item) => item.name).join(", ")}`);
};

const onDownload = async (items: FilePickerItem[]): Promise<void> => {
  push(`下载: ${items.map((item) => item.name).join(", ")}`);
};

/** 假预览通道：返回一段自带样式的 data: URL（FileStorageServerFilter 那条通道同理，只是地址来自后端） */
const previewUrl = async (item: FilePickerItem): Promise<string> => {
  const html = `<html><body style="font-family:system-ui;padding:24px">
    <h2 style="margin:0 0 8px">${item.name}</h2>
    <p style="color:#666">这是 ReFilePicker 内建 iframe 预览通道（假数据）。</p>
    <p style="color:#666">大小 ${item.size ?? 0} 字节</p>
  </body></html>`;
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
};

/** 派发一次真实 contextmenu：浏览器面板没有右键动作，靠它把菜单打开 */
const rightClickFirstRow = (): void => {
  const row = document.querySelector<HTMLElement>(".re-file-picker__item");
  if (!row) {
    push("没有可右键的行");
    return;
  }
  const rect = row.getBoundingClientRect();
  row.dispatchEvent(
    new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      button: 2,
      clientX: Math.round(rect.left + 60),
      clientY: Math.round(rect.top + 12),
    }),
  );
  push(`已派发 contextmenu: ${row.textContent?.trim().slice(0, 40)}`);
};
</script>

<style scoped>
.picker-lab {
  padding: 20px 24px 40px;
}

.picker-lab__title {
  margin: 0 0 16px;
  font-size: 18px;
}

.picker-lab__block {
  margin: 0 0 22px;
}

.picker-lab__block h2 {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
}

.picker-lab__row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.picker-lab__row button {
  padding: 4px 12px;
  cursor: pointer;
}

.picker-lab__log {
  margin: 0;
  padding: 12px;
  max-height: 220px;
  overflow: auto;
  background: var(--el-fill-color-light, #f5f7fa);
  font-size: 12px;
  line-height: 1.7;
  white-space: pre-wrap;
}
</style>
