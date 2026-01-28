<script setup>
import { reactive, ref, onMounted } from "vue";
import { message } from "@repo/utils";
import Prism from "prismjs";
// 修改导入方式，使用动态导入
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.css";
// 导入 XML 和 JSON 语法高亮
import "prismjs/components/prism-xml-doc.js";
import "prismjs/components/prism-json.js";
import "prismjs/components/prism-markup.js";
import "prismjs/plugins/line-numbers/prism-line-numbers";
import vkbeautify from "vkbeautify";
// 响应式数据
const env = reactive({
  // 输入XML
  inputXML: "",
  // 输出XML
  outputXML: "",
  // 操作类型
  operationType: "format", // format, minify, validate, convert
  // 格式化选项
  formatOptions: {
    indent: "  ",
    preserveComments: true,
  },
  // 转换选项
  convertOptions: {
    type: "xml2json", // xml2json, json2xml
    inputJSON: "",
    outputJSON: "",
  },
  // XPath查询
  xpathOptions: {
    query: "",
    results: [],
  },
  // 历史记录
  history: [],
  // 加载状态
  loading: false,
  // 示例XML
  examples: [
    {
      name: "简单XML示例",
      content: `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <person id="1">
    <name>张三</name>
    <age>30</age>
    <email>zhangsan@example.com</email>
    <address>
      <city>北京</city>
      <street>朝阳区</street>
    </address>
  </person>
  <person id="2">
    <name>李四</name>
    <age>25</age>
    <email>lisi@example.com</email>
    <address>
      <city>上海</city>
      <street>浦东新区</street>
    </address>
  </person>
</root>`,
    },
    {
      name: "配置文件示例",
      content: `<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <appSettings>
    <add key="setting1" value="value1" />
    <add key="setting2" value="value2" />
    <add key="setting3" value="value3" />
  </appSettings>
  <connectionStrings>
    <add name="Database1" connectionString="Server=localhost;Database=mydb;User Id=user;Password=password;" />
  </connectionStrings>
  <system.web>
    <compilation debug="true" />
    <authentication mode="Forms">
      <forms loginUrl="~/Account/Login" timeout="30" />
    </authentication>
  </system.web>
</configuration>`,
    },
    {
      name: "SOAP消息示例",
      content: `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" 
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Header>
    <AuthHeader xmlns="http://example.org/webservices">
      <Username>user123</Username>
      <Password>pass456</Password>
    </AuthHeader>
  </soap:Header>
  <soap:Body>
    <GetUserInfo xmlns="http://example.org/webservices">
      <UserId>12345</UserId>
    </GetUserInfo>
  </soap:Body>
</soap:Envelope>`,
    },
  ],
});

// 格式化XML
const formatXML = () => {
  try {
    env.loading = true;

    if (!env.inputXML.trim()) {
      throw new Error("请输入XML内容");
    }

    env.outputXML = vkbeautify.xml(env.inputXML, env.formatOptions.indent);

    // 添加到历史记录
    addToHistory("格式化XML", env.inputXML, env.outputXML);

    // 高亮显示
    setTimeout(() => {
      Prism.highlightAll();
    }, 0);

    message("XML格式化成功", { type: "success" });
  } catch (error) {
    console.error("XML格式化错误:", error);
    message(error.message || "XML格式化失败", { type: "error" });
  } finally {
    env.loading = false;
  }
};

// 压缩XML
const minifyXML = () => {
  try {
    env.loading = true;

    if (!env.inputXML.trim()) {
      throw new Error("请输入XML内容");
    }

    env.outputXML = vkbeautify.xmlmin(env.inputXML, env.formatOptions.preserveComments);

    // 添加到历史记录
    addToHistory("压缩XML", env.inputXML, env.outputXML);

    // 高亮显示
    setTimeout(() => {
      Prism.highlightAll();
    }, 0);

    message("XML压缩成功", { type: "success" });
  } catch (error) {
    console.error("XML压缩错误:", error);
    message(error.message || "XML压缩失败", { type: "error" });
  } finally {
    env.loading = false;
  }
};

