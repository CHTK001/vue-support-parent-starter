<template>
  <div class="bw">
    <div v-if="!widget.hideTitle" class="bw__header">
      <div class="bw__title">
        <el-icon class="bw__title-icon"><Collection /></el-icon>
        <span>{{ widget.title }}</span>
      </div>
      <button type="button" class="bw__add" title="添加书签" aria-label="添加书签" @click="openAdd">
        <el-icon><Plus /></el-icon>
      </button>
    </div>

    <div class="bw__body" v-loading="loading">
      <div v-if="!bookmarks.length && !loading" class="bw__empty">
        <el-icon :size="28"><Collection /></el-icon>
        <span>暂无书签</span>
        <button type="button" class="bw__empty-btn" @click="openAdd">添加一个</button>
      </div>
      <div v-else class="bw__grid">
        <div v-for="b in bookmarks" :key="b.id" class="bw__item" @click="openUrl(b.url)">
          <div class="bw__item-icon">
            <img v-if="b.icon" :src="b.icon" alt="" class="bw__item-img" />
            <el-icon v-else :size="18"><Link /></el-icon>
          </div>
          <span class="bw__item-title">{{ b.title }}</span>
          <button type="button" class="bw__item-del" :title="`删除书签 ${b.title}`" :aria-label="`删除书签 ${b.title}`" @click.stop="remove(b.id)">
            <el-icon><Close /></el-icon>
          </button>
        </div>
      </div>
    </div>

    <ReDialog v-model="dialogVisible" :title="editingId ? '编辑书签' : '添加书签'" width="420px" :close-on-click-modal="false" append-to-body @close="dialogVisible = false">
      <el-form label-width="60px" label-position="left">
        <el-form-item label="名称"><el-input v-model="form.title" maxlength="20" placeholder="书签名称" /></el-form-item>
        <el-form-item label="链接"><el-input v-model="form.url" placeholder="https://example.com" clearable /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts" name="BookmarkWidget">

import { message } from "@repo/core";
import { computed, onMounted, reactive, ref } from "vue";

import { Close, Collection, Link, Plus } from "@element-plus/icons-vue";
import { IndexedDBStore } from "@repo/utils";
import useAuthStore from "@repo/pinia/modules/auth";
import type { WidgetItem } from "../types";
import ReDialog from "@repo/ui/re-dialog";

const props = defineProps<{ widget: WidgetItem }>();

interface Bookmark { id: string; title: string; url: string; icon?: string; }

const authStore = useAuthStore();
const userId = computed(() => String(authStore.loginUser?.userId ?? authStore.loginUser?.id ?? "anonymous"));
const store = new IndexedDBStore({ dbName: `koi-home-bookmark-${userId.value}`, storeName: "bookmarks", keyPath: "id", version: 1 });

const bookmarks = ref<Bookmark[]>([]);
const loading = ref(true);
const dialogVisible = ref(false);
const editingId = ref<string | null>(null);
const form = reactive({ title: "", url: "" });

async function load(): Promise<void> {
  loading.value = true;
  try { bookmarks.value = await store.getAll<Bookmark>(); }
  catch (e) { console.warn("[bookmark] load failed", e); }
  finally { loading.value = false; }
}

async function remove(id: string): Promise<void> {
  bookmarks.value = bookmarks.value.filter((x) => x.id !== id);
  await store.remove(id);
}

function openUrl(url: string): void { if (url) window.open(url, "_blank", "noopener,noreferrer"); }
function openAdd(): void { editingId.value = null; form.title = ""; form.url = ""; dialogVisible.value = true; }

async function save(): Promise<void> {
  const title = form.title.trim(), url = form.url.trim();
  if (!title) { message.warning("请输入书签名称"); return; }
  if (!url) { message.warning("请输入链接地址"); return; }
  const now = Date.now();
  const bm: Bookmark = { id: editingId.value ?? `bm_${now}_${Math.random().toString(36).slice(2, 6)}`, title, url };
  await store.put(bm);
  if (editingId.value) { const i = bookmarks.value.findIndex((x) => x.id === editingId.value); if (i >= 0) bookmarks.value[i] = bm; }
  else { bookmarks.value.push(bm); }
  dialogVisible.value = false; message.success("已保存");
}

onMounted(() => load());
</script>

<style lang="scss" scoped>
/* 统一规范：圆角只用令牌、字号最小 12px、间距 4/8 基准、过渡走 --el-transition-duration */
.bw {
  display: flex; flex-direction: column; height: 100%; width: 100%; min-height: 0;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-card-border-radius, var(--el-radius-lg, 12px));
  overflow: hidden;
}
.bw__header { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 12px 16px 8px; }
.bw__title { display: inline-flex; align-items: center; gap: 8px; min-width: 0; font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); }
.bw__title-icon { flex-shrink: 0; color: var(--el-color-primary); }
.bw__add {
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  width: 32px; height: 32px; border: none; cursor: pointer;
  border-radius: var(--el-radius-sm, 6px);
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  transition: background var(--el-transition-duration, 0.2s);
}
.bw__add:hover { background: color-mix(in srgb, var(--el-color-primary) 20%, transparent); }
.bw__add:focus-visible { outline: none; box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent); }

.bw__body { flex: 1; min-height: 0; overflow: auto; padding: 0 16px 16px; }

.bw__empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  height: 100%; font-size: 13px; color: var(--el-text-color-disabled);
}
.bw__empty-btn {
  margin-top: 4px; padding: 8px 16px; cursor: pointer;
  font-size: 12px; color: var(--el-color-primary);
  background: transparent;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-sm, 6px);
  transition: background var(--el-transition-duration, 0.2s),
    border-color var(--el-transition-duration, 0.2s);
}
.bw__empty-btn:hover { background: var(--el-color-primary-light-9); border-color: var(--el-color-primary); }
.bw__empty-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent); }

.bw__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(84px, 1fr)); gap: 8px; }

.bw__item {
  position: relative; display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 16px 8px 12px; cursor: pointer;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  transition: border-color var(--el-transition-duration, 0.2s),
    background var(--el-transition-duration, 0.2s);
}
.bw__item:hover { background: color-mix(in srgb, var(--el-color-primary) 4%, transparent); border-color: var(--el-color-primary); }

/* 图标底随 hover 一起变主色，视觉上「这一格被选中了」 */
.bw__item-icon {
  display: flex; align-items: center; justify-content: center;
  width: 40px; height: 40px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-md, 8px);
  transition: background var(--el-transition-duration, 0.2s),
    color var(--el-transition-duration, 0.2s);
}
.bw__item:hover .bw__item-icon { color: var(--el-color-primary); background: color-mix(in srgb, var(--el-color-primary) 12%, transparent); }
.bw__item-img { width: 24px; height: 24px; object-fit: contain; }

.bw__item-title {
  max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-size: 12px; color: var(--el-text-color-primary); text-align: center;
}

.bw__item-del {
  position: absolute; top: 4px; right: 4px;
  display: flex; align-items: center; justify-content: center;
  width: 20px; height: 20px; border: none; cursor: pointer;
  font-size: 12px; color: #fff;
  background: var(--el-color-danger);
  border-radius: var(--el-radius-full, 9999px);
  opacity: 0;
  transition: opacity var(--el-transition-duration, 0.2s);
}
.bw__item:hover .bw__item-del { opacity: 1; }
.bw__item-del:focus-visible { opacity: 1; outline: none; box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-danger) 20%, transparent); }
</style>