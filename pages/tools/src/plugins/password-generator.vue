<template>
  <div class="password-generator-container">
    <sc-panel class="password-panel" title="密码生成器" theme="primary">
      <div class="password-display">
        <el-input v-model="generatedPassword" readonly class="password-input" :show-password="!showPassword">
          <template #prepend>
            <el-switch v-model="showPassword" active-text="显示" inactive-text="隐藏" inline-prompt size="small" />
          </template>
          <template #append>
            <el-button @click="copyPassword" type="primary" :icon="CopyDocument"> 复制 </el-button>
          </template>
        </el-input>
      </div>

      <div class="controls">
        <div class="password-length">
          <span class="control-label">密码长度：{{ passwordLength }}</span>
          <el-slider v-model="passwordLength" :min="4" :max="64" :marks="{ 4: '4', 8: '8', 12: '12', 16: '16', 24: '24', 32: '32', 64: '64' }" @change="generatePassword" />
        </div>

        <div class="password-options">
          <div class="option-row">
            <el-checkbox v-model="options.uppercase" @change="generatePassword"> 包含大写字母 (A-Z) </el-checkbox>
            <el-checkbox v-model="options.lowercase" @change="generatePassword"> 包含小写字母 (a-z) </el-checkbox>
          </div>

          <div class="option-row">
            <el-checkbox v-model="options.numbers" @change="generatePassword"> 包含数字 (0-9) </el-checkbox>
            <el-checkbox v-model="options.symbols" @change="generatePassword"> 包含特殊符号 (!@#$%^&*) </el-checkbox>
          </div>

          <div class="option-row">
            <el-checkbox v-model="options.excludeSimilar" @change="generatePassword"> 排除相似字符 (i, l, 1, L, o, 0, O) </el-checkbox>
            <el-checkbox v-model="options.excludeAmbiguous" @change="generatePassword"> 排除空格和特定符号 ({ } [ ] ( ) / \ ' " ` ~ , ; : . < >) </el-checkbox>
          </div>

          <div class="option-row">
            <el-checkbox v-model="options.requireAllTypes" @change="generatePassword"> 密码必须包含所有选中的字符类型 </el-checkbox>
          </div>
        </div>

        <el-button type="success" size="large" @click="generatePassword" class="generate-button" :icon="Refresh"> 生成新密码 </el-button>
      </div>

      <div class="password-strength">
        <div class="strength-label">密码强度：</div>
        <div class="strength-meter">
          <div class="strength-indicator" :style="{ width: `${strengthPercentage}%` }" :class="strengthClass"></div>
        </div>
        <div class="strength-text" :class="strengthClass">{{ strengthText }}</div>
      </div>

      <template #footer>
        <div class="tips">生成密码后可以点击复制按钮复制到剪贴板。密码不会保存在任何地方，刷新页面后将重新生成。</div>
      </template>
    </sc-panel>

    <el-row :gutter="20">
      <el-col :span="12">
        <sc-panel title="常用密码规则" theme="warning">
          <div class="password-presets">
            <el-card shadow="hover" v-for="preset in passwordPresets" :key="preset.name" @click="applyPreset(preset)">
              <div class="preset-card">
                <h4>{{ preset.name }}</h4>
                <p>{{ preset.description }}</p>
                <div class="preset-tags">
                  <el-tag size="small" v-if="preset.options.uppercase">大写字母</el-tag>
                  <el-tag size="small" v-if="preset.options.lowercase">小写字母</el-tag>
                  <el-tag size="small" v-if="preset.options.numbers">数字</el-tag>
                  <el-tag size="small" v-if="preset.options.symbols">特殊符号</el-tag>
                  <el-tag size="small" type="info">{{ preset.length }}位</el-tag>
                </div>
              </div>
            </el-card>
          </div>
        </sc-panel>
      </el-col>

      <el-col :span="12">
        <sc-panel title="密码安全建议" theme="info">
          <div class="security-tips">
            <h3>创建强密码的建议：</h3>
            <ul>
              <li>使用至少 12 位长度的密码</li>
              <li>结合使用大小写字母、数字和特殊符号</li>
              <li>避免使用个人信息（如生日、姓名）</li>
              <li>避免使用字典中的常见单词</li>
              <li>不同网站和应用使用不同的密码</li>
              <li>定期更换密码</li>
              <li>考虑使用密码管理器来存储复杂密码</li>
            </ul>

            <h3>解密时间估算：</h3>
            <el-table :data="crackTimeData" border style="width: 100%">
              <el-table-column prop="complexity" label="密码复杂度"></el-table-column>
              <el-table-column prop="time" label="暴力破解估计时间"></el-table-column>
            </el-table>
          </div>
        </sc-panel>
      </el-col>
    </el-row>

    <sc-panel title="批量生成密码" theme="success">
      <div class="batch-generation">
        <div class="batch-options">
          <el-input-number v-model="batchCount" :min="1" :max="100" label="生成数量"></el-input-number>
          <el-button type="primary" @click="generateBatchPasswords" :icon="Plus">生成</el-button>
          <el-button v-if="batchPasswords.length > 0" type="success" @click="copyBatchPasswords" :icon="CopyDocument">复制全部</el-button>
          <el-button v-if="batchPasswords.length > 0" @click="clearBatchPasswords" :icon="Delete">清空</el-button>
        </div>

        <div v-if="batchPasswords.length > 0" class="batch-results">
          <el-table :data="batchPasswords" border style="width: 100%">
            <el-table-column type="index" width="60" label="#"></el-table-column>
            <el-table-column prop="password" label="密码">
              <template #default="scope">
                <div class="password-cell">
                  <span v-if="showBatchPasswords">{{ scope.row.password }}</span>
                  <span v-else>••••••••••••••</span>
                  <el-button size="small" @click="copyPassword(scope.row.password)" :icon="CopyDocument" circle></el-button>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="strength" label="强度" width="120">
              <template #default="scope">
                <el-tag :type="getStrengthTag(scope.row.strength)">{{ scope.row.strengthText }}</el-tag>
              </template>
            </el-table-column>
          </el-table>

          <div class="batch-controls">
            <el-switch v-model="showBatchPasswords" active-text="显示密码" inactive-text="隐藏密码" inline-prompt />
          </div>
        </div>
      </div>
    </sc-panel>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Refresh, CopyDocument, Delete, Plus } from "@element-plus/icons-vue";
import useClipboard from "../../composables/useClipboard";

// 复制功能
const { copyText } = useClipboard();

// 密码配置
const generatedPassword = ref("");
const showPassword = ref(false);
const passwordLength = ref(16);

// 选项
const options = ref({
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeSimilar: false,
  excludeAmbiguous: false,
  requireAllTypes: true,
});

// 批量生成
const batchCount = ref(5);
const batchPasswords = ref([]);
const showBatchPasswords = ref(false);

// 字符集
const charSets = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
};

