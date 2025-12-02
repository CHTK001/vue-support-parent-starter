<template>
  <div class="profile-card">
    <div class="profile-card__cover" :style="coverStyle"></div>
    <div class="profile-card__content">
      <div class="profile-card__avatar-wrapper">
        <img :src="avatar" :alt="name" class="profile-card__avatar" />
        <div v-if="online" class="profile-card__status"></div>
      </div>
      <h3 class="profile-card__name">{{ name }}</h3>
      <p class="profile-card__role">{{ role }}</p>
      <p v-if="bio" class="profile-card__bio">{{ bio }}</p>
      <div class="profile-card__stats">
        <div class="profile-card__stat">
          <div class="profile-card__stat-value">{{ followers }}</div>
          <div class="profile-card__stat-label">关注者</div>
        </div>
        <div class="profile-card__stat">
          <div class="profile-card__stat-value">{{ following }}</div>
          <div class="profile-card__stat-label">关注中</div>
        </div>
        <div class="profile-card__stat">
          <div class="profile-card__stat-value">{{ posts }}</div>
          <div class="profile-card__stat-label">动态</div>
        </div>
      </div>
      <div class="profile-card__actions">
        <slot name="actions">
          <el-button type="primary" class="profile-card__btn">
            <IconifyIconOnline icon="ri:user-add-line" />
            关注
          </el-button>
          <el-button class="profile-card__btn">
            <IconifyIconOnline icon="ri:message-3-line" />
            消息
          </el-button>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  avatar?: string;
  name?: string;
  role?: string;
  bio?: string;
  coverImage?: string;
  coverColor?: string;
  online?: boolean;
  followers?: number;
  following?: number;
  posts?: number;
}

const props = withDefaults(defineProps<Props>(), {
  avatar: "https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png",
  name: "用户名称",
  role: "角色描述",
  online: true,
  followers: 0,
  following: 0,
  posts: 0,
});

const coverStyle = computed(() => {
  if (props.coverImage) {
    return { backgroundImage: `url(${props.coverImage})` };
  }
  return {
    background:
      props.coverColor ||
      "linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%)",
  };
});
</script>

<style lang="scss" scoped>
.profile-card {
  background: var(--el-bg-color-overlay);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  }

  &__cover {
    height: 120px;
    background-size: cover;
    background-position: center;
    position: relative;

    &::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 60px;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.3), transparent);
    }
  }

  &__content {
    padding: 0 24px 24px;
    text-align: center;
  }

  &__avatar-wrapper {
    position: relative;
    width: 96px;
    height: 96px;
    margin: -48px auto 16px;
  }

  &__avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 4px solid var(--el-bg-color-overlay);
    object-fit: cover;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &__status {
    position: absolute;
    bottom: 4px;
    right: 4px;
    width: 20px;
    height: 20px;
    background: var(--el-color-success);
    border: 3px solid var(--el-bg-color-overlay);
    border-radius: 50%;
    box-shadow: 0 0 0 2px var(--el-color-success-light-7);
  }

  &__name {
    font-size: 22px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    margin: 0 0 6px 0;
  }

  &__role {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin: 0 0 12px 0;
  }

  &__bio {
    font-size: 13px;
    color: var(--el-text-color-regular);
    line-height: 1.6;
    margin: 0 0 20px 0;
  }

  &__stats {
    display: flex;
    justify-content: space-around;
    padding: 20px 0;
    margin-bottom: 20px;
    border-top: 1px solid var(--el-border-color-lighter);
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  &__stat {
    text-align: center;
  }

  &__stat-value {
    font-size: 20px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    margin-bottom: 4px;
  }

  &__stat-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__actions {
    display: flex;
    gap: 12px;
  }

  &__btn {
    flex: 1;
    height: 44px;
    border-radius: 12px;
    font-weight: 600;
  }
}
</style>
