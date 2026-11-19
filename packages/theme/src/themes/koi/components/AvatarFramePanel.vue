<template>
  <div class="avatar-frame-panel">
    <div class="avatar-frame-toolbar">
      <span class="avatar-frame-toolbar-label">显示头像框</span>
      <el-switch v-model="frameShow" @change="persistShow" />
    </div>

    <template v-if="frameShow">
      <div class="avatar-frame-filters">
        <el-input
          v-model="keyword"
          size="small"
          placeholder="搜索头像框"
          clearable
          :prefix-icon="Search"
          class="avatar-frame-search"
        />
        <div class="avatar-frame-chips">
          <button
            v-for="chip in typeChips"
            :key="chip.value"
            type="button"
            class="avatar-frame-chip"
            :class="{ 'is-active': activeType === chip.value }"
            @click="activeType = chip.value"
          >
            {{ chip.label }}
          </button>
        </div>
      </div>
      <!-- 生日彩蛋：按 sysUserBirthday 推荐生肖框 / 星座框 -->
      <div v-if="birthdayPick" class="avatar-frame-birthday">
        <span class="avatar-frame-birthday-text">
          🎂 生日彩蛋：你是 {{ birthdayPick.label }}，有专属的生肖框和星座框
        </span>
        <el-button size="small" text type="primary" @click="applyBirthdayPick">一键试戴星座框</el-button>
      </div>

      <!-- 组合套装：框 + 挂件 + 昵称牌一键换装（纯前端推荐组合） -->
      <section class="avatar-frame-group">
        <h4 class="avatar-frame-group-title" @click="setsOpen = !setsOpen">
          <span>组合套装</span>
          <span class="avatar-frame-group-count">{{ AVATAR_SETS.length }}</span>
          <el-icon class="avatar-frame-chevron" :class="{ 'is-collapsed': !setsOpen }" :size="12">
            <ArrowDown />
          </el-icon>
        </h4>
        <div v-show="setsOpen" class="avatar-frame-set-list">
          <div v-for="set in AVATAR_SETS" :key="set.key" class="avatar-frame-set">
            <img
              v-if="setPoster(set)"
              class="avatar-frame-set-img"
              :src="setPoster(set)"
              :alt="set.name"
              loading="lazy"
            />
            <div class="avatar-frame-set-info">
              <span class="avatar-frame-set-name">{{ set.name }}</span>
              <span class="avatar-frame-set-desc">{{ set.desc }}</span>
            </div>
            <el-button
              size="small"
              type="primary"
              plain
              :loading="applyingSet === set.key"
              @click="applySet(set)"
            >
              一键佩戴
            </el-button>
          </div>
        </div>
      </section>

      <template v-if="visibleGroups.length">
        <section v-for="group in visibleGroups" :key="group.title" class="avatar-frame-group">
          <h4 class="avatar-frame-group-title" @click="toggleGroup(group.title)">
            <span>{{ group.title }}</span>
            <span class="avatar-frame-group-count">{{ group.items.length }}</span>
            <el-icon class="avatar-frame-chevron" :class="{ 'is-collapsed': isCollapsed(group.title) }" :size="12">
              <ArrowDown />
            </el-icon>
          </h4>
          <div v-show="!isCollapsed(group.title)" class="avatar-frame-grid">
            <div
              v-for="frame in group.items"
              :key="frame.id"
              class="avatar-frame-item"
              :class="{ 'is-selected': selectedFrame === frame.id }"
              @click="activateFrame(frame)"
            >
              <div class="avatar-frame-preview">
                <!-- 卡片默认显示 poster 静帧（省流省电），hover 才切 APNG 动图；旧素材无 poster 时回退原图 -->
                <img
                  v-if="cardSrc(frame)"
                  class="avatar-frame-poster"
                  :src="cardSrc(frame)"
                  :alt="frame.name"
                  loading="lazy"
                  @error="onPosterError(frame)"
                  @mouseenter="hoveredFrame = frame.id"
                  @mouseleave="hoveredFrame = 0"
                />
                <div
                  v-else-if="hasFrameVisual(frame)"
                  class="avatar-frame-img"
                  :style="frameLayerStyle(frame, 52)"
                ></div>
                <!-- 不佩戴：预览默认光环，让用户看到取下后的实际效果 -->
                <span
                  v-else
                  class="koi-avatar-default-frame"
                  :style="defaultFrameLayerStyle(52)"
                ></span>
                <el-avatar :size="52" :src="avatar" />
                <el-icon v-if="isLocked(frame)" class="avatar-frame-lock" :size="14"><Lock /></el-icon>
                <span class="avatar-frame-zoom" title="大图试戴" @click.stop="openPreview(frame)">
                  <el-icon :size="13"><ZoomIn /></el-icon>
                </span>
              </div>
              <span class="avatar-frame-name">
                {{ frame.name }}
                <span v-if="isBirthdayPick(frame)" class="avatar-frame-bday" title="生日推荐">🎂</span>
              </span>
              <span v-if="acquireLabel(frame)" class="avatar-frame-acquire">{{ acquireLabel(frame) }}</span>
              <el-icon v-if="selectedFrame === frame.id" class="avatar-frame-check"><CircleCheckFilled /></el-icon>
            </div>
          </div>
        </section>
      </template>
      <el-empty
        v-else
        :description="groups.length ? '没有匹配的头像框' : '暂无可用头像框'"
        :image-size="80"
      />
    </template>

    <!-- 大图试戴：52px 卡片预览看不清动效细节，弹出 120px「头像+框」组合预览，确认后再佩戴 -->
    <el-dialog v-model="previewVisible" width="340px" append-to-body destroy-on-close>
      <template #header>
        <span class="avatar-frame-preview-title">{{ previewFrame?.name || "试戴预览" }}</span>
      </template>
      <div class="avatar-frame-preview-stage">
        <div class="avatar-frame-preview-box">
          <div
            v-if="previewFrame && hasFrameVisual(previewFrame)"
            class="avatar-frame-img"
            :style="frameLayerStyle(previewFrame, 120)"
          ></div>
          <span v-else class="koi-avatar-default-frame" :style="defaultFrameLayerStyle(120)"></span>
          <el-avatar :size="120" :src="avatar" />
        </div>
        <p class="avatar-frame-preview-hint">{{ previewHint }}</p>
      </div>
      <template #footer>
        <el-button size="small" @click="previewVisible = false">关闭</el-button>
        <el-button
          size="small"
          type="primary"
          :disabled="!previewFrame || selectedFrame === previewFrame.id"
          @click="wearPreview"
        >
          {{ previewFrame && selectedFrame === previewFrame.id ? "已佩戴" : "佩戴该框" }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 头像框设置面板（组件化）
 *
 * 供个人中心等页面复用：分组展示「不佩戴 / 常规 / 灵动 / 生肖 / 星座 / 神兽 / 限定」头像框，点选即佩戴。
 * 字典来源：GET /v2/avatar-frame/list（服务端已按生日窗口过滤生日框）；
 * 限定帧（acquire 非 default）需先 POST /v2/avatar-frame/acquire 解锁，解锁记录取
 * GET /v2/avatar-frame/user。佩戴与显隐持久化：PUT /v2/user/update，
 * 成功后刷新登录用户信息并 emit updated。
 */
import { computed, onMounted, ref } from "vue";
import { ArrowDown, CircleCheckFilled, Lock, Search, ZoomIn } from "@element-plus/icons-vue";
import { msgError, msgSuccess } from "@repo/core";
import { resolveUserDisplayInfo, Http } from "@repo/utils";
import useAuthStore from "@repo/pinia/modules/auth";
import useUserStore from "@repo/pinia/modules/user";
import {
  avatarFrameDict,
  avatarFramePosterPath,
  defaultFrameLayerStyle,
  frameLayerStyle,
  hasFrameVisual,
  isAvatarFrameEnabled,
  isAvatarFrameLocked,
  loadAvatarFrames,
  resolveAvatarFrameUrl,
  type AvatarFrame,
} from "./avatarFrames";
import { AVATAR_SETS, recommendByBirthday, type AvatarSet } from "./avatarSets";
import {
  acquireOrnament,
  isOrnamentEnabled,
  isOrnamentExpired,
  isOrnamentOwned,
  ornamentCatalog,
  wearOrnament,
} from "./ornaments/store";

/** 兜底「默认光环」选项（id=0）：字典不含透明占位帧时，保证始终能取下头像框 */
const DEFAULT_FRAME_OPTION: AvatarFrame = {
  id: 0,
  name: "默认光环",
  type: "none",
  acquire: "default",
};

const props = defineProps<{ avatar?: string }>();
const emit = defineEmits<{ (e: "updated"): void }>();

const authStore = useAuthStore();
const userStore = useUserStore();

/** 统一用户信息（authStore > storage > userStore） */
const display = computed(() =>
  resolveUserDisplayInfo({
    authLoginUser: authStore.loginUser as Record<string, unknown>,
    userStoreInfo: userStore.userInfo as Record<string, unknown>,
  }),
);

interface FrameGroup {
  title: string;
  items: AvatarFrame[];
}

/** 面板分组：不佩戴 → 常规 → 灵动 → 生肖 → 星座 → 神兽 → 限定（生日等） */
const groups = computed<FrameGroup[]>(() => {
  if (!isAvatarFrameEnabled()) return [];
  const frames = avatarFrameDict.value.filter(hasFrameVisual);
  const byType = (type: string) => frames.filter((f) => f.type === type);
  const listed = new Set(["regular", "dynamic", "zodiac", "constellation", "beast"]);
  const limited = frames.filter((f) => !listed.has(f.type ?? ""));
  // 「不佩戴」项：优先用字典里的透明占位帧（经典），没有时用虚拟的「默认光环」
  const noneItems = avatarFrameDict.value.filter((f) => !hasFrameVisual(f));
  return [
    { title: "不佩戴", items: noneItems.length ? noneItems : [DEFAULT_FRAME_OPTION] },
    { title: "常规", items: byType("regular") },
    { title: "灵动", items: byType("dynamic") },
    { title: "生肖", items: byType("zodiac") },
    { title: "星座", items: byType("constellation") },
    { title: "神兽", items: byType("beast") },
    { title: "限定", items: limited },
  ].filter((g) => g.items.length);
});

const selectedFrame = ref<number>(0);
const frameShow = ref(false);
/** 已解锁的限定帧 ID（含未过期判断） */
const ownedIds = ref<Set<number>>(new Set());

/* ==================== 搜索 / 类型筛选 / 分组折叠 ==================== */

const keyword = ref("");
const activeType = ref("all");

const typeChips = [
  { label: "全部", value: "all" },
  { label: "常规", value: "regular" },
  { label: "灵动", value: "dynamic" },
  { label: "生肖", value: "zodiac" },
  { label: "星座", value: "constellation" },
  { label: "限定", value: "limited" },
];

/** 分组标题 → 筛选类型（不佩戴/神兽无独立筛选位，仅「全部」下展示） */
const TYPE_BY_TITLE: Record<string, string> = {
  不佩戴: "none",
  常规: "regular",
  灵动: "dynamic",
  生肖: "zodiac",
  星座: "constellation",
  神兽: "beast",
  限定: "limited",
};

/** 按关键字 + 类型筛选后的分组（搜索时强制展开全部分组） */
const visibleGroups = computed<FrameGroup[]>(() => {
  const kw = keyword.value.trim().toLowerCase();
  return groups.value
    .filter((g) => {
      if (activeType.value === "all") return true;
      return TYPE_BY_TITLE[g.title] === activeType.value;
    })
    .map((g) => ({
      title: g.title,
      items: kw ? g.items.filter((f) => f.name.toLowerCase().includes(kw)) : g.items,
    }))
    .filter((g) => g.items.length);
});

const collapsedTitles = ref<Set<string>>(new Set());

function toggleGroup(title: string): void {
  const next = new Set(collapsedTitles.value);
  if (next.has(title)) next.delete(title);
  else next.add(title);
  collapsedTitles.value = next;
}

function isCollapsed(title: string): boolean {
  // 搜索时强制展开，避免「搜到了却折叠着看不见」
  if (keyword.value.trim()) return false;
  return collapsedTitles.value.has(title);
}

/** 限定帧的获取途径标注（佩戴前点卡片仍会自动解锁） */
function acquireLabel(frame: AvatarFrame): string {
  if (!isAvatarFrameLocked(frame)) return "";
  if (frame.acquire === "birthday") return "生日限定";
  return "限定获取";
}

/* ==================== poster 静帧 + hover 播放 ==================== */

const hoveredFrame = ref(0);
/** poster 404 的帧（旧生肖/常规素材无 poster），永久回退 APNG */
const posterBroken = ref<Set<number>>(new Set());

/** 卡片预览图地址：hover 取 APNG 动图，其余取 poster 静帧 */
function cardSrc(frame: AvatarFrame): string | undefined {
  if (!frame.image) return undefined;
  const poster = avatarFramePosterPath(frame.image);
  if (!poster || posterBroken.value.has(frame.id)) return resolveAvatarFrameUrl(frame.image);
  if (hoveredFrame.value === frame.id) return resolveAvatarFrameUrl(frame.image);
  return resolveAvatarFrameUrl(poster);
}

function onPosterError(frame: AvatarFrame): void {
  if (!frame.image || !avatarFramePosterPath(frame.image)) return;
  const next = new Set(posterBroken.value);
  next.add(frame.id);
  posterBroken.value = next;
}

/* ==================== 组合套装 + 生日彩蛋 ==================== */

const setsOpen = ref(true);
const applyingSet = ref("");

/** 套装封面：取套装头像框的 poster（无 poster 回退 APNG） */
function setPoster(set: AvatarSet): string | undefined {
  const frame = avatarFrameDict.value.find((f) => f.id === set.frameId);
  if (!frame?.image) return undefined;
  const poster = avatarFramePosterPath(frame.image);
  const usePoster = poster && !posterBroken.value.has(frame.id);
  return resolveAvatarFrameUrl(usePoster ? (poster as string) : frame.image);
}

/**
 * 一键佩戴套装：头像框走既有佩戴链路（含限定解锁），
 * 挂件/昵称牌逐件「未领取先领取 → 佩戴」；任何一件失败不影响其余。
 */
async function applySet(set: AvatarSet): Promise<void> {
  if (applyingSet.value) return;
  applyingSet.value = set.key;
  try {
    const frame = avatarFrameDict.value.find((f) => f.id === set.frameId);
    if (frame) await activateFrame(frame);
    if (isOrnamentEnabled()) {
      for (const code of set.ornamentCodes) {
        const item = ornamentCatalog.value.find((o) => o.code === code);
        if (!item || isOrnamentExpired(item)) continue;
        if (!isOrnamentOwned(item)) {
          const ok = await acquireOrnament(item);
          if (!ok) continue;
        }
        wearOrnament(item.slot, item);
      }
    }
    msgSuccess(`已换上「${set.name}」`);
    emit("updated");
  } finally {
    applyingSet.value = "";
  }
}

/** 生日彩蛋：按 sysUserBirthday 推荐生肖框 / 星座框 */
const birthdayPick = computed(() => recommendByBirthday(display.value.birthday || ""));

/** 推荐框卡片打 🎂 标 */
function isBirthdayPick(frame: AvatarFrame): boolean {
  const pick = birthdayPick.value;
  if (!pick) return false;
  return frame.id === pick.zodiacFrameId || frame.id === pick.constellationFrameId;
}

/** 一键试戴推荐星座框（星座框缺失时退生肖框） */
async function applyBirthdayPick(): Promise<void> {
  const pick = birthdayPick.value;
  if (!pick) return;
  const frame =
    avatarFrameDict.value.find((f) => f.id === pick.constellationFrameId) ??
    avatarFrameDict.value.find((f) => f.id === pick.zodiacFrameId);
  if (frame) await activateFrame(frame);
}

/** 未解锁的限定帧才展示锁标记 */
function isLocked(frame: AvatarFrame): boolean {
  return isAvatarFrameLocked(frame) && !ownedIds.value.has(frame.id);
}

/** 读取用户已获取的限定帧（过期记录视为未持有） */
async function loadOwned(): Promise<void> {
  try {
    const { getApiHttp } = await import("@repo/core");
    const res = await getApiHttp()
      .get("/v2/avatar-frame/user")
      .loading(false)
      .then<{ data?: Array<Record<string, unknown>> }>((r) => r.data);
    const rows = Array.isArray(res?.data) ? res.data : [];
    const now = Date.now();
    ownedIds.value = new Set(
      rows
        .filter((row) => {
          const expire = row.expireTime as string | undefined;
          return !expire || new Date(expire).getTime() > now;
        })
        .map((row) => row.sysAvatarFrameId as number),
    );
  } catch {
    // 解锁记录拉取失败时按未解锁展示，点击仍会尝试获取
  }
}

/** 佩戴限定帧前先解锁 */
async function acquireFrame(frameId: number): Promise<boolean> {
  try {
    const { getApiHttp } = await import("@repo/core");
    const res = await getApiHttp()
      .post(`/v2/avatar-frame/acquire?frameId=${frameId}`)
      .loading(false)
      .then<{ code?: string; msg?: string }>((r) => r.data);
    if (Http.isSuccessful(res)) {
      await loadOwned();
      return true;
    }
    msgError(res?.msg || "解锁失败");
    return false;
  } catch (e) {
    msgError("解锁失败：" + ((e as Error)?.message || "网络异常"));
    return false;
  }
}

/** 提交佩戴结果并刷新登录用户信息 */
async function persistWear(
  payload: Record<string, unknown>,
  rollbackTo: number,
): Promise<boolean> {
  try {
    const { getApiHttp } = await import("@repo/core");
    const res = await getApiHttp()
      .put("/v2/user/update")
      .loading(false)
      .data(payload as Record<string, unknown>)
      .then<{ code?: string; msg?: string }>((r) => r.data);
    if (Http.isSuccessful(res)) {
      await authStore.getLoginUserInfo(false);
      emit("updated");
      return true;
    }
    msgError(res?.msg || "佩戴失败");
    selectedFrame.value = rollbackTo;
    return false;
  } catch (e) {
    msgError("佩戴失败：" + ((e as Error)?.message || "网络异常"));
    selectedFrame.value = rollbackTo;
    return false;
  }
}

/** 大图试戴：弹出 120px「头像+框」组合预览，可在弹层内直接佩戴 */
const previewVisible = ref(false);
const previewFrame = ref<AvatarFrame | null>(null);

const previewHint = computed<string>(() => {
  const frame = previewFrame.value;
  if (!frame) return "";
  if (!hasFrameVisual(frame)) return "取下头像框后的效果（默认光环）";
  if (isLocked(frame)) return "限定头像框 · 点「佩戴该框」自动解锁";
  return "动态素材 · 佩戴后随头像等比缩放";
});

function openPreview(frame: AvatarFrame): void {
  previewFrame.value = frame;
  previewVisible.value = true;
}

async function wearPreview(): Promise<void> {
  const frame = previewFrame.value;
  if (!frame) return;
  previewVisible.value = false;
  await activateFrame(frame);
}

/** 点选头像框：限定帧先解锁，佩戴同时打开显示 */
async function activateFrame(frame: AvatarFrame): Promise<void> {
  if (selectedFrame.value === frame.id) return;
  const previous = selectedFrame.value;
  if (isLocked(frame) && !(await acquireFrame(frame.id))) return;
  const visible = hasFrameVisual(frame);
  selectedFrame.value = frame.id;
  const ok = await persistWear({ sysUserAvatarFrame: frame.id, sysUserAvatarFrameShow: visible ? 1 : 0 }, previous);
  if (ok) {
    frameShow.value = visible;
    msgSuccess(visible ? "已佩戴头像框" : "已取下头像框");
  }
}

/** 显隐开关：关闭后仍保留佩戴记录，只隐藏头像框 */
async function persistShow(value: boolean | string | number): Promise<void> {
  const next = value ? 1 : 0;
  const { getApiHttp } = await import("@repo/core");
  try {
    const res = await getApiHttp()
      .put("/v2/user/update")
      .loading(false)
      .data({ sysUserAvatarFrameShow: next } as Record<string, unknown>)
      .then<{ code?: string; msg?: string }>((r) => r.data);
    if (Http.isSuccessful(res)) {
      await authStore.getLoginUserInfo(false);
      emit("updated");
    } else {
      frameShow.value = next === 1;
      msgError(res?.msg || "设置失败");
    }
  } catch (e) {
    frameShow.value = next === 1;
    msgError("设置失败：" + ((e as Error)?.message || "网络异常"));
  }
}

/** 初始化：载入字典与解锁记录，并把选中态对齐当前用户 */
async function initFrames(): Promise<void> {
  if (!isAvatarFrameEnabled()) return;
  await loadAvatarFrames();
  await loadOwned();
  const worn = display.value.avatarFrame ?? 0;
  selectedFrame.value = avatarFrameDict.value.some((f) => f.id === worn) ? worn : 0;
  frameShow.value = Number(display.value.avatarFrameShow ?? 0) === 1;
}

onMounted(() => {
  void initFrames();
});
</script>

<style scoped lang="scss">
.avatar-frame-panel {
  padding: 0 16px;
}

.avatar-frame-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.avatar-frame-toolbar-label {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.avatar-frame-filters {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.avatar-frame-search {
  width: 100%;
}

.avatar-frame-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.avatar-frame-chip {
  padding: 2px 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 999px;
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 18px;
  cursor: pointer;
  transition: all 0.15s;
}

.avatar-frame-chip:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

.avatar-frame-chip.is-active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.avatar-frame-birthday {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px 10px;
  border: 1px solid var(--el-color-warning-light-5);
  border-radius: 8px;
  background: var(--el-color-warning-light-9);
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.avatar-frame-birthday-text {
  line-height: 18px;
}

.avatar-frame-bday {
  margin-left: 3px;
  font-size: 11px;
}

.avatar-frame-set-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.avatar-frame-set {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 10px;
  background: var(--el-fill-color-lighter);
}

.avatar-frame-set-img {
  width: 40px;
  height: 40px;
  object-fit: contain;
  flex: none;
}

.avatar-frame-set-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.avatar-frame-set-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.avatar-frame-set-desc {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.avatar-frame-group {
  margin-bottom: 18px;
}

.avatar-frame-group-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  user-select: none;
}

.avatar-frame-group-count {
  min-width: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  font-size: 11px;
  font-weight: 400;
  line-height: 16px;
  text-align: center;
}

.avatar-frame-chevron {
  margin-left: auto;
  color: var(--el-text-color-placeholder);
  transition: transform 0.2s;
}

.avatar-frame-chevron.is-collapsed {
  transform: rotate(-90deg);
}

.avatar-frame-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(116px, 1fr));
  gap: 14px;
}

.avatar-frame-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 8px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color);
  cursor: pointer;
  transition: all 0.2s;
}

