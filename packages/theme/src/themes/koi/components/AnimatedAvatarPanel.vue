<template>
  <div class="animated-avatar-panel">
    <section class="animated-avatar-group">
      <h4 class="animated-avatar-group-title">不佩戴</h4>
      <div class="animated-avatar-grid">
        <div
          class="animated-avatar-item"
          :class="{ 'is-selected': !selected }"
          @click="activate('')"
        >
          <div class="animated-avatar-preview">
            <img class="animated-avatar-img" :src="defaultAvatarUrl" alt="默认头像" draggable="false" />
          </div>
          <span class="animated-avatar-name">默认头像</span>
          <el-icon v-if="!selected" class="animated-avatar-check"><CircleCheckFilled /></el-icon>
        </div>
      </div>
    </section>

    <section class="animated-avatar-group">
      <h4 class="animated-avatar-group-title">动态头像</h4>
      <div class="animated-avatar-grid">
        <div
          v-for="item in PRESET_AVATARS"
          :key="item.key"
          class="animated-avatar-item"
          :class="{ 'is-selected': selected === item.url }"
          @click="activate(item.url)"
        >
          <div class="animated-avatar-preview">
            <img class="animated-avatar-img" :src="item.url" :alt="item.name" draggable="false" />
          </div>
          <span class="animated-avatar-name">{{ item.name }}</span>
          <el-icon v-if="selected === item.url" class="animated-avatar-check"><CircleCheckFilled /></el-icon>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * 动态头像设置面板（APNG）
 *
 * 供个人中心复用：展示预置 APNG 动态头像，点选即佩戴到 sysUserAvatar。
 * 佩戴走自助端点 PUT /v2/user/updateProfile（后端按令牌更新自己、不开放角色变更），
 * 个别部署未提供该端点时回落 PUT /v2/user/update；「不佩戴」发空串恢复默认头像
 * （后端 updateById 对空串照常写库，前端展示侧空值自动回退默认头像）。
 * 成功后刷新登录用户信息并 emit updated，由父级刷新个人中心展示。
 */
import { ref, watch } from "vue";
import { CircleCheckFilled } from "@element-plus/icons-vue";
import { msgError, msgSuccess } from "@repo/core";
import { Http } from "@repo/utils";
import { defaultAvatarUrl } from "@repo/assets";
import useAuthStore from "@repo/pinia/modules/auth";
import { PRESET_AVATARS } from "./presetAvatars";

const props = defineProps<{ avatar?: string }>();
const emit = defineEmits<{ (e: "updated"): void }>();

const authStore = useAuthStore();

/** 预置头像 URL 集合（用于识别「当前佩戴的是哪款」） */
const PRESET_URLS = new Set(PRESET_AVATARS.map((p) => p.url));

/** 当前佩戴中的预置头像 URL；不在预置清单（默认/自定义上传）视为未佩戴 */
const selected = ref<string>("");

watch(
  () => props.avatar,
  (v) => {
    selected.value = v && PRESET_URLS.has(v) ? v : "";
  },
  { immediate: true },
);

/** 防连点：保存进行中忽略后续点击 */
const busy = ref(false);

/** 判断异常是否为「端点未部署（404）」 */
function isEndpointMissing(e: unknown): boolean {
  const err = e as { response?: { status?: number }; status?: number } | null;
  return err?.response?.status === 404 || err?.status === 404;
}

/**
 * 持久化 sysUserAvatar
 *
 * @param url        目标头像 URL；空串表示取下（恢复默认头像）
 * @param rollbackTo 失败时回滚到的旧值
 */
async function persistAvatar(url: string, rollbackTo: string): Promise<boolean> {
  const { getApiHttp } = await import("@repo/core");
  try {
    let res: { code?: string; msg?: string };
    try {
      res = await getApiHttp()
        .put("/v2/user/updateProfile")
        .loading(false)
        .data({ sysUserAvatar: url })
        .then<{ code?: string; msg?: string }>((r) => r.data);
    } catch (e) {
      if (!isEndpointMissing(e)) throw e;
      res = await getApiHttp()
        .put("/v2/user/update")
        .loading(false)
        .data({ sysUserAvatar: url })
        .then<{ code?: string; msg?: string }>((r) => r.data);
    }
    if (Http.isSuccessful(res)) {
      await authStore.getLoginUserInfo(false);
      emit("updated");
      return true;
    }
    msgError(res?.msg || "设置失败");
    selected.value = rollbackTo;
    return false;
  } catch (e) {
    if (isEndpointMissing(e)) {
      msgError("当前部署未开放头像保存");
    } else {
      msgError("设置失败：" + ((e as Error)?.message || "网络异常"));
    }
    selected.value = rollbackTo;
    return false;
  }
}

/** 点选佩戴 / 取下 */
async function activate(url: string): Promise<void> {
  if (busy.value || url === selected.value) return;
  busy.value = true;
  const rollbackTo = selected.value;
  selected.value = url;
  const ok = await persistAvatar(url, rollbackTo);
  busy.value = false;
  if (ok) msgSuccess(url ? "已佩戴动态头像" : "已恢复默认头像");
}
</script>

<style scoped lang="scss">
.animated-avatar-panel {
  padding: 0 16px;
}

.animated-avatar-group {
  margin-bottom: 18px;
}

.animated-avatar-group-title {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
}

.animated-avatar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(116px, 1fr));
  gap: 14px;
}

.animated-avatar-item {
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

.animated-avatar-item:hover {
  border-color: var(--el-color-primary);
  transform: translateY(-2px);
}

.animated-avatar-item.is-selected {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.animated-avatar-preview {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
}

.animated-avatar-img {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 2px 10px rgb(0 0 0 / 12%);
  transition: box-shadow 0.2s, transform 0.2s;
  pointer-events: none;
}

.animated-avatar-item:hover .animated-avatar-img {
  transform: scale(1.06);
  box-shadow: 0 4px 16px rgb(0 0 0 / 18%);
}

.animated-avatar-item.is-selected .animated-avatar-img {
  transform: scale(1.06);
  box-shadow:
    0 0 0 2px var(--el-color-primary),
    0 4px 18px var(--el-color-primary-light-5);
}

.animated-avatar-name {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.animated-avatar-check {
  position: absolute;
  top: 4px;
  right: 4px;
  color: var(--el-color-primary);
}
</style>
