<template>
  <div class="sc-input-example" :class="{ 'el-dark': isDarkMode }">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-content">
            <h3>多类型输入组件 (ScInput)</h3>
            <p class="text-secondary">一个支持多种输入类型的组件，可根据不同需求灵活使用</p>
          </div>
          <div class="theme-switch">
            <el-tooltip content="切换主题">
              <el-button circle @click="toggleTheme">
                <IconifyIconOnline :icon="isDarkMode ? 'ep:sunny' : 'ep:moon'" />
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </template>

      <div class="example-content">
        <!-- 左侧预览区域 -->
        <div class="preview-area">
          <h4>组件预览</h4>
          <div class="preview-container" :class="{ 'dark': isDarkMode }">
            <div class="preview-item">
              <ScInput
                v-model="inputValue"
                :type="inputType"
                :placeholder="placeholder"
                :disabled="disabled"
                :clearable="clearable"
                :maxlength="maxlength"
                :showWordLimit="showWordLimit"
                :size="size"
                :prefixIcon="prefixIcon"
                :suffixIcon="suffixIcon"
                :show-prefix="showPrefix"
                :rules="validationRules"
                :show-validation-msg="showValidationMsg"
                :captcha-source="captchaSource"
                :totp-value-type="totpValueType"
                :length="totpLength"
                :count="showTotpCount"
                :params="queryParams"
                @update:modelValue="handleValueChange"
                @change="handleChange"
                @focus="handleFocus"
                @blur="handleBlur"
                @clear="handleClear"
                @refresh="handleRefresh"
              />
            </div>

            <div class="result-display mt-4">
              <el-alert :title="`当前值: ${inputValue}`" type="success" :closable="false" />
            </div>
          </div>
          
          <!-- 类型预览 -->
          <h4 class="mt-4">输入类型预览</h4>
          <div class="layout-preview">
            <div class="layout-item">
              <p class="layout-title">文本输入</p>
              <ScInput v-model="textValue" type="text" placeholder="请输入文本" />
            </div>
            <div class="layout-item">
              <p class="layout-title">文本域</p>
              <ScInput v-model="textareaValue" type="textarea" placeholder="请输入多行文本" />
            </div>
            <div class="layout-item">
              <p class="layout-title">数字输入</p>
              <ScInput v-model="numberValue" type="number" placeholder="请输入数字" />
            </div>
            <div class="layout-item">
              <p class="layout-title">密码输入</p>
              <ScInput v-model="passwordValue" type="password" placeholder="请输入密码" />
            </div>
            <div class="layout-item">
              <p class="layout-title">搜索输入</p>
              <ScInput v-model="searchValue" type="search" placeholder="请输入搜索内容" />
            </div>
            <div class="layout-item">
              <p class="layout-title">邮箱输入</p>
              <ScInput 
                v-model="emailValue" 
                type="email" 
                placeholder="请输入邮箱" 
                :rules="{ required: true, type: 'email', message: '请输入有效的邮箱地址' }"
              />
            </div>
            <div class="layout-item">
              <p class="layout-title">颜色选择</p>
              <ScInput v-model="colorValue" type="color" />
            </div>
            <div class="layout-item">
              <p class="layout-title">布尔值选择</p>
              <ScInput v-model="booleanValue" type="boolean" />
            </div>
            <div class="layout-item">
              <p class="layout-title">IP地址输入</p>
              <ScInput 
                v-model="ipValue" 
                type="ip" 
                placeholder="0.0.0.0"
                :rules="{ required: true, type: 'ip', message: '请输入有效的IP地址' }"
              />
            </div>
            <div class="layout-item">
              <p class="layout-title">验证码输入</p>
              <ScInput 
                v-model="captchaValue" 
                type="captcha" 
                placeholder="请输入验证码"
                :captcha-source="captchaSource"
                :rules="{ required: true, message: '请输入验证码' }"
              />
            </div>
            <div class="layout-item">
              <p class="layout-title">TOTP数字输入</p>
              <ScInput 
                v-model="totpNumberValue" 
                type="totp" 
                totpValueType="number"
                :count="true"
                :rules="{ required: true, message: '请输入验证码' }"
              />
            </div>
            <div class="layout-item">
              <p class="layout-title">TOTP字母输入</p>
              <ScInput 
                v-model="totpLetterValue" 
                type="totp" 
                totpValueType="letter"
                :count="true"
                :rules="{ required: true, message: '请输入验证码' }"
              />
            </div>
            <div class="layout-item">
              <p class="layout-title">TOTP任意字符</p>
              <ScInput 
                v-model="totpAnyValue" 
                type="totp" 
                totpValueType="any"
                :count="false"
                :rules="{ required: true, message: '请输入验证码' }"
              />
            </div>
            
            <div class="layout-item">
              <p class="layout-title">选择器输入</p>
              <ScInput 
                v-model="selectValue" 
                type="select" 
                placeholder="请选择选项"
                :options="mockOptions"
              />
            </div>
            <div class="layout-item">
              <p class="layout-title">多选选择器</p>
              <ScInput 
                v-model="multiSelectValue" 
                type="select" 
                placeholder="请选择多个选项"
                :options="mockOptions"
                :multiple="true"
              />
            </div>
            <div class="layout-item">
              <p class="layout-title">远程数据选择器</p>
              <ScInput 
                v-model="remoteSelectValue" 
                type="select" 
                placeholder="请选择用户"
                :fetch-method="fetchUsers"
              />
            </div>
            <div class="layout-item">
              <p class="layout-title">带参数查询的选择器</p>
              <ScInput 
                v-model="paramsSelectValue" 
                type="select" 
                placeholder="查询用户"
                :fetch-method="fetchUsers"
                :params="{ username: 'Bret' }"
              />
            </div>
            <div class="layout-item">
              <p class="layout-title">日期选择器</p>
              <ScInput 
                v-model="dateValue" 
                type="date" 
                placeholder="选择日期"
              />
            </div>
            <div class="layout-item">
              <p class="layout-title">时间选择器</p>
              <ScInput 
                v-model="timeValue" 
                type="time" 
                placeholder="选择时间"
              />
            </div>
            <div class="layout-item">
              <p class="layout-title">日期时间</p>
              <ScInput 
                v-model="datetimeValue" 
                type="datetime" 
                placeholder="选择日期和时间"
              />
            </div>
            <div class="layout-item">
              <p class="layout-title">年份选择</p>
              <ScInput 
                v-model="yearValue" 
                type="year" 
                placeholder="选择年份"
              />
            </div>
            <div class="layout-item">
              <p class="layout-title">日期范围</p>
              <ScInput 
                v-model="dateRangeValue" 
                type="daterange" 
                placeholder="选择日期范围"
              />
            </div>
            <div class="layout-item">
              <p class="layout-title">时间范围</p>
              <ScInput 
                v-model="timeRangeValue" 
                type="timerange" 
                placeholder="选择时间范围"
              />
            </div>
            <div class="layout-item">
              <p class="layout-title">月份选择</p>
              <ScInput 
                v-model="monthValue" 
                type="month" 
                placeholder="选择月份"
              />
            </div>
            <div class="layout-item">
              <p class="layout-title">月份范围</p>
              <ScInput 
                v-model="monthRangeValue" 
                type="monthrange" 
                placeholder="选择月份范围"
              />
            </div>
          </div>
        </div>

        <!-- 右侧配置面板 -->
        <div class="config-panel">
          <h4>配置选项</h4>
          <el-form label-position="top" size="default">
            <el-form-item label="输入类型">
              <el-select v-model="inputType" placeholder="选择输入类型" class="w-100">
                <el-option-group label="基础输入">
                  <el-option label="文本 (text)" value="text" />
                  <el-option label="文本域 (textarea)" value="textarea" />
                  <el-option label="数字 (number)" value="number" />
                  <el-option label="密码 (password)" value="password" />
                  <el-option label="搜索 (search)" value="search" />
                  <el-option label="邮箱 (email)" value="email" />
                  <el-option label="电话 (tel)" value="tel" />
                  <el-option label="网址 (url)" value="url" />
                </el-option-group>
                <el-option-group label="日期时间">
                  <el-option label="日期 (date)" value="date" />
                  <el-option label="日期时间 (datetime)" value="datetime" />
                  <el-option label="月份 (month)" value="month" />
                  <el-option label="周 (week)" value="week" />
                  <el-option label="时间 (time)" value="time" />
                  <el-option label="年份 (year)" value="year" />
                  <el-option label="日期范围 (daterange)" value="daterange" />
                  <el-option label="日期时间范围 (datetimerange)" value="datetimerange" />
                  <el-option label="月份范围 (monthrange)" value="monthrange" />
                  <el-option label="周范围 (weekrange)" value="weekrange" />
                  <el-option label="时间范围 (timerange)" value="timerange" />
                </el-option-group>
                <el-option-group label="特殊输入">
                  <el-option label="颜色 (color)" value="color" />
                  <el-option label="IP地址 (ip)" value="ip" />
                  <el-option label="布尔值 (boolean)" value="boolean" />
                  <el-option label="验证码 (captcha)" value="captcha" />
                  <el-option label="TOTP验证码 (totp)" value="totp" />
                  <el-option label="选择器 (select)" value="select" />
                </el-option-group>
              </el-select>
            </el-form-item>

            <el-form-item label="输入框值">
              <el-input v-model="inputValue" placeholder="输入框的值" />
            </el-form-item>

            <el-form-item label="占位文本">
              <el-input v-model="placeholder" placeholder="输入框占位文本" />
            </el-form-item>

            <el-form-item label="组件尺寸">
              <el-radio-group v-model="size">
                <el-radio label="small">小</el-radio>
                <el-radio label="default">默认</el-radio>
                <el-radio label="large">大</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="UI主题">
              <el-radio-group v-model="isDarkMode">
                <el-radio :label="false">亮色</el-radio>
                <el-radio :label="true">暗色</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="禁用状态">
              <el-switch v-model="disabled" />
            </el-form-item>

            <el-form-item label="可清空">
              <el-switch v-model="clearable" />
            </el-form-item>
            
            <el-form-item label="显示前缀图标">
              <el-switch v-model="showPrefix" />
            </el-form-item>

            <el-form-item label="字数限制" v-if="['text', 'textarea', 'password', 'search', 'email', 'tel', 'url'].includes(inputType)">
              <el-input-number v-model="maxlength" :min="0" :max="1000" class="w-100" />
            </el-form-item>

            <el-form-item label="显示字数统计" v-if="['text', 'textarea', 'password', 'search', 'email', 'tel', 'url'].includes(inputType) && maxlength > 0">
              <el-switch v-model="showWordLimit" />
            </el-form-item>

            <el-form-item label="前缀图标" v-if="showPrefix">
              <el-select v-model="prefixIcon" placeholder="选择图标" clearable class="w-100">
                <el-option label="无图标" value="" />
                <el-option label="搜索" value="ep:search" />
                <el-option label="用户" value="ep:user" />
                <el-option label="邮件" value="ep:message" />
                <el-option label="电话" value="ep:phone" />
                <el-option label="位置" value="ep:location" />
                <el-option label="日历" value="ep:calendar" />
              </el-select>
            </el-form-item>

            <el-form-item label="后缀图标" v-if="['text', 'password', 'search', 'email', 'tel', 'url', 'card'].includes(inputType)">
              <el-select v-model="suffixIcon" placeholder="选择图标" clearable class="w-100">
                <el-option label="无图标" value="" />
                <el-option label="警告" value="ep:warning" />
                <el-option label="信息" value="ep:info" />
                <el-option label="正确" value="ep:check" />
                <el-option label="错误" value="ep:close" />
                <el-option label="帮助" value="ep:question" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="数据校验">
              <el-switch v-model="enableValidation" />
            </el-form-item>
            
            <el-form-item label="必填项" v-if="enableValidation">
              <el-switch v-model="isRequired" />
            </el-form-item>
            
            <el-form-item label="显示校验消息" v-if="enableValidation">
              <el-switch v-model="showValidationMsg" />
            </el-form-item>
            
            <el-form-item label="验证码图片地址" v-if="inputType === 'captcha'">
              <el-input v-model="captchaSource" placeholder="输入验证码图片地址" />
            </el-form-item>

            <el-form-item label="是否多选" v-if="inputType === 'select'">
              <el-switch v-model="isMultiple" />
            </el-form-item>

            <el-form-item label="数据来源" v-if="inputType === 'select'">
              <el-radio-group v-model="dataSource">
                <el-radio label="static">静态数据</el-radio>
                <el-radio label="remote">远程数据</el-radio>
                <el-radio label="params">参数查询</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="远程查询参数" v-if="inputType === 'select' && dataSource === 'params'">
              <el-input v-model="searchParams" placeholder="输入查询参数，如: name=John">
                <template #append>
                  <el-button @click="handleParamsSearch">搜索</el-button>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item label="TOTP值类型" v-if="inputType === 'totp'">
              <el-radio-group v-model="totpValueType">
                <el-radio label="number">数字</el-radio>
                <el-radio label="letter">字母</el-radio>
                <el-radio label="any">任意字符</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="TOTP长度" v-if="inputType === 'totp'">
              <el-slider v-model="totpLength" :min="4" :max="8" :show-stops="true" :marks="{4: '4', 5: '5', 6: '6', 7: '7', 8: '8'}" />
            </el-form-item>

            <el-form-item label="显示数量" v-if="inputType === 'totp'">
              <el-switch v-model="showTotpCount" />
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 代码示例 -->
      <div class="code-example mt-4">
        <CodeDisplay 
          :code="codeExample" 
          language="html" 
          title="代码示例" 
          description="根据当前配置生成的代码示例"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import ScInput from "@repo/components/ScInput/index.vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { http } from "@repo/utils";
