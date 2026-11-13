<script setup lang="ts">
/**
 * 饰品面板（个人中心「饰品」页签）
 *
 * <p>结构是「当前佩戴预览 + 按槽位分组的选择网格」。点卡片即佩戴，点已佩戴的卡片取下；
 * 每个槽位最多一件，与后端 {@code sys_user_ornament} 的唯一键一致。</p>
 *
 * <p>限定款（{@code acquire=limited}）先领取再佩戴；目录或领取记录过期后置灰不可点。
 * 目录与佩戴关系都来自服务端，失败时用内置兜底目录与本地快照。</p>
 */
import { computed, onMounted } from "vue";
import { Check } from "@element-plus/icons-vue";
import { defaultAvatarUrl } from "@repo/assets";
import { msgError, msgSuccess } from "@repo/core";
import { resolveUserDisplayInfo } from "@repo/utils";
import useAuthStore from "@repo/pinia/modules/auth";
import useUserStore from "@repo/pinia/modules/user";
import OrnamentBadge from "./OrnamentBadge.vue";
import {
  acquireOrnament,
  isOrnamentExpired,
  isOrnamentOwned,
  isOrnamentWorn,
  nameplateStyle,
  ornamentCatalog,
  ornamentLoading,
  ornamentWear,
  ornamentsForSlot,
  syncOrnaments,
  wearOrnament,
} from "./store";
import {
  ORNAMENT_SLOTS,
  ORNAMENT_SLOT_HINTS,
  ORNAMENT_SLOT_LABELS,
  type Ornament,
} from "./types";

const authStore = useAuthStore();
const userStore = useUserStore();

const display = computed(() =>
  resolveUserDisplayInfo({
    authLoginUser: authStore.loginUser as Record<string, unknown>,
    userStoreInfo: userStore.userInfo as Record<string, unknown>,
  }),
);

const userName = computed(
  () => display.value.username || userStore.nickname || userStore.username || "我",
);

const avatarUrl = computed(
  () => authStore.loginUser?.avatar || display.value.avatar || defaultAvatarUrl,
);

/** 目录只有负数 ID：说明服务端目录没拉到，正在用内置兜底 */
const fallbackOnly = computed(
  () => ornamentCatalog.value.length > 0 && ornamentCatalog.value.every((item) => item.id < 0),
);

/** 当前真正生效的佩戴（过期 / 未拥有的不算） */
const activeWorn = computed(() =>
  ORNAMENT_SLOTS.map((slot) => ornamentWear[slot]).filter(
    (item): item is Ornament =>
      Boolean(item && isOrnamentOwned(item) && !isOrnamentExpired(item)),
  ),
);

const summary = computed(() => {
  if (!activeWorn.value.length) return "还没有佩戴饰品";
  return activeWorn.value
    .map((item) => `${ORNAMENT_SLOT_LABELS[item.slot]}：${item.name}`)
    .join(" · ");
});

/** 动效类名（与 OrnamentBadge 同一套 keyframes） */
function effectClass(item: Ornament): string {
  return item.effect && item.effect !== "none" ? `is-${item.effect}` : "";
}

function toggle(item: Ornament): void {
  wearOrnament(item.slot, isOrnamentWorn(item) ? null : item);
}

/** 卡片点击：过期不动，未拥有先领取，已拥有就戴/取 */
async function onCard(item: Ornament): Promise<void> {
  if (isOrnamentExpired(item)) return;
  if (!isOrnamentOwned(item)) {
    const ok = await acquireOrnament(item);
    if (ok) {
      msgSuccess(`已领取「${item.name}」`);
    } else {
      msgError("领取失败，请稍后再试");
    }
    return;
  }
  toggle(item);
}

onMounted(() => {
  void syncOrnaments(true);
});
</script>

<template>
  <div class="op" v-loading="ornamentLoading">
    <!-- 当前佩戴：真实头像 + 真实昵称，所见即所得 -->
    <section class="op-hero">
      <div class="op-preview">
        <div class="op-avatar">
          <el-avatar :size="56" :src="avatarUrl">{{ userName.slice(0, 1) }}</el-avatar>
          <OrnamentBadge :size="16" :offset="0" />
        </div>
        <div class="op-identity">
          <div class="op-eyebrow">当前佩戴</div>
          <div class="op-name-line">
            <span class="op-name" :style="nameplateStyle()">{{ userName }}</span>
          </div>
          <p class="op-summary">{{ summary }}</p>
        </div>
      </div>
      <p class="op-tip">
        饰品是账号级设置，换设备登录同样生效；每个槽位最多一件，限定款需先领取。
      </p>
    </section>

    <section v-for="slot in ORNAMENT_SLOTS" :key="slot" class="op-section">
      <header class="op-section__head">
        <h4 class="op-section__title">{{ ORNAMENT_SLOT_LABELS[slot] }}</h4>
        <span class="op-section__hint">{{ ORNAMENT_SLOT_HINTS[slot] }}</span>
        <el-button
          v-if="ornamentWear[slot]"
          text
          size="small"
          class="op-section__clear"
          @click="wearOrnament(slot, null)"
        >
          取下
        </el-button>
      </header>

      <div class="op-grid">
        <button
          type="button"
          class="op-card"
          :class="{ 'is-selected': !ornamentWear[slot] }"
          @click="wearOrnament(slot, null)"
        >
          <span class="op-swatch op-swatch--none">—</span>
          <span class="op-card__name">不佩戴</span>
          <el-icon v-if="!ornamentWear[slot]" class="op-card__check"><Check /></el-icon>
        </button>

        <button
          v-for="item in ornamentsForSlot(slot)"
          :key="item.id"
          type="button"
          class="op-card"
          :class="{
            'is-selected': isOrnamentWorn(item) && isOrnamentOwned(item) && !isOrnamentExpired(item),
            'is-locked': !isOrnamentOwned(item) && !isOrnamentExpired(item),
            'is-expired': isOrnamentExpired(item),
          }"
          :disabled="isOrnamentExpired(item)"
          @click="onCard(item)"
        >
          <span class="op-swatch" :class="effectClass(item)">
            <img v-if="item.image" :src="item.image" :alt="item.name" />
            <span
              v-else-if="slot === 'avatar'"
              class="op-glyph"
              :style="{ color: item.color || 'var(--el-text-color-primary)' }"
            >
              {{ item.glyph || "★" }}
            </span>
            <span
              v-else
              class="op-plate"
              :style="{ background: item.css, color: item.color || 'var(--el-text-color-primary)' }"
            >
              {{ item.name }}
            </span>
          </span>
          <span class="op-card__name">{{ item.name }}</span>

          <span v-if="isOrnamentExpired(item)" class="op-card__badge op-card__badge--expired">
            已过期
          </span>
          <span v-else-if="!isOrnamentOwned(item)" class="op-card__badge">领取</span>
          <el-icon
            v-else-if="isOrnamentWorn(item)"
            class="op-card__check"
          >
            <Check />
          </el-icon>
        </button>
      </div>

      <el-empty
        v-if="!ornamentsForSlot(slot).length"
        description="暂无可用饰品"
        :image-size="56"
      />
    </section>

    <p v-if="fallbackOnly" class="op-note">
      服务端饰品目录不可用，当前展示的是内置兜底清单；佩戴与领取会先记在本机，接口恢复后自动同步。
    </p>
  </div>