.avatar-frame-item:hover {
  border-color: var(--el-color-primary);
  transform: translateY(-2px);
}

.avatar-frame-item.is-selected {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.avatar-frame-preview {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
}

.avatar-frame-img {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: center;
  pointer-events: none;
}

.avatar-frame-poster {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  width: 72px;
  height: 72px;
  object-fit: contain;
  pointer-events: none;
}

.avatar-frame-name {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.avatar-frame-acquire {
  margin-top: -4px;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
  font-size: 10px;
  line-height: 14px;
}

.avatar-frame-lock {
  position: absolute;
  right: 20px;
  bottom: 20px;
  z-index: 2;
  padding: 2px;
  border-radius: 50%;
  color: var(--el-color-warning);
  background: var(--el-bg-color);
}

.avatar-frame-check {
  position: absolute;
  top: 4px;
  right: 4px;
  color: var(--el-color-primary);
}

.avatar-frame-zoom {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 2;
  display: flex;
  padding: 3px;
  border-radius: 50%;
  color: var(--el-text-color-secondary);
  background: var(--el-bg-color);
  box-shadow: 0 1px 4px rgb(0 0 0 / 14%);
  transition: color 0.2s;
}

.avatar-frame-zoom:hover {
  color: var(--el-color-primary);
}

.avatar-frame-preview-title {
  font-size: 14px;
  font-weight: 500;
}

.avatar-frame-preview-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-frame-preview-box {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 168px;
  height: 168px;
}

.avatar-frame-preview-hint {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-align: center;
}
</style>
