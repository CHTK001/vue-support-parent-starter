<!-- 区划边界选择组件 -->
<template>
  <div class="boundary-selector" :class="{ active: active }" :style="positionStyle">
    <div class="boundary-selector-header">
      <div class="title">
        <i class="boundary-icon"></i>
        区划选择器
      </div>
      <div class="actions">
        <button class="btn-icon" @click="locateCurrent" title="定位到当前">
          <i class="location-icon"></i>
        </button>
        <button class="btn-icon" @click="toggleSettings" title="设置">
          <i class="settings-icon"></i>
        </button>
      </div>
    </div>

    <div class="boundary-selector-content">
      <div class="search-container">
        <input type="text" v-model="searchText" placeholder="搜索行政区划..." class="search-input" />
        <i class="search-icon"></i>
      </div>

      <div class="tree-container">
        <el-tree
          v-if="treeData.length > 0"
          :data="filteredTreeData"
          :expand-on-click-node="false"
          :default-expanded-keys="expandedKeys"
          :node-key="'key'"
          :highlight-current="true"
          :current-node-key="selectedKeys[0]"
          show-checkbox
          check-strictly
          @check="onCheck"
          @check-change="onCheckChange"
          @node-click="onNodeClick"
          @node-expand="onExpand"
          class="district-tree"
          ref="treeRef"
        >
          <template #default="{ node, data }">
            <span :class="{ 'selected-node': node.isCurrent }">{{ node.label }}</span>
          </template>
        </el-tree>
        <div v-else class="loading-state">
          <div v-if="isLoading" class="loading-spinner">
            <div class="spinner"></div>
            <span>加载中...</span>
          </div>
          <div v-else class="error-state">
            <i class="error-icon"></i>
            <p>加载失败</p>
            <button class="btn btn-primary" @click="loadDistrictTree">重试</button>
          </div>
        </div>
      </div>

      <div class="selected-section">
        <div class="selected-boundaries" v-if="selectedBoundaries.length > 0">
          <div class="selected-header">
            <span class="selected-title">
              <i class="check-icon"></i>
              已选区划 ({{ selectedBoundaries.length }})
            </span>
            <div class="actions">
              <button class="btn btn-primary" @click="applyBoundaries">应用</button>
              <button class="btn" @click="clearBoundaries">清空</button>
            </div>
          </div>
          <div class="selected-list">
            <div v-for="item in selectedBoundaries" :key="item.code" class="selected-item">
              <span class="item-name">{{ item.name }}</span>
              <button class="btn-icon remove-btn" @click="removeBoundary(item.code)" title="移除">
                <i class="delete-icon"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="settings-panel" v-if="showSettings">
      <div class="settings-header">
        <h3>边界显示设置</h3>
        <button class="btn-icon" @click="toggleSettings" title="关闭">
          <i class="close-icon"></i>
        </button>
      </div>

      <div class="settings-content">
        <div class="setting-item">
          <label>填充区域</label>
          <el-switch v-model="options.fillBoundary" />
        </div>

        <div class="setting-item">
          <label>边框颜色</label>
          <el-color-picker v-model="options.strokeColor" />
        </div>

        <div class="setting-item">
          <label>边框宽度</label>
          <el-slider v-model="options.strokeWidth" :min="1" :max="5" :step="0.5" />
        </div>

        <div class="setting-item">
          <label>填充颜色</label>
          <el-color-picker v-model="options.fillColor" />
        </div>

        <div class="setting-item">
          <label>填充透明度</label>
          <el-slider v-model="options.fillOpacity" :min="0" :max="1" :step="0.05" />
        </div>

        <div class="setting-item">
          <label>显示标签</label>
          <el-switch v-model="options.showLabel" />
        </div>

        <div class="setting-item" v-if="options.showLabel">
          <label>标签大小</label>
          <el-slider v-model="options.labelOptions.fontSize" :min="10" :max="24" :step="1" />
        </div>

        <div class="setting-item" v-if="options.showLabel">
          <label>标签颜色</label>
          <el-color-picker v-model="options.labelOptions.fontColor" />
        </div>
      </div>

      <div class="settings-footer">
        <button class="btn btn-primary" @click="applySettings">应用</button>
        <button class="btn" @click="resetSettings">重置</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: "BoundarySelector"
};
</script>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { BoundaryLevel, BoundaryData, BoundaryOptions } from "../types/boundary";
import { DEFAULT_BOUNDARY_OPTIONS } from "../types/default";
import { MapType } from "../types/map";
import { ApiUrls } from "../types/api";
import logger from "../composables/LogObject";
import { message } from "@repo/utils";

