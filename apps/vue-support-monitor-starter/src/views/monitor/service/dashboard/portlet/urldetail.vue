<template>
  <div class="datav">
    <scDrag ref="dragRef" v-model="visible" :overlay="overlay" :zIndex="zIndex" title="链路追踪" :mini="true" height="80vh" width="80vw" :tech="datav" @close="onClose">
      <div class="h-full z-[10]">
        <el-form :inline="true">
          <el-form-item>
            <el-date-picker v-model="time" class="!w-[500px] bg-transparent" type="datetimerange" format="YYYY-MM-DD HH:mm:ss" />
          </el-form-item>
          <el-form-item>
            <el-button :icon="useRenderIcon('ep:search')" @click="doQuery" />
          </el-form-item>
        </el-form>

        <el-tree
          :data="data"
          :style="{
            height: '600px',
            'background- color': datav ? 'transparent' : '',
            '--datav': datav ? 'transparent' : '',
            color: datav ? '#fff' : 'unset',
            overflow: 'auto'
          }"
          :props="defaultProps"
        >
          <template #default="{ data }">
            <div class="flex flex-wrap bg-transparent">
              <div class="w-full max-w-full px-3 sm:flex-0 shrink-0 bg-transparent">
                <div class="relative flex flex-col min-w-0 break-words bg-transparent shadow-soft-xl dark:shadow-soft-dark-xl rounded-2xl bg-clip-border">
                  <div class="flex-auto">
                    <span class="custom-tree-node bg-transparent" :title="data.message">
                      <span v-if="data.id == data.linkId">
                        <span v-if="(data.message || '').indexOf('span') > -1" v-html="data.message || data.ex" />
                        <span v-else>Http {{ data.message || data.ex }}</span>
                      </span>
                      <span v-else>
                        <span>
                          <span v-if="(data.message || '').indexOf('span') > -1" v-html="data.message || data.ex" />
                          <span v-else-if="(data.typeMethod || '').indexOf('span') > -1 || (data.typeMethod || '').indexOf('el-tag') > -1" v-html="data.typeMethod" />
                          <span v-else class="text-pretty">{{ data.message }}</span>
                        </span>
                      </span>
                      @
                      <span v-if="data?.timestamp" style="height: 26px">
                        {{ dateFormat(data?.timestamp * 1) }}
                      </span>
                      耗时:
                      <span style="height: 26px">{{ data?.costTime }} ms</span>
                      <el-icon class="z-[10]" @click="showTrack(data)">
                        <component :is="useRenderIcon('ri:information-2-line')" />
                      </el-icon>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </el-tree>
      </div>
    </scDrag>

    <el-drawer ref="drawerRef" v-model="dialog" :title="detail.message" :append-to-body="true" size="60%" direction="rtl" class="demo-drawer bg-transparent" :destroy-on-close="true">
      <div class="demo-drawer__content bg-transparent">
        <el-descriptions border :column="1">
          <el-descriptions-item label="linkId">
            {{ detail.linkId }}
          </el-descriptions-item>
          <el-descriptions-item label="应用地址">
            <el-tag>{{ detail.applicationName }}</el-tag>
            {{ detail.applicationHost }}:{{ detail.applicationPort }}
          </el-descriptions-item>
          <el-descriptions-item label="进入方法时间">{{ dateFormat(detail.enterTime * 1) }}</el-descriptions-item>
          <el-descriptions-item label="耗时">{{ detail.costTime }} ms</el-descriptions-item>
        </el-descriptions>
        <div v-if="detail.header" class="!max-h-[500px]">
          <pre><code class="language-http">{{ detail.header }}</code></pre>
        </div>
        <div v-if="detail.stack" class="!max-h-[500px]">
          <pre><code class="language-java">{{ detail.stack  instanceof Array ? detail.stack.join('\r\n') : detail.stack}}</code></pre>
        </div>
      </div>
    </el-drawer>
  </div>
</template>
<script>
import { fetchSearchQuery } from "@/api/monitor/service";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import scDrag from "@repo/components/ScDrag/index.vue";
import { useConfigStore } from "@/store/modules/config";
import { dateFormat } from "@/utils/date";
import { Md5 } from "ts-md5";
// 引入Prism.js
import Prism from "prismjs";
// 引入SQL语言插件
import "prismjs/components/prism-sql.min.js";
import "prismjs/components/prism-http.min.js";
import "prismjs/themes/prism-tomorrow.min.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.min.css";
import "prismjs/plugins/line-highlight/prism-line-highlight.min.css";
import "prismjs/plugins/inline-color/prism-inline-color.min.css";
import { fa } from "element-plus/es/locale/index.mjs";
export default {
  components: { scDrag },
  props: {
    form: Object,
    datav: {
      type: Boolean,
      default: true
    },
    overlay: {
      type: Boolean,
      default: false
    },
    zIndex: {
      type: Number,
      default: 9
    }
  },
  data() {
    return {
      data: [],
      time: [],
      dialog: false,
      visible: false,
      confirmLoading: false,
      eventName: "",
      detail: {},
      defaultProps: {
        children: "children",
        label: "ex"
      }
    };
  },
  mounted() {
    this.time[1] = new Date().getTime();
    this.time[0] = new Date().getTime() - 86400000;
    const suffix = this.form.host + this.form.port;
    this.eventName = Md5.hashStr("TRACE:" + suffix);
    this.socket = useConfigStore().socket;
  },
  methods: {
    dateFormat,
    useRenderIcon,
    highlightSQL() {
      setTimeout(() => {
        const _this = this;
        Prism.highlightAll();
        this.$nextTick(() => {
          // 假设你的SQL代码在模板的pre标签中
          // 使用Prism.highlightElement来高亮代码
          try {
            document.querySelectorAll("pre code").forEach(ele => {
              Prism.highlightElement(ele);
            });
          } catch (error) {}
        });
      }, 300);
    },
    showTrack(data) {
      this.dialog = true;
      this.detail = data;
      this.highlightSQL();
      return 0;
    },
    doQuery() {
      const q = {};
      Object.assign(q, this.form.condition);
      q.name = "trace:" + this.eventName;
      q.fromTimestamp = this.time[0];
      q.count = 10;
      q.offset = 0;
      q.keyword = "@modelType:trace ";
      q.toTimestamp = this.time[1];
      fetchSearchQuery(q).then(res => {
        this.data = (res.data?.data || []).map(element => {
          element.children = JSON.parse(element.children || "[]");
          return element;
        });
      });
    },
    onClose() {
      this.visible = false;
      this.dialog = false;
      this.confirmLoading = false;
      this.$emit("close");
      this.socket?.off(this.eventName);
    },
    open() {
      this.visible = true;
      this.socket?.on(this.eventName, this.event);
    },
    event(data) {
      if (this.data.length > 100) {
        this.data.shift();
      }
      const item = JSON.parse(data?.data || "{}");
      this.data.push(item);
    }
  }
};
</script>
<style lang="scss" scoped>
.datav {
  position: relative;
  top: 10px;
}
:deep(.el-picker__popper) {
  z-index: 10;
}
:deep(.el-tree-node__content:hover) {
  background: var(--datav);
}
</style>
