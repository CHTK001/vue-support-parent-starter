<template>
  <div>
    <div style="font-size: 13px; color: #999; margin-left: 1%">基本参数</div>
    <el-divider />
    <el-form>
      <el-form-item v-for="config in configs" :key="config" :label="config.desc">
        <el-row style="width: 100%">
          <el-col v-if="config.proxyConfigName == 'serviceDiscovery'" :span="12">
            <el-select v-if="form.proxyStatus == 0" v-model="config.proxyConfigValue" :placeholder="'请选择' + config.desc" style="width: 100%">
              <el-option v-for="item in serviceDiscoveryList" :key="item" :label="item.describe || item.name" :value="item.name" />
            </el-select>
            <el-input v-else v-model="config.proxyConfigValue" readonly disabled />
          </el-col>

          <el-col v-else-if="config.proxyConfigName == 'balance'" :span="12">
            <el-select v-model="config.proxyConfigValue" :placeholder="'请选择' + config.desc" style="width: 100%">
              <el-option v-for="item in robinList" :key="item" :label="item.describe || item.name" :value="item.name" />
            </el-select>
          </el-col>

          <el-col v-else-if="config.proxyConfigName == 'open-log'" :span="12">
            <el-switch v-model="config.proxyConfigValue" active-value="true" inactive-value="false" />
          </el-col>

          <el-col :span="12">
            <el-button title="保存" type="primary" :icon="useRenderIcon('ep:lock')" style="margin-left: 10px" @click="saveConfigItem(config)" />
            <el-button v-if="config.proxyConfigValue == 'STATISTIC'" title="配置" type="default" :icon="useRenderIcon('ep:setting')" style="margin-left: 10px" @click="openServiceDiscovery()" />
          </el-col>
        </el-row>
      </el-form-item>
    </el-form>
  </div>
  <div>
    <Suspense v-if="statisticLayoutVisible1">
      <template #default>
        <div>
          <statistic-layout v-if="statisticLayoutVisible" ref="statisticLayoutRef" />
        </div>
      </template>
    </Suspense>
  </div>
</template>
<script>
import { fetchProxyConfigList, fetchProxyConfigUpdate, fetchProxyConfigSave } from "@/api/monitor/proxy";
import { fetchOptionGet, fetchOptionList, fetchOptionObjectsList } from "@/api/spi";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { defineAsyncComponent } from "vue";
export default {
  components: {
    StatisticLayout: defineAsyncComponent(() => import("../statistic/index.vue"))
  },
  props: {
    form: {
      type: Object,
      default: () => ({})
    },
    pluginId: {
      type: String,
      default: ""
    }
  },
  data() {
    return {
      statisticLayoutVisible: false,
      statisticLayoutVisible1: false,
      robinList: [],
      serviceDiscoveryList: [],
      configs: [
        {
          proxyConfigName: "serviceDiscovery",
          desc: "发现服务",
          proxyConfigValue: "",
          proxyId: this.form.proxyId
        },
        {
          proxyConfigName: "balance",
          desc: "负载均衡",
          proxyConfigValue: "",
          proxyId: this.form.proxyId
        },
        {
          proxyConfigName: "open-log",
          desc: "实时日志",
          proxyConfigValue: "false",
          proxyId: this.form.proxyId
        }
      ]
    };
  },
  async mounted() {
    setTimeout(() => {
      this.statisticLayoutVisible1 = true;
    }, 100);
    this.serviceDiscoveryList = (await fetchOptionObjectsList({ type: "serviceDiscovery" }))?.data || [];
    this.serviceDiscoveryList.push({
      name: "STATISTIC",
      describe: "静态代理"
    });
    this.robinList = (await fetchOptionGet({ type: "robin" }))?.data || [];
    fetchProxyConfigList(this.form).then(res => {
      if (res.code == "00000") {
        this.configs.forEach(it => {
          it.proxyConfigValue = res.data.filter(it1 => it1.proxyConfigName == it.proxyConfigName)[0]?.proxyConfigValue;
          it.proxyConfigId = res.data.filter(it1 => it1.proxyConfigName == it.proxyConfigName)[0]?.proxyConfigId;
          it.proxyPluginId = res.data.filter(it1 => it1.proxyConfigName == it.proxyConfigName)[0]?.proxyPluginId;
        });
      }
    });
  },
  methods: {
    useRenderIcon,
    saveConfigItem(config) {
      if (config.proxyPluginId == null) {
        config.proxyPluginId = "0";
      }
      if (config.proxyConfigId) {
        return fetchProxyConfigUpdate(config).then(res => {
          if (res.code == "00000") {
            this.$message.success("操作成功");
            return;
          }
          this.$message.error(res.msg);
        });
      }
      return fetchProxyConfigSave(config).then(res => {
        if (res.code == "00000") {
          this.$message.success("操作成功");
          return;
        }
        this.$message.error(res.msg);
      });
    },
    openServiceDiscovery() {
      this.statisticLayoutVisible = true;
      this.$nextTick(() => {
        setTimeout(() => {
          this.$refs.statisticLayoutRef.setData(this.form).open();
        }, 300);
      });
      return false;
    }
  }
};
</script>
