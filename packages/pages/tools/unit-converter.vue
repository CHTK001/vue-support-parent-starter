<script setup>
import { ref, reactive, onMounted } from "vue";
import { useClipboard } from "@vueuse/core";
import { ElMessage } from "element-plus";

const { copy } = useClipboard();

// 环境变量
const env = reactive({
  inputValue: "",
  outputResults: [],
  loading: false,
  unitType: "length", // 默认长度单位
  fromUnit: "", // 源单位
  toUnit: "", // 目标单位
  history: [], // 历史记录
  unitTypes: [
    { label: "长度", value: "length" },
    { label: "面积", value: "area" },
    { label: "体积", value: "volume" },
    { label: "质量", value: "mass" },
    { label: "温度", value: "temperature" },
    { label: "时间", value: "time" },
    { label: "速度", value: "speed" },
    { label: "数据存储", value: "data" },
    { label: "能量", value: "energy" },
    { label: "压力", value: "pressure" },
  ],
  units: {
    length: [
      { label: "纳米 (nm)", value: "nm", factor: 1e-9 },
      { label: "微米 (μm)", value: "um", factor: 1e-6 },
      { label: "毫米 (mm)", value: "mm", factor: 1e-3 },
      { label: "厘米 (cm)", value: "cm", factor: 1e-2 },
      { label: "分米 (dm)", value: "dm", factor: 1e-1 },
      { label: "米 (m)", value: "m", factor: 1 },
      { label: "千米 (km)", value: "km", factor: 1e3 },
      { label: "英寸 (in)", value: "in", factor: 0.0254 },
      { label: "英尺 (ft)", value: "ft", factor: 0.3048 },
      { label: "码 (yd)", value: "yd", factor: 0.9144 },
      { label: "英里 (mi)", value: "mi", factor: 1609.344 },
      { label: "海里 (nmi)", value: "nmi", factor: 1852 },
      { label: "光年 (ly)", value: "ly", factor: 9.461e15 },
    ],
    area: [
      { label: "平方毫米 (mm²)", value: "mm2", factor: 1e-6 },
      { label: "平方厘米 (cm²)", value: "cm2", factor: 1e-4 },
      { label: "平方分米 (dm²)", value: "dm2", factor: 1e-2 },
      { label: "平方米 (m²)", value: "m2", factor: 1 },
      { label: "公亩 (are)", value: "are", factor: 100 },
      { label: "公顷 (ha)", value: "ha", factor: 10000 },
      { label: "平方千米 (km²)", value: "km2", factor: 1e6 },
      { label: "平方英寸 (in²)", value: "in2", factor: 0.00064516 },
      { label: "平方英尺 (ft²)", value: "ft2", factor: 0.09290304 },
      { label: "平方码 (yd²)", value: "yd2", factor: 0.83612736 },
      { label: "英亩 (acre)", value: "acre", factor: 4046.8564224 },
      { label: "平方英里 (mi²)", value: "mi2", factor: 2589988.110336 },
      { label: "亩", value: "mu", factor: 666.6666667 },
    ],
    volume: [
      { label: "立方毫米 (mm³)", value: "mm3", factor: 1e-9 },
      { label: "立方厘米 (cm³)", value: "cm3", factor: 1e-6 },
      { label: "毫升 (ml)", value: "ml", factor: 1e-6 },
      { label: "立方分米 (dm³)", value: "dm3", factor: 1e-3 },
      { label: "升 (l)", value: "l", factor: 1e-3 },
      { label: "立方米 (m³)", value: "m3", factor: 1 },
      { label: "立方千米 (km³)", value: "km3", factor: 1e9 },
      { label: "立方英寸 (in³)", value: "in3", factor: 1.6387064e-5 },
      { label: "立方英尺 (ft³)", value: "ft3", factor: 0.028316846592 },
      { label: "立方码 (yd³)", value: "yd3", factor: 0.764554857984 },
      { label: "加仑(美) (gal)", value: "gal", factor: 0.003785411784 },
      { label: "加仑(英) (uk_gal)", value: "uk_gal", factor: 0.00454609 },
      { label: "品脱(美) (pt)", value: "pt", factor: 0.000473176473 },
      { label: "品脱(英) (uk_pt)", value: "uk_pt", factor: 0.00056826125 },
    ],
    mass: [
      { label: "微克 (μg)", value: "ug", factor: 1e-9 },
      { label: "毫克 (mg)", value: "mg", factor: 1e-6 },
      { label: "克 (g)", value: "g", factor: 1e-3 },
      { label: "千克 (kg)", value: "kg", factor: 1 },
      { label: "吨 (t)", value: "t", factor: 1e3 },
      { label: "磅 (lb)", value: "lb", factor: 0.45359237 },
      { label: "盎司 (oz)", value: "oz", factor: 0.028349523125 },
      { label: "英石 (st)", value: "st", factor: 6.35029318 },
      { label: "短吨 (sh_t)", value: "sh_t", factor: 907.18474 },
      { label: "长吨 (l_t)", value: "l_t", factor: 1016.0469088 },
      { label: "斤", value: "jin", factor: 0.5 },
      { label: "两", value: "liang", factor: 0.05 },
    ],
    temperature: [
      { label: "摄氏度 (°C)", value: "c" },
      { label: "华氏度 (°F)", value: "f" },
      { label: "开尔文 (K)", value: "k" },
    ],
    time: [
      { label: "纳秒 (ns)", value: "ns", factor: 1e-9 },
      { label: "微秒 (μs)", value: "us", factor: 1e-6 },
      { label: "毫秒 (ms)", value: "ms", factor: 1e-3 },
      { label: "秒 (s)", value: "s", factor: 1 },
      { label: "分钟 (min)", value: "min", factor: 60 },
      { label: "小时 (h)", value: "h", factor: 3600 },
      { label: "天 (d)", value: "d", factor: 86400 },
      { label: "周 (wk)", value: "wk", factor: 604800 },
      { label: "月 (30天)", value: "mo", factor: 2592000 },
      { label: "年 (365天)", value: "yr", factor: 31536000 },
    ],
    speed: [
      { label: "米/秒 (m/s)", value: "mps", factor: 1 },
      { label: "千米/时 (km/h)", value: "kph", factor: 0.2777777778 },
      { label: "英里/时 (mph)", value: "mph", factor: 0.44704 },
      { label: "英尺/秒 (ft/s)", value: "fps", factor: 0.3048 },
      { label: "节 (kn)", value: "kn", factor: 0.5144444444 },
      { label: "马赫 (Ma)", value: "mach", factor: 340.29 },
    ],
    data: [
      { label: "位 (bit)", value: "bit", factor: 1 / 8 },
      { label: "字节 (B)", value: "B", factor: 1 },
      { label: "千字节 (KB)", value: "KB", factor: 1e3 },
      { label: "兆字节 (MB)", value: "MB", factor: 1e6 },
      { label: "吉字节 (GB)", value: "GB", factor: 1e9 },
      { label: "太字节 (TB)", value: "TB", factor: 1e12 },
      { label: "拍字节 (PB)", value: "PB", factor: 1e15 },
      { label: "千比特 (Kbit)", value: "Kbit", factor: 125 },
      { label: "兆比特 (Mbit)", value: "Mbit", factor: 125000 },
      { label: "吉比特 (Gbit)", value: "Gbit", factor: 1.25e8 },
      { label: "太比特 (Tbit)", value: "Tbit", factor: 1.25e11 },
    ],
    energy: [
      { label: "焦耳 (J)", value: "J", factor: 1 },
      { label: "千焦 (kJ)", value: "kJ", factor: 1e3 },
      { label: "卡路里 (cal)", value: "cal", factor: 4.184 },
      { label: "千卡 (kcal)", value: "kcal", factor: 4184 },
      { label: "瓦时 (Wh)", value: "Wh", factor: 3600 },
      { label: "千瓦时 (kWh)", value: "kWh", factor: 3.6e6 },
      { label: "电子伏 (eV)", value: "eV", factor: 1.602176634e-19 },
      { label: "英热单位 (BTU)", value: "BTU", factor: 1055.05585262 },
    ],
    pressure: [
      { label: "帕斯卡 (Pa)", value: "Pa", factor: 1 },
      { label: "千帕 (kPa)", value: "kPa", factor: 1e3 },
      { label: "兆帕 (MPa)", value: "MPa", factor: 1e6 },
      { label: "巴 (bar)", value: "bar", factor: 1e5 },
      { label: "毫巴 (mbar)", value: "mbar", factor: 100 },
      { label: "标准大气压 (atm)", value: "atm", factor: 101325 },
      { label: "托 (Torr)", value: "Torr", factor: 133.3223684 },
      { label: "毫米汞柱 (mmHg)", value: "mmHg", factor: 133.3223684 },
      { label: "英寸汞柱 (inHg)", value: "inHg", factor: 3386.389 },
      { label: "磅/平方英寸 (psi)", value: "psi", factor: 6894.757293168 },
    ],
  },
});

