<template>
  <div class="page flex flex-col h-full">
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <IconifyIconOnline icon="ri:qr-code-line" class="title-icon" />
            二维码生成器
          </h1>
          <p class="page-subtitle">将文本转换为二维码图片</p>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-auto">
      <el-card shadow="never">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form :inline="true">
              <el-form-item label="文本">
                <el-input v-model="textValue" type="textarea" :rows="10" class="!w-[500px]" />
              </el-form-item>
            </el-form>
            <el-form :inline="true">
              <el-form-item label="质量">
                <el-segmented
                  v-model="levelValue"
                  :options="[
                    { label: '高', value: 'H' },
                    { label: '中', value: 'M' },
                    { label: '低', value: 'L' }
                  ]"
                />
              </el-form-item>
            </el-form>
            <el-form :inline="true">
              <el-form-item label="大小">
                <el-slider v-model="widthValue" class="!min-w-[500px]" :min="100" :max="1024" show-tooltip />
              </el-form-item>
            </el-form>
          </el-col>
          <el-col :span="12">
            <div class="qrcode-preview">
              <div class="qrcode-wrapper">
                <qrcode-vue :value="textValue" :level="levelValue" :size="widthValue" />
              </div>
              <div class="qrcode-info">
                <el-tag>{{ widthValue }} x {{ widthValue }}</el-tag>
                <el-tag type="info">{{ levelValue }} 质量</el-tag>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>
  </div>
</template>

<script>
import QrcodeVue from "qrcode.vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";

export default {
  name: "QrCodeComponent",
  components: { QrcodeVue },
  data() {
    return {
      textValue: "测试",
      widthValue: 200,
      levelValue: "H",
      heightValue: 100
    };
  },
  methods: {
    useRenderIcon,
    generateQRCode() {
      const canvas = this.$refs.qrcodeCanvas;
      QRCode.toCanvas(canvas, this.textValue, error => {
        if (error) console.error(error);
      });
    }
  }
};
</script>