// 排除相似字符
const similarChars = "iIlL1oO0";
const ambiguousChars = " {}[]()\/'\"~,;:.<>";

// 密码预设
const passwordPresets = [
  {
    name: "标准强密码",
    description: "包含所有字符类型的16位密码",
    length: 16,
    options: {
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      excludeSimilar: false,
      excludeAmbiguous: false,
      requireAllTypes: true,
    },
  },
  {
    name: "超级强密码",
    description: "包含所有字符类型的24位密码",
    length: 24,
    options: {
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      excludeSimilar: true,
      excludeAmbiguous: true,
      requireAllTypes: true,
    },
  },
  {
    name: "易记密码",
    description: "仅包含字母和数字的12位密码",
    length: 12,
    options: {
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: false,
      excludeSimilar: true,
      excludeAmbiguous: true,
      requireAllTypes: true,
    },
  },
  {
    name: "PIN 码",
    description: "仅包含数字的6位密码",
    length: 6,
    options: {
      uppercase: false,
      lowercase: false,
      numbers: true,
      symbols: false,
      excludeSimilar: false,
      excludeAmbiguous: false,
      requireAllTypes: true,
    },
  },
];

// 密码强度数据
const crackTimeData = [
  {
    complexity: "6位数字密码",
    time: "瞬间",
  },
  {
    complexity: "8位仅小写字母密码",
    time: "几小时",
  },
  {
    complexity: "8位含大小写字母+数字",
    time: "几天",
  },
  {
    complexity: "12位含大小写字母+数字",
    time: "几年",
  },
  {
    complexity: "16位含大小写字母+数字+特殊符号",
    time: "几千年",
  },
  {
    complexity: "24位含大小写字母+数字+特殊符号",
    time: "数十亿年",
  },
];