// 定义组件属性
const props = defineProps({
  active: {
    type: Boolean,
    default: false
  },
  position: {
    type: String,
    default: "top-right",
    validator: (value: string) => ["top-left", "top-right", "bottom-left", "bottom-right"].includes(value)
  },
  boundaryObj: {
    type: Object,
    required: true
  },
  defaultOptions: {
    type: Object,
    default: () => DEFAULT_BOUNDARY_OPTIONS
  },
  mapKey: {
    type: Object,
    default: () => ({})
  },
  // 添加 apiUrls 属性
  apiUrls: {
    type: Object as () => ApiUrls,
    default: () => ({})
  },
  // 保留旧属性以保持向后兼容性
  boundaryUrl: {
    type: String,
    default: ""
  },
  districtUrl: {
    type: String,
    default: ""
  }
});

// 定义组件事件
const emit = defineEmits(["close", "apply", "clear", "remove"]);

// 组件状态
const searchText = ref("");
const treeData = ref<any[]>([]);
const rawTreeData = ref<any[]>([]);
const expandedKeys = ref<string[]>([]);
const selectedKeys = ref<string[]>([]);
const selectedBoundaries = ref<BoundaryData[]>([]);
const showSettings = ref(false);
const isLoading = ref(false);
const options = ref<BoundaryOptions>({ ...DEFAULT_BOUNDARY_OPTIONS, ...props.defaultOptions });
const treeRef = ref(null);

// 位置样式
const positionStyle = computed(() => {
  switch (props.position) {
    case "top-left":
      return { top: "10px", left: "10px" };
    case "top-right":
      return { top: "10px", right: "10px" };
    case "bottom-left":
      return { bottom: "10px", left: "10px" };
    case "bottom-right":
      return { bottom: "10px", right: "10px" };
    default:
      return { top: "10px", right: "10px" };
  }
});

// 过滤后的树数据
const filteredTreeData = computed(() => {
  if (!searchText.value.trim()) return treeData.value;

  const searchValue = searchText.value.toLowerCase();
  logger.info("搜索关键词:", searchValue);

  // 特殊处理常见省份搜索
  if (handleCommonProvinceSearch(searchValue)) {
    return handleCommonProvinceSearch(searchValue);
  }

  // 使用深拷贝创建原始数据的副本
  const treeDataCopy = JSON.parse(JSON.stringify(treeData.value));

  // 如果直接匹配省名称（如浙江省），尝试直接查找
  const directMatch = treeDataCopy.find(province => province.label.toLowerCase().includes(searchValue) || (province.fullname && province.fullname.toLowerCase().includes(searchValue)));

  if (directMatch) {
    logger.info(`直接匹配到省份: ${directMatch.label}`);
    return [directMatch];
  }

  // 定义一个函数检查节点是否匹配搜索条件
  const isNodeMatch = (node: any): boolean => {
    if (!node) return false;

    // 匹配标签名称
    const titleMatch = node.label && node.label.toLowerCase().includes(searchValue);
    // 匹配完整名称（如果存在）
    const fullnameMatch = node.fullname && node.fullname.toLowerCase().includes(searchValue);
    // 匹配拼音字段（如果存在）
    const pinyinMatch = node.pinyin && node.pinyin.toLowerCase().includes(searchValue);

    return titleMatch || fullnameMatch || pinyinMatch;
  };

  // 遍历树并保留匹配节点及其父节点
  const filterTreeNodes = (nodes: any[]): any[] => {
    if (!nodes || nodes.length === 0) return [];

    const result: any[] = [];

    for (const node of nodes) {
      // 检查节点本身是否匹配
      const selfMatch = isNodeMatch(node);

      // 递归处理子节点
      const filteredChildren = node.children ? filterTreeNodes(node.children) : [];

      // 如果节点自身匹配或有匹配的子节点，则保留
      if (selfMatch || filteredChildren.length > 0) {
        const clonedNode = { ...node };

        // 如果有匹配的子节点，替换子节点数组
        if (filteredChildren.length > 0) {
          clonedNode.children = filteredChildren;
        }

        result.push(clonedNode);

        if (selfMatch) {
          logger.info(`找到匹配: ${node.label}`);
        }
      }
    }

    return result;
  };

  const filteredResult = filterTreeNodes(treeDataCopy);
  logger.info(`过滤后节点数量: ${filteredResult.length}`);

  // 如果没有找到匹配，尝试更宽松的搜索（部分匹配）
  if (filteredResult.length === 0) {
    logger.info("尝试宽松搜索...");
    // 在原始数据中模糊搜索
    const fuzzyMatches = treeDataCopy.filter(node => {
      // 检查所有节点及其子节点是否有任何包含搜索词的文本
      const hasMatch = JSON.stringify(node).toLowerCase().includes(searchValue);
      if (hasMatch) {
        logger.info(`模糊匹配到: ${node.label}`);
      }
      return hasMatch;
    });

    return fuzzyMatches;
  }

  return filteredResult;
});

