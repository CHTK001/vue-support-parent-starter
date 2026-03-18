<script setup lang="ts">
/**
 * 头像下拉菜单组件
 * 用于展示用户信息和快捷操作菜单
 * @author CH
 * @version 1.0.0
 * @since 2024-12-04
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStoreHook } from '@/store/modules/user'

interface MenuItem {
  icon: string
  label: string
  command: string
  divided?: boolean
  danger?: boolean
}

interface AvatarDropdownProps {
  username?: string
  avatar?: string
  email?: string
  role?: string
  menuItems?: MenuItem[]
}

const props = withDefaults(defineProps<AvatarDropdownProps>(), {
  username: '用户',
  avatar: '',
  email: '',
  role: '',
  menuItems: () => [
    { icon: 'ri:user-line', label: '个人中心', command: 'profile' },
    { icon: 'ri:settings-3-line', label: '账号设置', command: 'settings' },
    { icon: 'ri:lock-password-line', label: '修改密码', command: 'password', divided: true },
    { icon: 'ri:logout-box-line', label: '退出登录', command: 'logout', danger: true }
  ]
})

const emit = defineEmits<{
  command: [command: string]
}>()

const router = useRouter()
const userStore = useUserStoreHook()

// 获取用户信息
const currentUser = computed(() => ({
  username: props.username || userStore.username || '用户',
  avatar: props.avatar || userStore.avatar || '',
  email: props.email || userStore.email || '',
  role: props.role || userStore.roles?.[0] || ''
}))

// 处理菜单命令
const handleCommand = (command: string) => {
  emit('command', command)
  
  // 默认行为
  switch (command) {
    case 'profile':
      router.push('/user/profile')
      break
    case 'settings':
      router.push('/user/settings')
      break
    case 'password':
      router.push('/user/password')
      break
    case 'logout':
      handleLogout()
      break
  }
}

// 退出登录
const handleLogout = async () => {
  try {
    await userStore.logOut()
    router.push('/login')
  } catch (error) {
    console.error('退出登录失败:', error)
  }
}

// 角色标签颜色
const roleColor = computed(() => {
  const role = currentUser.value.role.toLowerCase()
  if (role.includes('admin')) return 'danger'
  if (role.includes('manager')) return 'warning'
  return 'primary'
})
</script>

<template>
  <el-dropdown
    trigger="click"
    placement="bottom-end"
    popper-class="avatar-dropdown-popper"
    @command="handleCommand"
  >
    <div class="avatar-trigger">
      <ScAvatar
        :size="36"
        :src="currentUser.avatar"
        class="avatar-trigger__image"
      >
        <template v-if="!currentUser.avatar">
          <IconifyIconOnline icon="ri:user-3-fill" />
        </template>
      </ScAvatar>
      <span class="avatar-trigger__name">{{ currentUser.username }}</span>
      <IconifyIconOnline icon="ri:arrow-down-s-line" class="avatar-trigger__arrow" />
    </div>

    <template #dropdown>
      <div class="avatar-dropdown">
        <!-- 用户信息卡片 -->
        <div class="avatar-dropdown__header">
          <ScAvatar
            :size="56"
            :src="currentUser.avatar"
            class="header-avatar"
          >
            <template v-if="!currentUser.avatar">
              <IconifyIconOnline icon="ri:user-3-fill" />
            </template>
          </ScAvatar>
          <div class="header-info">
            <div class="header-info__name">{{ currentUser.username }}</div>
            <div v-if="currentUser.email" class="header-info__email">
              {{ currentUser.email }}
            </div>
            <ScTag
              v-if="currentUser.role"
              :type="roleColor"
              size="small"
              effect="light"
              class="header-info__role"
            >
              {{ currentUser.role }}
            </ScTag>
          </div>
        </div>

        <!-- 菜单列表 -->
        <el-dropdown-menu class="avatar-dropdown__menu">
          <template v-for="(item, index) in menuItems" :key="index">
            <el-dropdown-item
              v-if="item.divided && index > 0"
              divided
              :command="item.command"
              :class="{ 'is-danger': item.danger }"
            >
              <IconifyIconOnline :icon="item.icon" class="menu-icon" />
              <span>{{ item.label }}</span>
            </el-dropdown-item>
            <el-dropdown-item
              v-else
              :command="item.command"
              :class="{ 'is-danger': item.danger }"
            >
              <IconifyIconOnline :icon="item.icon" class="menu-icon" />
              <span>{{ item.label }}</span>
            </el-dropdown-item>
          </template>
        </el-dropdown-menu>
      </div>
    </template>
  </el-dropdown>
</template>

<style lang="scss" scoped>
.avatar-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 4px 4px;
  border-radius: var(--stitch-radius-lg, 12px);
  cursor: pointer;
  transition: all var(--stitch-transition-base, 0.3s) ease;
  background: transparent;
  position: relative;
  overflow: hidden;

  /* 玻璃拟态光泽 */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent);
    opacity: 0;
    transition: opacity var(--stitch-transition-base, 0.3s);
  }

  &:hover {
    background: var(--stitch-lay-bg-hover, var(--el-fill-color-light));
    transform: translateY(-2px);
    box-shadow: var(--stitch-shadow-sm, 0 4px 12px rgba(0, 0, 0, 0.05));

    &::before {
      opacity: 1;
    }

    .avatar-trigger__arrow {
      transform: rotate(180deg);
    }
  }

  &__image {
    flex-shrink: 0;
    border: 2px solid var(--el-border-color-lighter);
    transition: border-color var(--stitch-transition-base, 0.3s);

    &:hover {
      border-color: var(--el-color-primary);
    }
  }

  &__name {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__arrow {
    font-size: 16px;
    color: var(--el-text-color-secondary);
    transition: transform var(--stitch-transition-base, 0.3s);
  }
}
</style>

