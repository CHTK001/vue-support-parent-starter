<template>
  <div>
    <div class="h-[300px]">
      <ScDivider>
        <p class="text-gray-500 text-xs">
          {{ $t("login.pureThirdLogin") }}
        </p>
      </ScDivider>
      <div
        v-if="unbindThirdParty.length > 0"
        class="w-full flex justify-evenly"
      >
        <span
          v-for="(item, index) in unbindThirdParty"
          :key="index"
          :title="transformI18n(item.title)"
          @click="handleBindCode(item)"
        >
          <IconifyIconOnline
            size="large"
            :icon="`${item.icon}`"
            width="40"
            class="cursor-pointer text-gray-500 hover:text-blue-400"
          />
        </span>
      </div>
      <ScEmpty v-else />
    </div>
    <div class="mt-[100px]">
      <ScDivider>
        <p class="text-gray-500 text-xs">
          {{ $t("login.pureThirdLoginBinded") }}
        </p>
      </ScDivider>
      <div class="w-full flex justify-evenly">
        <ScTable :data="bindThirdParty">
          <ScTableColumn prop="title" label="三方">
            <template #default="scope">
              <span class="flex flex-1">
                <IconifyIconOnline
                  size="large"
                  :icon="`${scope.row.icon}`"
                  width="25"
                  class="mr-2"
                  style="fill: currentColor"
                />
                <span>{{ scope.row.title }}</span>
              </span>
            </template>
          </ScTableColumn>
          <ScTableColumn prop="title" label="操作">
            <template #default="scope">
              <ScButton
                type="primary"
                size="small"
                text
                plain
                @click="handleUnBindCode(scope.row)"
              >
                {{ $t("login.unbind") }}
              </ScButton>
            </template>
          </ScTableColumn>
        </ScTable>
      </div>
    </div>
  </div>
</template>
<script>
import { } from @repo/components; } from "@repo/components/} from @repo/components;";

import { defineComponent } from "vue";
import { $t, transformI18n, uuid } from "@repo/config";
import {
  fetchThirdBindCode,
  fetchThirdBindInfo,
  fetchThirdUnbind,
} from "@repo/core";
import { fetchSetting } from "@pages/setting";
import { message } from "@repo/utils";
import {
  ScDivider,
  ScEmpty,
  ScTable,
  ScTableColumn,
  ScButton,

export default defineComponent({
  components: {
    ScDivider,
    ScEmpty,
    ScTable,
    ScTableColumn,
    ScButton,
  },
  data() {
    return {
      visible: false,
      url: null,
      thirdParty: [],
      bindThirdParty: [],
      unbindThirdParty: [],
    };
  },
  mounted() {
    this.thirdParty.length = 0;
    this.unbindThirdParty.length = 0;
    this.bindThirdParty.length = 0;
    this.afterPropertiesSet();
  },
  methods: {
    $t,
    transformI18n,
    async afterPropertiesSet() {
      const response = await fetchSetting("sso");
      const data = response?.data || [];
      this.thirdParty.length = 0;
      data.forEach((element) => {
        const enabled = element.sysSettingValue === "true";
        if (!enabled) {
          return;
        }
        const name = element.sysSettingName;
        const bindType = name ? name.toLowerCase() : "";
        let icon = "simple-icons:" + bindType;
        if (bindType === "gitee") {
          icon = "simple-icons:gitee";
        } else if (bindType === "github") {
          icon = "mdi:github";
        } else if (bindType === "wechat") {
          icon = "ri:wechat-fill";
        }
        this.thirdParty.push({
          title: name,
          icon,
          loginType: name,
          bindType,
        });
      });
      await this.initializeBindInfo();
    },
    async initializeBindInfo() {
      this.unbindThirdParty.length = 0;
      this.bindThirdParty.length = 0;
      const { data } = await fetchThirdBindInfo({});
      this.thirdParty.forEach((element2) => {
        if (data.indexOf(element2.bindType) > -1) {
          element2.bind = true;
          this.bindThirdParty.push(element2);
          return;
        }
        this.unbindThirdParty.push(element2);
      });
    },

    async handleUnBindCode(item) {
      fetchThirdUnbind({
        loginType: item.bindType || item.title,
      }).then((res) => {
        if (res.code === "00000") {
          message(transformI18n("login.unbindSuccess"), { type: "success" });
          this.initializeBindInfo();
          return;
        }
        message(transformI18n("login.unbindFailure"), { type: "error" });
      });
    },
    async handleBindCode(item) {
      const { data } = await fetchThirdBindCode({
        loginType: item.loginType || item.title,
        loginCode: uuid(),
        thirdType: 0,
        callback: window.location.origin + "/#/bindSuccess",
      });
      window.open(data);
    },
  },
});
</script>