// 生命周期钩子
onMounted(async () => {
  if (props.active) {
    try {
      await loadDistrictTree();
    } catch (error) {
      logger.error("加载区划树失败:", error);
    }
  }
});

// 监听active状态变化，当变为true时加载数据
watch(
  () => props.active,
  async newValue => {
    if (newValue && treeData.value.length === 0) {
      try {
        await loadDistrictTree();
      } catch (error) {
        logger.error("加载区划树失败:", error);
      }
    }
  }
);

// 加载区划树
async function loadDistrictTree() {
  if (isLoading.value) return;

  isLoading.value = true;
  try {
    // 优先使用 apiUrls，然后是旧的 districtUrl 属性
    const districtUrl = props.apiUrls?.district || props.districtUrl || undefined;

    // 获取区划树数据
    const districtTree = await props.boundaryObj.loadDistrictTree(props.mapKey, districtUrl);

    if (!districtTree || districtTree.length === 0) {
      throw new Error("获取区划树数据为空");
    }

    rawTreeData.value = districtTree;

    // 打印原始区划树数据的部分内容，帮助调试
    logger.info("原始区划树数据示例:", JSON.stringify(districtTree.slice(0, 1)));

    // 检查数据中是否包含浙江省
    const hasZhejiang = districtTree.some((item: any) => (item.name && item.name.includes("浙江")) || (item.fullname && item.fullname.includes("浙江")));
    logger.info("数据中包含浙江省:", hasZhejiang);

    // 转换为树形结构
    treeData.value = formatTreeData(districtTree);

    // 默认展开所有一级节点
    expandedKeys.value = treeData.value.map(item => item.key);

    // 已选边界回显
    updateSelectedBoundaries();
  } catch (error) {
    logger.error("加载区划树失败:", error);
    message("加载区划树失败，请检查网络连接或API密钥", { type: "error" });
    treeData.value = [];
  } finally {
    isLoading.value = false;
  }
}

// 更新已选边界
function updateSelectedBoundaries() {
  const boundaries = props.boundaryObj.getSelectedBoundaries();
  if (boundaries && boundaries.length > 0) {
    // 避免重复，使用Map来存储唯一的边界
    const uniqueBoundaries = new Map();
    boundaries.forEach(b => {
      if (!uniqueBoundaries.has(b.code)) {
        uniqueBoundaries.set(b.code, b);
      }
    });

    selectedBoundaries.value = Array.from(uniqueBoundaries.values());
    selectedKeys.value = Array.from(uniqueBoundaries.keys());

    // 设置选中状态
    nextTick(() => {
      if (treeRef.value) {
        selectedKeys.value.forEach(key => {
          treeRef.value.setChecked(key, true, false);
        });
      }
    });
  }
}

