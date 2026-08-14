<template>
  <div class="avatar-frame-panel">
    <p class="avatar-frame-panel__desc">点击头像框即可佩戴</p>
    <div v-if="avatarFrames.length" class="avatar-frame-grid">
      <div
        v-for="frame in avatarFrames"
        :key="frame.id"
        class="avatar-frame-item"
        :class="{ 'is-selected': selectedFrame === frame.id }"
        @click="activateFrame(frame.id)"
      >
        <div class="avatar-frame-preview">
          <div
            v-if="frame.image"
            class="avatar-frame-img"
            :style="{ backgroundImage: `url(${frame.image})` }"
          ></div>
          <el-avatar :size="52" :src="avatar" />
        </div>
        <span class="avatar-frame-name">{{ frame.name }}</span>
        <el-icon v-if="selectedFrame === frame.id" class="avatar-frame-check"><CircleCheckFilled /></el-icon>
      </div>
    </div>
    <el-empty v-else description="暂无可用头像框" :image-size="80" />
  </div>
</template>

<script setup lang="ts">
/**
 * 头像框设置面板（组件化）
 *
 * 提供头像框选择宫格，供个人中心等页面复用；点选即佩戴并自动开启显示。
 * 头像框来源：服务端 /v2/avatar-frame/list 动态返回（生日框为数据库真实记录，
 * 仅生日窗口内在列表中出现，前端不再做生日框追加），失败时回退本地默认图片帧。
 * 佩戴持久化：PUT /v2/user/update，成功后刷新登录用户信息并 emit updated。
 */
import { computed, onMounted, ref } from "vue";
import { CircleCheckFilled } from "@element-plus/icons-vue";
import { msgError, msgSuccess } from "@repo/core";
import { resolveUserDisplayInfo } from "@repo/utils";
import { getConfig } from "@repo/config";
import useAuthStore from "@repo/pinia/modules/auth";
import useUserStore from "@repo/pinia/modules/user";

const props = defineProps<{ avatar?: string }>();
const emit = defineEmits<{ (e: "updated"): void }>();

const authStore = useAuthStore();
const userStore = useUserStore();

/** 头像框开关：由 app.yaml 的 other.avatarFrame.enable 控制（默认关闭） */
const frameEnabled = computed(() => getConfig()?.other?.avatarFrame?.enable ?? false);

interface FrameItem {
  id: number;
  name: string;
  image?: string;
}

/** 本地默认图片帧（与后端 sys_avatar_frame 种子 23-27 保持一致） */
const baseFrames: FrameItem[] = [
  { id: 23, name: "鎏金", image: "/assets/avatar-frames/frame-gold.png" },
  { id: 24, name: "皇室蓝", image: "/assets/avatar-frames/frame-royal.png" },
  { id: 25, name: "玫瑰金", image: "/assets/avatar-frames/frame-rose.png" },
  { id: 26, name: "焰光", image: "/assets/avatar-frames/frame-flame.apng" },
  { id: 27, name: "晶蓝", image: "/assets/avatar-frames/frame-azure.apng" },
];

const avatarFrames = ref<FrameItem[]>([]);
const selectedFrame = ref(1);

/** 统一用户信息（authStore > storage > userStore） */
const display = computed(() =>
  resolveUserDisplayInfo({
    authLoginUser: authStore.loginUser as Record<string, unknown>,
    userStoreInfo: userStore.userInfo as Record<string, unknown>,
  }),
);

/**
 * 初始化头像框列表
 * <p>优先服务端 /v2/avatar-frame/list（后端已按生日窗口过滤生日框），
 * 服务端失败时回退本地默认图片帧（23-27）</p>
 */
async function initFrames(): Promise<void> {
  if (!frameEnabled.value) return;
  let frames: FrameItem[] = [...baseFrames];
  try {
    const { getApiHttp } = await import("@repo/core");
    const res = await getApiHttp()
      .get("/v2/avatar-frame/list")
      .then<{ code?: number; msg?: string; data?: Array<Record<string, unknown>> }>((r) => r.data);
    const list = res?.data;
    if (Array.isArray(list) && list.length) {
      frames = list
        .filter((f) => f.sysAvatarFrameStatus === 1)
        .map((f) => ({
          id: f.sysAvatarFrameId as number,
          name: f.sysAvatarFrameName as string,
          image: f.sysAvatarFrameImage as string | undefined,
        }));
    }
  } catch {
    // 服务端不可用时使用本地默认列表
  }
  avatarFrames.value = frames;
  selectedFrame.value = avatarFrames.value.some((f) => f.id === display.value.avatarFrame)
    ? (display.value.avatarFrame ?? 1)
    : 1;
}

/** 佩戴头像框：PUT /v2/user/update 持久化后刷新登录用户信息 */
async function activateFrame(id: number): Promise<void> {
  if (selectedFrame.value === id) return;
  selectedFrame.value = id;
  try {
    const { getApiHttp } = await import("@repo/core");
    const res = await getApiHttp()
      .put("/v2/user/update")
      .data({ sysUserAvatarFrame: id, sysUserAvatarFrameShow: 1 } as Record<string, unknown>)
      .then<{ code?: number; msg?: string }>((r) => r.data);
    if (res?.code === 200 || res?.code === 0 || res?.msg === "操作成功" || res?.msg == null) {
      msgSuccess("已佩戴头像框");
      await authStore.getLoginUserInfo();
      emit("updated");
    } else {
      msgError(res?.msg || "佩戴失败");
      selectedFrame.value = display.value.avatarFrame ?? 1;
    }
  } catch (e) {
    msgError("佩戴失败：" + ((e as Error)?.message || "网络异常"));
    selectedFrame.value = display.value.avatarFrame ?? 1;
  }
}

onMounted(() => {
  void initFrames();
});
</script>

<style scoped lang="scss">
.avatar-frame-panel {
  max-width: 640px;
  margin: 0 auto;
}

.avatar-frame-panel__desc {
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.avatar-frame-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
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
  width: 52px;
  height: 52px;
}

.avatar-frame-img {
  position: absolute;
  inset: 0;
  z-index: 1;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  pointer-events: none;
}

.avatar-frame-name {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.avatar-frame-check {
  position: absolute;
  top: 4px;
  right: 4px;
  color: var(--el-color-primary);
}
</style>
