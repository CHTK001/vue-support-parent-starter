<template>
  <div class="h-full">
    <el-dialog v-model="visiable" width="70%" top="10px" draggable :title="title" :close-on-click-modal="false" :destroy-on-close="true">
      <el-header>
        <div>
          <el-input v-model="form.className" placeholder="请输入类名" />
        </div>
        <div class="left-panel">
          <sc-select-filter :data="selectedValuesItem" :selected-values="selectedValues" :label-width="80" @on-change="change" />
          <br />
        </div>
      </el-header>
      <el-main class="nopadding !h-[600px]">
        <scTable ref="table" :filter="filter" :dataTotal="total" :pageSize="form.pageSize" :data="data" :params="params" :initiSearch="false" paginationLayout="total, prev, pager, next">
          <el-table-column label="应用名称" prop="configApplicationName">
            <template #default>
              <el-tag>{{ metadata.applicationName }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="环境" prop="configProfile" show-overflow-tooltip />
          <el-table-column label="名称" prop="name" show-overflow-tooltip width="230" />
          <el-table-column label="日志等级" prop="effectiveLevel">
            <template #default="scope">
              <el-tag v-if="scope.row?.effectiveLevel == 'DEBUG'" type="info">{{ scope.row?.effectiveLevel }}</el-tag>
              <el-tag v-else-if="scope.row?.effectiveLevel == 'OFF'" type="info">{{ scope.row?.effectiveLevel }}</el-tag>
              <el-tag v-else-if="scope.row?.effectiveLevel == 'TRACE'" type="info">{{ scope.row?.effectiveLevel }}</el-tag>
              <el-tag v-else-if="scope.row?.effectiveLevel == 'WARN'" type="warning">{{ scope.row?.effectiveLevel }}</el-tag>
              <el-tag v-else-if="scope.row?.effectiveLevel == 'ERROR'" type="danger">{{ scope.row?.effectiveLevel }}</el-tag>
              <el-tag v-else>{{ scope.row?.effectiveLevel }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="配置等级" prop="configuredLevel" show-overflow-tooltip />
          <el-table-column label="操作" prop="" width="650">
            <template #default="scope">
              <span v-for="item in selectedValuesItem[0].options" :key="item">
                <el-button v-if="!!item?.value" :type="item?.value == scope.row?.effectiveLevel ? 'primary' : 'default'" @click="changeLevels(scope.row, item)">
                  {{ item.value }}
                </el-button>
              </span>
            </template>
          </el-table-column>
        </scTable>
      </el-main>
    </el-dialog>
  </div>
</template>

<script>
import scSelectFilter from "@repo/components/ScSelectFilter/index.vue";
import { fetchActuatorCall } from "@/api/monitor/actuator";
export default {
  components: { scSelectFilter },
  data() {
    return {
      params: {},
      selectedValues: {},
      selectedValuesItem: [
        {
          title: "日志级别",
          key: "levels",
          multiple: !1,
          options: [
            {
              label: "全部",
              value: ""
            },
            {
              label: "OFF",
              value: "OFF"
            },
            {
              label: "ERROR",
              value: "ERROR"
            },
            {
              label: "WRAN",
              value: "WRAN"
            },
            {
              label: "INFO",
              value: "INFO"
            },
            {
              label: "DEBUG",
              value: "DEBUG"
            },
            {
              label: "TRACE",
              value: "TRACE"
            }
          ]
        }
      ],
      visiable: false,
      form: {
        className: null
      },
      metadata: {},
      item: {},
      data: [],
      loggers: {},
      title: "",
      total: 0
    };
  },
  watch: {
    className: {
      handler(val) {
        this.$refs.table.reload();
      }
    }
  },

  methods: {
    filter(_value) {
      var rs = !this.selectedValues.levels || this.selectedValues.levels == (_value?.effectiveLevel || _value?.configuredLevel);
      var rs1 = !!this.className ? _value?.name.indexOf(this.className) > -1 : true;
      return rs && rs1;
    },
    change(selected) {
      this.selectedValues = selected;
      this.$refs.table.reload();
    },
    changeLevels(item, level) {
      fetchActuatorCall({
        url: `http://${this.item.host}:${this.item.port}${this.metadata.contextPath}${this.metadata.endpointsUrl}/loggers/${item.name}`,
        method: "POST",
        body: JSON.stringify({
          configuredLevel: level.value
        })
      }).then(res => {
        if (res.code === "00000") {
          this.$message.success("操作成功");
          item.effectiveLevel = level.value;
          item.configuredLevel = level.value;
          return 0;
        }
        this.$message.error(res.msg);
      });
    },
    rebuild(data) {
      this.total = Object.keys(data).length;
      const rs = [];
      for (const k of Object.keys(data)) {
        let v = data[k];
        rs.push({
          name: k,
          configApplicationName: this.metadata.applicationName,
          configProfile: this.metadata.applicationActive,
          configuredLevel: v.configuredLevel,
          effectiveLevel: v.effectiveLevel,
          filters: !0
        });
      }

      return rs;
    },
    open(item) {
      const metadata = item.metadata;
      this.metadata = metadata;
      this.item = item;
      this.visiable = true;
      this.title = metadata?.applicationName + "日志配置";
      fetchActuatorCall({
        url: `http://${item.host}:${item.port}${metadata.contextPath}${metadata.endpointsUrl}/loggers`,
        method: "GET"
      }).then(res => {
        if (res.code === "00000") {
          const data = JSON.parse(res.data);
          this.levels = data.levels;
          this.loggers = res.data.loggers;
          this.data = this.rebuild(data.loggers);
        }
      });
    }
  }
};
</script>
