<script setup lang="ts">
/**
 * 个人设置页面（/system/settings）
 *
 * 与个人中心结构类似，提供当前登录用户的头像框与个性化偏好设置：
 *   - 头像框：选择头像框并保存到服务器（PUT /v2/user/update 的 sysUserAvatarFrame）
 *   - 生日头像框：当今天为用户生日时自动出现，供用户选择
 *   - 界面偏好 / 通知偏好 / 安全设置：本地持久化
 */
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { Monitor, Bell, Lock, Setting } from "@element-plus/icons-vue";
import ReTab, { type ReTabItem } from "@repo/ui/re-tab";
import useUserStore from "@repo/pinia/modules/user";
import useAuthStore from "@repo/pinia/modules/auth";
import { updateUser } from "../api/systemApi";

const userStore = useUserStore();
const authStore = useAuthStore();

const userInfo = computed(() => userStore.userInfo || {});

const display = computed(() => {
  const u: Record<string, unknown> = userInfo.value;
  return {
    nickname: (u.nickname as string) || (u.sysUserNickname as string) || "-",
    username: (u.username as string) || (u.sysUserUsername as string) || "-",
    avatar: (u.avatar as string) || (u.sysUserAvatar as string) || "",
    roles: (u.roles as string[]) || [],
    phone: (u.sysUserPhone as string) || "-",
    email: (u.sysUserEmail as string) || "-",
    sex: (u.sysUserSex as number) ?? 0,
    birthday: (u.sysUserBirthday as string) || (u.birthday as string) || "",
    avatarFrame: (u.sysUserAvatarFrame as number) ?? (u.avatarFrame as number) ?? 0,
  };
});

const activeTab = ref("avatarFrame");

const tabs: ReTabItem[] = [
  { name: "avatarFrame", label: "头像框", icon: "Avatar" },
  { name: "appearance", label: "界面偏好", icon: "Monitor" },
  { name: "notify", label: "通知偏好", icon: "Bell" },
  { name: "security", label: "安全设置", icon: "Lock" },
];

/** 头像框定义：color 为简单位（渐变背景），image 为图片框（PNG 透明叠加） */
interface AvatarFrameItem {
  id: number;
  name: string;
  color?: string;
  image?: string;
}

const baseFrames: AvatarFrameItem[] = [
  { id: 0, name: "经典", color: "transparent" },
  { id: 1, name: "金色", color: "linear-gradient(135deg, #f6d365, #fda085)" },
  { id: 2, name: "蓝色", color: "linear-gradient(135deg, #667eea, #764ba2)" },
  { id: 3, name: "红色", color: "linear-gradient(135deg, #f093fb, #f5576c)" },
  { id: 4, name: "绿色", color: "linear-gradient(135deg, #4facfe, #00f2fe)" },
  { id: 5, name: "紫色", color: "linear-gradient(135deg, #a18cd1, #fbc2eb)" },
  { id: 6, name: "橙色", color: "linear-gradient(135deg, #fa709a, #fee140)" },
  { id: 7, name: "暗夜", color: "linear-gradient(135deg, #2c3e50, #3498db)" },
];

/** 生日头像框（固定 id=100，今天为生日时自动加入） */
const BIRTHDAY_FRAME_ID = 100;

/** 当前可选头像框（生日时追加生日框） */
const avatarFrames = ref<AvatarFrameItem[]>([]);

/** 今天是否为用户生日 */
function isBirthdayToday(birthday: string): boolean {
  if (!birthday) return false;
  const m = birthday.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (!m) return false;
  const now = new Date();
  return Number(m[2]) === now.getMonth() + 1 && Number(m[3]) === now.getDate();
}

/** 当前选中头像框ID */
const selectedFrame = ref(0);
const savingFrame = ref(false);

const PREFS_KEY = "personal-settings";

function readPrefs(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function writePrefs(data: Record<string, unknown>): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(data));
}

const interfaceForm = ref({ theme: "light", language: "zh-CN", density: "default" });
const notifyForm = ref({ system: true, message: true, task: false, email: false });
const securityForm = ref({ loginRemind: false, twoFactor: false });

function loadPrefs(): void {
  const saved = readPrefs();
  interfaceForm.value = {
    theme: (saved.theme as string) || "light",
    language: (saved.language as string) || "zh-CN",
    density: (saved.density as string) || "default",
  };
  notifyForm.value = {
    system: (saved.system as boolean) ?? true,
    message: (saved.message as boolean) ?? true,
    task: (saved.task as boolean) ?? false,
    email: (saved.email as boolean) ?? false,
  };
  securityForm.value = {
    loginRemind: (saved.loginRemind as boolean) ?? false,
    twoFactor: (saved.twoFactor as boolean) ?? false,
  };
}