import CodeDisplay from "./CodeDisplay.vue";

// 主题设置
const isDarkMode = ref(false);

// 切换主题
const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value;
};

// 配置选项
const inputType = ref("text");
const size = ref("default");
const disabled = ref(false);
const clearable = ref(true);
const showPrefix = ref(true);
const placeholder = ref("请输入内容");
const maxlength = ref(50);
const showWordLimit = ref(false);
const prefixIcon = ref("");
const suffixIcon = ref("");

// 校验配置
const enableValidation = ref(false);
const isRequired = ref(false);
const showValidationMsg = ref(true);

// 各种类型的值
const inputValue = ref("");
const textValue = ref("这是文本输入");
const textareaValue = ref("这是多行文本\n第二行");
const numberValue = ref(100);
const passwordValue = ref("password123");
const searchValue = ref("搜索关键词");
const emailValue = ref("example@example.com");
const colorValue = ref("#409EFF");
const booleanValue = ref(true);
const ipValue = ref("192.168.0.1");
const cardValue = ref("卡片输入示例");
const captchaValue = ref("");

// 验证码图片源
const captchaSource = ref("https://picsum.photos/100/36");

// SELECT相关变量
const selectValue = ref("");
const multiSelectValue = ref([]);
const remoteSelectValue = ref("");
const paramsSelectValue = ref("");
const isMultiple = ref(false);
const dataSource = ref("static");