// 验证XML
const validateXML = () => {
  try {
    env.loading = true;

    if (!env.inputXML.trim()) {
      throw new Error("请输入XML内容");
    }

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(env.inputXML, "text/xml");

    // 检查解析错误
    const parserError = xmlDoc.getElementsByTagName("parsererror");
    if (parserError.length > 0) {
      const errorMsg = parserError[0].textContent;
      throw new Error("XML验证失败: " + errorMsg);
    }

    // 格式化输出
    env.outputXML = vkbeautify.xml(env.inputXML);

    // 添加到历史记录
    addToHistory("验证XML", env.inputXML, env.outputXML);

    // 高亮显示
    setTimeout(() => {
      Prism.highlightAll();
    }, 0);

    message("XML验证通过", { type: "success" });
  } catch (error) {
    console.error("XML验证错误:", error);
    message(error.message || "XML验证失败", { type: "error" });
  } finally {
    env.loading = false;
  }
};

// XML转JSON
const xml2json = () => {
  try {
    env.loading = true;

    if (!env.inputXML.trim()) {
      throw new Error("请输入XML内容");
    }

    // 解析XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(env.inputXML, "text/xml");

    // 检查解析错误
    const parserError = xmlDoc.getElementsByTagName("parsererror");
    if (parserError.length > 0) {
      const errorMsg = parserError[0].textContent;
      throw new Error("XML解析失败: " + errorMsg);
    }

    // 转换为JSON
    const jsonObj = xmlToJson(xmlDoc);
    env.convertOptions.outputJSON = JSON.stringify(jsonObj, null, 2);

    // 添加到历史记录
    addToHistory("XML转JSON", env.inputXML, env.convertOptions.outputJSON);

    message("XML转JSON成功", { type: "success" });
  } catch (error) {
    console.error("XML转JSON错误:", error);
    message(error.message || "XML转JSON失败", { type: "error" });
  } finally {
    env.loading = false;
  }
};

// JSON转XML
const json2xml = () => {
  try {
    env.loading = true;

    if (!env.convertOptions.inputJSON.trim()) {
      throw new Error("请输入JSON内容");
    }

    // 解析JSON
    const jsonObj = JSON.parse(env.convertOptions.inputJSON);

    // 转换为XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += jsonToXml(jsonObj);

    // 格式化XML
    env.outputXML = vkbeautify.xml(xml);

    // 添加到历史记录
    addToHistory("JSON转XML", env.convertOptions.inputJSON, env.outputXML);

    // 高亮显示
    setTimeout(() => {
      Prism.highlightAll();
    }, 0);

    message("JSON转XML成功", { type: "success" });
  } catch (error) {
    console.error("JSON转XML错误:", error);
    message(error.message || "JSON转XML失败", { type: "error" });
  } finally {
    env.loading = false;
  }
};

// XPath查询
const queryXPath = () => {
  try {
    env.loading = true;

    if (!env.inputXML.trim()) {
      throw new Error("请输入XML内容");
    }

    if (!env.xpathOptions.query.trim()) {
      throw new Error("请输入XPath查询表达式");
    }

    // 解析XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(env.inputXML, "text/xml");

    // 检查解析错误
    const parserError = xmlDoc.getElementsByTagName("parsererror");
    if (parserError.length > 0) {
      const errorMsg = parserError[0].textContent;
      throw new Error("XML解析失败: " + errorMsg);
    }

    // 执行XPath查询
    const result = xmlDoc.evaluate(env.xpathOptions.query, xmlDoc, null, XPathResult.ANY_TYPE, null);

    // 收集结果
    const results = [];
    let node;

    switch (result.resultType) {
      case XPathResult.NUMBER_TYPE:
        results.push({ type: "数值", value: result.numberValue.toString() });
        break;
      case XPathResult.STRING_TYPE:
        results.push({ type: "字符串", value: result.stringValue });
        break;
      case XPathResult.BOOLEAN_TYPE:
        results.push({ type: "布尔值", value: result.booleanValue.toString() });
        break;
      case XPathResult.UNORDERED_NODE_ITERATOR_TYPE:
      case XPathResult.ORDERED_NODE_ITERATOR_TYPE:
        while ((node = result.iterateNext())) {
          let value;
          if (node.nodeType === Node.ELEMENT_NODE) {
            // 元素节点，获取XML字符串
            const serializer = new XMLSerializer();
            value = vkbeautify.xml(serializer.serializeToString(node));
          } else {
            // 其他节点类型，获取节点值
            value = node.nodeValue;
          }
          results.push({ type: "节点", value });
        }
        break;
      default:
        results.push({ type: "未知", value: "查询结果类型不支持" });
    }

    env.xpathOptions.results = results;

    if (results.length === 0) {
      message("XPath查询未找到匹配结果", { type: "warning" });
    } else {
      message(`XPath查询成功，找到 ${results.length} 个结果`, { type: "success" });
    }

    // 高亮显示
    setTimeout(() => {
      Prism.highlightAll();
    }, 0);
  } catch (error) {
    console.error("XPath查询错误:", error);
    message(error.message || "XPath查询失败", { type: "error" });
  } finally {
    env.loading = false;
  }
};

