<template>
  <el-dialog
    v-model="visible"
    title="MD5计算测试"
    width="600px"
    :close-on-click-modal="false"
  >
    <div class="md5-test">
      <el-upload
        ref="uploadRef"
        :auto-upload="false"
        :show-file-list="false"
        :on-change="handleFileChange"
        drag
      >
        <div class="upload-area">
          <IconifyIconOnline icon="ri:file-upload-line" class="upload-icon" />
          <div class="upload-text">
            <p>选择文件测试MD5计算</p>
            <p class="text-sm text-[var(--el-text-color-regular)]">支持任意文件类型</p>
          </div>
        </div>
      </el-upload>

      <div v-if="selectedFile" class="file-info">
        <h4>文件信息</h4>
        <p><strong>文件名:</strong> {{ selectedFile.name }}</p>
        <p><strong>文件大小:</strong> {{ formatFileSize(selectedFile.size) }}</p>
        <p><strong>文件类型:</strong> {{ selectedFile.type || '未知' }}</p>
        <p><strong>最后修改:</strong> {{ new Date(selectedFile.lastModified).toLocaleString() }}</p>
      </div>

      <div v-if="isCalculating" class="calculating">
        <el-progress :percentage="progress" :stroke-width="8" />
        <p class="mt-2">正在计算MD5哈希值...</p>
      </div>

      <div v-if="results.length" class="results">
        <h4>计算结果</h4>
        <div v-for="(result, index) in results" :key="index" class="result-item">
          <div class="result-header">
            <strong>{{ result.method }}</strong>
            <span class="time">{{ result.time }}ms</span>
          </div>
          <div class="result-hash">
            <el-input
              :value="result.hash"
              readonly
              size="small"
            >
              <template #append>
                <el-button @click="copyToClipboard(result.hash)">
                  <IconifyIconOnline icon="ri:file-copy-line" />
                </el-button>
              </template>
            </el-input>
          </div>
        </div>
      </div>

      <div class="actions">
        <el-button v-if="selectedFile" type="primary" @click="calculateMD5" :loading="isCalculating">
          计算MD5
        </el-button>
        <el-button @click="clearResults">清空结果</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import { formatBytes } from "@pureadmin/utils";
import SparkMD5 from "spark-md5";

// Props & Emits
const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

// 响应式数据
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const selectedFile = ref<File | null>(null);
const isCalculating = ref(false);
const progress = ref(0);
const results = ref<Array<{
  method: string;
  hash: string;
  time: number;
}>>([]);

/**
 * 处理文件选择
 */
const handleFileChange = (file: any) => {
  selectedFile.value = file.raw;
  results.value = [];
};

/**
 * 格式化文件大小
 */
const formatFileSize = (size: number) => {
  return formatBytes(size);
};

/**
 * 计算MD5 - 标准方法
 */
const calculateStandardMD5 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const spark = new SparkMD5.ArrayBuffer();
    
    reader.onload = (e) => {
      try {
        spark.append(e.target?.result as ArrayBuffer);
        const md5Hash = spark.end();
        resolve(md5Hash);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error("读取文件失败"));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * 计算MD5 - 分片方法（适用于大文件）
 */
const calculateChunkedMD5 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const spark = new SparkMD5.ArrayBuffer();
    const fileReader = new FileReader();
    const chunkSize = 2097152; // 2MB chunks
    const chunks = Math.ceil(file.size / chunkSize);
    let currentChunk = 0;

    const loadNext = () => {
      const start = currentChunk * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      
      fileReader.readAsArrayBuffer(chunk);
    };

    fileReader.onload = (e) => {
      try {
        spark.append(e.target?.result as ArrayBuffer);
        currentChunk++;
        
        // 更新进度
        progress.value = Math.round((currentChunk / chunks) * 100);

        if (currentChunk < chunks) {
          loadNext();
        } else {
          const md5Hash = spark.end();
          resolve(md5Hash);
        }
      } catch (error) {
        reject(error);
      }
    };

    fileReader.onerror = () => reject(new Error("读取文件失败"));
    loadNext();
  });
};

/**
 * 计算MD5
 */
const calculateMD5 = async () => {
  if (!selectedFile.value) return;

  isCalculating.value = true;
  progress.value = 0;
  results.value = [];

  try {
    // 标准方法
    const startTime1 = Date.now();
    const hash1 = await calculateStandardMD5(selectedFile.value);
    const time1 = Date.now() - startTime1;
    
    results.value.push({
      method: "标准方法",
      hash: hash1,
      time: time1
    });

    // 分片方法
    progress.value = 0;
    const startTime2 = Date.now();
    const hash2 = await calculateChunkedMD5(selectedFile.value);
    const time2 = Date.now() - startTime2;
    
    results.value.push({
      method: "分片方法",
      hash: hash2,
      time: time2
    });

    // 验证结果一致性
    if (hash1 === hash2) {
      ElMessage.success("MD5计算完成，两种方法结果一致");
    } else {
      ElMessage.error("警告：两种方法计算结果不一致！");
    }

  } catch (error) {
    console.error("MD5计算失败:", error);
    ElMessage.error("MD5计算失败");
  } finally {
    isCalculating.value = false;
    progress.value = 0;
  }
};

/**
 * 复制到剪贴板
 */
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success("已复制到剪贴板");
  } catch (error) {
    ElMessage.error("复制失败");
  }
};

/**
 * 清空结果
 */
const clearResults = () => {
  selectedFile.value = null;
  results.value = [];
  progress.value = 0;
};
</script>

<style scoped lang="scss">
.md5-test {
  .upload-area {
    padding: 40px 20px;
    text-align: center;
    border: 2px dashed #dcdfe6;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      border-color: #409eff;
      background-color: #f0f9ff;
    }

    .upload-icon {
      font-size: 48px;
      color: #c0c4cc;
      margin-bottom: 16px;
    }

    .upload-text p {
      margin: 4px 0;
    }
  }

  .file-info {
    margin: 20px 0;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 8px;

    h4 {
      margin: 0 0 12px 0;
      color: #303133;
    }

    p {
      margin: 8px 0;
      color: #606266;
    }
  }

  .calculating {
    margin: 20px 0;
    text-align: center;
  }

  .results {
    margin: 20px 0;

    h4 {
      margin: 0 0 16px 0;
      color: #303133;
    }

    .result-item {
      margin-bottom: 16px;
      padding: 12px;
      border: 1px solid #ebeef5;
      border-radius: 8px;

      .result-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        .time {
          color: #909399;
          font-size: 12px;
        }
      }

      .result-hash {
        font-family: monospace;
      }
    }
  }

  .actions {
    margin-top: 20px;
    text-align: center;

    .el-button {
      margin: 0 8px;
    }
  }
}
</style>