// 计算密码强度
const calculateStrength = (password) => {
  if (!password) return 0;

  // 基础分数
  let score = 0;

  // 长度分数：每个字符加1分，最多30分
  score += Math.min(30, password.length * 1);

  // 字符多样性分数
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  // 每种字符类型加10分
  if (hasLower) score += 10;
  if (hasUpper) score += 10;
  if (hasNumber) score += 10;
  if (hasSymbol) score += 10;

  // 加分：中间有非字母数字字符
  if (/[^A-Za-z0-9]/.test(password.substring(1, password.length - 1))) score += 5;

  // 加分：密码有数字和字母混合
  if ((hasLower || hasUpper) && hasNumber) score += 5;

  // 减分：仅有字母或数字
  if (password.match(/^[A-Za-z]+$/) || password.match(/^[0-9]+$/)) score -= 10;

  // 减分：重复字符
  const repeats = password.match(/(.)\1+/g) || [];
  score -= repeats.length * 2;

  // 减分：连续字符
  // 检查字母连续
  let consecAlphaUC = 0;
  let consecAlphaLC = 0;
  for (let i = 1; i < password.length; i++) {
    if (/[A-Z]/.test(password[i]) && /[A-Z]/.test(password[i - 1]) && password.charCodeAt(i) === password.charCodeAt(i - 1) + 1) {
      consecAlphaUC++;
    }
    if (/[a-z]/.test(password[i]) && /[a-z]/.test(password[i - 1]) && password.charCodeAt(i) === password.charCodeAt(i - 1) + 1) {
      consecAlphaLC++;
    }
  }
  score -= (consecAlphaUC + consecAlphaLC) * 2;

  // 检查数字连续
  let consecDigit = 0;
  for (let i = 1; i < password.length; i++) {
    if (/[0-9]/.test(password[i]) && /[0-9]/.test(password[i - 1]) && Number(password[i]) === Number(password[i - 1]) + 1) {
      consecDigit++;
    }
  }
  score -= consecDigit * 2;

  // 确保得分在0-100之间
  return Math.max(0, Math.min(100, score));
};

// 密码强度显示
const strengthPercentage = computed(() => calculateStrength(generatedPassword.value));
const strengthClass = computed(() => {
  const strength = strengthPercentage.value;
  if (strength >= 80) return "very-strong";
  if (strength >= 60) return "strong";
  if (strength >= 40) return "medium";
  if (strength >= 20) return "weak";
  return "very-weak";
});
const strengthText = computed(() => {
  const strength = strengthPercentage.value;
  if (strength >= 80) return "非常强";
  if (strength >= 60) return "强";
  if (strength >= 40) return "中等";
  if (strength >= 20) return "弱";
  return "非常弱";
});

// 获取强度标签样式
const getStrengthTag = (strength) => {
  if (strength >= 80) return "success";
  if (strength >= 60) return "primary";
  if (strength >= 40) return "warning";
  return "danger";
};

// 生成密码
const generatePassword = () => {
  // 验证至少选择了一种字符类型
  if (!options.value.uppercase && !options.value.lowercase && !options.value.numbers && !options.value.symbols) {
    ElMessage.warning("请至少选择一种字符类型");
    options.value.lowercase = true;
    return;
  }

  // 构建字符集
  let charset = "";
  let mandatoryChars = [];

  if (options.value.uppercase) {
    let upperSet = charSets.uppercase;
    if (options.value.excludeSimilar) {
      upperSet = upperSet
        .split("")
        .filter((c) => !similarChars.includes(c))
        .join("");
    }
    if (options.value.excludeAmbiguous) {
      upperSet = upperSet
        .split("")
        .filter((c) => !ambiguousChars.includes(c))
        .join("");
    }
    charset += upperSet;
    if (options.value.requireAllTypes && upperSet.length > 0) {
      mandatoryChars.push(upperSet.charAt(Math.floor(Math.random() * upperSet.length)));
    }
  }

  if (options.value.lowercase) {
    let lowerSet = charSets.lowercase;
    if (options.value.excludeSimilar) {
      lowerSet = lowerSet
        .split("")
        .filter((c) => !similarChars.includes(c))
        .join("");
    }
    if (options.value.excludeAmbiguous) {
      lowerSet = lowerSet
        .split("")
        .filter((c) => !ambiguousChars.includes(c))
        .join("");
    }
    charset += lowerSet;
    if (options.value.requireAllTypes && lowerSet.length > 0) {
      mandatoryChars.push(lowerSet.charAt(Math.floor(Math.random() * lowerSet.length)));
    }
  }

  if (options.value.numbers) {
    let numSet = charSets.numbers;
    if (options.value.excludeSimilar) {
      numSet = numSet
        .split("")
        .filter((c) => !similarChars.includes(c))
        .join("");
    }
    charset += numSet;
    if (options.value.requireAllTypes && numSet.length > 0) {
      mandatoryChars.push(numSet.charAt(Math.floor(Math.random() * numSet.length)));
    }
  }

  if (options.value.symbols) {
    let symSet = charSets.symbols;
    if (options.value.excludeAmbiguous) {
      symSet = symSet
        .split("")
        .filter((c) => !ambiguousChars.includes(c))
        .join("");
    }
    charset += symSet;
    if (options.value.requireAllTypes && symSet.length > 0) {
      mandatoryChars.push(symSet.charAt(Math.floor(Math.random() * symSet.length)));
    }
  }

  if (charset.length === 0) {
    ElMessage.error("所选选项排除了所有可能的字符");
    return;
  }

  // 生成随机密码
  let password = "";

  // 如果需要包含所有类型，先添加必需字符
  if (options.value.requireAllTypes && mandatoryChars.length > 0) {
    // 洗牌算法，随机排列必需字符
    for (let i = mandatoryChars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [mandatoryChars[i], mandatoryChars[j]] = [mandatoryChars[j], mandatoryChars[i]];
    }

    password = mandatoryChars.join("");
  }

  // 填充剩余长度
  while (password.length < passwordLength.value) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  // 如果密码长度大于要求长度（可能因为强制包含所有类型），截断
  if (password.length > passwordLength.value) {
    password = password.substring(0, passwordLength.value);
  }

  // 再次洗牌，确保必需字符不总是在开头
  password = password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");

  generatedPassword.value = password;
  return password;
};