// XML转JSON辅助函数
const xmlToJson = (xml) => {
  // 创建空对象
  let obj = {};

  // 如果没有子节点，返回空对象
  if (xml.nodeType === 9) {
    // document节点
    return xmlToJson(xml.documentElement);
  }

  // 如果是元素节点
  if (xml.nodeType === 1) {
    // 处理属性
    if (xml.attributes.length > 0) {
      obj["@attributes"] = {};
      for (let i = 0; i < xml.attributes.length; i++) {
        const attribute = xml.attributes.item(i);
        obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
      }
    }
  } else if (xml.nodeType === 3) {
    // 文本节点
    return xml.nodeValue.trim();
  }

  // 处理子节点
  if (xml.hasChildNodes()) {
    for (let i = 0; i < xml.childNodes.length; i++) {
      const item = xml.childNodes.item(i);
      const nodeName = item.nodeName;

      // 忽略注释和处理指令
      if (nodeName === "#comment" || (nodeName === "#text" && item.nodeValue.trim() === "")) {
        continue;
      }

      if (nodeName === "#text") {
        // 处理文本内容
        if (xml.childNodes.length === 1) {
          return item.nodeValue.trim();
        } else {
          obj["#text"] = item.nodeValue.trim();
        }
      } else {
        // 处理元素节点
        if (typeof obj[nodeName] === "undefined") {
          obj[nodeName] = xmlToJson(item);
        } else {
          // 如果节点已存在，转换为数组
          if (typeof obj[nodeName].push === "undefined") {
            const old = obj[nodeName];
            obj[nodeName] = [];
            obj[nodeName].push(old);
          }
          obj[nodeName].push(xmlToJson(item));
        }
      }
    }
  }

  return obj;
};

// JSON转XML辅助函数
const jsonToXml = (json, parentKey = "") => {
  let xml = "";

  // 处理数组
  if (Array.isArray(json)) {
    for (let i = 0; i < json.length; i++) {
      xml += jsonToXml(json[i], parentKey);
    }
  } else if (typeof json === "object" && json !== null) {
    // 处理对象
    for (const key in json) {
      if (key === "@attributes") {
        continue; // 属性在外层处理
      }

      if (key === "#text") {
        // 处理文本内容
        xml += json[key];
      } else {
        // 开始标签
        xml += `<${key}`;

        // 处理属性
        if (json["@attributes"] && key === parentKey) {
          for (const attrKey in json["@attributes"]) {
            xml += ` ${attrKey}="${json["@attributes"][attrKey]}"`;
          }
        }

        xml += ">";

        // 处理子元素或文本
        if (typeof json[key] === "object" && json[key] !== null) {
          xml += jsonToXml(json[key], key);
        } else {
          xml += json[key];
        }

        // 结束标签
        xml += `</${key}>`;
      }
    }
  } else {
    // 处理基本类型
    xml += json;
  }

  return xml;
};

// 添加到历史记录
const addToHistory = (operation, input, output) => {
  const now = new Date();
  const historyItem = {
    id: now.getTime(),
    date: now.toLocaleString(),
    operation,
    input,
    output,
  };

  env.history.unshift(historyItem);

  // 限制历史记录数量
  if (env.history.length > 10) {
    env.history.pop();
  }

  // 保存到本地存储
  try {
    localStorage.setItem("xml-tool-history", JSON.stringify(env.history));
  } catch (e) {
    console.error("保存历史记录失败:", e);
  }
};