<style lang="scss">
.avatar-dropdown-popper {
  .el-dropdown-menu {
    padding: 0 !important;
    border-radius: var(--stitch-radius-xl, 16px);
    border: 1px solid var(--stitch-lay-border, var(--el-border-color-lighter));
    background: var(--stitch-lay-bg-overlay, var(--el-bg-color-overlay));
    backdrop-filter: blur(20px);
    box-shadow: var(--stitch-shadow-lg, 0 16px 48px rgba(0, 0, 0, 0.18));
    overflow: hidden;
    min-width: 260px;
  }

  // 去除箭头
  .el-popper__arrow {
    display: none;
  }
}

.avatar-dropdown {
  &__header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    background: linear-gradient(
      135deg,
      rgba(var(--el-color-primary-rgb), 0.05) 0%,
      rgba(var(--el-color-primary-rgb), 0.02) 100%
    );
    border-bottom: 1px solid var(--stitch-lay-border, var(--el-border-color-lighter));

    .header-avatar {
      flex-shrink: 0;
      border: 3px solid var(--el-color-primary-light-8);
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);
    }

    .header-info {
      flex: 1;
      min-width: 0;

      &__name {
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin-bottom: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      &__email {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        margin-bottom: 8px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      &__role {
        display: inline-flex;
      }
    }
  }

  &__menu {
    padding: 8px !important;

    .el-dropdown-menu__item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      margin: 2px 0;
      border-radius: var(--stitch-radius-md, 8px);
      font-size: 14px;
      transition: all var(--stitch-transition-base, 0.3s) ease;

      &:hover {
        background: var(--stitch-lay-bg-hover, var(--el-fill-color-light));
        color: var(--el-color-primary);

        .menu-icon {
          color: var(--el-color-primary);
          transform: scale(1.1);
        }
      }

      &.is-danger {
        color: var(--el-color-danger);

        &:hover {
          background: rgba(var(--el-color-danger-rgb), 0.1);
          color: var(--el-color-danger);

          .menu-icon {
            color: var(--el-color-danger);
          }
        }
      }

      .menu-icon {
        font-size: 18px;
        color: var(--el-text-color-secondary);
        transition: all var(--stitch-transition-base, 0.3s) ease;
      }
    }
  }
}

// 深色模式适配
html.dark {
  .avatar-dropdown__header {
    background: linear-gradient(
      135deg,
      rgba(var(--el-color-primary-rgb), 0.15) 0%,
      rgba(var(--el-color-primary-rgb), 0.05) 100%
    );
  }
}
</style>
