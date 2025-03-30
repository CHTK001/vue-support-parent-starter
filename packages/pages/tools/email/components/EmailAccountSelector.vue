<script setup>
import { ref, defineProps, defineEmits, computed } from 'vue';
import { IconifyIconOnline } from '@iconify/vue';

const props = defineProps({
  accounts: {
    type: Array,
    required: true
  },
  selectedAccountId: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['select-account']);

const selectedAccount = computed(() => {
  return props.accounts.find(account => account.emailAccountId === props.selectedAccountId) || props.accounts[0];
});

const isDropdownOpen = ref(false);

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const selectAccount = (accountId) => {
  emit('select-account', accountId);
  isDropdownOpen.value = false;
};
</script>

<template>
  <div class="email-account-selector">
    <div class="email-account-selector__current" @click="toggleDropdown">
      <div class="email-account-selector__avatar" v-if="selectedAccount">
        <img :src="selectedAccount.emailAccountAvatar" :alt="selectedAccount.emailAccountName" />
      </div>
      <div class="email-account-selector__info" v-if="selectedAccount">
        <div class="email-account-selector__name">{{ selectedAccount.emailAccountName }}</div>
        <div class="email-account-selector__address">{{ selectedAccount.emailAccountAddress }}</div>
      </div>
      <div class="email-account-selector__toggle">
        <IconifyIconOnline :icon="isDropdownOpen ? 'ri:arrow-up-s-line' : 'ri:arrow-down-s-line'" />
      </div>
    </div>

    <div class="email-account-selector__dropdown" v-if="isDropdownOpen">
      <div 
        v-for="account in accounts" 
        :key="account.emailAccountId" 
        class="email-account-selector__item"
        :class="{ 'is-active': account.emailAccountId === selectedAccountId }"
        @click="selectAccount(account.emailAccountId)"
      >
        <div class="email-account-selector__item-avatar">
          <img :src="account.emailAccountAvatar" :alt="account.emailAccountName" />
          <div class="email-account-selector__item-badge" v-if="account.emailAccountUnreadCount > 0">
            {{ account.emailAccountUnreadCount }}
          </div>
        </div>
        <div class="email-account-selector__item-info">
          <div class="email-account-selector__item-name">{{ account.emailAccountName }}</div>
          <div class="email-account-selector__item-address">{{ account.emailAccountAddress }}</div>
        </div>
        <div class="email-account-selector__item-provider" :style="{ color: account.emailAccountColor }">
          {{ account.emailAccountProvider }}
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.email-account-selector {
  position: relative;
  width: 100%;
  
  &__current {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    background-color: var(--el-bg-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 1px solid var(--el-border-color-light);
    
    &:hover {
      border-color: var(--el-color-primary);
    }
  }
  
  &__avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    margin-right: 12px;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  
  &__info {
    flex: 1;
  }
  
  &__name {
    font-weight: 600;
    font-size: 16px;
    color: var(--el-text-color-primary);
  }
  
  &__address {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
  
  &__toggle {
    font-size: 20px;
    color: var(--el-text-color-secondary);
  }
  
  &__dropdown {
    position: absolute;
    top: calc(100% + 5px);
    left: 0;
    width: 100%;
    background-color: var(--el-bg-color);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    z-index: 10;
    overflow: hidden;
    border: 1px solid var(--el-border-color-light);
  }
  
  &__item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background-color: var(--el-fill-color-light);
    }
    
    &.is-active {
      background-color: var(--el-color-primary-light-9);
    }
    
    &-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      overflow: hidden;
      margin-right: 12px;
      position: relative;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
    
    &-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      min-width: 18px;
      height: 18px;
      border-radius: 9px;
      background-color: var(--el-color-danger);
      color: white;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
    }
    
    &-info {
      flex: 1;
    }
    
    &-name {
      font-weight: 500;
      font-size: 14px;
      color: var(--el-text-color-primary);
    }
    
    &-address {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
    
    &-provider {
      font-size: 12px;
      font-weight: 600;
    }
  }
}
</style>