<template>
  <div>
    <el-drawer v-model="visible" :title="config.title" @close="handleClose">
      <AcArticle :data="config.configList" />
    </el-drawer>
  </div>
</template>
<script setup>
import { ref, defineExpose, defineAsyncComponent } from "vue";
const AcArticle = defineAsyncComponent(() => import("@repo/components/ScArticle/index.vue"));

const config = {
  title: "",
  data: {},
  configList: [
    {
      id: 452,
      blog_class: "42",
      title: "Node.js + Docker自动化部署",
      count: 56,
      create_time: "2024-08-26T00:00:00.000Z",
      home_img: "",
      brief:
        "本章将介绍 Node.js 使用 Docker 、Webhook 自动化部署、蓝绿部署、项目到服务器。1、Mac os 安装 Docker 客户端 OrbStack我这里使用的是第三方客户端，相比于官方的，较轻量，启动速度快OrbStack 是一种快速、轻便且简单的运行 Docker 容器和 Linux 的方法。使用我们的 Docker Desktop 替代方案以光速进行开发。下载地址： http",
      type_name: "Node.js",
      html_content: ""
    }
  ]
};
const visible = ref(false);

const handleClose = async () => {
  visible.value = false;
  config.data = {};
};
const handleOpen = async data => {
  config.data = data;
  visible.value = true;
};

defineExpose({ handleOpen });
</script>
