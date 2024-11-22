<template>
  <el-container>
    <el-header>
      <div class="left-panel">
        <el-radio-group v-model="showType" size="mini">
          <el-radio-button label="list">列表</el-radio-button>
          <el-radio-button label="grid">卡片</el-radio-button>
        </el-radio-group>
      </div>
      <div class="right-panel">
        <el-select v-model="limit" style="height: 30px; width: 100px; margin-left: 10px">
          <el-option v-for="item in [10, 20, 50, 100, 200, 500, 1000]" :key="item" :label="item + '条'" :value="item" />
        </el-select>
        <el-button :icon="useRenderIcon('ep:refresh')" style="height: 30px; margin-left: 10px" @click="afterPropertiesSet()" />
      </div>
    </el-header>
    <el-main style="padding-top: 10px">
      <el-page-header @back="onBack">
        <template #breadcrumb>
          <el-breadcrumb>
            <el-breadcrumb-item v-for="item in router" :key="item">{{ item }}</el-breadcrumb-item>
          </el-breadcrumb>
        </template>
        <template #content>
          <div class="flex items-center">
            <el-tag v-if="marker">{{ marker }}</el-tag>
          </div>
        </template>
        <el-skeleton :rows="1" :loading="loading" animated />
        <div v-if="!loading">
          <el-empty v-if="metadata.length == 0" description="暂无数据" />
          <div v-else>
            <list-layout
              v-if="showType == 'list'"
              :canPreview="canPreview"
              :canDownload="canDownload"
              :menu="menu"
              :data="metadata"
              :parentPath="path"
              @copy="doCopy"
              @download="doDownload"
              @search="doSearch"
              @preview="doPreview"
            />
            <grid-layout
              v-else-if="showType == 'grid'"
              :menu="menu"
              :canPreview="canPreview"
              :canDownload="canDownload"
              :data="metadata"
              :parentPath="path"
              @copy="doCopy"
              @download="doDownload"
              @search="doSearch"
              @preview="doPreview"
            />
            <el-pagination
              v-model:current-page="currentPage1"
              next-text="下一页"
              :page-size="limit"
              layout="->, next"
              :total="total"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
            <view-layout v-if="viewLayoutStatus && canPreview" ref="viewLayoutRef" :menu="menu" />
            <download-layout v-if="downloadLayoutStatus && canDownload" ref="downloadLayoutRef" :menu="menu" />
          </div>
        </div>
      </el-page-header>
    </el-main>
  </el-container>
</template>
<script>
import ListLayout from "../layout/ListLayout.vue";
import GridLayout from "../layout/GridLayout.vue";
import ViewLayout from "../layout/ViewLayout.vue";
import DownloadLayout from "../layout/DownloadLayout.vue";
import { fetchOssViewer } from "@/api/monitor/oss";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { normalizePath } from "@repo/config";
import { copyTextToClipboard } from "@pureadmin/utils";
import { message } from "@repo/utils";
export default {
  components: {
    ListLayout,
    GridLayout,
    ViewLayout,
    DownloadLayout
  },
  props: {
    form: {
      type: Object,
      default: () => {
        return {};
      }
    },
    menu: {
      type: Object,
      default: () => {
        return {};
      }
    }
  },
  data() {
    return {
      viewLayoutStatus: false,
      downloadLayoutStatus: false,
      total: 1000000000,
      currentPage1: 1,
      showType: "grid",
      router: ["/"],
      marker: null,
      path: "/",
      limit: 100,
      loading: true,
      metadata: [],
      canPreview: false,
      canDownload: false
    };
  },
  watch: {
    form: {
      handler(val) {
        this.check(val);
      },
      deep: true
    }
  },
  mounted() {
    this.check(this.form);
    this.afterPropertiesSet();
  },
  methods: {
    useRenderIcon,
    check(form) {
      this.canPreview = form.fileStorageProtocolStatus == 1 && (form.fileStorageProtocolPreviewOrDownload == 0 || form.fileStorageProtocolPreviewOrDownload == 1);
      this.canDownload = form.fileStorageProtocolStatus == 1 && (form.fileStorageProtocolPreviewOrDownload == 0 || form.fileStorageProtocolPreviewOrDownload == 2);
    },
    handleSizeChange(val) {
      this.limit = val;
    },
    handleCurrentChange(val) {
      this.afterPropertiesSet(this.marker);
    },
    onBack() {
      this.router = this.router.slice(0, this.router.length - 1);
      if (this.router.length == 0) {
        this.router.push("/");
        return;
      }
      this.path = this.router.join("/");
      this.afterPropertiesSet();
    },
    doPreview(path, row) {
      if (!this.canPreview) {
        return;
      }
      this.viewLayoutStatus = true;
      this.$nextTick(() => {
        this.$refs.viewLayoutRef.setData(path, row, this.menu, this.form).open();
      });
    },
    doCopy(path, row) {
      if (!this.canPreview) {
        return;
      }
      const path1 =
        this.form.fileStorageProtocolName.toLowerCase() +
        "://" +
        this.getHost(this.form) +
        ":" +
        this.form.fileStorageProtocolPort +
        (this.menu.fileStorageBucket.startsWith("/") ? this.menu.fileStorageBucket : "/" + this.menu.fileStorageBucket) +
        (path.startsWith("/") ? path : "/" + path);
      const _this = this;
      if (copyTextToClipboard(path1)) {
        message("复制成功!", { duration: 3000, type: "success" });
      }
    },
    getHost(form) {
      const fileStorageProtocolHost = form.fileStorageProtocolHost;
      return "0.0.0.0" == fileStorageProtocolHost ? "127.0.0.1" : fileStorageProtocolHost;
    },
    doDownload(path, row) {
      if (!this.canDownload) {
        this.$message.error("该文件不支持下载");
        return;
      }
      this.downloadLayoutStatus = true;
      this.$nextTick(() => {
        this.$refs.downloadLayoutRef.setData(path, row, this.menu, this.form).open();
      });
    },
    doSearch(path) {
      this.path = normalizePath(path);
      this.router.length = 0;
      this.router.push("/");
      this.path.split("/").forEach(item => {
        if (!item) {
          return;
        }
        this.router.push(item);
      });
      this.afterPropertiesSet();
    },

    afterPropertiesSet(marker) {
      if (!marker) {
        this.total = 10000000000000;
      }
      this.loading = true;
      fetchOssViewer({
        fileStorageId: this.menu.fileStorageId,
        limit: this.limit,
        marker: marker,
        path: this.path
      })
        .then(res => {
          if (res.code == "00000") {
            this.metadata = res.data.metadata || [];
            this.marker = res.data.marker;
            if (this.metadata.length == 0 || this.metadata.length < this.limit) {
              this.total = 0;
              this.marker = null;
            }
          }
        })
        .finally(() => {
          this.loading = false;
        });
    }
  }
};
</script>
