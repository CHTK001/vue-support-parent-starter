<template>
  <div class="qw">
    <div v-if="!widget.hideTitle" class="qw__header">
      <div class="qw__title">
        <el-icon class="qw__title-icon"><Grid /></el-icon>
        <span>{{ widget.title }}</span>
      </div>
      <button type="button" class="qw__add-btn" title="添加快捷" aria-label="添加快捷" @click="openAdd">
        <el-icon><Plus /></el-icon>
      </button>
    </div>

    <div class="qw__body" v-loading="loading">
      <div v-if="!merged.length && !loading" class="qw__empty">
        <el-icon :size="28"><Grid /></el-icon>
        <span>暂无快捷项</span>
        <button type="button" class="qw__empty-btn" @click="openAdd">添加一个</button>
      </div>
      <div v-else class="qw__grid">
        <div v-for="item in merged" :key="item.id" class="qw__item" :title="item.title" @click="go(item)">
          <div class="qw__item-icon">
            <img
              v-if="item.icon && isImageUrl(item.icon) && !imgFailed[item.id!]"
              :src="item.icon"
              alt=""
              class="qw__item-img"
              @error="imgFailed[item.id!] = true"
            />
            <el-icon v-else :size="20"><component :is="iconMap[item.icon ?? ''] || 'Menu'" /></el-icon>
          </div>
          <span class="qw__item-title">{{ item.title }}</span>
          <button
            v-if="!item.isSystem"
            type="button"
            class="qw__item-del"
            :title="`删除 ${item.title}`"
            :aria-label="`删除 ${item.title}`"
            @click.stop="remove(item.id!)"
          >
            <el-icon><Close /></el-icon>
          </button>
        </div>
      </div>
    </div>

    <ReDialog v-model="dialogVisible" title="添加快捷" width="440px" :close-on-click-modal="false" append-to-body @close="dialogVisible = false">
      <el-form label-width="70px" label-position="left">
        <el-form-item label="类型">
          <el-radio-group v-model="form.type">
            <el-radio value="route">系统路由</el-radio>
            <el-radio value="link">外部链接</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.type === 'route'" label="路由">
          <el-select v-model="form.routePath" filterable placeholder="搜索系统菜单..." style="width:100%">
            <el-option v-for="r in routeOptions" :key="r.path" :label="r.title" :value="r.path">
              <span>{{ r.title }}</span>
              <span class="text-xs text-[var(--el-text-color-disabled)] ml-2">{{ r.path }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.type === 'link'" label="名称">
          <el-input v-model="form.linkTitle" maxlength="20" placeholder="快捷名称" />
        </el-form-item>
        <el-form-item v-if="form.type === 'link'" label="链接">
          <el-input v-model="form.linkUrl" placeholder="https://example.com" clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">添加</el-button>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts" name="QuickAccessWidget">

import { message } from "@repo/core";
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";

import { Close, Grid, Menu, Plus, Setting, User, Document, DataBoard, Monitor, ChatDotSquare, Message, Bell, Key, Files, Folder, Tools, InfoFilled, Link } from "@element-plus/icons-vue";
import { IndexedDBStore } from "@repo/utils";
import { getMenuLanguage } from "@repo/languages";
import useAuthStore from "@repo/pinia/modules/auth";
import type { WidgetItem } from "../types";
import ReDialog from "@repo/ui/re-dialog";

defineProps<{ widget: WidgetItem }>();

interface QuickItem {
  id?: string;
  title: string;
  icon?: string;
  path?: string;
  url?: string;
  isSystem: boolean;
}

/**
 * 持久化到 IndexedDB 的形态：id 必填。
 *
 * <p>{@link QuickItem} 是「系统菜单项 + 自定义项」合并后的**展示**类型，系统项由菜单生成、
 * 本就没有 id（模板里的 {@code item.id!} 由此而来）。但写入库的只有自定义项，且写时必定带
 * {@code cust_<timestamp>}（见 save()）。把两者分开，入库处就满足 IndexedDBStore 的
 * {@code WithId} 约束，不必再靠断言糊过去。</p>
 */
type StoredQuickItem = QuickItem & { id: string };

const router = useRouter();
const authStore = useAuthStore();

const iconMap: Record<string, unknown> = { Grid, Link, Menu, Setting, User, Document, DataBoard, Monitor, ChatDotSquare, Message, Bell, Key, Files, Folder, Tools, InfoFilled };

/**
 * 品牌 logo 图库（@repo/images/brand/），按域名 key 索引。
 *
 * <p>{@code import: "default"} 时运行时取的是模块的 default 导出（字符串），但 Vite 的
 * {@code import.meta.glob} 泛型标注的是**模块**类型，于是 TS 推出
 * {@code Record<string, { default: string }>}，直接断言成 {@code Record<string, string>}
 * 属于「无充分重叠」的错误断言。这里经 unknown 过渡一次并注明原因。</p>
 */
const brandImages = import.meta.glob<{ default: string }>(
  "/packages/images/src/brand/*.webp",
  { eager: true, import: "default" },
) as unknown as Record<string, string>;

/** 域名 → 品牌图片路径 */
function brandForDomain(domain: string): string | undefined {
  const key = domain.replace(/^www\./, "").split(".")[0].toLowerCase();
  for (const [path, img] of Object.entries(brandImages)) {
    const base = path.split("/").pop()?.replace(/\.webp$/, "").replace(/-1$/, "").toLowerCase() ?? "";
    if (base === key) return img;
  }
  return undefined;
}

const store = new IndexedDBStore({ dbName: "koi-home-quickaccess", storeName: "items", keyPath: "id", version: 1 });

const customItems = ref<QuickItem[]>([]);
const loading = ref(true);
const dialogVisible = ref(false);

/** 记录图片加载失败的快捷项（回退到 Element 图标） */
const imgFailed = reactive<Record<string, boolean>>({});

const form = reactive({
  type: "route" as "route" | "link",
  routePath: "",
  linkTitle: "",
  linkUrl: "",
});

/** 展平系统菜单叶子节点（标题经 getMenuLanguage 翻译） */
const systemItems = computed<QuickItem[]>(() => {
  const result: QuickItem[] = [];
  function walk(list: any[]): void {
    list.forEach((m: any) => {
      if (m.children?.length) walk(m.children);
      else if (m.path && m.meta?.title) {
        result.push({
          title: getMenuLanguage(m.meta.title),
          path: m.path,
          icon: m.meta?.icon,
          isSystem: true,
        });
      }
    });
  }
  walk(authStore.recursiveMenuList || []);
  return result;
});

/** 路由下拉选项 */
const routeOptions = computed(() =>
  systemItems.value.map((m) => ({ path: m.path!, title: m.title })),
);

/** 合并系统 + 自定义 */
const merged = computed(() => {
  const sys = systemItems.value.map((m) => ({ ...m, id: "sys_" + m.path }));
  const cust = customItems.value.map((m) => ({ ...m, id: m.id ?? "cust_" + Math.random() }));
  return [...cust, ...sys].slice(0, 30);
});

async function load(): Promise<void> {
  loading.value = true;
  try { customItems.value = await store.getAll<StoredQuickItem>(); }
  catch { /* ignore */ }
  finally { loading.value = false; }
}

async function remove(id: string): Promise<void> {
  customItems.value = customItems.value.filter((x) => x.id !== id);
  await store.remove(id);
}

function go(item: QuickItem): void {
  if (item.url) {
    window.open(item.url, "_blank", "noopener,noreferrer");
  } else if (item.path) {
    router.push(item.path).catch(() => undefined);
  }
}

function openAdd(): void {
  form.type = "route";
  form.routePath = "";
  form.linkTitle = "";
  form.linkUrl = "";
  dialogVisible.value = true;
}

async function save(): Promise<void> {
  const now = Date.now();
  if (form.type === "route") {
    if (!form.routePath) { message.warning("请选择系统路由"); return; }
    const found = systemItems.value.find((m) => m.path === form.routePath);
    if (!found) return;
    const item: StoredQuickItem = { id: "cust_" + now, title: found.title, path: found.path, icon: found.icon, isSystem: false };
    await store.put(item);
    customItems.value.push(item);
  } else {
    const title = form.linkTitle.trim();
    const url = form.linkUrl.trim();
    if (!title) { message.warning("请输入快捷名称"); return; }
    if (!url) { message.warning("请输入链接地址"); return; }
    const item: StoredQuickItem = { id: "cust_" + now, title, url, icon: resolveIcon(url), isSystem: false };
    await store.put(item);
    customItems.value.push(item);
  }
  dialogVisible.value = false;
  message.success("已添加");
}

/** 判断是否为图片 URL（本地路径 / http 链接 / 数据 URL） */
function isImageUrl(v: string): boolean {
  return v.startsWith("/") || v.startsWith("http") || v.startsWith("data:");
}

/** 解析图标：优先本地品牌图库，其次在线 favicon */
function resolveIcon(raw: string): string | undefined {
  try {
    let url = raw.trim();
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    const domain = new URL(url).hostname;
    const local = brandForDomain(domain);
    if (local) return local;
    return `https://${domain}/favicon.ico`;
  } catch {
    return undefined;
  }
}

onMounted(() => load());
</script>

<style lang="scss" scoped>
/* 统一规范：圆角只用令牌、字号最小 12px、间距 4/8 基准、过渡走 --el-transition-duration */
.qw {
  display: flex; flex-direction: column; height: 100%; width: 100%; min-height: 0;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-card-border-radius, var(--el-radius-lg, 12px));
  overflow: hidden;
}
.qw__header { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 12px 16px 8px; }
.qw__title { display: inline-flex; align-items: center; gap: 8px; min-width: 0; font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); }
.qw__title-icon { flex-shrink: 0; color: var(--el-color-primary); }
.qw__add-btn {
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  width: 32px; height: 32px; border: none; cursor: pointer;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  border-radius: var(--el-radius-sm, 6px);
  transition: background var(--el-transition-duration, 0.2s);
}
.qw__add-btn:hover { background: color-mix(in srgb, var(--el-color-primary) 20%, transparent); }
.qw__add-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent); }