function savePrefs(): void {
  writePrefs({
    ...interfaceForm.value,
    ...notifyForm.value,
    ...securityForm.value,
  });
  ElMessage.success("偏好设置已保存");
}

function resetPrefs(): void {
  localStorage.removeItem(PREFS_KEY);
  loadPrefs();
  ElMessage.success("已恢复默认偏好");
}

/** 初始化头像框列表（生日时自动追加） */
function initFrames(): void {
  const frames = [...baseFrames];
  if (isBirthdayToday(display.value.birthday)) {
    frames.push({
      id: BIRTHDAY_FRAME_ID,
      name: "生日快乐",
      image: "/assets/avatar-frames/birthday.png",
    });
  }
  avatarFrames.value = frames;
  // 若服务器已保存头像框，则回填选中
  selectedFrame.value =
    avatarFrames.value.some((f) => f.id === display.value.avatarFrame)
      ? display.value.avatarFrame
      : 0;
}

/** 选择头像框 */
function selectFrame(id: number): void {
  selectedFrame.value = id;
}

/** 保存头像框到服务器 */
async function saveFrame(): Promise<void> {
  savingFrame.value = true;
  try {
    const res = await updateUser({ sysUserAvatarFrame: selectedFrame.value } as any);
    if (res.code === 200 || res.code === 0 || res.msg === "操作成功" || res.msg == null) {
      ElMessage.success("头像框已保存");
      await authStore.getLoginUserInfo();
    } else {
      ElMessage.error(res.msg || "保存失败");
    }
  } catch (e) {
    ElMessage.error("保存失败：" + ((e as Error)?.message || "网络异常"));
  } finally {
    savingFrame.value = false;
  }
}

onMounted(() => {
  loadPrefs();
  initFrames();
});
</script>

