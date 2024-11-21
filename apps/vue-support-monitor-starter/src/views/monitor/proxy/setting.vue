<template>
  <div>
    <el-dialog
      v-model="visible"
      draggable
      width="80%"
      :destroy-on-close="true"
      :close-on-click-modal="false"
      title="插件管理"
      class="bg-blue-gray-50/50"
      style="background-color: #f6f8f9"
      @closed="$emit('closed')"
    >
      <el-skeleton :loading="loadding" animated :count="6">
        <Suspense>
          <template #default>
            <div>
              <el-row :gutter="16">
                <el-col v-for="(item, index) in filterPluginList" :key="index" :span="6" class="py-2">
                  <el-card>
                    <div class="flex flex-1">
                      <div class="basis-1/6">
                        <el-icon size="35">
                          <component :is="useRenderIcon(item.icon)" />
                        </el-icon>
                      </div>
                      <div class="basis-2/6 pt-[8px]">
                        <span class="truncate">{{ item.proxyPluginName }}</span>
                      </div>
                      <div class="basis-3/6 pt-2 justify-end flex">
                        <div class="justify-end">
                          <el-button v-if="item.type === 'filter'" :icon="installOrUninstall(item)" circle plain :loading="startDialogStatus" @click="doInstallOrUninstall(item)" />
                          <el-button v-if="(!isInstall(item) || item.type === 'config') && item.components" circle plain :icon="useRenderIcon('ep:setting')" @click="doOpen(item)" />
                        </div>
                      </div>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </div>
          </template>
        </Suspense>
      </el-skeleton>
    </el-dialog>

    <ProxySetting v-if="openDialogStatus" ref="proxySettingRef" @closed="doClose" />
  </div>
</template>

<script>
import { fetchProxyPluginDelete, fetchProxyPluginList, fetchProxyPluginSave } from "@/api/monitor/proxy";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import ProxySetting from "./proxySetting.vue";
import { defineAsyncComponent } from "vue";

