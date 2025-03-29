<template>
  <div>
    <el-skeleton :loading="loading" animated :count="6" />
    <div v-if="!isBlob">
      <div v-if="!loading" id="luckysheet" ref="luckysheet" :style="{ margin: '0px', padding: '0px', width: '100%', height: '650px' }" />
    </div>
    <div v-else>
      <el-icon class="cursor-pointer" style="font-size: 64px; position: relative; color: #ccc; top: calc(50% - 64px); left: calc(50% - 64px)" @click="download">
        <component :is="useRenderIcon('ri:download-2-fill')" />
      </el-icon>
    </div>
  </div>
</template>
<script>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { http } from "@repo/utils";
import LuckyExcel from "luckyexcel";
export default {
  props: {
    url: {
      type: String,
      default: ""
    },
    ua: {
      type: String,
      default: ""
    },
    name: {
      type: String,
      default: ""
    }
  },
  data() {
    return {
      data: null,
      loading: true,
      isBlob: false
    };
  },
  unmounted() {
    try {
      URL.revokeObjectURL(this.url);
    } catch (error) {}
    try {
      URL.revokeObjectURL(this.data);
    } catch (error) {}
  },
  mounted() {
    this.loading = true;
    this.data = null;
    const _this = this;
    if (this.url.startsWith("blob")) {
      this.loading = false;
      this.isBlob = true;
      try {
        var xhr = new XMLHttpRequest(); //创建XMLHttpRequest对象
        xhr.open("get", this.url, true); //建立http链接
        xhr.responseType = "blob";
        xhr.onload = function () {
          if (this.status == 200) {
            _this.isBlob = false;
            this.doRender(xhr.response);
          }
        };
        xhr.send();
      } catch (error) {}
      this.loading = false;
      return false;
    }
    this.$nextTick(() => {
      http
        .get(
          this.url,
          {},
          {
            headers: {
              "X-User-Agent": this.ua
            },
            responseType: "blob"
          }
        )
        .then(res => {
          this.data = URL.createObjectURL(res?.response.data);
          this.doRender(res);
        })
        .finally(() => {
          this.loading = false;
        });
    });
  },
  methods: {
    useRenderIcon,
    doRender(res) {
      const file = new File([res?.response.data], "filename.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      // 加载 excel 文件
      LuckyExcel.transformExcelToLucky(file, (exportJson, luckysheetfile) => {
        if (exportJson.sheets == null || exportJson.sheets.length == 0) {
          alert("文件读取失败!");
          return;
        }
        // 销毁原来的表格
        // luckysheet?.destroy();
        // 重新创建新表格
        luckysheet.create({
          container: "luckysheet", // 设定DOM容器的id
          showtoolbar: false, // 是否显示工具栏
          showinfobar: false, // 是否显示顶部信息栏
          showstatisticBar: false, // 是否显示底部计数栏
          sheetBottomConfig: false, // sheet页下方的添加行按钮和回到顶部按钮配置
          allowEdit: false, // 是否允许前台编辑
          showsheetbar: false,
          enableAddRow: false, // 是否允许增加行
          enableAddCol: false, // 是否允许增加列
          sheetFormulaBar: false, // 是否显示公式栏
          enableAddBackTop: false, //返回头部按钮
          data: exportJson.sheets, //表格内容
          title: exportJson.info.name //表格标题
        });
      });
    },
    download() {
      const box = document.createElement("a");
      box.download = this.name;
      box.href = this.data;
      box.click();
    }
  }
};
</script>
<style lang="scss" scoped>
:global(.viewer-close) {
  display: none;
}
</style>
