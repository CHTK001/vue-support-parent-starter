<template>
  <div class="avatar-frame-panel">
    <div class="avatar-frame-toolbar">
      <span class="avatar-frame-toolbar-label">显示头像框</span>
      <div class="avatar-frame-toolbar-actions">
        <span class="avatar-frame-collect" title="头像框与饰品的收集进度">
          收集
          <span class="avatar-frame-collect-bar">
            <span class="avatar-frame-collect-fill" :style="{ width: collectPercent + '%' }"></span>
          </span>
          {{ collectedCount }}/{{ collectTotal }}
        </span>
        <el-button
          size="small"
          text
          type="primary"
          :icon="Refresh"
          :loading="randomDressing"
          @click="randomDress"
        >
          随机换装
        </el-button>
        <el-switch v-model="frameShow" @change="persistShow" />
      </div>
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
        <h4
          class="avatar-frame-group-title"
          role="button"
          tabindex="0"
          :aria-expanded="setsOpen"
          @click="setsOpen = !setsOpen"
          @keydown.enter.prevent="setsOpen = !setsOpen"
          @keydown.space.prevent="setsOpen = !setsOpen"
        >
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

      <!-- 我的搭配：本机保存的「框 + 挂件 + 昵称牌」组合，一键应用 -->
      <section class="avatar-frame-group">
        <h4
          class="avatar-frame-group-title"
          role="button"
          tabindex="0"
          :aria-expanded="outfitsOpen"
          @click="outfitsOpen = !outfitsOpen"
          @keydown.enter.prevent="outfitsOpen = !outfitsOpen"
          @keydown.space.prevent="outfitsOpen = !outfitsOpen"
        >
          <span>我的搭配</span>
          <span class="avatar-frame-group-count">{{ outfits.length }}</span>
          <el-button
            size="small"
            text
            type="primary"
            class="avatar-frame-outfit-save"
            @click.stop="openSaveOutfit"
          >
            存当前搭配
          </el-button>
          <el-icon class="avatar-frame-chevron" :class="{ 'is-collapsed': !outfitsOpen }" :size="12">
            <ArrowDown />
          </el-icon>
        </h4>
        <div v-show="outfitsOpen" class="avatar-frame-set-list">
          <div v-for="outfit in outfits" :key="outfit.id" class="avatar-frame-set">
            <img
              v-if="outfitPoster(outfit)"
              class="avatar-frame-set-img"
              :src="outfitPoster(outfit)"
              :alt="outfit.name"
              loading="lazy"
            />
            <span v-else class="avatar-frame-set-img avatar-frame-set-img--none">—</span>
            <div class="avatar-frame-set-info">
              <span class="avatar-frame-set-name">{{ outfit.name }}</span>
              <span class="avatar-frame-set-desc">{{ outfitDesc(outfit) }}</span>
            </div>
            <el-button
              size="small"
              type="primary"
              plain
              :loading="applyingOutfit === outfit.id"
              @click="applyOutfit(outfit)"
            >
              应用
            </el-button>
            <el-popconfirm title="删除这套搭配？" width="150" @confirm="removeOutfit(outfit.id)">
              <template #reference>
                <el-button size="small" text type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </div>
          <p v-if="!outfits.length" class="avatar-frame-outfit-empty">
            还没有保存的搭配；戴好头像框和饰品后点「存当前搭配」。
          </p>
        </div>
      </section>

      <template v-if="visibleGroups.length">
        <section v-for="group in visibleGroups" :key="group.title" class="avatar-frame-group">
          <h4
            class="avatar-frame-group-title"
            role="button"
            tabindex="0"
            :aria-expanded="!isCollapsed(group.title)"
            @click="toggleGroup(group.title)"
            @keydown.enter.prevent="toggleGroup(group.title)"
            @keydown.space.prevent="toggleGroup(group.title)"
          >
            <span>{{ group.title }}</span>
            <span class="avatar-frame-group-count">{{ group.items.length }}</span>
            <el-icon class="avatar-frame-chevron" :class="{ 'is-collapsed': isCollapsed(group.title) }" :size="12">
              <ArrowDown />
            </el-icon>
          </h4>
          <div v-show="!isCollapsed(group.title)" class="avatar-frame-grid">
            <button
              v-for="frame in group.items"
              :key="frame.id"
              type="button"
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
            </button>
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
            :style="previewLayerStyle"
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

    <!-- 保存当前搭配：起个名字存到本机 -->
    <el-dialog v-model="outfitSaveVisible" width="320px" append-to-body destroy-on-close title="保存当前搭配">
      <el-input
        v-model="outfitSaveName"
        maxlength="20"
        show-word-limit
        placeholder="搭配名称，如：日常 / 开会"
        @keyup.enter="saveCurrentOutfit"
      />
      <p class="avatar-frame-outfit-hint">保存当前头像框与挂件/昵称牌组合，仅存本机。</p>
      <template #footer>
        <el-button size="small" @click="outfitSaveVisible = false">取消</el-button>
        <el-button size="small" type="primary" @click="saveCurrentOutfit">保存</el-button>
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
import { ArrowDown, CircleCheckFilled, Lock, Refresh, Search, ZoomIn } from "@element-plus/icons-vue";
import { msgError, msgSuccess, msgWarning } from "@repo/core";
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
  ornamentWear,
  ornamentsForSlot,
  wearOrnament,
} from "./ornaments/store";
import { ORNAMENT_SLOTS } from "./ornaments/types";
import { loadOutfits, newOutfitId, persistOutfits, type AvatarOutfit } from "./avatarOutfits";

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