// 从历史记录加载
const loadFromHistory = (item) => {
  env.inputXML = item.input;
  env.outputXML = item.output;

  // 高亮显示
  setTimeout(() => {
    Prism.highlightAll();
  }, 0);

  message("已从历史记录加载", { type: "success" });
};

// 应用示例
const applyExample = (example) => {
  env.inputXML = example.content;

  // 高亮显示
  setTimeout(() => {
    Prism.highlightAll();
  }, 0);

  message("已应用示例", { type: "success" });
};

// 复制到剪贴板
const copyToClipboard = (text) => {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      message("复制成功", { type: "success" });
    })
    .catch(() => {
      message("复制失败", { type: "error" });
    });
};

// 清空表单
const clearForm = () => {
  env.inputXML = "";
  env.outputXML = "";
  env.convertOptions.inputJSON = "";
  env.convertOptions.outputJSON = "";
  env.xpathOptions.query = "";
  env.xpathOptions.results = [];

  message("已清空", { type: "success" });
};

// 执行操作
const executeOperation = () => {
  switch (env.operationType) {
    case "format":
      formatXML();
      break;
    case "minify":
      minifyXML();
      break;
    case "validate":
      validateXML();
      break;
    case "xml2json":
      xml2json();
      break;
    case "json2xml":
      json2xml();
      break;
    case "xpath":
      queryXPath();
      break;
    default:
      message("请选择操作类型", { type: "warning" });
  }
};

// 组件挂载时初始化
onMounted(() => {
  // 从本地存储加载历史记录
  try {
    const savedHistory = localStorage.getItem("xml-tool-history");
    if (savedHistory) {
      env.history = JSON.parse(savedHistory);
    }
  } catch (e) {
    console.error("加载历史记录失败:", e);
  }

  // 初始化语法高亮
  setTimeout(() => {
    Prism.highlightAll();
  }, 0);
});
</script>