// 格式化树形数据
function formatTreeData(data: any[]): any[] {
  if (!data || data.length === 0) return [];

  return data
    .map(item => {
      if (!item) return null;

      const children = item.children || item.districts || [];
      const name = item.name || "";

      // 调试日志：检查浙江省数据
      if (name.includes("浙江")) {
        logger.info("找到浙江省数据:", JSON.stringify(item));
      }

      const node = {
        label: name,
        key: item.adcode || item.code || "",
        pinyin: item.pinyin || "", // 保留拼音字段，确保不为undefined
        fullname: item.fullname || name, // 保留完整名称字段
        level: item.level, // 保留级别字段
        center: item.center, // 保留中心点字段
        children: children.length > 0 ? formatTreeData(children) : [],
        isLeaf: !children || children.length === 0,
        // 保留原始数据，以便调试
        rawData: { ...item }
      };

      return node;
    })
    .filter(Boolean); // 过滤掉可能的null值
}

// 节点点击处理
function onNodeClick(data: any) {
  // 点击节点时不执行特殊操作，由复选框处理选择
}

// 复选框变化处理
async function onCheckChange(data: any, checked: boolean) {
  const key = data.key;

  if (checked) {
    // 如果已经选择了该节点，则不重复添加
    if (selectedBoundaries.value.some(item => item.code === key)) {
      return;
    }

    try {
      await addBoundaryByKey(key);
    } catch (error) {
      logger.error("添加边界失败:", error);
      message("添加边界失败", { type: "error" });
    }
  } else {
    // 移除边界
    removeBoundary(key);
  }
}

// 复选框选中处理
function onCheck(data: any, checkInfo: any) {
  // 处理批量选中/取消选中的情况
  const { checkedKeys } = checkInfo;
  const currentSelected = selectedBoundaries.value.map(b => b.code);

  // 找出新增的keys
  const newKeys = checkedKeys.filter((key: string) => !currentSelected.includes(key));

  // 找出移除的keys
  const removedKeys = currentSelected.filter(key => !checkedKeys.includes(key));

  // 批量添加新选中的边界（避免重复添加）
  if (newKeys.length > 0) {
    Promise.all(
      newKeys.map(key => {
        // 避免重复添加已经存在的边界
        if (!selectedBoundaries.value.some(b => b.code === key)) {
          return addBoundaryByKey(key);
        }
        return Promise.resolve(true);
      })
    ).catch(error => {
      logger.error("批量添加边界失败:", error);
      message("部分边界添加失败", { type: "warning" });
    });
  }

  // 批量移除取消选中的边界
  removedKeys.forEach(key => {
    removeBoundary(key);
  });
}

// 通过key添加边界
async function addBoundaryByKey(key: string) {
  // 检查是否已经存在此边界
  if (selectedBoundaries.value.some(b => b.code === key)) {
    return true; // 已存在，直接返回成功
  }

  // 优先使用 apiUrls，然后是旧的 boundaryUrl 属性
  const boundaryUrl = props.apiUrls?.boundary || props.boundaryUrl || undefined;

  // 添加边界
  const added = await props.boundaryObj.addBoundaryByAdcode(key, {
    ...options.value,
    mapKey: props.mapKey,
    // 使用 apiUrls 对象传递 API URL
    apiUrls: {
      boundary: boundaryUrl
    }
  });

  if (added) {
    // 获取添加的边界数据
    const boundaries = props.boundaryObj.getSelectedBoundaries();
    const boundary = boundaries.find(b => b.code === key);

    if (boundary) {
      // 确保不重复添加
      if (!selectedBoundaries.value.some(b => b.code === key)) {
        selectedBoundaries.value.push(boundary);
      }
    }
  }

  return added;
}

// 展开节点
function onExpand(data: any, node: any) {
  const expanded = node.expanded;
  if (expanded) {
    expandedKeys.value.push(data.key);
  } else {
    expandedKeys.value = expandedKeys.value.filter(key => key !== data.key);
  }
}

// 应用边界
function applyBoundaries() {
  emit("apply", selectedBoundaries.value);
}

// 清空边界
function clearBoundaries() {
  selectedBoundaries.value = [];
  props.boundaryObj.clearBoundaries();

  // 清空树选中状态
  if (treeRef.value) {
    treeRef.value.setCheckedKeys([]);
  }

  emit("clear");
}

