<template>
  <el-dialog v-model="visible" title="控制台" width="80%" draggable top="20px" :close-on-click-modal="false">
    <el-container>
      <el-header>
        <div class="left-panel">
          <el-button type="primary" :icon="useRenderIcon('ep:plus')" @click="doAddSave" />
        </div>
        <div class="right-panel">
          <div class="right-panel-search">
            <el-button type="primary" :icon="useRenderIcon('ep:search')" @click="search" />
          </div>
        </div>
      </el-header>
      <el-main class="nopadding">
        <el-empty v-if="returnData.length === 0" />
        <el-tabs v-else v-model="activeName" class="demo-tabs !min-h-[600px]" @tab-click="handleClick">
          <el-tab-pane
            v-for="item in returnData"
            :key="item"
            ref="myTable"
            class="!min-h-[600px]"
            :label="item.templateName + '.' + item.templateType"
            :name="item.templateName + '.' + item.templateType"
          >
            <div style="position: relative" class="!min-h-[600px]">
              <ScCodeEditor
                :ref="item.templateName + '.' + item.templateType"
                v-model="item.templateContent"
                :height="650"
                :options="options"
                :onInput="onInput"
                :onCursorActivity="onCursorActivity"
                mode="groovy"
              />
              <el-button
                v-if="item.templateId"
                size="small"
                type="primary"
                :icon="useRenderIcon('ri:save-2-line')"
                :loading="isLoadDatabase"
                style="position: absolute; top: 0; right: 10px"
                @click="doSave(item)"
              />
              <el-button
                v-if="item.templateId"
                size="small"
                type="danger"
                :icon="useRenderIcon('ep:delete')"
                :loading="isLoadDatabase"
                style="position: absolute; top: 0; right: 58px"
                @click="doDelete(item)"
              />
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-main>
    </el-container>

    <save-dialog v-if="saveDialogStatus" ref="saveDialogRef" @success="handlerSuccess" />
  </el-dialog>
</template>
<script>
import { fetchGenTemplateDelete, fetchGenTemplatePage, fetchGenTemplateUpdate } from "@/api/monitor/gen/template";
import ScCodeEditor from "@repo/components/ScCodeEditor/index.vue";
import SaveDialog from "./save.vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";

export default {
  components: { ScCodeEditor, SaveDialog },
  data() {
    return {
      form: {
        page: 1,
        pageSize: 10
      },
      activeName: "first",
      data: null,
      isLoadDatabase: false,
      saveDialogStatus: false,
      returnData: [],
      returnTotal: 0,
      visible: false,
      options: {
        height: 1000,
        hintOptions: {
          // 自定义提示选项
          completeSingle: false
        }
      }
    };
  },
  unmounted() {
    window.removeEventListener("keydown", this.handleEvent);
  },
  mounted() {
    // this.form.genId = this.$route.params.genId;
    // if (!this.form.genId || this.form.genId === 'null') {
    //     delete this.form.genId;
    // }
    // window.addEventListener('keydown', this.handleEvent)
    // this.search();
  },
  methods: {
    useRenderIcon,
    open(mode = "add") {
      this.visible = true;
      return this;
    },
    setData(form) {
      this.form.genId = form.genId;
      window.addEventListener("keydown", this.handleEvent);
      this.search();
      return this;
    },
    doAddSave() {
      this.saveDialogStatus = true;
      this.$nextTick(() => {
        this.$refs.saveDialogRef.open();
      });
    },
    handlerSuccess() {
      this.search();
    },
    doSave(row) {
      this.isLoadDatabase = true;
      fetchGenTemplateUpdate(row)
        .then(res => {
          if (res.code == "00000") {
            this.$message.success("操作成功");
            return;
          }
          this.$message.error(res.msg);
        })
        .finally(() => (this.isLoadDatabase = false));
    },
    doDelete(row) {
      this.isLoadDatabase = true;
      fetchGenTemplateDelete({ id: row.templateId })
        .then(res => {
          if (res.code == "00000") {
            this.$message.success("操作成功");
            this.search();
            return;
          }
          this.$message.error(res.msg);
        })
        .finally(() => (this.isLoadDatabase = false));
    },
    handleClick(tab, event) {
      this.data = this.returnData[tab.index];
      this.$nextTick(() => {
        this.$refs[tab.paneName][0].refresh();
      });
    },
    onInput(val, s) {
      if (s.code.indexOf("Arrow") > -1) {
        return false;
      }
      val.showHint();
    },
    onCursorActivity(cm, s) {
      if (!cm.getSelection()) {
        console.log(cm.getSelection()); // 获取到选中部分内容，用来实现执行部分内容
      }
    },
    search() {
      this.isLoadDatabase = true;
      fetchGenTemplatePage(this.form)
        .then(res => {
          if (res.code == "00000") {
            this.returnData = res.data.data;
            this.returnTotal = res.data.total;
            if (this.returnData.length > 0) {
              this.data = this.returnData[0];
              this.activeName = this.data.templateName + "." + this.data.templateType;
            }
            return;
          }
          this.$message.error(res.msg);
        })
        .finally(() => (this.isLoadDatabase = false));
    },
    async handleEvent(event) {
      switch (event.keyCode) {
        case 37:
          console.log("ctrl + ←");
          break;
        case 38:
          console.log("ctrl + ↑");
          break;
        case 39:
          console.log("ctrl + →");
          break;
        case 40:
          console.log("ctrl + ↓");
          break;
        case 67:
          console.log("ctrl + c");
          break;
        case 83:
          console.log("ctrl + s");
          event.preventDefault();
          event.returnValue = false; // 阻止直接保存网页

          if (event.ctrlKey && event.code === "KeyS") {
            // 在这里写保存需要执行的逻辑
            this.doSave(this.data);
          }
          // if (event.ctrlKey && event.code === 'KeyS') return false
          break;
        case 86:
          console.log("ctrl + v");
          break;
        case 89:
          console.log("ctrl + y");
          if (event.ctrlKey && event.code === "KeyY") {
            this.$router.go(+1);
          }
          break;
        case 90:
          // if (this.$route.path === '登录成功重定向的路由，比如控制台：/dashboard') return // 防止退出项目
          // if (event.ctrlKey && event.code === 'KeyZ') {
          //     this.$router.go(-1)
          // }
          break;
      }
    }
  }
};
</script>
<style scoped>
.demo-tabs {
  padding: 10px;
}
</style>