<template>
  <div class="xml-tool">
    <div class="xml-tool__content">
      <!-- 头部信息 -->
      <div class="xml-tool__header-container">
        <div class="xml-tool__header">
          <div class="xml-tool__header-inner">
            <h1 class="xml-tool__header-title">XML处理工具</h1>
            <p class="xml-tool__header-subtitle">格式化、压缩、验证XML，支持XML与JSON互转，XPath查询等功能</p>
          </div>
        </div>
      </div>

      <!-- 主要内容区域 -->
      <el-row :gutter="24">
        <!-- 左侧输入区域 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card class="xml-tool__input-card" shadow="hover">
            <template #header>
              <div class="xml-tool__card-header">
                <IconifyIconOnline icon="ri:code-box-line" class="xml-tool__card-icon" />
                <span>XML处理</span>
              </div>
            </template>

            <el-form label-position="top">
              <!-- 操作类型选择 -->
              <el-form-item label="操作类型">
                <el-radio-group v-model="env.operationType" class="xml-tool__radio-group">
                  <el-radio label="format">
                    <div class="xml-tool__radio-content">
                      <IconifyIconOnline icon="ri:format-line" />
                      <span>格式化</span>
                    </div>
                  </el-radio>
                  <el-radio label="minify">
                    <div class="xml-tool__radio-content">
                      <IconifyIconOnline icon="ri:file-reduce-line" />
                      <span>压缩</span>
                    </div>
                  </el-radio>
                  <el-radio label="validate">
                    <div class="xml-tool__radio-content">
                      <IconifyIconOnline icon="ri:check-line" />
                      <span>验证</span>
                    </div>
                  </el-radio>
                  <el-radio label="xml2json">
                    <div class="xml-tool__radio-content">
                      <IconifyIconOnline icon="ri:arrow-right-line" />
                      <span>XML转JSON</span>
                    </div>
                  </el-radio>
                  <el-radio label="json2xml">
                    <div class="xml-tool__radio-content">
                      <IconifyIconOnline icon="ri:arrow-left-line" />
                      <span>JSON转XML</span>
                    </div>
                  </el-radio>
                  <el-radio label="xpath">
                    <div class="xml-tool__radio-content">
                      <IconifyIconOnline icon="ri:search-line" />
                      <span>XPath查询</span>
                    </div>
                  </el-radio>
                </el-radio-group>
              </el-form-item>

              <!-- XML输入 -->
              <el-form-item v-if="env.operationType !== 'json2xml'" label="XML内容">
                <el-input v-model="env.inputXML" type="textarea" :rows="12" placeholder="请输入XML内容" resize="vertical" class="xml-tool__input" />
              </el-form-item>

              <!-- JSON输入 (仅JSON转XML模式) -->
              <el-form-item v-if="env.operationType === 'json2xml'" label="JSON内容">
                <el-input v-model="env.convertOptions.inputJSON" type="textarea" :rows="12" placeholder="请输入JSON内容" resize="vertical" class="xml-tool__input" />
              </el-form-item>

              <!-- XPath查询 (仅XPath查询模式) -->
              <el-form-item v-if="env.operationType === 'xpath'" label="XPath表达式">
                <el-input v-model="env.xpathOptions.query" placeholder="例如: //person[@id='1']/name" class="xml-tool__input" />
              </el-form-item>

              <!-- 示例选择 -->
              <el-form-item v-if="env.operationType !== 'json2xml'" label="示例">
                <div class="xml-tool__examples">
                  <el-button v-for="example in env.examples" :key="example.name" size="small" @click="applyExample(example)">
                    {{ example.name }}
                  </el-button>
                </div>
              </el-form-item>

              <!-- 操作按钮 -->
              <div class="xml-tool__actions">
                <el-button type="primary" :loading="env.loading" class="xml-tool__execute-btn" @click="executeOperation">
                  <IconifyIconOnline icon="ri:play-line" />
                  <span>执行操作</span>
                </el-button>

                <el-button class="xml-tool__clear-btn" @click="clearForm">
                  <IconifyIconOnline icon="ri:delete-bin-line" />
                  <span>清空</span>
                </el-button>
              </div>
            </el-form>
          </el-card>
        </el-col>

        <!-- 右侧结果区域 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <!-- 结果卡片 -->
          <el-card class="xml-tool__result-card" shadow="hover">
            <template #header>
              <div class="xml-tool__card-header">
                <IconifyIconOnline icon="ri:file-list-line" class="xml-tool__card-icon" />
                <span>处理结果</span>
              </div>
            </template>

            <el-empty v-if="!env.outputXML && !env.convertOptions.outputJSON && !env.xpathOptions.results.length" description="请先执行操作" class="xml-tool__empty">
              <template #image>
                <IconifyIconOnline icon="ri:code-box-line" class="xml-tool__empty-icon" />
              </template>
            </el-empty>

            <!-- XML输出结果 -->
            <div v-if="env.outputXML && env.operationType !== 'xml2json'" class="xml-tool__result-content">
              <div class="xml-tool__result-header">
                <span>XML结果</span>
                <el-button type="primary" link size="small" @click="copyToClipboard(env.outputXML)">
                  <IconifyIconOnline icon="ri:file-copy-line" />
                  <span>复制</span>
                </el-button>
              </div>
              <pre class="language-xml">