</template>

<style lang="scss" scoped>
.op {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* ==================== 当前佩戴 ==================== */

.op-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-fill-color-lighter);
  flex-wrap: wrap;
}

.op-preview {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.op-avatar {
  position: relative;
  flex: none;
  line-height: 0;
}

.op-identity {
  min-width: 0;
}

.op-eyebrow {
  font-size: 11px;
  letter-spacing: 0.16em;
  color: var(--el-text-color-placeholder);
}

.op-name-line {
  margin-top: 4px;
}

.op-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}

.op-summary {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 18px;
  color: var(--el-text-color-secondary);
}

.op-tip {
  margin: 0;
  max-width: 280px;
  font-size: 12px;
  line-height: 18px;
  color: var(--el-text-color-placeholder);
}

/* ==================== 槽位分组 ==================== */

.op-section + .op-section {
  margin-top: 2px;
}

.op-section__head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.op-section__title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.op-section__hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.op-section__clear {
  margin-left: auto;
  padding: 0;
  height: 20px;
  font-size: 12px;
}

.op-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.op-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 6px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-fill-color-lighter);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: 1px;
  }

  &.is-selected {
    border-color: var(--el-color-primary);
    box-shadow: inset 0 0 0 1px var(--el-color-primary);
  }

  &.is-locked {
    border-style: dashed;
  }

  &.is-expired {
    cursor: not-allowed;
    filter: grayscale(0.85);
    opacity: 0.62;

    &:hover {
      border-color: var(--el-border-color-lighter);
      transform: none;
    }
  }
}

.op-swatch {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 16 / 10;
  border-radius: 6px;
  background-color: var(--el-fill-color);
  background-image: linear-gradient(
    135deg,
    var(--el-fill-color-light) 25%,
    var(--el-fill-color) 25% 50%,
    var(--el-fill-color-light) 50% 75%,
    var(--el-fill-color) 75%
  );
  background-size: 14px 14px;
  overflow: hidden;

  img {
    display: block;
    max-width: 56%;
    max-height: 56%;
    object-fit: contain;
  }
}

.op-swatch--none {
  color: var(--el-text-color-placeholder);
  font-size: 18px;
}

.op-glyph {
  display: inline-block;
  font-size: 26px;
  line-height: 1;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

.op-plate {
  display: inline-block;
  max-width: 88%;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 动效预览：与 OrnamentBadge 同一套节奏 */
.op-swatch.is-pulse .op-glyph,
.op-swatch.is-pulse .op-plate {
  animation: op-pulse 2.4s ease-in-out infinite;
}

.op-swatch.is-spin .op-glyph {
  animation: op-spin 3.6s linear infinite;
}

.op-swatch.is-glow .op-glyph {
  animation: op-glow 2.8s ease-in-out infinite;
}

@keyframes op-pulse {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.14);
  }
}

@keyframes op-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes op-glow {
  0%,
  100% {
    filter: drop-shadow(0 0 2px currentColor);
  }

  50% {
    filter: drop-shadow(0 0 7px currentColor);
  }
}

.op-card__name {
  padding: 0 2px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.op-card__check {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 2px;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: #fff;
  font-size: 12px;
}

.op-card__badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--el-color-primary);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.op-card__badge--expired {
  background: var(--el-text-color-placeholder);
}

.op-note {
  margin: 0;
  font-size: 12px;
  line-height: 18px;
  color: var(--el-text-color-secondary);
}

@media (max-width: 640px) {
  .op-tip {
    max-width: none;
  }
}

/* 减少动态：预览也静止 */
@media (prefers-reduced-motion: reduce) {
  .op-swatch.is-pulse .op-glyph,
  .op-swatch.is-pulse .op-plate,
  .op-swatch.is-spin .op-glyph,
  .op-swatch.is-glow .op-glyph {
    animation: none;
  }
}
</style>
