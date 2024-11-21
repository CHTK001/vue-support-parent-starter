<template>
  <div style="height: 100%; width: 100%" class="overflow-auto !h-[660px]">
    <el-skeleton :loading="loading" animated :count="6" />
    <div v-if="!isBlob">
      <div v-if="!loading" style="height: 100%; width: 100%">
        <el-tree :data="data">
          <template #default="{ data }">
            <span class="custom-tree-node" @click="doDetail(data.url, data)">
              <div class="relative grid grid-cols-3">
                <div class="relative">
                  <img class="block absolute z-10 top-[-4px] left-[-6px] w-6 h-6 rounded-full shadow-lg" :src="getIcon(data.suffix)" />
                </div>
                <div>{{ data.name }}</div>
                <div />
              </div>
            </span>
          </template>
        </el-tree>
      </div>
    </div>
    <div v-else>
      <el-icon class="cursor-pointer" style="font-size: 64px; position: relative; color: #ccc; top: calc(50% - 64px); left: calc(50% - 64px)" @click="download">
        <component :is="useRenderIcon('ri:download-2-fill')" />
      </el-icon>
    </div>
  </div>
  <view-layout v-if="viewLayoutStatus" ref="viewLayoutRef" :menu="menu" />
</template>
<script>
import { getAssetsImages } from "@/utils/Utils";

import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { http } from "@repo/utils";
import JSZip from "jszip";
import ViewLayout from "../layout/Viewlayout.vue";

export default {
  components: {
    ViewLayout
  },
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
      viewLayoutStatus: false,
      data: null,
      loading: true,
      isBlob: false
    };
  },
  unmounted() {
    try {
      URL.revokeObjectURL(this.url);
    } catch (error) {}
  },
  mounted() {
    this.loading = true;
    this.data = null;
    if (this.url.startsWith("blob")) {
      this.loading = false;
      this.isBlob = true;
      return false;
    }
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
        const zipFile = new File([res.response.data], "1.zip");
        const jszip = new JSZip();
        const root = {};
        function pathsToTree(paths) {
          const parts = paths.split("/").filter(Boolean); // 分割路径并过滤空字符串
          const tpl = [];
          for (let i = 0; i < parts.length - 1; i++) {
            tpl.push(parts[i]);
          }
          return tpl.join("/") + "/";
        }
        function arrayToTree(items) {
          const result = []; // 用于存放根节点的数组
          const map = new Map(); // 用于快速查找子节点

          // 遍历所有项目并将其存储在map中，以便根据父ID查找
          items.forEach(item => {
            if (!map.has(item.id)) {
              map.set(item.id, item);
            }
            item.children = []; // 初始化children数组
          });

          items.forEach(item => {
            const parent = map.get(item.pid);
            if (parent) {
              // 如果有父节点，则添加到父节点的children数组中
              parent.children.push(item);
            } else {
              // 如果没有父节点，说明这是根节点
              result.push(item);
            }
          });

          return result;
        }
        const list = [];
        jszip.loadAsync(zipFile).then(zip => {
          // 读取zip
          for (let key in zip.files) {
            const current = pathsToTree(key);
            const keyArray = key.split("/");
            const item = {
              name: (zip.files[key].dir ? keyArray[keyArray.length - 2] : keyArray[keyArray.length - 1]) || "/", // 文件名
              type: zip.files[key].dir ? "dir" : "file", // 文件类型
              id: key,
              suffix: zip.files[key].dir ? null : zip.files[key].name.split(".").pop(), // 文件后缀
              mediaType: zip.files[key].dir ? null : this.isImageByExtension(key) ? "image" : zip.files[key].name.split(".").pop(), // 文件后缀
              absolutePath: key, // 文件绝对路径
              pid: current
            };
            list.push(item);
            if (item.type == "file") {
              zip
                .file(zip.files[key].name)
                .async("blob")
                .then(res => {
                  item.url = URL.createObjectURL(res);
                });
            }
          }

          this.data = arrayToTree(list);
        });
      })
      .finally(() => {
        this.loading = false;
      });
  },
  methods: {
    useRenderIcon,
    isImageByExtension(fileName) {
      const imageExtensions = [".jpeg", ".jpg", ".png", ".gif", ".webp", ".bmp"];
      const fileExtension = fileName.slice(((fileName.lastIndexOf(".") - 1) >>> 0) + 2);
      return imageExtensions.includes("." + fileExtension.toLowerCase());
    },
    download() {
      const box = document.createElement("a");
      box.download = this.name;
      box.href = this.url;
      box.click();
    },
    getIcon(name) {
      return getAssetsImages(!name ? "folder" : name);
    },
    doDetail(url, data) {
      if (!url) {
        return false;
      }
      this.doPreview(url, {
        filename: data.name,
        mediaType: {},
        suffix: data.mediaType
      });
    },
    doPreview(path, row) {
      this.viewLayoutStatus = true;
      this.$nextTick(() => {
        this.$refs.viewLayoutRef.setData(path, row, {}, {}, true).open();
      });
    }
  }
};
</script>
<style lang="scss" scoped>
.custom-tree-node {
  width: 60px;
}
</style>
