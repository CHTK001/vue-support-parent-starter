<template>
  <div>
    <el-divider>
      <p class="text-gray-500 text-xs">
        {{ $t("login.pureThirdLogin") }}
      </p>
    </el-divider>
    <div class="w-full flex justify-evenly">
      <span v-for="(item, index) in thirdParty" :key="index" :title="item.displayName" @click="handleLoginCode(item)">
        <IconifyIconOnline v-if="data[item.title]" :icon="`${item.icon}`" width="20" class="cursor-pointer text-gray-500 hover:text-blue-400" />
      </span>
    </div>
  </div>
</template>
<script>
import { $t, transformI18n, uuid } from "@repo/config";
import { fetchThirdLoginCode } from "@repo/core";
import { defineComponent } from "vue";

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
          title: "Gitee",
          displayName: transformI18n("thirdParty.gitee"),
          icon: "simple-icons:gitee",
        },
      ],
    };
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
