<template>
  <div class="password-generator-container">
    <sc-panel class="generator-panel" title="密码生成器" theme="primary">
      <div class="password-display">
        <div class="password-field">
          <el-input v-model="generatedPassword" :disabled="true" size="large" class="password-input">
            <template #append>
              <el-button @click="copyPassword">
                <IconifyIconOnline icon="ep:document-copy" />
              </el-button>
            </template>
          </el-input>
        </div>

        <div class="password-strength" :class="passwordStrengthClass">
          <div class="strength-indicator">
            <div class="strength-bar" :style="{ width: strengthPercentage + '%' }"></div>
          </div>
          <div class="strength-text">{{ passwordStrengthText }}</div>
        </div>
      </div>

      <el-divider content-position="center">选项</el-divider>

      <div class="password-options">
        <el-form label-position="left" :label-width="120">
          <el-form-item label="密码长度">
            <el-slider v-model="passwordLength" :min="4" :max="64" show-input @change="generatePassword" />
          </el-form-item>

          <el-form-item label="密码字符集">
            <div class="character-options">
              <el-checkbox v-model="includeUppercase" @change="generatePassword">大写字母 (A-Z)</el-checkbox>
              <el-checkbox v-model="includeLowercase" @change="generatePassword">小写字母 (a-z)</el-checkbox>
              <el-checkbox v-model="includeNumbers" @change="generatePassword">数字 (0-9)</el-checkbox>
              <el-checkbox v-model="includeSymbols" @change="generatePassword">特殊符号 (!@#$%^&*)</el-checkbox>
            </div>
          </el-form-item>

          <el-form-item label="排除相似字符">
            <el-checkbox v-model="excludeSimilar" @change="generatePassword"> 排除容易混淆的字符 (1, l, I, 0, O, o) </el-checkbox>
          </el-form-item>

          <el-form-item label="排除重复字符">
            <el-checkbox v-model="excludeDuplicates" @change="generatePassword">每个字符只出现一次</el-checkbox>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="generatePassword">
              <IconifyIconOnline icon="ep:refresh" />
              重新生成
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="batch-generator">
          <div class="batch-header">
            <h3>批量生成</h3>
            <div class="batch-controls">
              <el-input-number v-model="batchCount" :min="1" :max="100" :step="1" controls-position="right" size="small" />
              <el-button type="success" size="small" @click="generateBatch">
                <IconifyIconOnline icon="ep:plus" />
                生成多个
              </el-button>
              <el-button size="small" @click="copyAllPasswords" :disabled="batchPasswords.length === 0">
                <IconifyIconOnline icon="ep:document-copy" />
                复制全部
              </el-button>
            </div>
          </div>
          <div v-if="batchPasswords.length > 0" class="batch-list">
            <div v-for="(password, index) in batchPasswords" :key="index" class="batch-item">
              <el-input :value="password" readonly size="small" />
              <el-button size="small" @click="copyBatchPassword(password)">
                <IconifyIconOnline icon="ep:document-copy" />
              </el-button>
            </div>
          </div>
        </div>
      </template>
    </sc-panel>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <sc-panel title="密码安全提示" theme="warning">
          <h3>创建强密码的技巧</h3>
          <ul>
            <li>使用至少 12 个字符的密码</li>
            <li>混合使用大小写字母、数字和特殊符号</li>
            <li>避免使用个人信息（生日、姓名等）</li>
            <li>不要在多个网站使用相同的密码</li>
            <li>定期更换密码，特别是重要账户</li>
            <li>考虑使用密码管理器来存储复杂密码</li>
          </ul>
        </sc-panel>
      </el-col>
      <el-col :span="12">
        <sc-panel title="密码强度指南" theme="info">
          <div class="strength-guide">
            <div class="strength-level poor">
              <div class="level-indicator"></div>
              <div class="level-info">
                <h4>弱</h4>
                <p>很容易被破解，不推荐使用。</p>
              </div>
            </div>

            <div class="strength-level fair">
              <div class="level-indicator"></div>
              <div class="level-info">
                <h4>一般</h4>
                <p>可以抵抗简单攻击，但不适用于重要账户。</p>
              </div>
            </div>

            <div class="strength-level good">
              <div class="level-indicator"></div>
              <div class="level-info">
                <h4>良好</h4>
                <p>对大多数账户来说足够安全。</p>
              </div>
            </div>

            <div class="strength-level strong">
              <div class="level-indicator"></div>
              <div class="level-info">
                <h4>强</h4>
                <p>非常安全，适用于重要账户。</p>
              </div>
            </div>
          </div>
        </sc-panel>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { message } from "@repo/utils";
import { useClipboard } from "@vueuse/core";

// 密码生成选项
const passwordLength = ref(16);
const includeUppercase = ref(true);
const includeLowercase = ref(true);
const includeNumbers = ref(true);
const includeSymbols = ref(true);
const excludeSimilar = ref(false);
const excludeDuplicates = ref(false);

// 生成的密码
const generatedPassword = ref("");
const batchCount = ref(5);
const batchPasswords = ref([]);

// 复制功能
const { copyText } = useClipboard();

// 字符集
const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const lowercase = "abcdefghijklmnopqrstuvwxyz";
const numbers = "0123456789";
const symbols = "!@#$%^&*()-_=+[]{};:,.<>?";
const similarChars = "iIlL1oO0";

// 生成密码
const generatePassword = () => {
  // 至少要选择一种字符类型
  if (!includeUppercase.value && !includeLowercase.value && !includeNumbers.value && !includeSymbols.value) {
    message("请至少选择一种字符类型", { type: "warning" });
    includeUppercase.value = true;
    return;
  }

  let charset = "";
  if (includeUppercase.value) charset += uppercase;
  if (includeLowercase.value) charset += lowercase;
  if (includeNumbers.value) charset += numbers;
  if (includeSymbols.value) charset += symbols;

  // 排除相似字符
  if (excludeSimilar.value) {
    for (let i = 0; i < similarChars.length; i++) {
      charset = charset.replace(new RegExp(similarChars[i], "g"), "");
    }
  }

  // 如果排除重复字符，但字符集太小
  if (excludeDuplicates.value && charset.length < passwordLength.value) {
    message(`无法生成 ${passwordLength.value} 个不重复字符的密码，可用字符集只有 ${charset.length} 个字符`, { type: "warning" });
    excludeDuplicates.value = false;
    return;
  }

  // 生成密码
  let password = "";
  if (excludeDuplicates.value) {
    // 如果排除重复，洗牌整个字符集并取前 n 个
    const shuffled = [...charset].sort(() => 0.5 - Math.random());
    password = shuffled.slice(0, passwordLength.value).join("");
  } else {
    // 随机选择字符
    for (let i = 0; i < passwordLength.value; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
  }

  // 确保密码包含所有选择的字符类型
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSymbols = /[!@#$%^&*()-_=+[\]{};:,.<>?]/.test(password);

  let satisfied = true;
  if (includeUppercase.value && !hasUppercase) satisfied = false;
  if (includeLowercase.value && !hasLowercase) satisfied = false;
  if (includeNumbers.value && !hasNumbers) satisfied = false;
  if (includeSymbols.value && !hasSymbols) satisfied = false;

  // 如果不满足所有条件，重新生成
  if (!satisfied) {
    return generatePassword();
  }

  generatedPassword.value = password;
};

// 批量生成密码
const generateBatch = () => {
  const passwords = [];
  for (let i = 0; i < batchCount.value; i++) {
    generatePassword();
    passwords.push(generatedPassword.value);
  }
  batchPasswords.value = passwords;
};

// 复制密码
const copyPassword = async () => {
  if (!generatedPassword.value) {
    message("请先生成密码", { type: "warning" });
    return;
  }

  try {
    await copyText(generatedPassword.value);
    message("密码已复制到剪贴板", { type: "success" });
  } catch (error) {
    console.error("复制失败:", error);
    message("复制失败", { type: "error" });
  }
};

// 复制批量生成的密码
const copyBatchPassword = async (password) => {
  try {
    await copyText(password);
    message("密码已复制到剪贴板", { type: "success" });
  } catch (error) {
    console.error("复制失败:", error);
    message("复制失败", { type: "error" });
  }
};

// 复制所有批量生成的密码
const copyAllPasswords = async () => {
  if (batchPasswords.value.length === 0) {
    message("没有可复制的密码", { type: "warning" });
    return;
  }

  try {
    const text = batchPasswords.value.join("\n");
    await copyText(text);
    message("所有密码已复制到剪贴板", { type: "success" });
  } catch (error) {
    console.error("复制失败:", error);
    message("复制失败", { type: "error" });
  }
};

// 计算密码强度
const calculatePasswordStrength = (password) => {
  if (!password) return 0;

  let score = 0;

  // 长度评分：最高 40 分
  score += Math.min(40, password.length * 2);

  // 字符类型多样性：每种类型 10 分，最高 40 分
  if (/[A-Z]/.test(password)) score += 10;
  if (/[a-z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^A-Za-z0-9]/.test(password)) score += 10;

  // 额外奖励：字符类型分布更均匀可额外得 20 分
  const upperCount = (password.match(/[A-Z]/g) || []).length;
  const lowerCount = (password.match(/[a-z]/g) || []).length;
  const numberCount = (password.match(/[0-9]/g) || []).length;
  const symbolCount = (password.match(/[^A-Za-z0-9]/g) || []).length;

  const total = password.length;
  const distribution = [upperCount / total, lowerCount / total, numberCount / total, symbolCount / total].filter((ratio) => ratio > 0);

  // 计算分布的方差 - 越小越均匀
  if (distribution.length > 1) {
    const avg = distribution.reduce((a, b) => a + b, 0) / distribution.length;
    const variance = distribution.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / distribution.length;

    // 方差越小，分数越高
    const distributionScore = Math.max(0, 20 - variance * 100);
    score += distributionScore;
  }

  return Math.min(100, score);
};

// 密码强度
const passwordStrength = computed(() => calculatePasswordStrength(generatedPassword.value));

// 强度百分比
const strengthPercentage = computed(() => passwordStrength.value);

// 强度等级
const strengthLevel = computed(() => {
  const strength = passwordStrength.value;
  if (strength < 30) return "poor";
  if (strength < 60) return "fair";
  if (strength < 80) return "good";
  return "strong";
});

// 强度文本
const passwordStrengthText = computed(() => {
  const level = strengthLevel.value;
  switch (level) {
    case "poor":
      return "弱";
    case "fair":
      return "一般";
    case "good":
      return "良好";
    case "strong":
      return "强";
    default:
      return "";
  }
});

// 强度样式类
const passwordStrengthClass = computed(() => `strength-${strengthLevel.value}`);

// 页面加载时生成密码
onMounted(() => {
  generatePassword();
});
</script>

<style scoped>
.password-generator-container {
  padding: 0;
}

.generator-panel {
  margin-bottom: 20px;
}

.password-display {
  margin-bottom: 20px;
}

.password-field {
  margin-bottom: 10px;
}

.password-input {
  font-family: "Courier New", monospace;
  letter-spacing: 1px;
}

.password-strength {
  margin-top: 10px;
}

.strength-indicator {
  height: 10px;
  background: var(--el-bg-color-page);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.strength-bar {
  height: 100%;
  border-radius: 6px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.strength-poor .strength-bar {
  background: linear-gradient(90deg, var(--el-color-danger), var(--el-color-danger-light-3));
}

.strength-fair .strength-bar {
  background: linear-gradient(90deg, var(--el-color-warning), var(--el-color-warning-light-3));
}

.strength-good .strength-bar {
  background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-primary-light-3));
}

.strength-strong .strength-bar {
  background: linear-gradient(90deg, var(--el-color-success), var(--el-color-success-light-3));
}

.strength-text {
  font-size: 12px;
  text-align: right;
}

.strength-poor .strength-text {
  color: var(--el-color-danger);
  font-weight: 600;
}

.strength-fair .strength-text {
  color: var(--el-color-warning);
  font-weight: 600;
}

.strength-good .strength-text {
  color: var(--el-color-primary);
  font-weight: 600;
}

.strength-strong .strength-text {
  color: var(--el-color-success);
  font-weight: 600;
}

.character-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.batch-generator {
  border-top: 1px solid var(--el-border-color-light);
  padding-top: 15px;
  margin-top: 10px;
}

.batch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.batch-header h3 {
  margin: 0;
  font-size: 16px;
}

.batch-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.batch-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 240px;
  overflow-y: auto;
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-bg-color-overlay);
  transition: all 0.3s ease;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--el-border-color);
    border-radius: 3px;
    
    &:hover {
      background: var(--el-border-color-darker);
    }
  }
}