.qw__body { flex: 1; min-height: 0; overflow: auto; padding: 0 16px 16px; }

.qw__empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; height: 100%; font-size: 13px; color: var(--el-text-color-disabled); }
.qw__empty-btn {
  margin-top: 4px; padding: 8px 16px; cursor: pointer;
  font-size: 12px; color: var(--el-color-primary);
  background: transparent;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-sm, 6px);
  transition: background var(--el-transition-duration, 0.2s),
    border-color var(--el-transition-duration, 0.2s);
}
.qw__empty-btn:hover { background: var(--el-color-primary-light-9); border-color: var(--el-color-primary); }
.qw__empty-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent); }

.qw__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(76px, 1fr)); gap: 8px; }

/* 边框默认透明，hover 才描边 —— 静止时页面更安静，hover 时仍有明确边界 */
.qw__item {
  position: relative; display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 16px 4px 12px; cursor: pointer;
  border: 1px solid transparent;
  border-radius: var(--el-radius-md, 8px);
  transition: background var(--el-transition-duration, 0.2s),
    border-color var(--el-transition-duration, 0.2s);
}
.qw__item:hover { background: var(--el-fill-color-light); border-color: var(--el-border-color-lighter); }
.qw__item:hover .qw__item-del { opacity: 1; }

.qw__item-icon {
  display: flex; align-items: center; justify-content: center;
  width: 40px; height: 40px;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
  border-radius: var(--el-radius-lg, 12px);
  transition: background var(--el-transition-duration, 0.2s);
}
.qw__item:hover .qw__item-icon { background: color-mix(in srgb, var(--el-color-primary) 14%, transparent); }
.qw__item-img { width: 24px; height: 24px; object-fit: contain; }

.qw__item-title {
  max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-size: 12px; color: var(--el-text-color-secondary); text-align: center;
}

.qw__item-del {
  position: absolute; top: 4px; right: 4px;
  display: flex; align-items: center; justify-content: center;
  width: 20px; height: 20px; border: none; cursor: pointer;
  font-size: 12px; color: #fff;
  background: var(--el-color-danger);
  border-radius: var(--el-radius-full, 9999px);
  opacity: 0;
  transition: opacity var(--el-transition-duration, 0.2s);
}
.qw__item-del:focus-visible { opacity: 1; outline: none; box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-danger) 20%, transparent); }
</style>