<template>
  <div class="settings-page">
    <el-row :gutter="20">
      <el-col :span="6" :xs="24">
        <el-card class="rounded-md profile-card" shadow="never">
          <div class="avatar-wrap">
            <div class="avatar-frame-box">
              <div
                v-if="avatarFrames.find((f) => f.id === selectedFrame)?.image"
                class="avatar-frame-layer"
                :style="{ backgroundImage: `url(${avatarFrames.find((f) => f.id === selectedFrame)?.image})` }"
              ></div>
              <el-avatar :size="80" :src="display.avatar">
                {{ display.nickname.charAt(0) }}
              </el-avatar>
            </div>
            <h3 class="nickname">{{ display.nickname }}</h3>
            <p class="username">@{{ display.username }}</p>
            <div class="roles" v-if="display.roles.length">
              <el-tag v-for="r in display.roles" :key="r" size="small" type="primary" effect="plain" round>
                {{ r }}
              </el-tag>
            </div>
          </div>
          <el-divider />
          <el-descriptions :column="1" class="base-info">
            <el-descriptions-item label="手机号">{{ display.phone }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ display.email }}</el-descriptions-item>
            <el-descriptions-item label="性别">
              {{ display.sex === 1 ? "女" : display.sex === 2 ? "保密" : "男" }}
            </el-descriptions-item>
            <el-descriptions-item label="生日">
              {{ display.birthday || "-" }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <el-col :span="18" :xs="24">
        <el-card class="rounded-md" shadow="never" :body-style="{ paddingTop: '6px' }">
          <ReTab :tabs="tabs" v-model="activeTab" variant="capsule">
            <template #avatarFrame>
              <div class="avatar-frame-section">
                <p class="section-desc">
                  选择头像框，展示在你的头像周围。
                  <span v-if="avatarFrames.some((f) => f.id === BIRTHDAY_FRAME_ID)" class="birthday-tip">
                    🎂 今天是你的生日，生日快乐！已解锁生日专属头像框。
                  </span>
                </p>
                <div class="frame-grid">
                  <div
                    v-for="frame in avatarFrames"
                    :key="frame.id"
                    class="frame-item"
                    :class="{ 'is-selected': selectedFrame === frame.id }"
                    @click="selectFrame(frame.id)"
                  >
                    <div class="frame-preview">
                      <div
                        v-if="frame.image"
                        class="frame-img"
                        :style="{ backgroundImage: `url(${frame.image})` }"
                      ></div>
                      <el-avatar :size="56" :src="display.avatar" />
                    </div>
                    <span class="frame-name">{{ frame.name }}</span>
                  </div>
                </div>
                <div class="frame-actions">
                  <el-button type="primary" :icon="Setting" :loading="savingFrame" @click="saveFrame">
                    保存头像框
                  </el-button>
                </div>
              </div>
            </template>

            <template #appearance>
              <el-form :model="interfaceForm" label-width="90px" class="settings-form">
                <el-form-item label="主题氛围">
                  <el-radio-group v-model="interfaceForm.theme">
                    <el-radio-button value="light">浅色</el-radio-button>
                    <el-radio-button value="dark">深色</el-radio-button>
                    <el-radio-button value="auto">跟随系统</el-radio-button>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="界面语言">
                  <el-select v-model="interfaceForm.language" style="width: 200px">
                    <el-option label="简体中文" value="zh-CN" />
                    <el-option label="English" value="en-US" />
                  </el-select>
                </el-form-item>
                <el-form-item label="面板密度">
                  <el-radio-group v-model="interfaceForm.density">
                    <el-radio-button value="comfortable">舒适</el-radio-button>
                    <el-radio-button value="default">适中</el-radio-button>
                    <el-radio-button value="compact">紧凑</el-radio-button>
                  </el-radio-group>
                </el-form-item>
              </el-form>
            </template>

            <template #notify>
              <el-form :model="notifyForm" label-width="90px" class="settings-form">
                <el-form-item label="系统通知">
                  <el-switch v-model="notifyForm.system" />
                </el-form-item>
                <el-form-item label="消息提醒">
                  <el-switch v-model="notifyForm.message" />
                </el-form-item>
                <el-form-item label="任务提醒">
                  <el-switch v-model="notifyForm.task" />
                </el-form-item>
                <el-form-item label="邮件通知">
                  <el-switch v-model="notifyForm.email" />
                </el-form-item>
              </el-form>
            </template>

            <template #security>
              <el-form :model="securityForm" label-width="90px" class="settings-form">
                <el-form-item label="登录提醒">
                  <el-switch v-model="securityForm.loginRemind" />
                  <div class="form-tip">新设备登录时发送提醒</div>
                </el-form-item>
                <el-form-item label="双重验证">
                  <el-switch v-model="securityForm.twoFactor" />
                  <div class="form-tip">登录时需额外验证，提升账号安全</div>
                </el-form-item>
              </el-form>
            </template>
          </ReTab>

          <div class="tab-actions">
            <el-button type="primary" :icon="Setting" @click="savePrefs">保存设置</el-button>
            <el-button @click="resetPrefs">恢复默认</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.settings-page {
  padding: 6px;

  .profile-card {
    text-align: center;

    .avatar-wrap {
      padding: 16px 0 4px;

      .avatar-frame-box {
        position: relative;
        display: inline-flex;
        width: 86px;
        height: 86px;
        align-items: center;
        justify-content: center;

        .avatar-frame-layer {
          position: absolute;
          inset: 0;
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          pointer-events: none;
        }
      }

      .nickname {
        margin: 10px 0 2px;
        font-size: 18px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .username {
        margin: 0;
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }

      .roles {
        margin-top: 10px;
        display: flex;
        gap: 6px;
        justify-content: center;
        flex-wrap: wrap;
      }
    }

    .base-info {
      :deep(.el-descriptions__label) {
        width: 70px;
      }
    }
  }

  .avatar-frame-section {
    .section-desc {
      font-size: 13px;
      color: var(--el-text-color-secondary);
      margin: 0 0 16px;

      .birthday-tip {
        color: var(--el-color-warning);
        display: block;
        margin-top: 6px;
      }
    }

    .frame-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 12px;
    }

    .frame-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 12px 8px;
      border-radius: 10px;
      border: 2px solid transparent;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: var(--el-color-primary-light-9);
      }

      &.is-selected {
        border-color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
      }

      .frame-preview {
        position: relative;
        width: 62px;
        height: 62px;
        display: flex;
        align-items: center;
        justify-content: center;

        .frame-img {
          position: absolute;
          inset: 0;
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          pointer-events: none;
        }
      }

      .frame-name {
        font-size: 12px;
        color: var(--el-text-color-regular);
      }
    }

    .frame-actions {
      margin-top: 16px;
    }
  }

  .settings-form {
    max-width: 480px;

    .form-tip {
      width: 100%;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      line-height: 1.4;
    }
  }

  .tab-actions {
    margin-top: 16px;
    display: flex;
    gap: 12px;
  }
}
</style>