// 移除边界
function removeBoundary(code: string) {
  selectedBoundaries.value = selectedBoundaries.value.filter(item => item.code !== code);
  props.boundaryObj.removeBoundary(code);

  // 更新树选中状态
  if (treeRef.value) {
    treeRef.value.setChecked(code, false, false);
  }

  emit("remove", code);
}

// 定位到当前
function locateCurrent() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        props.boundaryObj.locateToPosition([longitude, latitude]);
      },
      error => {
        logger.error("获取当前位置失败:", error);
        message("获取当前位置失败", { type: "error" });
      }
    );
  } else {
    message("您的浏览器不支持地理定位", { type: "error" });
  }
}

// 切换设置面板
function toggleSettings() {
  showSettings.value = !showSettings.value;
}

// 应用设置
function applySettings() {
  props.boundaryObj.setOptions(options.value);
  props.boundaryObj.updateAllBoundariesStyle();
  showSettings.value = false;
}

// 重置设置
function resetSettings() {
  options.value = { ...DEFAULT_BOUNDARY_OPTIONS, ...props.defaultOptions };
}

// 监听选项变化
watch(
  () => props.defaultOptions,
  newOptions => {
    options.value = { ...DEFAULT_BOUNDARY_OPTIONS, ...newOptions };
  },
  { deep: true }
);

// 监听搜索文本变化
watch(
  () => searchText.value,
  newValue => {
    // 记录搜索内容
    if (newValue) {
      logger.info(`执行搜索: "${newValue}"`);

      // 添加浙江省的直接查找功能
      if (newValue.toLowerCase().includes("浙江")) {
        findProvinceInRawData("浙江");
      }
    }

    // 如果搜索内容不为空，自动展开所有节点
    if (newValue.trim()) {
      nextTick(() => {
        if (treeRef.value) {
          try {
            // 尝试展开所有节点
            treeRef.value.expandAll();
          } catch (error) {
            // 如果不支持expandAll方法，则使用默认展开逻辑
            const allKeys = getAllKeys(treeData.value);
            expandedKeys.value = allKeys;
          }
        }
      });
    } else {
      // 搜索内容为空时，只展开一级节点
      expandedKeys.value = treeData.value.map(item => item.key);
    }
  }
);

// 在原始数据中查找省份
function findProvinceInRawData(provinceName: string) {
  if (!rawTreeData.value || rawTreeData.value.length === 0) {
    logger.info(`原始数据为空，无法查找${provinceName}`);
    return;
  }

  // 在原始数据中搜索
  const findInData = (data: any[], name: string): any => {
    if (!data || data.length === 0) return null;

    // 先在顶层查找
    const found = data.find(item => (item.name && item.name.includes(name)) || (item.fullname && item.fullname.includes(name)));

    if (found) {
      return found;
    }

    // 在子层级递归查找
    for (const item of data) {
      const children = item.children || item.districts || [];
      if (children.length > 0) {
        const foundInChildren = findInData(children, name);
        if (foundInChildren) {
          return foundInChildren;
        }
      }
    }

    return null;
  };

  const province = findInData(rawTreeData.value, provinceName);

  if (province) {
    logger.info(`在原始数据中找到${provinceName}:`, JSON.stringify(province));

    // 找到后，确保对应的节点被选中和展开
    nextTick(() => {
      if (treeRef.value && province.adcode) {
        try {
          // 设置节点为当前选中节点
          treeRef.value.setCurrentKey(province.adcode);
          // 确保节点可见
          expandedKeys.value = [...expandedKeys.value, province.adcode];
        } catch (error) {
          logger.error("设置当前节点失败:", error);
        }
      }
    });
  } else {
    logger.info(`在原始数据中未找到${provinceName}`);

    // 进一步检查数据结构
    logger.info("原始数据结构:", Object.keys(rawTreeData.value[0] || {}).join(", "));
    logger.info("原始数据示例:", JSON.stringify(rawTreeData.value.slice(0, 1)));

    // 尝试查找包含该省份名称的任何字符串
    const dataStr = JSON.stringify(rawTreeData.value);
    const includesProvince = dataStr.includes(provinceName);
    logger.info(`原始数据字符串中包含${provinceName}: ${includesProvince}`);

    if (includesProvince) {
      // 查找包含该省份的原始数据项
      const index = rawTreeData.value.findIndex(item => JSON.stringify(item).includes(provinceName));

      if (index >= 0) {
        logger.info(`在第${index}项中找到包含${provinceName}的数据:`, JSON.stringify(rawTreeData.value[index]));
      }
    }
  }
}