// 当单位类型改变时，重置单位选择
const handleUnitTypeChange = () => {
  env.fromUnit = env.units[env.unitType][0].value;
  env.toUnit = env.units[env.unitType][1].value;
  env.outputResults = [];
};

// 初始化默认单位
onMounted(() => {
  env.fromUnit = env.units[env.unitType][0].value;
  env.toUnit = env.units[env.unitType][1].value;
});

// 温度转换特殊处理
const convertTemperature = (value, fromUnit, toUnit) => {
  let kelvin;

  // 先转换为开尔文
  switch (fromUnit) {
    case "c":
      kelvin = parseFloat(value) + 273.15;
      break;
    case "f":
      kelvin = ((parseFloat(value) - 32) * 5) / 9 + 273.15;
      break;
    case "k":
      kelvin = parseFloat(value);
      break;
  }

  // 从开尔文转换为目标单位
  switch (toUnit) {
    case "c":
      return kelvin - 273.15;
    case "f":
      return ((kelvin - 273.15) * 9) / 5 + 32;
    case "k":
      return kelvin;
  }
};

// 执行单位转换
const convertUnit = () => {
  try {
    env.loading = true;

    if (!env.inputValue) {
      ElMessage.warning("请输入要转换的数值");
      env.loading = false;
      return;
    }

    const value = parseFloat(env.inputValue);

    if (isNaN(value)) {
      ElMessage.warning("请输入有效的数值");
      env.loading = false;
      return;
    }

    let result;

    // 温度需要特殊处理
    if (env.unitType === "temperature") {
      result = convertTemperature(value, env.fromUnit, env.toUnit);
    } else {
      // 其他单位通过因子转换
      const fromUnitObj = env.units[env.unitType].find((u) => u.value === env.fromUnit);
      const toUnitObj = env.units[env.unitType].find((u) => u.value === env.toUnit);

      if (!fromUnitObj || !toUnitObj) {
        throw new Error("单位不存在");
      }

      // 转换为标准单位，再转换为目标单位
      result = (value * fromUnitObj.factor) / toUnitObj.factor;
    }

    // 格式化结果，处理科学计数法
    let formattedResult;
    if (Math.abs(result) < 0.000001 || Math.abs(result) > 1000000) {
      formattedResult = result.toExponential(6);
    } else {
      formattedResult = result.toString();
      // 如果是整数，不显示小数点
      if (formattedResult.includes(".")) {
        // 限制小数位数，最多显示6位
        const parts = formattedResult.split(".");
        if (parts[1].length > 6) {
          formattedResult = parseFloat(formattedResult).toFixed(6);
          // 去除末尾的0
          formattedResult = formattedResult.replace(/\.?0+$/, "");
        }
      }
    }

    // 获取单位显示名称
    const fromUnitLabel = env.units[env.unitType].find((u) => u.value === env.fromUnit).label;
    const toUnitLabel = env.units[env.unitType].find((u) => u.value === env.toUnit).label;

    // 生成结果
    env.outputResults = [
      {
        label: "转换结果",
        value: `${formattedResult} ${toUnitLabel.split(" ")[0]}`,
      },
      {
        label: "完整表达式",
        value: `${value} ${fromUnitLabel} = ${formattedResult} ${toUnitLabel}`,
      },
    ];

    // 添加到历史记录
    addToHistory(value, fromUnitLabel, formattedResult, toUnitLabel);

    ElMessage.success("转换成功");
  } catch (error) {
    console.error("转换错误:", error);
    ElMessage.error("转换失败: " + error.message);
  } finally {
    env.loading = false;
  }
};

