<template>
  <div>
    <a-menu
      v-if="getUserInfo && getUserInfo.systemUser"
      v-model:value="mangerMenuOpenkeys"
      :theme="theme"
      mode="inline"
      :open-keys="mangerMenuOpenkeys"
      class="menu"
      @click="mangerMenuClick"
    >
      <a-menu-item key="admin-manager">
        <template v-if="mode === 'normal'">
          <a-tooltip :title="$t('i18n_4d85ac1250')" color="cyan">
            <SettingOutlined :style="{ fontSize: '18px' }" />

            <span>{{ $t('i18n_4d85ac1250') }}</span>
          </a-tooltip>
        </template>
        <template v-if="mode === 'management'">
          <a-tooltip :title="$t('i18n_d9c28e376c')" color="cyan">
            <DesktopOutlined :style="{ fontSize: '18px' }" />

            <span>{{ $t('i18n_d9c28e376c') }}</span>
          </a-tooltip>
        </template>
      </a-menu-item>
    </a-menu>
    <a-menu
      v-model:selectedKeys="selectedKeys"
      :theme="theme"
      mode="inline"
      :open-keys="getMenuOpenKeys2"
      class="menu"
      @open-change="openChange"
    >
      <template v-for="menu in getMenus">
        <template v-if="menu.childs && menu.childs.length">
          <a-sub-menu :key="menu.id">
            <template #title>
              <a-tooltip :title="menu.title" color="cyan">
                <icon :type="menu.icon_v3" :style="{ fontSize: '18px' }" />
                <span>{{ menu.title }}</span>
              </a-tooltip>
            </template>
            <a-menu-item
              v-for="subMenu in menu.childs"
              :key="subMenu.id"
              :p="(subMenu.parent = menu)"
              @click="handleClick(subMenu)"
            >
              <a-tooltip :title="subMenu.title" color="cyan">{{ subMenu.title }}</a-tooltip>
            </a-menu-item>
          </a-sub-menu>
        </template>
        <template v-else>
          <a-menu-item :key="menu.id" @click="handleClick(menu)">
            <a-tooltip :title="menu.title" color="cyan">
              <icon :type="menu.icon_v3" :style="{ fontSize: '18px' }" />
              <span>{{ menu.title }}</span>
            </a-tooltip>
          </a-menu-item>
        </template>
      </template>
    </a-menu>
  </div>
</template>
<script>
import { mapState } from 'pinia'
import Icon from '@/components/Icon'
import { useAllMenuStore } from '@/stores/menu2'


export default {
  components: {
    Icon
  },
  props: {
    mode: {
      type: String,
      default: ''
    },
    theme: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      mangerMenuOpenkeys: []
    }
  },
  computed: {
    selectedKeys: {
      get() {
        return [useAllMenuStore().getActiveMenuKey(this.mode)]
      },
      set() {}
    },
    getMenus() {
      return useAllMenuStore().getMenus(this.mode)
    },
    getMenuOpenKeys2() {
      if (this.getCollapsed) {
        // 折叠的时候使用，用户点击的菜单
        return this.menuOpenKeys
      }
      // 时候全局缓存的菜单
      return useAllMenuStore().getMenuOpenKeys(this.mode)
    },
    menuMultipleFlag() {
      return this.getGuideCache.menuMultipleFlag === undefined ? true : this.getGuideCache.menuMultipleFlag
    }
  },
  created() {
    useAllMenuStore().menuOpenKeys(this.mode, this.$route.query.sPid || '')
  },
  beforeUnmount() {},
  methods: {
    mangerMenuClick() {
      this.mangerMenuOpenkeys = []
      this.$nextTick(() => {
        this.mangerMenuOpenkeys = []
        this.$router.push({
          path: this.mode == 'normal' ? '/system/overview' : '/overview'
        })
      })
    },
    // 菜单打开
    openChange(keys) {
      if (keys.length && !this.menuMultipleFlag) {
        // 保留一个打开
        keys = [keys[keys.length - 1]]
      }

      useAllMenuStore().menuOpenKeys(this.mode, keys)
    },
    // 点击菜单
    handleClick(subMenu) {
      // 如果路由不存在
      if (!subMenu.path) {
        $notification.error({
          message: this.$t('i18n_130318a2a1')
        })
        return false
      }
      // 如果跳转路由跟当前一致
      if (this.$route.path === subMenu.path) {
        // $notification({
        //   message: "已经在当前页面了",
        // });
        return false
      }
      // 跳转路由
      this.$router.push({
        query: {
          ...this.$route.query,
          sPid: subMenu.parent?.id,
          sId: subMenu.id
        },
        path: subMenu.path
      })
      // this.$router.push()
    }
  }
}
</script>
<style scoped>
.menu {
  border-inline-end: 0 !important;
}
</style>