// 获取所有节点的key
function getAllKeys(nodes: any[]): string[] {
  if (!nodes || nodes.length === 0) return [];

  let keys: string[] = [];

  nodes.forEach(node => {
    if (node.key) {
      keys.push(node.key);
    }
    if (node.children && node.children.length > 0) {
      keys = [...keys, ...getAllKeys(node.children)];
    }
  });

  return keys;
}

// 处理常见省份的特殊搜索
function handleCommonProvinceSearch(searchValue: string): any[] | null {
  // 省份名称映射，适配不同的搜索词
  const provinceMap: Record<string, string[]> = {
    浙江: ["浙江", "zhejiang", "浙"],
    北京: ["北京", "beijing", "京"],
    上海: ["上海", "shanghai", "沪"],
    广东: ["广东", "guangdong", "粤"],
    江苏: ["江苏", "jiangsu", "苏"],
    山东: ["山东", "shandong", "鲁"],
    河南: ["河南", "henan", "豫"],
    四川: ["四川", "sichuan", "川"],
    河北: ["河北", "hebei", "冀"],
    湖北: ["湖北", "hubei", "鄂"],
    湖南: ["湖南", "hunan", "湘"],
    福建: ["福建", "fujian", "闽"],
    安徽: ["安徽", "anhui", "皖"],
    陕西: ["陕西", "shaanxi", "陕"],
    山西: ["山西", "shanxi", "晋"],
    江西: ["江西", "jiangxi", "赣"],
    广西: ["广西", "guangxi", "桂"],
    重庆: ["重庆", "chongqing", "渝"],
    辽宁: ["辽宁", "liaoning", "辽"],
    吉林: ["吉林", "jilin", "吉"],
    黑龙江: ["黑龙江", "heilongjiang", "黑"],
    云南: ["云南", "yunnan", "云"],
    贵州: ["贵州", "guizhou", "贵"],
    甘肃: ["甘肃", "gansu", "甘"],
    内蒙古: ["内蒙古", "neimenggu", "蒙"],
    宁夏: ["宁夏", "ningxia", "宁"],
    新疆: ["新疆", "xinjiang", "新"],
    西藏: ["西藏", "xizang", "藏"],
    海南: ["海南", "hainan", "琼"],
    青海: ["青海", "qinghai", "青"],
    香港: ["香港", "hongkong", "港"],
    澳门: ["澳门", "macao", "澳"],
    台湾: ["台湾", "taiwan", "台"]
  };

  // 查找匹配的省份
  let matchedProvince: string | null = null;

  // 遍历所有省份别名
  for (const [province, aliases] of Object.entries(provinceMap)) {
    if (aliases.some(alias => searchValue.includes(alias.toLowerCase()))) {
      matchedProvince = province;
      break;
    }
  }

  if (!matchedProvince) return null;

  logger.info(`特殊处理省份搜索: ${matchedProvince}`);

  // 在树数据中查找匹配的省份
  const provincesInTree = treeData.value.filter(node => node.label.includes(matchedProvince!) || (node.fullname && node.fullname.includes(matchedProvince!)));

  if (provincesInTree.length > 0) {
    logger.info(`找到省份 ${matchedProvince}: ${provincesInTree.map(p => p.label).join(", ")}`);
    return provincesInTree;
  }

  // 如果在一级节点中没找到，尝试在所有节点中搜索
  const allNodes = getAllNodes(treeData.value);
  const matchedNodes = allNodes.filter(node => node.label.includes(matchedProvince!) || (node.fullname && node.fullname.includes(matchedProvince!)));

  if (matchedNodes.length > 0) {
    logger.info(`在所有节点中找到省份 ${matchedProvince}: ${matchedNodes.map(n => n.label).join(", ")}`);

    // 构建返回一个包含这些节点的树
    // 这里我们简单地返回找到的节点列表，UI会自动展示
    return matchedNodes;
  }

  // 如果真的找不到，返回null让默认逻辑处理
  return null;
}