// 复制密码
const copyPassword = async (pwd = null) => {
  const passwordToCopy = pwd || generatedPassword.value;

  if (!passwordToCopy) {
    ElMessage.warning("没有可复制的密码");
    return;
  }

  try {
    await copyText(passwordToCopy);
    ElMessage.success("密码已复制到剪贴板");
  } catch (error) {
    console.error("复制失败:", error);
    ElMessage.error("复制失败");
  }
};

// 应用预设
const applyPreset = (preset) => {
  passwordLength.value = preset.length;
  options.value = { ...preset.options };
  generatePassword();
};

// 批量生成密码
const generateBatchPasswords = () => {
  batchPasswords.value = [];
  for (let i = 0; i < batchCount.value; i++) {
    const password = generatePassword();
    const strength = calculateStrength(password);
    let strengthText = "非常弱";

    if (strength >= 80) strengthText = "非常强";
    else if (strength >= 60) strengthText = "强";
    else if (strength >= 40) strengthText = "中等";
    else if (strength >= 20) strengthText = "弱";

    batchPasswords.value.push({
      password,
      strength,
      strengthText,
    });
  }
};

// 复制批量密码
const copyBatchPasswords = async () => {
  if (batchPasswords.value.length === 0) {
    ElMessage.warning("没有可复制的密码");
    return;
  }

  try {
    const text = batchPasswords.value.map((item) => item.password).join("\n");
    await copyText(text);
    ElMessage.success("所有密码已复制到剪贴板");
  } catch (error) {
    console.error("复制失败:", error);
    ElMessage.error("复制失败");
  }
};

// 清空批量密码
const clearBatchPasswords = () => {
  batchPasswords.value = [];
};

// 初始化
onMounted(() => {
  generatePassword();
});
</script>

<style scoped>
.password-generator-container {
  padding: 0;
}

.password-panel {
  margin-bottom: 20px;
}

.password-display {
  margin-bottom: 20px;
}

.password-input {
  font-family: "Consolas", "Monaco", monospace;
  font-size: 16px;
}

.controls {
  margin-bottom: 20px;
}

.password-length {
  margin-bottom: 20px;
}

.control-label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
}

.password-options {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-row {
  display: flex;
  gap: 24px;
}

.generate-button {
  width: 100%;
  height: 50px;
  font-size: 16px;
  margin-bottom: 20px;
}

.password-strength {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.strength-label {
  font-weight: bold;
  min-width: 80px;
}

.strength-meter {
  flex: 1;
  height: 8px;
  background-color: var(--el-color-info-light-9);
  border-radius: 4px;
  overflow: hidden;
}

.strength-indicator {
  height: 100%;
  transition:
    width 0.3s,
    background-color 0.3s;
}

.strength-text {
  font-weight: bold;
  min-width: 60px;
  text-align: center;
}

.very-weak {
  background-color: var(--el-color-danger);
  color: var(--el-color-danger);
}

.weak {
  background-color: var(--el-color-warning);
  color: var(--el-color-warning);
}

.medium {
  background-color: var(--el-color-warning);
  color: var(--el-color-warning);
}

.strong {
  background-color: var(--el-color-success);
  color: var(--el-color-success);
}

.very-strong {
  background-color: var(--el-color-success);
  color: var(--el-color-success);
}

.tips {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.password-presets {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.preset-card {
  cursor: pointer;
}

.preset-card h4 {
  margin: 0 0 8px 0;
}

.preset-card p {
  margin: 0 0 12px 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.preset-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.security-tips h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: var(--el-color-primary);
}

.security-tips ul {
  margin: 0 0 20px 0;
  padding-left: 20px;
}

.security-tips li {
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
}

.batch-generation {
  padding: 0;
}

.batch-options {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.batch-results {
  margin-top: 16px;
}

.batch-controls {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.password-cell {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: "Consolas", "Monaco", monospace;
}
</style>
