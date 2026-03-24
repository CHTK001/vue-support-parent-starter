<template>
  <div class="font-encryption-demo">
    <div class="demo-header">
      <h2>字体加密功能演示</h2>
      <p>通过自定义字体实现真正的字体加密，防止复制</p>
    </div>

    <!-- 控制面板 -->
    <div class="control-panel">
      <h3>控制面板</h3>
      <div class="controls">
        <div class="control-item">
          <label>
            <input
              type="checkbox"
              v-model="enabled"
              @change="handleEnabledChange"
            />
            <span>启用字体加密</span>
          </label>
        </div>

        <div class="control-item" v-if="enabled">
          <label>
            <input
              type="checkbox"
              v-model="encryptNumbers"
              @change="handleConfigChange"
            />
            <span>加密数字</span>
          </label>
        </div>

        <div class="control-item" v-if="enabled">
          <label>
            <input
              type="checkbox"
              v-model="encryptChinese"
              @change="handleConfigChange"
            />
            <span>加密汉字</span>
          </label>
        </div>

        <div class="control-item" v-if="enabled">
          <label>
            <input
              type="checkbox"
              v-model="applyGlobal"
              @change="handleConfigChange"
            />
            <span>应用到全局</span>
          </label>
        </div>

        <div class="control-item">
          <label>
            <input
              type="checkbox"
              v-model="disableCopy"
              @change="handleCopyChange"
            />
            <span>禁用复制</span>
          </label>
        </div>
      </div>
    </div>

    <!-- 演示区域 -->
    <div class="demo-area">
      <div class="demo-section">
        <h3>使用指令方式（v-font-encryption）</h3>
        <div
          class="demo-content"
          v-font-encryption="{
            enabled: enabled,
            encryptNumbers: encryptNumbers,
            encryptChinese: encryptChinese,
            disableCopy: disableCopy,
          }"
        >
          <p>这是一段测试文本，包含数字：1234567890</p>
          <p>这是一段测试文本，包含汉字：这是一个测试，包含常用汉字如：的、了、在、是、我、有、和等。</p>
          <p>混合内容：我在2024年12月16日创建了这个功能，包含数字和汉字。</p>
        </div>
      </div>

      <div class="demo-section">
        <h3>使用类名方式（.font-encryption-enabled）</h3>
        <div
          class="demo-content"
          :class="{ 'font-encryption-enabled': enabled }"
        >
          <p>这是使用类名方式的测试：数字123456，汉字：测试文本。</p>
        </div>
      </div>

      <div class="demo-section">
        <h3>未加密的对比文本</h3>
        <div class="demo-content">
          <p>这是一段测试文本，包含数字：1234567890</p>
          <p>这是一段测试文本，包含汉字：这是一个测试，包含常用汉字如：的、了、在、是、我、有、和等。</p>
          <p>混合内容：我在2024年12月16日创建了这个功能，包含数字和汉字。</p>
        </div>
      </div>
    </div>

    <!-- 说明 -->
    <div class="demo-info">
      <h3>使用说明</h3>
      <ul>
        <li>
          <strong>字体加密：</strong>将数字和汉字替换为映射字符，通过自定义字体显示为原始字符
        </li>
        <li>
          <strong>防复制：</strong>用户看到的是正常文本，但复制到的是映射后的字符
        </li>
        <li>
          <strong>指令方式：</strong>使用 <code>v-font-encryption</code> 指令，支持动态配置
        </li>
        <li>
          <strong>类名方式：</strong>使用 <code>font-encryption-enabled</code> 类名，需要手动加密文本
        </li>
        <li>
          <strong>复制开关：</strong>可以禁用复制功能，防止用户复制内容
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { vFontEncryption } from "../directives/fontEncryption";
import { useFontEncryptionControl } from "../composables/useFontEncryptionControl";

// 使用字体加密控制
const {
  enabled,
  encryptNumbers,
  encryptChinese,
  applyGlobal,
  disableCopy,
  updateConfig,
} = useFontEncryptionControl({
  initialEnabled: false,
  initialEncryptNumbers: true,
  initialEncryptChinese: true,
  initialApplyGlobal: false,
  initialDisableCopy: false,
});

// 处理加密开关变化
const handleEnabledChange = () => {
  updateConfig({ enabled: enabled.value });
};

// 处理配置变化
const handleConfigChange = () => {
  if (enabled.value) {
    updateConfig({
      encryptNumbers: encryptNumbers.value,
      encryptChinese: encryptChinese.value,
      applyGlobal: applyGlobal.value,
    });
  }
};

// 处理复制开关变化
const handleCopyChange = () => {
  // 复制开关通过指令处理，这里不需要额外操作
};
</script>

<style scoped lang="scss">
.font-encryption-demo {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;

  .demo-header {
    margin-bottom: 30px;
    text-align: center;

    h2 {
      margin: 0 0 10px 0;
      font-size: 24px;
    }

    p {
      margin: 0;
      color: #666;
    }
  }

  .control-panel {
    background: #f5f5f5;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 30px;

    h3 {
      margin: 0 0 15px 0;
      font-size: 18px;
    }

    .controls {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;

      .control-item {
        label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;

          input[type="checkbox"] {
            width: 18px;
            height: 18px;
            cursor: pointer;
          }

          span {
            font-size: 14px;
          }
        }
      }
    }
  }

  .demo-area {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-bottom: 30px;

    .demo-section {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 15px;
      background: #fff;

      h3 {
        margin: 0 0 15px 0;
        font-size: 16px;
        color: #333;
      }

      .demo-content {
        padding: 15px;
        background: #fafafa;
        border-radius: 4px;
        min-height: 150px;

        p {
          margin: 10px 0;
          line-height: 1.6;
        }
      }
    }
  }

  .demo-info {
    background: #e8f4f8;
    padding: 20px;
    border-radius: 8px;
    border-left: 4px solid #1890ff;

    h3 {
      margin: 0 0 15px 0;
      font-size: 18px;
    }

    ul {
      margin: 0;
      padding-left: 20px;

      li {
        margin: 8px 0;
        line-height: 1.6;

        code {
          background: #fff;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: monospace;
          font-size: 13px;
        }
      }
    }
  }
}
</style>