export default {
  components: { ProxySetting },
  emits: ["success", "closed"],
  data() {
    return {
      startDialogStatus: false,
      openDialogStatus: false,
      visible: false,
      loadding: true,
      mode: "add",
      form: {},
      installPluginList: [],
      filterPluginList: [],
      pluginList: [
        {
          proxyPluginName: "代理设置",
          proxyPluginSpi: "path-limit",
          proxyProtocol: "http-proxy",
          components: defineAsyncComponent(() => import("./setting/index.vue")),
          type: "config",
          icon: "ri:settings-4-line"
        },
        {
          proxyPluginName: "Http代理",
          proxyPluginSpi: "http-proxy",
          proxyProtocol: "http-proxy",
          type: "filter",
          icon: "ri:parking-box-line"
        },
        {
          proxyPluginName: "Tcp代理",
          proxyPluginSpi: "tcp-proxy",
          proxyProtocol: "tcp-proxy",
          type: "filter",
          icon: "simple-icons:trpc"
        },
        {
          proxyPluginName: "websocket代理",
          proxyPluginSpi: "websocket-proxy",
          proxyProtocol: "http-proxy",
          type: "filter",
          icon: "simple-icons:webstorm"
        },
        {
          proxyPluginName: "白名单",
          proxyPluginSpi: "white",
          proxyProtocol: "http-proxy",
          components: defineAsyncComponent(() => import("./list/index.vue")),
          type: "filter",
          icon: "simple-icons:whitesource"
        },
        {
          proxyPluginName: "黑名单",
          proxyPluginSpi: "black",
          components: defineAsyncComponent(() => import("./list/index.vue")),
          proxyProtocol: "http-proxy",
          type: "filter",
          icon: "ri:bubble-chart-line"
        },
        {
          proxyPluginName: "IP限流",
          proxyPluginSpi: "ip-limit",
          components: defineAsyncComponent(() => import("./limit/index.vue")),
          proxyProtocol: "http-proxy",
          type: "filter",
          icon: "ri:input-cursor-move"
        },
        {
          proxyPluginName: "路径限流",
          proxyPluginSpi: "path-limit",
          components: defineAsyncComponent(() => import("./limit/index.vue")),

          proxyProtocol: "http-proxy",
          type: "filter",
          icon: "ri:parentheses-line"
        }
      ]
    };
  },
  methods: {
    useRenderIcon,
    doClose() {
      this.openDialogStatus = false;
    },
    doOpen(item) {
      this.openDialogStatus = true;
      this.$nextTick(() => {
        this.$refs.proxySettingRef.setData(this.form).setPlugin(item).setComponent(item.components).setPluginId(item.proxyPluginId).open();
      });
    },
    isInstall(item) {
      return !item.proxyPluginId;
    },
    doInstallOrUninstall(item) {
      if (item.type === "filter") {
        return this.doInstallOrUninstallFilter(item).then(res => {
          this.initialPlugin(this.form);
        });
      }
    },
    doInstallOrUninstallFilter(item) {
      this.startDialogStatus = true;
      if (this.isInstall(item)) {
        return fetchProxyPluginSave({
          proxyId: this.form.proxyId,
          proxyPluginSpi: item.proxyPluginSpi,
          proxyPluginName: item.proxyPluginName
        })
          .then(res => {
            if (res.code == "00000") {
              this.$message.success("操作成功");
              return;
            }
            this.$message.error(res.msg);
          })
          .finally(() => {
            this.startDialogStatus = false;
          });
      }
      return fetchProxyPluginDelete({
        proxyPluginId: item.proxyPluginId
      })
        .then(res => {
          if (res.code == "00000") {
            this.$message.success("操作成功");
            return;
          }
          this.$message.error(res.msg);
        })
        .finally(() => {
          this.startDialogStatus = false;
        });
    },
    installOrUninstall(item) {
      return this.isInstall(item) ? this.useRenderIcon("ep:plus") : this.useRenderIcon("line-md:remove");
    },
    close() {
      this.visible = false;
      this.form = {};
      this.loading = true;
      this.$emit("closed");
      return this;
    },
    async initialPlugin(data) {
      const res = await fetchProxyPluginList(this.form);
      if (res.code == "00000") {
        this.installPluginList = res.data;
      }
      this.filterPluginList = this.pluginList.filter(it => {
        return it.proxyProtocol == data.proxyProtocol;
      });
      this.filterPluginList.map(it => {
        it.proxyPluginId = this.installPluginList.filter(it1 => it1.proxyPluginSpi == it.proxyPluginSpi && it1.proxyPluginName == it.proxyPluginName)?.[0]?.proxyPluginId;
      });
      const installList = this.filterPluginList.filter(it => it.proxyPluginId);
      const unInstallList = this.filterPluginList.filter(it => !it.proxyPluginId);
      const newPluginList = [];
      installList.forEach(item => {
        newPluginList.push(item);
      });
      unInstallList.forEach(item => {
        newPluginList.push(item);
      });
      this.filterPluginList = newPluginList;
    },
    //显示
    open(mode = "add") {
      this.mode = mode;
      this.visible = true;
      this.loadding = false;

      return this;
    },
    //表单注入数据
    setData(data) {
      //可以和上面一样单个注入，也可以像下面一样直接合并进去
      Object.assign(this.form, data);
      try {
        this.loadding = true;
      } catch (error) {
        this.loadding = false;
      }
      this.initialPlugin(data);
      return this;
    }
  }
};
</script>

<style lang="scss" scoped>
.filter {
  width: 100%;
  height: 40px;
  line-height: 40px;
  margin-top: 8px;
  background-color: white;
  box-shadow: 1px 4px 5px 2px #999;
  text-align: center;
}

::deep(.redis path) {
  fill: red;
}
</style>
