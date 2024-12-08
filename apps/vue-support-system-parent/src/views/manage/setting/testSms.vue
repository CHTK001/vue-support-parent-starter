<script>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { message } from "@repo/utils";
import { defineComponent } from "vue";

import { fetchPageTemplate } from "@/api/manage/template";
import ScTableSelect from "@repo/components/ScTableSelect/index.vue";
import ScFormTable from "@repo/components/ScFormTable/index.vue";
import { fetchSmsSender } from "@/api/manage/sms";
export default defineComponent({
  components: { ScTableSelect, ScFormTable },
  data() {
    return {
      appType: null,
      form: {
        sysTemplateId: null,
        target: []
      },
      template: {
        key: null,
        value: null
      },
      tempData: [],
      sysTemplateObject: {},
      props: {
        label: "sysTemplateName",
        value: "sysTemplateId",
        keyword: "keyword"
      },
      target: null,
      params: {},
      visible: false
    };
  },
  watch: {
    tempData: {
      handler(val) {
        if (val) {
          this.form.params = {};
          val.forEach(item => {
            this.form.params[item["key"]] = item?.value;
          });
        }
      },
      deep: true,
      immediate: true
    },
    target: {
      handler(val) {
        this.form.target = val?.split(",")?.map(it => it.trim());
      },
      deep: true,
      immediate: true
    },
    sysTemplateObject: {
      handler(val) {
        this.form.sysTemplateId = val?.sysTemplateId;
      },
      deep: true,
      immediate: true
    }
  },
  mounted() {},
  methods: {
    useRenderIcon,
    fetchSmsSender,
    fetchPageTemplate,
    async afterPropertiesSet() {},
    setData(data) {
      Object.assign(this.form, data);
      this.appType = data.filter(it => it.sysSettingName === "appType")[0]?.sysSettingValue;
      this.params.sysDictItem1Code = this.appType;
      return this;
    },
    open(mode) {
      this.visible = true;
      this.afterPropertiesSet();
    },
    close() {
      this.visible = false;
      this.form = {};
    },
    async submit() {
      if (!this.form.sysTemplateId) {
        message("请选择短信模板", { type: "error" });
        return;
      }
      fetchSmsSender(this.form).then(res => {
        if (res.code === "00000") {
          message("发送成功", { type: "success" });
        } else {
          message(res?.message, { type: "error" });
        }
      });
    }
  }
});
</script>
<template>
  <div>
    <el-dialog v-model="visible" title="测试" :close-on-click-modal="false" draggable width="40%" @close="close">
      <el-form :model="form" label-width="100px">
        <el-form-item label="模板">
          <ScTableSelect v-model="sysTemplateObject" :props="props" :url="fetchPageTemplate" :params="params" class="w-[60%]">
            <el-table-column prop="sysTemplateName" label="模板名称" align="center" width="340px" show-overflow-tooltip>
              <template #default="{ row }">
                <div>
                  <el-tooltip v-if="row.sysTemplateRemark" :content="row.sysTemplateRemark">
                    <el-tag :title="row.sysTemplateName" effect="dark" size="small" class="w-[180px] truncate" style="margin-right: 5px">
                      {{ row.sysTemplateName }}
                    </el-tag>
                    <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">
                      {{ row.sysTemplateCode }}
                    </span>
                  </el-tooltip>
                  <div v-else>
                    <el-tag :title="row.sysTemplateName" effect="dark" size="small" class="w-[180px] truncate" style="margin-right: 5px">
                      {{ row.sysTemplateName }}
                    </el-tag>
                    <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">
                      {{ row.sysTemplateCode }}
                    </span>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="sysDictItem1Name" label="适用厂家" width="90px" show-overflow-tooltip />
            <el-table-column prop="sysDictItem2Name" label="模板类型" width="90px" show-overflow-tooltip>
              <template #default="{ row }">
                <el-tag>{{ row.sysDictItem2Name || "/" }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="sysTemplateContent" label="模板内容" align="center" show-overflow-tooltip>
              <template #default="{ row }">
                <span>{{ row.sysTemplateContent || "/" }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="sysTemplateStatus" label="状态" align="center">
              <template #default="{ row }">
                <el-tag>
                  <span v-if="row.sysTemplateStatus === 1">{{ $t("buttons.enable") }}</span>
                  <span v-else>{{ $t("buttons.disable") }}</span>
                </el-tag>
              </template>
            </el-table-column>
          </ScTableSelect>
          <div v-if="sysTemplateObject?.sysTemplateContent">
            {{ sysTemplateObject?.sysTemplateContent }}
          </div>
        </el-form-item>
        <el-form-item prop="被叫号码" label="被叫号码">
          <el-input v-model="target" placeholder="请输入被叫号码" />
        </el-form-item>
        <el-form-item prop="参数">
          <ScFormTable v-model="tempData" :add-template="template">
            <el-table-column prop="key" label="参数名" width="120px">
              <template #default="{ row }">
                <el-input v-model="row.key" placeholder="请输入参数名" />
              </template>
            </el-table-column>
            <el-table-column prop="value" label="参数值">
              <template #default="{ row }">
                <el-input v-model="row.value" placeholder="请输入参数值" />
              </template>
            </el-table-column>
          </ScFormTable>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" size="default" :icon="useRenderIcon('ep:refresh')" @click="submit">
          {{ $t("buttons.test") }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