<code>{{ env.outputXML }}</code>
              </pre>
            </div>

            <!-- JSON输出结果 -->
            <div v-if="env.convertOptions.outputJSON && env.operationType === 'xml2json'" class="xml-tool__result-content">
              <div class="xml-tool__result-header">
                <span>JSON结果</span>
                <el-button type="primary" link size="small" @click="copyToClipboard(env.convertOptions.outputJSON)">
                  <IconifyIconOnline icon="ri:file-copy-line" />
                  <span>复制</span>
                </el-button>
              </div>
              <pre class="language-json line-numbers"><code>{{ env.convertOptions.outputJSON }}</code></pre>
            </div>

            <!-- XPath查询结果 -->
            <div v-if="env.xpathOptions.results.length > 0 && env.operationType === 'xpath'" class="xml-tool__result-content">
              <div class="xml-tool__result-header">
                <span>XPath查询结果 ({{ env.xpathOptions.results.length }}个)</span>
              </div>
              <div v-for="(result, index) in env.xpathOptions.results" :key="index" class="xml-tool__xpath-result">
                <div class="xml-tool__xpath-result-header">
                  <span>结果 #{{ index + 1 }} ({{ result.type }})</span>
                  <el-button type="primary" link size="small" @click="copyToClipboard(result.value)">
                    <IconifyIconOnline icon="ri:file-copy-line" />
                  </el-button>
                </div>
                <pre v-if="result.type === '节点'" class="language-xml"><code>{{ result.value }}</code></pre>
                <div v-else class="xml-tool__xpath-value">{{ result.value }}</div>
              </div>
            </div>
          </el-card>

          <!-- 历史记录卡片 -->
          <el-card class="xml-tool__history-card" shadow="hover">
            <template #header>
              <div class="xml-tool__card-header">
                <IconifyIconOnline icon="ri:history-line" class="xml-tool__card-icon" />
                <span>历史记录</span>
              </div>
            </template>

            <el-empty v-if="!env.history.length" description="暂无历史记录" class="xml-tool__empty">
              <template #image>
                <IconifyIconOnline icon="ri:history-line" class="xml-tool__empty-icon" />
              </template>
            </el-empty>

            <div v-else class="xml-tool__history">
              <div v-for="item in env.history" :key="item.id" class="xml-tool__history-item">
                <div class="xml-tool__history-content">
                  <div class="xml-tool__history-operation">{{ item.operation }}</div>
                  <div class="xml-tool__history-meta">
                    <span class="xml-tool__history-date">{{ item.date }}</span>
                  </div>
                </div>
                <div class="xml-tool__history-actions">
                  <el-button type="primary" link size="small" @click="loadFromHistory(item)">
                    <IconifyIconOnline icon="ri:arrow-go-back-line" />
                    <span>加载</span>
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 帮助卡片 -->
          <el-card class="xml-tool__help-card" shadow="hover">
            <template #header>
              <div class="xml-tool__card-header">
                <IconifyIconOnline icon="ri:question-line" class="xml-tool__card-icon" />
                <span>帮助信息</span>
              </div>
            </template>

            <el-collapse accordion>
              <el-collapse-item title="XML格式化" name="format">
                <div class="xml-tool__help-content">
                  <p>将XML内容进行格式化，使其具有良好的缩进和换行，便于阅读和编辑。</p>
                </div>
              </el-collapse-item>
              <el-collapse-item title="XML压缩" name="minify">
                <div class="xml-tool__help-content">
                  <p>移除XML中的空白字符、换行符和缩进，生成紧凑的XML内容，减小文件体积。</p>
                </div>
              </el-collapse-item>
              <el-collapse-item title="XML验证" name="validate">
                <div class="xml-tool__help-content">
                  <p>检查XML内容是否符合XML语法规范，验证XML的有效性。</p>
                </div>
              </el-collapse-item>
              <el-collapse-item title="XML转JSON" name="xml2json">
                <div class="xml-tool__help-content">
                  <p>将XML内容转换为JSON格式，便于在JavaScript中处理。</p>
                  <p>转换规则：</p>
                  <ul>
                    <li>XML元素转换为JSON对象</li>
                    <li>XML属性转换为带@attributes前缀的对象</li>
                    <li>相同名称的子元素转换为数组</li>
                  </ul>
                </div>
              </el-collapse-item>
              <el-collapse-item title="JSON转XML" name="json2xml">
                <div class="xml-tool__help-content">
                  <p>将JSON内容转换为XML格式。</p>
                  <p>转换规则：</p>
                  <ul>
                    <li>JSON对象转换为XML元素</li>
                    <li>@attributes对象转换为XML属性</li>
                    <li>数组转换为多个相同名称的XML元素</li>
                  </ul>
                </div>
              </el-collapse-item>
              <el-collapse-item title="XPath查询" name="xpath">
                <div class="xml-tool__help-content">
                  <p>使用XPath表达式查询XML文档中的节点。</p>
                  <p>常用XPath语法：</p>
                  <ul>
                    <li><code>//元素名</code> - 选择所有指定元素</li>
                    <li><code>//元素名[@属性='值']</code> - 选择具有特定属性值的元素</li>
                    <li><code>//元素名[子元素='值']</code> - 选择具有特定子元素值的元素</li>
                    <li><code>//元素名[position()=n]</code> - 选择第n个元素</li>
                    <li><code>//元素名/子元素</code> - 选择所有子元素</li>
                  </ul>
                </div>
              </el-collapse-item>
            </el-collapse>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.xml-tool {
  width: 100%;
  height: 100%;
  background-color: var(--el-bg-color);

  &__content {
    margin: 0 auto;
    padding: 20px;
  }

  /* 头部样式 */
  &__header-container {
    margin-bottom: 24px;
  }

  &__header {
    background: linear-gradient(135deg, var(--el-color-danger-light-3) 0%, var(--el-color-danger) 100%);
    border-radius: 12px;
    padding: 30px;
    color: #fff;
    box-shadow: 0 4px 20px rgba(var(--el-color-danger-rgb), 0.3);
    position: relative;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      box-shadow: 0 6px 24px rgba(var(--el-color-danger-rgb), 0.4);
      transform: translateY(-2px);
    }

    &-inner {
      position: relative;
      z-index: 2;
    }

    &-title {
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 10px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    &-subtitle {
      font-size: 16px;
      margin: 0;
      opacity: 0.9;
    }
  }

  /* 卡片样式 */
  &__card-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__card-icon {
    font-size: 18px;
    color: var(--el-color-primary);
  }

  /* 输入卡片 */
  &__input-card,
  &__result-card,
  &__history-card,
  &__help-card {
    margin-bottom: 24px;
    border-radius: 12px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid var(--el-border-color-lighter);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      border-color: var(--el-color-danger-light-7);
    }
  }

  /* 单选按钮组样式 */
  &__radio-group {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 10px;

    .el-radio {
      margin-right: 0;
      padding: 8px 0;
      flex: 0 0 calc(33.33% - 10px);

      &.is-checked {
        .xml-tool__radio-content {
          color: var(--el-color-primary);
          transform: translateY(-2px);
        }
      }
    }
  }

  &__radio-content {
    display: flex;
    align-items: center;
    gap: 5px;
    transition: all 0.3s ease;
  }

  /* 输入框样式 */
  &__input {
    font-family: monospace;
  }

  /* 示例按钮 */
  &__examples {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  /* 操作按钮 */
  &__actions {
    display: flex;
    gap: 10px;
    margin-top: 20px;
  }

  &__execute-btn,
  &__clear-btn {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  /* 结果区域 */
  &__result-content {
    margin-bottom: 20px;
  }

  &__result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    font-weight: 500;
  }

  /* XPath查询结果 */
  &__xpath-result {
    margin-bottom: 16px;
    padding: 12px;
    border-radius: 8px;
    background-color: var(--el-fill-color-light);
  }

  &__xpath-result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    font-weight: 500;
  }

  &__xpath-value {
    font-family: monospace;
    padding: 8px;
    background-color: var(--el-fill-color);
    border-radius: 4px;
    white-space: pre-wrap;
    word-break: break-all;
  }

  /* 空状态 */
  &__empty {
    padding: 40px 0;
  }

  &__empty-icon {
    font-size: 48px;
    color: var(--el-color-info-light-5);
  }

  /* 历史记录 */
  &__history {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__history-item {
    padding: 12px;
    border-radius: 8px;
    background-color: var(--el-fill-color-light);
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.3s ease;

    &:hover {
      background-color: var(--el-fill-color);
    }
  }

  &__history-content {
    flex: 1;
  }

  &__history-operation {
    font-size: 14px;
    color: var(--el-text-color-primary);
    margin-bottom: 4px;
  }

  &__history-meta {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  /* 帮助内容 */
  &__help-content {
    font-size: 14px;
    color: var(--el-text-color-regular);
    line-height: 1.6;

    p {
      margin: 8px 0;
    }

    ul {
      padding-left: 20px;
      margin: 8px 0;
    }

    code {
      background-color: var(--el-fill-color);
      padding: 2px 4px;
      border-radius: 4px;
      font-family: monospace;
    }
  }
}

/* 代码高亮相关样式 */
:deep(.line-numbers) {
  padding-left: 3.8em !important;
}

:deep(.line-numbers-rows) {
  left: 0 !important;
  border-right: 1px solid rgba(0, 0, 0, 0.2);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .xml-tool {
    &__radio-group {
      .el-radio {
        flex: 0 0 calc(50% - 10px);
      }
    }
  }
}
</style>