// 添加到历史记录
const addToHistory = (inputValue, fromUnit, result, toUnit) => {
  env.history.unshift({
    inputValue,
    fromUnit,
    result,
    toUnit,
    date: new Date().toLocaleString(),
    unitType: env.unitTypes.find((t) => t.value === env.unitType).label,
  });

  // 限制历史记录数量
  if (env.history.length > 10) {
    env.history.pop();
  }
};

// 从历史记录加载
const loadFromHistory = (item) => {
  // 找到对应的单位类型
  const unitType = env.unitTypes.find((t) => t.label === item.unitType).value;
  env.unitType = unitType;

  // 设置单位
  setTimeout(() => {
    const fromUnitValue = env.units[unitType].find((u) => u.label.startsWith(item.fromUnit.split(" ")[0])).value;
    const toUnitValue = env.units[unitType].find((u) => u.label.startsWith(item.toUnit.split(" ")[0])).value;

    env.fromUnit = fromUnitValue;
    env.toUnit = toUnitValue;
    env.inputValue = item.inputValue.toString();

    // 执行转换
    convertUnit();
  }, 0);
};

// 交换单位
const swapUnits = () => {
  const temp = env.fromUnit;
  env.fromUnit = env.toUnit;
  env.toUnit = temp;

  if (env.inputValue && env.outputResults.length > 0) {
    convertUnit();
  }
};

