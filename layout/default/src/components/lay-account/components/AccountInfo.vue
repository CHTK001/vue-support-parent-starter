<script setup lang="ts">
/**
 * 账号信息卡片组件
 * 用于展示用户基本信息的卡片视图
 * @author CH
 * @version 1.0.0
 * @since 2024-12-04
 */
import { ScTag } from "@repo/components/ScTag";
import { computed } from 'vue'
import { ScAvatar } from "@repo/components/ScAvatar";


interface AccountInfoProps {
  userId?: number
  username?: string
  nickname?: string
  avatar?: string
  email?: string
  phone?: string
  roles?: string[]
  status?: 'online' | 'offline' | 'busy' | 'away'
  createdAt?: string
  lastLoginAt?: string
  variant?: 'card' | 'inline' // 卡片模式或内联模式
}

const props = withDefaults(defineProps<AccountInfoProps>(), {
  userId: 0,
  username: '',
  nickname: '',
  avatar: '',
  email: '',
  phone: '',
  roles: () => [],
  status: 'online',
  createdAt: '',
  lastLoginAt: '',
  variant: 'card'
})

const emit = defineEmits<{
  edit: []
  avatarClick: []
}>()

// 状态配置
const statusConfig = {
  online: { label: '在线', color: '#22c55e', icon: 'ri:checkbox-circle-fill' },
  offline: { label: '离线', color: '#94a3b8', icon: 'ri:close-circle-fill' },
  busy: { label: '忙碌', color: '#ef4444', icon: 'ri:forbid-fill' },
  away: { label: '离开', color: '#f59e0b', icon: 'ri:time-fill' }
}

const currentStatus = computed(() => statusConfig[props.status] || statusConfig.online)

// 角色标签颜色
const getRoleColor = (role: string) => {
  const roleLower = role.toLowerCase()
  if (roleLower.includes('admin')) return 'danger'
  if (roleLower.includes('manager')) return 'warning'
  if (roleLower.includes('vip')) return 'success'
  return 'primary'
}

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleEdit = () => {
  emit('edit')
}

const handleAvatarClick = () => {
  emit('avatarClick')
}
</script>

