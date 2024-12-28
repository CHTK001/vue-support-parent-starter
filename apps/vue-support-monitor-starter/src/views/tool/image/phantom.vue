<script setup>
import { fetchToolPhantom } from "@/api/monitor/tools";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { ref } from "vue";

const form = new FormData();
const leftFile = ref();
const rightFile = ref();
const sourceImage = ref();
const handleLeftChange = async file => {
  leftFile.value = file.raw;
  sourceImage.value = null;
};

const handleRightChange = async file => {
  rightFile.value = file.raw;
  sourceImage.value = null;
};

const handleGenerate = async () => {
  const form = new FormData();
  form.append("files", leftFile.value);
  form.append("files", rightFile.value);
  fetchToolPhantom(form).then(res => {
    sourceImage.value = "data:image/png;base64," + res.data;
  });
};
</script>

<template>
  <div class="h-dvh">
    <el-row :gutter="20" class="h-full">
      <el-col :span="12" class="h-full">
        <el-row class="h-[300px] relative top-[20px] flex justify-start items-start">
          <el-col :span="10" class="h-full">
            <el-upload drag class="h-full" :auto-upload="false" :limit="1" :on-change="handleLeftChange" accept="jpeg,jpg,png">
              <el-icon class="el-icon--upload">
                <component :is="useRenderIcon('ep:upload')" />
              </el-icon>
              <div class="el-upload__text">先选择一张本地图片（亮）</div>
            </el-upload>
          </el-col>

          <el-col :span="4" class="h-full flex justify-center items-center">
            <el-button :icon="useRenderIcon('ri:save-2-line')" type="primary" class="w-full h-full relative top-1/4" @click="handleGenerate" />
          </el-col>

          <el-col :span="10" class="h-full">
            <el-upload drag class="h-full" :auto-upload="false" :limit="1" :on-change="handleRightChange" accept="jpeg,jpg,png">
              <el-icon class="el-icon--upload">
                <component :is="useRenderIcon('ep:upload')" />
              </el-icon>
              <div class="el-upload__text">先选择一张本地图片（暗）</div>
            </el-upload>
          </el-col>
        </el-row>
      </el-col>
      <el-col :span="12">
        <el-image v-if="sourceImage" :src="sourceImage" />
        <el-empty v-else />
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss"></style>