// 复制到剪贴板
const copyToClipboard = (text) => {
  copy(text)
    .then(() => {
      ElMessage.success("已复制到剪贴板");
    })
    .catch((err) => {
      console.error("复制失败:", err);
      ElMessage.error("复制失败");
    });
};

// 重置表单
const resetForm = () => {
  env.inputValue = "";
  env.outputResults = [];
  env.fromUnit = env.units[env.unitType][0].value;
  env.toUnit = env.units[env.unitType][1].value;
};

// 获取结果图标
const getResultIcon = (label) => {
  if (label.includes("转换结果")) return "ri:exchange-line";
  if (label.includes("完整表达式")) return "ri:equation-line";
  return "ri:information-line";
};
</script>

<template>
  <div class="unit-tool">
    <div class="unit-tool__content">
      <!-- 头部信息 -->
      <div class="unit-tool__header-container">
        <div class="unit-tool__header">
          <div class="unit-tool__header-inner">
            <h1 class="unit-tool__header-title">单位换算工具</h1>
            <p class="unit-tool__header-subtitle">支持长度、面积、体积、质量、温度等多种单位的相互转换</p>
          </div>
        </div>
      </div>

      <!-- 主要内容区域 -->
      <el-row :gutter="24">
        <!-- 左侧输入区域 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card class="unit-tool__input-card" shadow="hover">
            <template #header>
              <div class="unit-tool__card-header">
                <IconifyIconOnline icon="ri:scales-line" class="unit-tool__card-icon" />
                <span>单位转换</span>
              </div>
            </template>

            <el-form label-position="top">
              <!-- 单位类型选择 -->
              <el-form-item label="单位类型">
                <el-select v-model="env.unitType" placeholder="选择单位类型" class="unit-tool__select" @change="handleUnitTypeChange">
                  <el-option v-for="item in env.unitTypes" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>

              <!-- 转换单位选择 -->
              <div class="unit-tool__unit-row">
                <el-form-item label="从">
                  <el-select v-model="env.fromUnit" placeholder="选择源单位" class="unit-tool__select">
                    <el-option v-for="item in env.units[env.unitType]" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-form-item>

                <div class="unit-tool__swap-btn-container">
                  <el-button type="primary" circle @click="swapUnits" class="unit-tool__swap-btn">
                    <IconifyIconOnline icon="ri:arrow-left-right-line" />
                  </el-button>
                </div>

                <el-form-item label="到">
                  <el-select v-model="env.toUnit" placeholder="选择目标单位" class="unit-tool__select">
                    <el-option v-for="item in env.units[env.unitType]" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-form-item>
              </div>

              <!-- 输入值 -->
              <el-form-item label="输入值">
                <el-input v-model="env.inputValue" placeholder="请输入数值" clearable type="number" class="unit-tool__input">
                  <template #prefix>
                    <IconifyIconOnline icon="ri:number-5" />
                  </template>
                </el-input>
              </el-form-item>

              <!-- 操作按钮 -->
              <div class="unit-tool__actions">
                <el-button type="primary" :loading="env.loading" class="unit-tool__convert-btn" @click="convertUnit">
                  <IconifyIconOnline icon="ri:exchange-line" />
                  <span>转换</span>
                </el-button>

                <el-button class="unit-tool__reset-btn" @click="resetForm">
                  <IconifyIconOnline icon="ri:refresh-line" />
                  <span>重置</span>
                </el-button>
              </div>
            </el-form>
          </el-card>

          <!-- 历史记录 -->
          <el-card class="unit-tool__history-card" shadow="hover">
            <template #header>
              <div class="unit-tool__card-header">
                <IconifyIconOnline icon="ri:history-line" class="unit-tool__card-icon" />
                <span>历史记录</span>
              </div>
            </template>

            <el-empty v-if="!env.history.length" description="暂无历史记录" class="unit-tool__empty">
              <template #image>
                <IconifyIconOnline icon="ri:history-line" class="unit-tool__empty-icon" />
              </template>
            </el-empty>

            <div v-else class="unit-tool__history">
              <div v-for="(item, index) in env.history" :key="index" class="unit-tool__history-item" @click="loadFromHistory(item)">
                <div class="unit-tool__history-content">
                  <div class="unit-tool__history-expression">{{ item.inputValue }} {{ item.fromUnit.split(" ")[0] }} = {{ item.result }} {{ item.toUnit.split(" ")[0] }}</div>
                  <div class="unit-tool__history-meta">
                    <span class="unit-tool__history-type">{{ item.unitType }}</span>
                    <span class="unit-tool__history-date">{{ item.date }}</span>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧结果区域 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card class="unit-tool__result-card" shadow="hover">
            <template #header>
              <div class="unit-tool__card-header">
                <IconifyIconOnline icon="ri:file-list-line" class="unit-tool__card-icon" />
                <span>转换结果</span>
              </div>
            </template>

            <el-empty v-if="!env.outputResults.length" description="请先输入并转换单位" class="unit-tool__empty">
              <template #image>
                <IconifyIconOnline icon="ri:scales-line" class="unit-tool__empty-icon" />
              </template>
            </el-empty>

            <div v-else class="unit-tool__results">
              <div v-for="(result, index) in env.outputResults" :key="index" class="unit-tool__result-item" :class="{ 'unit-tool__result-item--highlight': index === 0 }">
                <div class="unit-tool__result-label">
                  <IconifyIconOnline :icon="getResultIcon(result.label)" class="unit-tool__result-icon" />
                  <span>{{ result.label }}</span>
                </div>
                <div class="unit-tool__result-value">
                  <span>{{ result.value }}</span>
                  <el-button type="primary" link size="small" class="unit-tool__copy-btn" @click="copyToClipboard(result.value)">
                    <IconifyIconOnline icon="ri:file-copy-line" />
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 单位参考卡片 -->
          <el-card class="unit-tool__reference-card" shadow="hover">
            <template #header>
              <div class="unit-tool__card-header">
                <IconifyIconOnline icon="ri:information-line" class="unit-tool__card-icon" />
                <span>单位参考</span>
              </div>
            </template>

            <div class="unit-tool__reference">
              <el-collapse accordion>
                <el-collapse-item title="长度单位" name="length">
                  <div class="unit-tool__reference-list">
                    <div class="unit-tool__reference-item">
                      <span class="unit-tool__reference-name">1 米 (m)</span>
                      <span class="unit-tool__reference-value">= 100 厘米 = 1000 毫米 = 0.001 千米</span>
                    </div>
                    <div class="unit-tool__reference-item">
                      <span class="unit-tool__reference-name">1 英寸 (in)</span>
                      <span class="unit-tool__reference-value">= 2.54 厘米</span>
                    </div>
                    <div class="unit-tool__reference-item">
                      <span class="unit-tool__reference-name">1 英尺 (ft)</span>
                      <span class="unit-tool__reference-value">= 30.48 厘米 = 12 英寸</span>
                    </div>
                    <div class="unit-tool__reference-item">
                      <span class="unit-tool__reference-name">1 码 (yd)</span>
                      <span class="unit-tool__reference-value">= 0.9144 米 = 3 英尺</span>
                    </div>
                    <div class="unit-tool__reference-item">
                      <span class="unit-tool__reference-name">1 英里 (mi)</span>
                      <span class="unit-tool__reference-value">= 1.609344 千米 = 1609.344 米</span>
                    </div>
                  </div>
                </el-collapse-item>
                <el-collapse-item title="体积单位" name="volume">
                  <div class="unit-tool__reference-list">
                    <div class="unit-tool__reference-item">
                      <span class="unit-tool__reference-name">1 立方米 (m³)</span>
                      <span class="unit-tool__reference-value">= 1000 升 = 1000000 立方厘米</span>
                    </div>
                    <div class="unit-tool__reference-item">
                      <span class="unit-tool__reference-name">1 升 (l)</span>
                      <span class="unit-tool__reference-value">= 1000 毫升 = 1 立方分米</span>
                    </div>
                    <div class="unit-tool__reference-item">
                      <span class="unit-tool__reference-name">1 加仑(美) (gal)</span>
                      <span class="unit-tool__reference-value">= 3.785 升</span>
                    </div>
                    <div class="unit-tool__reference-item">
                      <span class="unit-tool__reference-name">1 加仑(英) (uk_gal)</span>
                      <span class="unit-tool__reference-value">= 4.546 升</span>
                    </div>
                  </div>
                </el-collapse-item>
                <el-collapse-item title="质量单位" name="mass">
                  <div class="unit-tool__reference-list">
                    <div class="unit-tool__reference-item">
                      <span class="unit-tool__reference-name">1 千克 (kg)</span>
                      <span class="unit-tool__reference-value">= 1000 克 = 2.2046 磅</span>
                    </div>
                    <div class="unit-tool__reference-item">
                      <span class="unit-tool__reference-name">1 磅 (lb)</span>
                      <span class="unit-tool__reference-value">= 453.59 克 = 16 盎司</span>
                    </div>
                    <div class="unit-tool__reference-item">
                      <span class="unit-tool__reference-name">1 吨 (t)</span>
                      <span class="unit-tool__reference-value">= 1000 千克</span>
                    </div>
                    <div class="unit-tool__reference-item">
                      <span class="unit-tool__reference-name">1 斤</span>
                      <span class="unit-tool__reference-value">= 500 克 = 10 两</span>
                    </div>
                  </div>
                </el-collapse-item>
                <el-collapse-item title="温度单位" name="temperature">
                  <div class="unit-tool__reference-list">
                    <div class="unit-tool__reference-item">
                      <span class="unit-tool__reference-name">摄氏度 (°C) 转 华氏度 (°F)</span>
                      <span class="unit-tool__reference-value">°F = °C × 9/5 + 32</span>
                    </div>
                    <div class="unit-tool__reference-item">
                      <span class="unit-tool__reference-name">华氏度 (°F) 转 摄氏度 (°C)</span>
                      <span class="unit-tool__reference-value">°C = (°F - 32) × 5/9</span>
                    </div>
                    <div class="unit-tool__reference-item">
                      <span class="unit-tool__reference-name">摄氏度 (°C) 转 开尔文 (K)</span>
                      <span class="unit-tool__reference-value">K = °C + 273.15</span>
                    </div>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.unit-tool {
  width: 100%;
  height: 100%;
  background-color: var(--el-bg-color);

  &__content {
    max-width: 1600px;
    margin: 0 auto;
    padding: 20px;
  }

  &__header-container {
    margin-bottom: 24px;
  }

  &__header {
    background: linear-gradient(135deg, var(--el-color-primary-light-5), var(--el-color-primary));
    border-radius: 12px;
    padding: 24px;
    color: #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &__header-inner {
    max-width: 800px;
  }

  &__header-title {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 8px;
  }

  &__header-subtitle {
    font-size: 16px;
    opacity: 0.9;
  }

  &__card-header {
    display: flex;
    align-items: center;
    font-size: 16px;
    font-weight: 600;
  }

  &__card-icon {
    margin-right: 8px;
    font-size: 20px;
  }

  &__input-card,
  &__result-card,
  &__history-card,
  &__reference-card {
    margin-bottom: 24px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  }

  &__input,
  &__select {
    width: 100%;
  }

  &__unit-row {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    margin-bottom: 20px;

    .el-form-item {
      flex: 1;
      margin-bottom: 0;
    }
  }

  &__swap-btn-container {
    display: flex;
    justify-content: center;
    align-items: center;
    padding-bottom: 20px;
  }

  &__swap-btn {
    transition: all 0.3s ease;

    &:hover {
      transform: rotate(180deg);
    }
  }

  &__actions {
    display: flex;
    justify-content: flex-start;
    margin-top: 20px;
    gap: 12px;
  }

  &__convert-btn,
  &__reset-btn {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__empty {
    padding: 40px 0;
  }

  &__empty-icon {
    font-size: 48px;
    color: var(--el-text-color-secondary);
  }

  &__results {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__result-item {
    padding: 16px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    transition: all 0.3s ease;

    &--highlight {
      background-color: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary-light-5);
    }
  }

  &__result-label {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    color: var(--el-text-color-secondary);
    font-size: 14px;
  }

  &__result-icon {
    margin-right: 8px;
  }

  &__result-value {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 18px;
    font-weight: 600;
    color: var(--el-color-primary);
    word-break: break-all;
  }

  &__copy-btn {
    margin-left: 8px;
  }

  &__history {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 300px;
    overflow-y: auto;
  }

  &__history-item {
    padding: 12px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background-color: var(--el-fill-color-light);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
  }

  &__history-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__history-expression {
    font-weight: 600;
    color: var(--el-color-primary);
  }

  &__history-meta {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__reference {
    padding: 8px;
  }

  &__reference-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__reference-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__reference-name {
    font-weight: 600;
    color: var(--el-color-primary);
  }

  &__reference-value {
    color: var(--el-text-color-regular);
  }

  @media (max-width: 768px) {
    &__unit-row {
      flex-direction: column;
      align-items: stretch;
      gap: 20px;
    }

    &__swap-btn-container {
      padding: 0;
      margin: -10px 0;
    }

    &__actions {
      flex-wrap: wrap;
    }
  }
}
</style>