// 获取树中的所有节点
function getAllNodes(nodes: any[]): any[] {
  if (!nodes || nodes.length === 0) return [];

  let result: any[] = [];

  for (const node of nodes) {
    result.push(node);
    if (node.children && node.children.length > 0) {
      result = [...result, ...getAllNodes(node.children)];
    }
  }

  return result;
}
</script>

<style lang="scss" scoped>
// 变量定义
$primary-color: #409eff;
$primary-hover: #66b1ff;
$primary-active: #3a8ee6;
$border-color: #dcdfe6;
$border-hover: #c0c4cc;
$text-primary: #303133;
$text-secondary: #606266;
$text-muted: #909399;
$success-color: #67c23a;
$error-color: #f56c6c;
$warning-color: #e6a23c;
$info-color: var(--el-text-color-primary);
$background-color: #ffffff;
$border-radius: 4px;
$box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
$transition-time: 0.3s;

// 图标样式
@mixin icon($url) {
  display: inline-block;
  width: 16px;
  height: 16px;
  background: $url no-repeat center center;
  background-size: contain;
}

.boundary-selector {
  position: absolute;
  width: 320px;
  max-height: 80vh;
  background-color: $background-color;
  border-radius: $border-radius;
  box-shadow: $box-shadow;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  opacity: 0;
  pointer-events: none;
  transition:
    opacity $transition-time ease,
    transform $transition-time ease;
  transform: translateY(-10px);
  overflow: hidden;
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif;

  &.active {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }

  // 头部样式
  .boundary-selector-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid $border-color;
    background-color: #f5f7fa;

    .title {
      font-weight: 600;
      color: $text-primary;
      font-size: 16px;
      display: flex;
      align-items: center;

      .boundary-icon {
        @include icon(
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23409EFF' d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z'/%3E%3C/svg%3E")
        );
        margin-right: 8px;
      }
    }

    .actions {
      display: flex;
      gap: 8px;
    }
  }

  // 内容区域
  .boundary-selector-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-height: calc(80vh - 54px); // 减去header高度

    // 搜索框
    .search-container {
      position: relative;
      flex-shrink: 0;
      margin-bottom: 16px;

      .search-input {
        width: 100%;
        height: 36px;
        padding: 0 36px 0 12px;
        border: 1px solid $border-color;
        border-radius: $border-radius;
        font-size: 14px;
        color: $text-primary;
        transition: border-color $transition-time;
        outline: none;

        &:hover {
          border-color: $border-hover;
        }

        &:focus {
          border-color: $primary-color;
        }

        &::placeholder {
          color: $text-muted;
        }
      }

      .search-icon {
        @include icon(
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23909399' d='M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z'/%3E%3C/svg%3E")
        );
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        opacity: 0.7;
      }
    }

    // 树容器
    .tree-container {
      flex: 1;
      height: 240px;
      min-height: 180px;
      max-height: 35vh;
      border: 1px solid $border-color;
      border-radius: $border-radius;
      padding: 12px;
      background-color: #fafafa;
      overflow-y: auto;
      margin-bottom: 16px;

      .district-tree {
        width: 100%;

        :deep(.el-tree) {
          background-color: transparent;
        }

        :deep(.el-tree-node) {
          margin-top: 2px;

          &:first-child {
            margin-top: 0;
          }
        }

        :deep(.el-tree-node__content) {
          height: 32px;

          &:hover {
            background-color: #f5f7fa;
          }
        }

        :deep(.el-tree-node.is-current > .el-tree-node__content) {
          background-color: #ecf5ff;
        }

        :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
          background-color: $primary-color;
          border-color: $primary-color;
        }

        :deep(.el-tree-node__label) {
          font-size: 14px;
        }

        .selected-node {
          color: $primary-color;
          font-weight: 500;
        }
      }

      .loading-state,
      .error-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 200px;
        color: $text-muted;
        gap: 12px;

        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;

          .spinner {
            width: 30px;
            height: 30px;
            border: 3px solid rgba($primary-color, 0.3);
            border-top-color: $primary-color;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        }

        .error-icon {
          @include icon(
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23F56C6C' d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z'/%3E%3C/svg%3E")
          );
          width: 40px;
          height: 40px;
        }

        p {
          margin: 0 0 8px;
          font-size: 14px;
        }
      }
    }

    // 已选区域
    .selected-section {
      flex-shrink: 0;

      .selected-boundaries {
        border-top: 1px solid $border-color;
        padding-top: 12px;

        .selected-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          .selected-title {
            font-weight: 500;
            color: $text-primary;
            display: flex;
            align-items: center;

            .check-icon {
              @include icon(
                url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%2367C23A' d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'/%3E%3C/svg%3E")
              );
              margin-right: 6px;
            }
          }

          .actions {
            display: flex;
            gap: 8px;
          }
        }

        .selected-list {
          max-height: 150px;
          overflow-y: auto;
          border: 1px solid $border-color;
          border-radius: $border-radius;

          &::-webkit-scrollbar {
            width: 6px;
          }

          &::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 3px;
          }

          &::-webkit-scrollbar-thumb {
            background: #ccc;
            border-radius: 3px;
          }

          &::-webkit-scrollbar-thumb:hover {
            background: #aaa;
          }

          .selected-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            border-bottom: 1px solid rgba($border-color, 0.5);
            transition: background-color $transition-time;

            &:last-child {
              border-bottom: none;
            }

            &:hover {
              background-color: #f5f7fa;
            }

            .item-name {
              font-size: 14px;
              color: $text-primary;
            }

            .remove-btn {
              opacity: 0.6;

              &:hover {
                opacity: 1;
              }

              .delete-icon {
                @include icon(
                  url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23F56C6C' d='M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z'/%3E%3C/svg%3E")
                );
              }
            }
          }
        }
      }
    }
  }

  // 设置面板
  .settings-panel {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: $background-color;
    z-index: 1001;
    display: flex;
    flex-direction: column;
    transition: all $transition-time ease;

    .settings-header {
      padding: 12px 16px;
      border-bottom: 1px solid $border-color;
      background-color: #f5f7fa;
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: $text-primary;
      }

      .close-icon {
        @include icon(
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23303133' d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'/%3E%3C/svg%3E")
        );
      }
    }

    .settings-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;

      .setting-item {
        margin-bottom: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;

        label {
          flex: 1;
          color: $text-secondary;
          font-size: 14px;
        }

        :deep(.el-slider) {
          width: 140px;
        }
      }
    }

    .settings-footer {
      padding: 12px 16px;
      border-top: 1px solid $border-color;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
  }
}

