<template>
  <div>
    <div class="h-[300px]">
      <el-divider>
        <p class="text-gray-500 text-xs">
          {{ $t("login.pureThirdLogin") }}
        </p>
      </el-divider>
      <div v-if="unbindThirdParty.length > 0" class="w-full flex justify-evenly">
        <span v-for="(item, index) in unbindThirdParty" :key="index" :title="transformI18n(item.title)" @click="handleBindCode(item)">
          <IconifyIconOnline size="large" :icon="`${item.icon}`" width="40" class="cursor-pointer text-gray-500 hover:text-blue-400" />
        </span>
      </div>
      <el-empty v-else />
    </div>
    <div class="mt-[100px]">
      <el-divider>
        <p class="text-gray-500 text-xs">
          {{ $t("login.pureThirdLoginBinded") }}
        </p>
      </el-divider>
      <div class="w-full flex justify-evenly">
        <el-table :data="bindThirdParty">
          <el-table-column prop="title" label="三方">
            <template #default="scope">
              <span class="flex flex-1">
                <IconifyIconOnline size="large" :icon="`${scope.row.icon}`" width="25" class="mr-2" style="fill: currentColor" />
                <span>{{ scope.row.title }}</span>
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="操作">
            <template #default="scope">
              <el-button type="primary" size="mini" text plain @click="handleUnBindCode(scope.row)">
                {{ $t("login.unbind") }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>
<script>
import { defineComponent } from "vue";
import { $t, transformI18n, uuid } from "@repo/config";
import { fetchSetting, fetchThirdBindCode, fetchThirdBindInfo, fetchThirdUnbind } from "@repo/core";
import { message } from "@repo/utils";

export default defineComponent({
  data() {
    return {
      visible: false,
      url: null,
      thirdParty: [],
      bindThirdParty: [],
      unbindThirdParty: []
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
      const { data } = await fetchSetting("sso");
      this.thirdParty.length = 0;
      data.forEach(element => {
        const _val = element.sysSettingValue === "true";
        if (_val) {
          this.thirdParty.push({
            title: element.sysSettingName,
            icon: "simple-icons:" + element.sysSettingName
          });
        }
        this.initializeBindInfo();
      });
    },
    async initializeBindInfo() {
      this.unbindThirdParty.length = 0;
      this.bindThirdParty.length = 0;
      const { data } = await fetchThirdBindInfo({});
      this.thirdParty.forEach(element2 => {
        if (data.indexOf(element2.title) > -1) {
          element2.bind = true;
          this.bindThirdParty.push(element2);
        }
      });
      this.thirdParty.forEach(element2 => {
        if (data.indexOf(element2.title) == -1) {
          this.unbindThirdParty.push(element2);
        }
      });
    },

    async handleUnBindCode(item) {
      fetchThirdUnbind({
        loginType: item.title
      }).then(res => {
        if (res.code == "00000") {
          message(transformI18n("login.unbindSuccess"), { type: "success" });
          this.initializeBindInfo();
          return;
        }
        message(transformI18n("login.unbindFailure"), { type: "error" });
      });
    },
    async handleBindCode(item) {
      const { data } = await fetchThirdBindCode({
        loginType: item.title,
        loginCode: uuid(),
        thirdType: 0,
        callback: window.location.origin + "/#/bindSuccess"
      });
      window.open(data);
    }
  }
});
</script>
