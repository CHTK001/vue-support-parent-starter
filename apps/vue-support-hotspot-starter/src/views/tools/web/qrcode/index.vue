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

<style lang="scss" scoped>
.page {
  padding: 0;
  background: var(--el-bg-color-page);
}

.page-header {
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-8) 100%);
  padding: 24px 32px;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 8px 0;

  .title-icon {
    font-size: 28px;
    color: var(--el-color-primary);
  }
}

.page-subtitle {
  color: var(--el-text-color-regular);
  font-size: 14px;
  margin: 0;
}

.qrcode-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.qrcode-wrapper {
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
}

.qrcode-info {
  display: flex;
  gap: 12px;
}

:deep(.el-card) {
  border-radius: 8px;
}
</style>