<template>
  <div :class="['account-info', `account-info--${variant}`]">
    <!-- 卡片模式 -->
    <template v-if="variant === 'card'">
      <!-- 背景装饰 -->
      <div class="account-info__bg">
        <div class="bg-gradient"></div>
        <div class="bg-pattern"></div>
      </div>

      <!-- 头像区域 -->
      <div class="account-info__avatar-section">
        <div class="avatar-wrapper" @click="handleAvatarClick">
          <ScAvatar :size="96" :src="avatar" class="avatar-image">
            <template v-if="!avatar">
              <IconifyIconOnline icon="ri:user-3-fill" />
            </template>
          </ScAvatar>
          <div class="avatar-badge" :style="{ background: currentStatus.color }">
            <IconifyIconOnline :icon="currentStatus.icon" />
          </div>
          <div class="avatar-overlay">
            <IconifyIconOnline icon="ri:camera-line" />
          </div>
        </div>
      </div>

      <!-- 信息区域 -->
      <div class="account-info__content">
        <div class="content-header">
          <div class="header-main">
            <h3 class="user-nickname">{{ nickname || username }}</h3>
            <ScTag
              :type="currentStatus.color"
              size="small"
              effect="light"
              class="status-tag"
            >
              <IconifyIconOnline :icon="currentStatus.icon" class="status-icon" />
              {{ currentStatus.label }}
            </ScTag>
          </div>
          <ScButton
            circle
            type="primary"
            size="default"
            @click="handleEdit"
            title="编辑资料"
          >
            <IconifyIconOnline icon="ri:edit-line" />
          </ScButton>
        </div>

        <div class="content-body">
          <!-- 基本信息 -->
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">
                <IconifyIconOnline icon="ri:user-line" />
                <span>用户名</span>
              </div>
              <div class="info-value">{{ username || '-' }}</div>
            </div>

            <div class="info-item">
              <div class="info-label">
                <IconifyIconOnline icon="ri:mail-line" />
                <span>邮箱</span>
              </div>
              <div class="info-value">{{ email || '-' }}</div>
            </div>

            <div class="info-item">
              <div class="info-label">
                <IconifyIconOnline icon="ri:phone-line" />
                <span>手机</span>
              </div>
              <div class="info-value">{{ phone || '-' }}</div>
            </div>

            <div class="info-item">
              <div class="info-label">
                <IconifyIconOnline icon="ri:shield-user-line" />
                <span>角色</span>
              </div>
              <div class="info-value">
                <ScTag
                  v-for="role in roles"
                  :key="role"
                  :type="getRoleColor(role)"
                  size="small"
                  effect="light"
                  class="role-tag"
                >
                  {{ role }}
                </ScTag>
                <span v-if="roles.length === 0">-</span>
              </div>
            </div>
          </div>

          <!-- 时间信息 -->
          <div class="info-footer">
            <div class="footer-item">
              <IconifyIconOnline icon="ri:calendar-line" class="footer-icon" />
              <span>注册时间：{{ formatDate(createdAt) }}</span>
            </div>
            <div class="footer-item">
              <IconifyIconOnline icon="ri:login-circle-line" class="footer-icon" />
              <span>最后登录：{{ formatDate(lastLoginAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 内联模式 -->
    <template v-else>
      <div class="account-info__inline">
        <div class="inline-avatar">
          <ScAvatar :size="48" :src="avatar">
            <template v-if="!avatar">
              <IconifyIconOnline icon="ri:user-3-fill" />
            </template>
          </ScAvatar>
          <div class="inline-badge" :style="{ background: currentStatus.color }"></div>
        </div>
        <div class="inline-content">
          <div class="inline-name">{{ nickname || username }}</div>
          <div class="inline-meta">
            <span class="inline-username">@{{ username }}</span>
            <span class="inline-divider">•</span>
            <span class="inline-status" :style="{ color: currentStatus.color }">
              {{ currentStatus.label }}
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.account-info {
  // 卡片模式
  &--card {
    background: var(--stitch-lay-bg-overlay, var(--el-bg-color));
    border-radius: var(--stitch-radius-xl, 16px);
    border: 1px solid var(--stitch-lay-border, var(--el-border-color-lighter));
    overflow: hidden;
    box-shadow: var(--stitch-shadow-md, 0 8px 24px rgba(0, 0, 0, 0.08));
    position: relative;
  }

  // 内联模式
  &--inline {
    display: inline-flex;
    align-items: center;
    gap: 12px;
  }

  // 背景装饰
  &__bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 180px;
    overflow: hidden;

    .bg-gradient {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        135deg,
        var(--el-color-primary) 0%,
        var(--el-color-primary-light-3) 100%
      );
      opacity: 0.9;
    }

    .bg-pattern {
      position: absolute;
      inset: 0;
      background-image: radial-gradient(
        circle at 20% 50%,
        rgba(255, 255, 255, 0.1) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 80%,
        rgba(255, 255, 255, 0.1) 0%,
        transparent 50%
      );
    }
  }

  // 头像区域
  &__avatar-section {
    position: relative;
    padding: 120px 0 32px;
    display: flex;
    justify-content: center;

    .avatar-wrapper {
      position: relative;
      cursor: pointer;
      transition: transform var(--stitch-transition-base, 0.3s) ease;

      &:hover {
        transform: scale(1.05);

        .avatar-overlay {
          opacity: 1;
        }
      }

      .avatar-image {
        border: 5px solid var(--el-bg-color);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
      }

      .avatar-badge {
        position: absolute;
        bottom: 8px;
        right: 8px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 4px solid var(--el-bg-color);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }

      .avatar-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 32px;
        opacity: 0;
        transition: opacity var(--stitch-transition-base, 0.3s);
      }
    }
  }

  // 内容区域
  &__content {
    position: relative;
    padding: 0 32px 32px;
  }

  .content-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;

    .header-main {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }

    .user-nickname {
      font-size: 24px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin: 0;
    }

    .status-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;

      .status-icon {
        font-size: 14px;
      }
    }
  }

  .content-body {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  // 信息网格
  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    background: var(--el-fill-color-lighter);
    border-radius: var(--stitch-radius-md, 8px);
    transition: all var(--stitch-transition-base, 0.3s) ease;

    &:hover {
      background: var(--el-fill-color-light);
      transform: translateY(-2px);
      box-shadow: var(--stitch-shadow-sm, 0 4px 12px rgba(0, 0, 0, 0.05));
    }

    .info-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 500;
      color: var(--el-text-color-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;

      .iconify {
        font-size: 14px;
      }
    }

    .info-value {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;

      .role-tag {
        margin: 0;
      }
    }
  }

  // 底部信息
  .info-footer {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 20px;
    background: linear-gradient(
      135deg,
      var(--el-fill-color-lighter) 0%,
      var(--el-fill-color-light) 100%
    );
    border-radius: var(--stitch-radius-md, 8px);
    border: 1px solid var(--el-border-color-lighter);

    .footer-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--el-text-color-secondary);

      .footer-icon {
        font-size: 16px;
        color: var(--el-color-primary);
      }
    }
  }

  // 内联模式样式
  &__inline {
    .inline-avatar {
      position: relative;
      flex-shrink: 0;

      .inline-badge {
        position: absolute;
        bottom: 2px;
        right: 2px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid var(--el-bg-color);
      }
    }

    .inline-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .inline-name {
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .inline-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--el-text-color-secondary);

      .inline-divider {
        color: var(--el-border-color);
      }

      .inline-status {
        font-weight: 500;
      }
    }
  }
}

// 深色模式适配
html.dark {
  .account-info {
    &__bg .bg-gradient {
      opacity: 0.7;
    }

    .info-footer {
      background: linear-gradient(
        135deg,
        rgba(var(--el-color-primary-rgb), 0.1) 0%,
        rgba(var(--el-color-primary-rgb), 0.05) 100%
      );
    }
  }
}
</style>