// 按钮样式
.btn {
  height: 32px;
  padding: 0 12px;
  border: 1px solid $border-color;
  border-radius: $border-radius;
  background-color: var(--el-bg-color-overlay);
  color: $text-secondary;
  cursor: pointer;
  font-size: 14px;
  transition: all $transition-time;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    border-color: $primary-color;
    color: $primary-color;
  }

  &:active {
    background-color: rgba($primary-color, 0.1);
  }

  &.btn-primary {
    background-color: $primary-color;
    color: var(--el-text-color-primary);
    border-color: $primary-color;

    &:hover {
      background-color: $primary-hover;
      border-color: $primary-hover;
    }

    &:active {
      background-color: $primary-active;
      border-color: $primary-active;
    }
  }
}

.btn-icon {
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: $border-radius;
  transition: all $transition-time;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  i {
    width: 18px;
    height: 18px;
    display: inline-block;
  }

  .location-icon {
    @include icon(
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23303133' d='M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z'/%3E%3C/svg%3E")
    );
  }

  .settings-icon {
    @include icon(
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23303133' d='M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z'/%3E%3C/svg%3E")
    );
  }

  .close-icon {
    @include icon(
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23303133' d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'/%3E%3C/svg%3E")
    );
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .boundary-selector {
    width: calc(100% - 20px);
    max-width: 320px;
    max-height: 70vh;
  }
}
</style>
