<template>
  <div class="third-party-login">
    <div class="third-party-icons">
      <el-tooltip v-for="(item, index) in enabledThirdParty" :key="index" :content="item.displayName" placement="top">
        <div class="third-party-item" :class="item.className" @click="handleLoginCode(item)">
          <IconifyIconOnline :icon="item.icon" width="22" />
        </div>
      </el-tooltip>
    </div>
  </div>
</template>

<script>
import { $t, transformI18n, uuid } from "@repo/config";
import { fetchThirdLoginCode } from "@repo/core";
import { computed, defineComponent } from "vue";

export default defineComponent({
  props: {
    data: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      thirdParty: [
        {
          title: "gitee",
          key: "Gitee",
          displayName: "Gitee 登录",
          icon: "simple-icons:gitee",
          className: "gitee",
        },
        {
          title: "github",
          key: "Github",
          displayName: "GitHub 登录",
          icon: "mdi:github",
          className: "github",
        },
        {
          title: "wechat",
          key: "Wechat",
          displayName: "微信登录",
          icon: "ri:wechat-fill",
          className: "wechat",
        },
      ],
    };
  },
  computed: {
    enabledThirdParty() {
      return this.thirdParty.filter((item) => this.data[item.key]);
    },
  },
  methods: {
    $t,
    transformI18n,
    async handleLoginCode(item) {
      const { data } = await fetchThirdLoginCode({
        loginType: item.title,
        loginCode: uuid(),
        thirdType: 1,
        callback: window.location.origin,
      });
      window.location.href = data;
    },
  },
});
</script>

<style lang="scss" scoped>
.third-party-login {
  width: 100%;
  
  .third-party-icons {
    display: flex;
    justify-content: center;
    gap: 16px;
    
    .third-party-item {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: var(--el-fill-color-light);
      border: 1px solid var(--el-border-color-lighter);
      color: var(--el-text-color-regular);
      
      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
      }
      
      &.gitee {
        &:hover {
          background: linear-gradient(135deg, #c71d23 0%, #d64a4a 100%);
          border-color: #c71d23;
          color: #fff;
          box-shadow: 0 6px 16px rgba(199, 29, 35, 0.3);
        }
      }
      
      &.github {
        &:hover {
          background: linear-gradient(135deg, #24292e 0%, #404448 100%);
          border-color: #24292e;
          color: #fff;
          box-shadow: 0 6px 16px rgba(36, 41, 46, 0.3);
        }
      }
      
      &.wechat {
        &:hover {
          background: linear-gradient(135deg, #07c160 0%, #2aae67 100%);
          border-color: #07c160;
          color: #fff;
          box-shadow: 0 6px 16px rgba(7, 193, 96, 0.3);
        }
      }
    }
  }
}
</style>