/** 减少动态偏好：与 OrnamentBadge 的 CSS 口径一致，hover 不再切 APNG 动图 */
const reducedMotion =
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

/** 卡片预览图地址：hover 取 APNG 动图，其余取 poster 静帧；减少动态时保持静帧 */
function cardSrc(frame: AvatarFrame): string | undefined {
  if (!frame.image) return undefined;
  const poster = avatarFramePosterPath(frame.image);
  if (!poster || posterBroken.value.has(frame.id)) return resolveAvatarFrameUrl(frame.image);
  if (hoveredFrame.value === frame.id && !reducedMotion?.matches) return resolveAvatarFrameUrl(frame.image);
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

/** 头像框封面：优先 poster 静帧（无 poster 回退 APNG） */
function framePosterById(frameId: number): string | undefined {
  const frame = avatarFrameDict.value.find((f) => f.id === frameId);
  if (!frame?.image) return undefined;
  const poster = avatarFramePosterPath(frame.image);
  const usePoster = poster && !posterBroken.value.has(frame.id);
  return resolveAvatarFrameUrl(usePoster ? (poster as string) : frame.image);
}

/** 套装封面 */
function setPoster(set: AvatarSet): string | undefined {
  return framePosterById(set.frameId);
}

/** 搭配方案封面 */
function outfitPoster(outfit: AvatarOutfit): string | undefined {
  return framePosterById(outfit.frameId);
}

/**
 * 按编码逐件「未领取先领取 → 佩戴」；任何一件失败不影响其余。
 *
 * @returns 未换上的饰品名单（用于套装 / 搭配的半失败提示）
 */
async function wearOrnamentsByCodes(codes: string[]): Promise<string[]> {
  if (!isOrnamentEnabled()) return [];
  const failed: string[] = [];
  for (const code of codes) {
    const item = ornamentCatalog.value.find((o) => o.code === code);
    if (!item || isOrnamentExpired(item)) {
      failed.push(item?.name ?? code);
      continue;
    }
    if (!isOrnamentOwned(item)) {
      const ok = await acquireOrnament(item);
      if (!ok) {
        failed.push(item.name);
        continue;
      }
    }
    if (!wearOrnament(item.slot, item)) failed.push(item.name);
  }
  return failed;
}

/** 组合穿戴的结果提示：全成 → 成功；半失败 → 警告并列出未换上的件 */
function notifyDressResult(name: string, frameOk: boolean, failed: string[]): void {
  if (!frameOk) {
    // 头像框失败已由佩戴链路 toast，这里只补饰品侧的半失败
    if (failed.length) msgWarning(`饰品未换上：${failed.join("、")}`);
    return;
  }
  if (failed.length) msgWarning(`已换上「${name}」，部分饰品未穿戴：${failed.join("、")}`);
  else msgSuccess(`已换上「${name}」`);
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
    const frameOk = frame ? await activateFrame(frame) : true;
    const failed = await wearOrnamentsByCodes(set.ornamentCodes);
    notifyDressResult(set.name, frameOk, failed);
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

/* ==================== 我的搭配（localStorage） ==================== */

const outfitsOpen = ref(true);
const outfits = ref<AvatarOutfit[]>(loadOutfits());
const applyingOutfit = ref("");
const outfitSaveVisible = ref(false);
const outfitSaveName = ref("");

/** 搭配描述：框名 + 饰品名（编码可能已下架，查不到就显示编码） */
function outfitDesc(outfit: AvatarOutfit): string {
  const frame = avatarFrameDict.value.find((f) => f.id === outfit.frameId);
  const parts = [frame?.name ?? "不佩戴"];
  for (const code of outfit.ornamentCodes) {
    parts.push(ornamentCatalog.value.find((o) => o.code === code)?.name ?? code);
  }
  return parts.join(" · ");
}

function openSaveOutfit(): void {
  outfitSaveName.value = "";
  outfitSaveVisible.value = true;
}

/** 当前佩戴（框 + 挂件/昵称牌）存成一套方案 */
function saveCurrentOutfit(): void {
  const name = outfitSaveName.value.trim() || `搭配 ${outfits.value.length + 1}`;
  const codes = ORNAMENT_SLOTS.map((slot) => ornamentWear[slot]?.code).filter(
    (c): c is string => Boolean(c),
  );
  outfits.value = [
    {
      id: newOutfitId(),
      name,
      frameId: selectedFrame.value || 0,
      ornamentCodes: codes,
      createdAt: Date.now(),
    },
    ...outfits.value,
  ].slice(0, 20);
  persistOutfits(outfits.value);
  outfitSaveVisible.value = false;
  msgSuccess(`已保存「${name}」`);
}

/** 一键应用方案：与套装同一链路（框 → /v2/user/update，饰品 → wearOrnament） */
async function applyOutfit(outfit: AvatarOutfit): Promise<void> {
  if (applyingOutfit.value) return;
  applyingOutfit.value = outfit.id;
  try {
    let frameOk = true;
    if (outfit.frameId) {
      const frame = avatarFrameDict.value.find((f) => f.id === outfit.frameId);
      frameOk = frame ? await activateFrame(frame) : false;
    } else {
      frameOk = await activateFrame(DEFAULT_FRAME_OPTION);
    }
    const failed = await wearOrnamentsByCodes(outfit.ornamentCodes);
    notifyDressResult(outfit.name, frameOk, failed);
    emit("updated");
  } finally {
    applyingOutfit.value = "";
  }
}

function removeOutfit(id: string): void {
  outfits.value = outfits.value.filter((o) => o.id !== id);
  persistOutfits(outfits.value);
}

/* ==================== 随机换装 ==================== */

const randomDressing = ref(false);

function pickRandom<T>(list: T[]): T | undefined {
  return list.length ? list[Math.floor(Math.random() * list.length)] : undefined;
}

/** 从可戴项里随机搭一套：头像框 + 每个饰品槽位各一件 */
async function randomDress(): Promise<void> {
  if (randomDressing.value) return;
  randomDressing.value = true;
  try {
    const frame = pickRandom(avatarFrameDict.value.filter((f) => hasFrameVisual(f) && !isLocked(f)));
    const frameOk = frame ? await activateFrame(frame) : true;
    const codes: string[] = [];
    for (const slot of ORNAMENT_SLOTS) {
      const item = pickRandom(
        ornamentsForSlot(slot).filter((o) => isOrnamentOwned(o) && !isOrnamentExpired(o)),
      );
      if (item) codes.push(item.code);
    }
    const failed = await wearOrnamentsByCodes(codes);
    notifyDressResult("随机搭配", frameOk, failed);
    emit("updated");
  } finally {
    randomDressing.value = false;
  }
}

/* ==================== 收集进度 ==================== */

const collectTotal = computed(() => {
  const frames = avatarFrameDict.value.filter(hasFrameVisual).length;
  if (!isOrnamentEnabled()) return frames;
  return frames + ornamentCatalog.value.length;
});

const collectedCount = computed(() => {
  const frames = avatarFrameDict.value.filter((f) => hasFrameVisual(f) && !isLocked(f)).length;
  if (!isOrnamentEnabled()) return frames;
  const ornaments = ornamentCatalog.value.filter(
    (o) => isOrnamentOwned(o) && !isOrnamentExpired(o),
  ).length;
  return frames + ornaments;
});

const collectPercent = computed(() =>
  collectTotal.value ? Math.round((collectedCount.value / collectTotal.value) * 100) : 0,
);

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

/** 试戴弹层的框层样式；减少动态时换 poster 静帧，不播 APNG */
const previewLayerStyle = computed<Record<string, string>>(() => {
  const frame = previewFrame.value;
  if (!frame || !hasFrameVisual(frame)) return {};
  if (reducedMotion?.matches) {
    const poster = avatarFramePosterPath(frame.image ?? "");
    if (poster) return frameLayerStyle({ ...frame, image: poster }, 120);
  }
  return frameLayerStyle(frame, 120);
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

/**
 * 点选头像框：限定帧先解锁，佩戴同时打开显示。
 *
 * @returns 佩戴是否成功（未变化视为成功，便于套装 / 搭配的整体结果提示）
 */
async function activateFrame(frame: AvatarFrame): Promise<boolean> {
  if (selectedFrame.value === frame.id) return true;
  const previous = selectedFrame.value;
  if (isLocked(frame) && !(await acquireFrame(frame.id))) return false;
  const visible = hasFrameVisual(frame);
  selectedFrame.value = frame.id;
  const ok = await persistWear({ sysUserAvatarFrame: frame.id, sysUserAvatarFrameShow: visible ? 1 : 0 }, previous);
  if (ok) {
    frameShow.value = visible;
    msgSuccess(visible ? "已佩戴头像框" : "已取下头像框");
  }
  return ok;
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
  background: transparent;
  font: inherit;
  color: inherit;
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

/* ==================== 工具栏扩展：收集进度 / 随机换装 ==================== */

.avatar-frame-toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar-frame-collect {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.avatar-frame-collect-bar {
  width: 56px;
  height: 4px;
  border-radius: 999px;
  background: var(--el-fill-color);
  overflow: hidden;
}

.avatar-frame-collect-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--el-color-primary);
  transition: width 0.3s;
}

/* ==================== 我的搭配 ==================== */

.avatar-frame-outfit-save {
  height: 20px;
  margin-left: 2px;
  font-size: 11px;
}

.avatar-frame-outfit-empty {
  margin: 0;
  font-size: 12px;
  line-height: 18px;
  color: var(--el-text-color-placeholder);
}

.avatar-frame-set-img--none {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--el-fill-color);
  color: var(--el-text-color-placeholder);
}

.avatar-frame-outfit-hint {
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 18px;
  color: var(--el-text-color-secondary);
}

/* 键盘可达：卡片与折叠标题的焦点环 */
.avatar-frame-item:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 1px;
}

.avatar-frame-group-title:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
  border-radius: 4px;
}

/* 减少动态：hover 位移与折叠箭头一并静止 */
@media (prefers-reduced-motion: reduce) {
  .avatar-frame-item:hover {
    transform: none;
  }

  .avatar-frame-chevron {
    transition: none;
  }
}
</style>