// 参数查询相关
const searchParams = ref('');
const queryParams = ref({});
const showTotpCount = ref(true);

// TOTP输入相关
const totpNumberValue = ref('');
const totpLetterValue = ref('');
const totpAnyValue = ref('');
const totpValueType = ref('number');
const totpLength = ref(6);

// 日期时间相关变量
const dateValue = ref('');
const timeValue = ref('');
const datetimeValue = ref('');
const yearValue = ref('');
const dateRangeValue = ref([]);
const timeRangeValue = ref([]);
const monthValue = ref('');
const weekValue = ref('');
const monthRangeValue = ref([]);
const weekRangeValue = ref([]);
const datetimeRangeValue = ref([]);

// 模拟数据选项
const mockOptions = ref([
  { label: "选项一", value: "1", icon: "ep:goods" },
  { label: "选项二", value: "2", icon: "ep:shopping-cart" },
  { label: "选项三", value: "3", icon: "ep:present" },
  { label: "选项四", value: "4", icon: "ep:sell" },
  { label: "选项五", value: "5", icon: "ep:money" },
]);

// 从JSONPlaceholder获取用户数据
const fetchUsers = async (params) => {
  try {
    const response = await http.get('https://jsonplaceholder.typicode.com/users', params);
    return response.data.map(user => ({
      label: user.name,
      value: user.id,
      icon: "ep:user"
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

// 校验规则
const validationRules = computed(() => {
  if (!enableValidation.value) return {};
  
  const rules = { required: isRequired.value };
  
  if (inputType.value) {
    rules.type = inputType.value;
  }
  
  if (isRequired.value) {
    rules.message = `请输入${inputType.value === 'captcha' ? '验证码' : '内容'}`;
  } else {
    rules.message = `请输入有效的${inputType.value}格式`;
  }
  
  return rules;
});

// 事件处理
const handleValueChange = (value) => {
  console.log("值变化:", value);
};

const handleChange = (value) => {
  console.log("change事件:", value);
  ElMessage.success(`输入值变为: ${value}`);
};

const handleFocus = (event) => {
  console.log("获得焦点:", event);
};

const handleBlur = (event) => {
  console.log("失去焦点:", event);
};

const handleClear = () => {
  console.log("清空输入");
  ElMessage.info("已清空输入");
};

const handleRefresh = () => {
  console.log("刷新验证码");
  ElMessage.info("验证码已刷新");
};

// 处理参数搜索
const handleParamsSearch = () => {
  const params = {};
  const paramPairs = searchParams.value.split('&');
  
  paramPairs.forEach(pair => {
    const [key, value] = pair.split('=');
    if (key && value) {
      params[key.trim()] = value.trim();
    }
  });
  
  queryParams.value = params;
  ElMessage.info(`搜索参数: ${JSON.stringify(params)}`);
};

// 生成代码示例
const codeExample = computed(() => {
  let propsStr = [];
  
  // 必要属性
  propsStr.push(`type="${inputType.value}"`);
  
  // 可选属性，只有不是默认值时才添加
  if (placeholder.value) propsStr.push(`placeholder="${placeholder.value}"`);
  if (size.value !== "default") propsStr.push(`size="${size.value}"`);
  if (disabled.value) propsStr.push(`disabled`);
  if (!clearable.value) propsStr.push(`:clearable="false"`);
  if (!showPrefix.value) propsStr.push(`:show-prefix="false"`);
  
  // 根据类型添加不同的属性
  if (["text", "textarea", "password", "search", "email", "tel", "url"].includes(inputType.value)) {
    if (maxlength.value > 0) propsStr.push(`:maxlength="${maxlength.value}"`);
    if (showWordLimit.value) propsStr.push(`show-word-limit`);
  }
  
  if (prefixIcon.value) propsStr.push(`prefix-icon="${prefixIcon.value}"`);
  if (suffixIcon.value && ["text", "password", "search", "email", "tel", "url", "card"].includes(inputType.value)) {
    propsStr.push(`suffix-icon="${suffixIcon.value}"`);
  }
  
  if (inputType.value === 'captcha' && captchaSource.value) {
    propsStr.push(`captcha-source="${captchaSource.value}"`);
  }
  
  // TOTP特定属性
  if (inputType.value === 'totp') {
    propsStr.push(`totp-value-type="${totpValueType.value}"`);
    if (totpLength.value !== 6) {
      propsStr.push(`:length="${totpLength.value}"`);
    }
    if (!showTotpCount) {
      propsStr.push(`:count="false"`);
    }
  }
  
  // 选择器特定属性
  if (inputType.value === 'select') {
    if (isMultiple.value) {
      propsStr.push(`:multiple="true"`);
    }
    
    if (dataSource.value === 'static') {
      propsStr.push(`:options="options"`);
    } else if (dataSource.value === 'remote') {
      propsStr.push(`:fetch-method="fetchUsers"`);
    } else if (dataSource.value === 'params') {
      propsStr.push(`:fetch-method="fetchUsers"`);
      propsStr.push(`:params="{ username: 'Bret' }"`);
    }
  }
  
  // 添加校验规则
  if (enableValidation.value) {
    let rulesStr = '{';
    if (isRequired.value) {
      rulesStr += ' required: true,';
    }
    if (inputType.value && inputType.value !== 'select') {
      rulesStr += ` type: "${inputType.value}",`;
    }
    let message = isRequired.value 
      ? `请${inputType.value === 'select' ? '选择' : '输入'}${inputType.value === 'captcha' ? '验证码' : '内容'}`
      : `请输入有效的${inputType.value}格式`;
    rulesStr += ` message: "${message}" }`;
    propsStr.push(`:rules="${rulesStr}"`);
    
    if (!showValidationMsg.value) {
      propsStr.push(`:show-validation-msg="false"`);
    }
  }
  
  const propsText = propsStr.join("\n    ");
  
  // 根据类型确定示例值
  let exampleValue;
  switch (inputType.value) {
    case "number":
      exampleValue = 0;
      break;
    case "boolean":
      exampleValue = false;
      break;
    case "color":
      exampleValue = "'#409EFF'";
      break;
    case "ip":
      exampleValue = "'0.0.0.0'";
      break;
    case "select":
      exampleValue = isMultiple.value ? "[]" : "''";
      break;
    case "date":
    case "datetime":
    case "month":
    case "year":
    case "time":
      exampleValue = "''";
      break;
    case "daterange":
    case "datetimerange":
    case "monthrange":
    case "weekrange":
    case "timerange":
      exampleValue = "[]";
      break;
    default:
      exampleValue = "''";
  }
  
  // 添加事件
  let events = [];
  events.push(`@change="handleChange"`);
  
  if (inputType.value === 'captcha') {
    events.push(`@refresh="handleRefresh"`);
  }
  
  const eventsText = events.join("\n    ");
  
  let code = `<template>
  <ScInput
    v-model="value"
    ${propsText}
    ${eventsText}
  />
</template>

<script setup>
import { ref } from 'vue';
import ScInput from "@repo/components/ScInput/index.vue";`;

  // 根据类型添加相关代码
  if (inputType.value === 'select') {
    if (dataSource.value === 'static') {
      code += `\n
// 静态选项数据
const options = [
  { label: "选项一", value: "1", icon: "ep:goods" },
  { label: "选项二", value: "2", icon: "ep:shopping-cart" },
  { label: "选项三", value: "3", icon: "ep:present" },
  { label: "选项四", value: "4", icon: "ep:sell" },
  { label: "选项五", value: "5", icon: "ep:money" }
];`;
    } else if (dataSource.value === 'remote' || dataSource.value === 'params') {
      code += `\nimport { http } from "@repo/utils";

// 从JSONPlaceholder获取用户数据
const fetchUsers = async (params) => {
  try {
    const response = await http.get('https://jsonplaceholder.typicode.com/users', params);
    return response.data.map(user => ({
      label: user.name,
      value: user.id,
      icon: "ep:user"
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};`;
    }
  }

  code += `\n
const value = ref(${exampleValue});

const handleChange = (value) => {
  console.log("值变化:", value);
};`;

  if (inputType.value === 'captcha') {
    code += `\n
const handleRefresh = () => {
  console.log("验证码已刷新");
};`;
  }

  code += `\n<\/script>`;

  return code;
});

// 挂载时预加载远程数据
onMounted(() => {
  // 预加载用户数据
  fetchUsers();
});
</script>

<style scoped>
.sc-input-example {
  padding: 20px 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content {
  flex: 1;
}

.card-header h3 {
  margin: 0 0 8px 0;
  font-size: 22px;
}

.text-secondary {
   color: var(--el-text-color-primary);
  margin: 0;
}

.example-content {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
}

.preview-area {
  flex: 1;
  min-width: 0;
}

.config-panel {
  width: 320px;
  flex-shrink: 0;
}

h4 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 18px;
  color: var(--el-text-color-primary);
}

.preview-container {
  margin: 20px 0;
  padding: 20px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.preview-item {
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 500px;
}

.layout-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-top: 16px;
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #fafafa;
}

.layout-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  min-width: 200px;
  width: calc(50% - 24px);
}

.layout-title {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

.code-example {
  margin-top: 16px;
}

.w-100 {
  width: 100%;
}

.mt-4 {
  margin-top: 16px;
}

.mt-2 {
  margin-top: 8px;
}

.mb-3 {
  margin-bottom: 12px;
}

pre {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 0;
}

code {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.code-desc {
  margin-bottom: 8px;
}

/* 暗黑模式样式 */
.el-dark {
  --preview-bg: #1a1a1a;
  --preview-border: #333;
  --text-color: #eee;
  --heading-color: #fff;
  --code-bg: #2d2d2d;
  --code-color: #eee;
}

.el-dark .preview-container,
.el-dark .layout-preview {
  background-color: var(--preview-bg);
  border-color: var(--preview-border);
}

.el-dark .layout-item {
  background-color: #2a2a2a;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.2);
}

.el-dark .layout-title {
  color: #ddd;
}

.el-dark h3, 
.el-dark h4 {
  color: var(--heading-color);
}

.el-dark .text-secondary {
  color: #aaa;
}

.el-dark pre {
  background-color: var(--code-bg);
}

.el-dark code {
  color: var(--code-color);
}

@media screen and (max-width: 768px) {
  .example-content {
    flex-direction: column;
  }
  
  .config-panel {
    width: 100%;
  }
  
  .layout-item {
    width: 100%;
  }
}
</style>