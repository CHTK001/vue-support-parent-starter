<template>
  <div class="bg-white p-[30px]">
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
    <qrcode-vue :value="textValue" :level="levelValue" :size="widthValue" />
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