.batch-item {
  display: flex;
  gap: 12px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateX(4px);
  }
}

.strength-guide {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.strength-level {
  display: flex;
  align-items: center;
  gap: 15px;
}

.level-indicator {
  width: 50px;
  height: 8px;
  border-radius: 4px;
}

.level-info {
  flex: 1;
}

.level-info h4 {
  margin: 0 0 5px 0;
  font-size: 14px;
}

.level-info p {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.poor .level-indicator {
  background: linear-gradient(90deg, var(--el-color-danger), var(--el-color-danger-light-3));
  box-shadow: 0 2px 8px color-mix(in srgb, var(--el-color-danger) 30%, transparent);
}

.fair .level-indicator {
  background: linear-gradient(90deg, var(--el-color-warning), var(--el-color-warning-light-3));
  box-shadow: 0 2px 8px color-mix(in srgb, var(--el-color-warning) 30%, transparent);
}

.good .level-indicator {
  background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-primary-light-3));
  box-shadow: 0 2px 8px color-mix(in srgb, var(--el-color-primary) 30%, transparent);
}

.strong .level-indicator {
  background: linear-gradient(90deg, var(--el-color-success), var(--el-color-success-light-3));
  box-shadow: 0 2px 8px color-mix(in srgb, var(--el-color-success) 30%, transparent);
}

.poor h4 {
  color: var(--el-color-danger);
  font-weight: 600;
}

.fair h4 {
  color: var(--el-color-warning);
  font-weight: 600;
}

.good h4 {
  color: var(--el-color-primary);
  font-weight: 600;
}

.strong h4 {
  color: var(--el-color-success);
  font-weight: 600;
}
</style>
