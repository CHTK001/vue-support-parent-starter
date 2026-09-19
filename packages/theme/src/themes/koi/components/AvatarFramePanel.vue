<template>
  <div class="avatar-frame-panel">
    <div class="avatar-frame-toolbar">
      <span class="avatar-frame-toolbar-label">显示头像框</span>
      <el-switch v-model="frameShow" size="small" @change="persistShow" />
    </div>

    <template v-if="frameShow">
      <template v-if="groups.length">
        <section v-for="group in groups" :key="group.title" class="avatar-frame-group">
          <h4 class="avatar-frame-group-title">{{ group.title }}</h4>
          <div class="avatar-frame-grid">
            <div
              v-for="frame in group.items"
              :key="frame.id"
              class="avatar-frame-item"
              :class="{ 'is-selected': selectedFrame === frame.id }"
              @click="activateFrame(frame)"
            >
              <div class="avatar-frame-preview">
                <div
                  v-if="hasFrameVisual(frame)"
                  class="avatar-frame-img"
                  :style="frameLayerStyle(frame, 52)"
                ></div>
                <el-avatar :size="52" :src="avatar" />
                <el-icon v-if="isLocked(frame)" class="avatar-frame-lock" :size="14"><Lock /></el-icon>
              </div>
              <span class="avatar-frame-name">{{ frame.name }}</span>
              <el-icon v-if="selectedFrame === frame.id" class="avatar-frame-check"><CircleCheckFilled /></el-icon>
            </div>
          </div>
        </section>
      </template>
      <el-empty v-else description="暂无可用头像框" :image-size="80" />
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * 头像框设置面板（组件化）
 *
 * 供个人中心等页面复用：分组展示「不佩戴 / 生肖 / 神兽 / 限定」头像框，点选即佩戴。
 * 字典来源：GET /v2/avatar-frame/list（服务端已按生日窗口过滤生日框）；
 * 限定帧（acquire 非 default）需先 POST /v2/avatar-frame/acquire 解锁，解锁记录取
 * GET /v2/avatar-frame/user。佩戴与显隐持久化：PUT /v2/user/update，
 * 成功后刷新登录用户信息并 emit updated。
 */
import { computed, onMounted, ref } from "vue";
import { CircleCheckFilled, Lock } from "@element-plus/icons-vue";
import { msgError, msgSuccess } from "@repo/core";
import { resolveUserDisplayInfo, Http } from "@repo/utils";
import useAuthStore from "@repo/pinia/modules/auth";
import useUserStore from "@repo/pinia/modules/user";
import {
  avatarFrameDict,
  frameLayerStyle,
  hasFrameVisual,
  isAvatarFrameEnabled,
  isAvatarFrameLocked,
  loadAvatarFrames,
  type AvatarFrame,
} from "./avatarFrames";

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

/** 面板分组：不佩戴 → 常规 → 生肖 → 神兽 → 限定（生日等） */
const groups = computed<FrameGroup[]>(() => {
  if (!isAvatarFrameEnabled()) return [];
  const frames = avatarFrameDict.value.filter(hasFrameVisual);
  const byType = (type: string) => frames.filter((f) => f.type === type);
  const listed = new Set(["regular", "zodiac", "beast"]);
  const limited = frames.filter((f) => !listed.has(f.type ?? ""));
  return [
    { title: "不佩戴", items: avatarFrameDict.value.filter((f) => !hasFrameVisual(f)) },
    { title: "常规", items: byType("regular") },
    { title: "生肖", items: byType("zodiac") },
    { title: "神兽", items: byType("beast") },
    { title: "限定", items: limited },
  ].filter((g) => g.items.length);
});

const selectedFrame = ref<number>(0);
const frameShow = ref(false);
/** 已解锁的限定帧 ID（含未过期判断） */
const ownedIds = ref<Set<number>>(new Set());

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

.avatar-frame-group {
  margin-bottom: 18px;
}

.avatar-frame-group-title {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
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

.avatar-frame-name {
  font-size: 12px;
  color: var(--el-text-color-regular);
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
</style>
