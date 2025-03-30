<script setup>
import { reactive, ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import Prism from "prismjs";
import "prismjs/components/prism-sql.min.js";
import "prismjs/themes/prism-tomorrow.min.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.min.css";
import { format } from "sql-formatter";

// 响应式数据
const env = reactive({
  // 输入SQL
  inputSQL: "",
  // 参数输入
  paramsInput: "",
  // 参数类型
  paramsType: "json", // json, array, numbered, named
  // 参数分隔符
  paramsSeparator: ",",
  // 输出SQL
  outputSQL: "",
  // 格式化选项
  formatOptions: {
    enabled: true,
    language: "mysql", // mysql, postgresql, tsql, etc.
    uppercase: false,
    indent: "  ",
  },
  // MyBatis日志解析
  mybatisLog: {
    input: "",
    enabled: true, // 修改为 true，默认显示 MyBatis 日志解析功能
  },
  // 历史记录
  history: [],
  // 加载状态
  loading: false,
  // 常用SQL模板
  templates: [
    {
      name: "MySQL预处理语句 (问号占位符)",
      sql: "SELECT * FROM users WHERE username = ? AND status = ? AND created_at > ?",
      params: '["admin", 1, "2023-01-01"]',
      type: "json",
    },
    {
      name: "PostgreSQL预处理语句 (数字占位符)",
      sql: "SELECT * FROM products WHERE category = $1 AND price > $2 ORDER BY name $3",
      params: '["electronics", 100, "ASC"]',
      type: "json",
    },
    {
      name: "命名参数 (冒号前缀)",
      sql: "SELECT * FROM orders WHERE customer_id = :customerId AND order_date BETWEEN :startDate AND :endDate",
      params: '{"customerId": 12345, "startDate": "2023-01-01", "endDate": "2023-12-31"}',
      type: "json",
    },
    {
      name: "JDBC预处理语句 (问号占位符)",
      sql: "INSERT INTO users (username, email, password, created_at) VALUES (?, ?, ?, NOW())",
      params: '["newuser", "user@example.com", "hashed_password"]',
      type: "json",
    },
    {
      name: "MyBatis动态SQL (井号占位符)",
      sql: "SELECT * FROM employees WHERE department_id = #{departmentId} AND salary > #{minSalary}",
      params: '{"departmentId": 5, "minSalary": 5000}',
      type: "json",
    },
  ],
  // 参数类型选项
  paramTypeOptions: [
    { label: "JSON格式", value: "json" },
    { label: "数组格式", value: "array" },
    { label: "命名参数", value: "named" },
    { label: "数字占位符", value: "numbered" },
  ],
  // SQL方言选项
  sqlDialectOptions: [
    { label: "MySQL", value: "mysql" },
    { label: "PostgreSQL", value: "postgresql" },
    { label: "SQL Server", value: "tsql" },
    { label: "MariaDB", value: "mariadb" },
    { label: "SQLite", value: "sqlite" },
    { label: "Oracle", value: "plsql" },
    { label: "标准SQL", value: "sql" },
  ],
});

// 填充SQL参数
const fillSQLParams = () => {
  try {
    env.loading = true;

    if (!env.inputSQL) {
      throw new Error("请输入SQL语句");
    }

    let sql = env.inputSQL;
    let params = [];

    // 解析参数
    if (env.paramsType === "json") {
      try {
        params = JSON.parse(env.paramsInput);
      } catch (e) {
        throw new Error("JSON参数格式错误: " + e.message);
      }
    } else if (env.paramsType === "array") {
      params = env.paramsInput.split(env.paramsSeparator).map((p) => p.trim());
    } else if (env.paramsType === "named" || env.paramsType === "numbered") {
      try {
        params = JSON.parse(env.paramsInput);
      } catch (e) {
        throw new Error("参数格式错误: " + e.message);
      }
    }

    // 根据参数类型填充SQL
    if (env.paramsType === "json" || env.paramsType === "array") {
      if (Array.isArray(params)) {
        // 处理问号占位符
        let paramIndex = 0;
        sql = sql.replace(/\?/g, () => {
          if (paramIndex < params.length) {
            const param = formatParam(params[paramIndex]);
            paramIndex++;
            return param;
          }
          return "?";
        });

        // 处理数字占位符 $1, $2, ...
        sql = sql.replace(/\$(\d+)/g, (match, number) => {
          const index = parseInt(number, 10) - 1;
          if (index >= 0 && index < params.length) {
            return formatParam(params[index]);
          }
          return match;
        });
      } else {
        throw new Error("参数必须是数组格式");
      }
    } else if (env.paramsType === "named") {
      // 处理命名参数 :name 或 #{name}
      sql = sql.replace(/:([\w]+)/g, (match, name) => {
        if (params[name] !== undefined) {
          return formatParam(params[name]);
        }
        return match;
      });

      sql = sql.replace(/#{([\w]+)}/g, (match, name) => {
        if (params[name] !== undefined) {
          return formatParam(params[name]);
        }
        return match;
      });
    } else if (env.paramsType === "numbered") {
      // 处理数字占位符 $1, $2, ...
      sql = sql.replace(/\$(\d+)/g, (match, number) => {
        const index = parseInt(number, 10) - 1;
        if (index >= 0 && index < params.length) {
          return formatParam(params[index]);
        }
        return match;
      });
    }

    // 格式化SQL
    if (env.formatOptions.enabled) {
      try {
        sql = format(sql, {
          language: env.formatOptions.language,
          uppercase: env.formatOptions.uppercase,
          indent: env.formatOptions.indent,
        });
      } catch (e) {
        console.error("SQL格式化错误:", e);
        // 继续使用未格式化的SQL
      }
    }

    env.outputSQL = sql;

    // 添加到历史记录
    addToHistory(env.inputSQL, env.paramsInput, env.outputSQL);

    // 高亮显示
    setTimeout(() => {
      Prism.highlightAll();
    }, 0);

    ElMessage.success("SQL参数填充成功");
  } catch (error) {
    console.error("SQL参数填充错误:", error);
    ElMessage.error(error.message || "参数填充失败");
  } finally {
    env.loading = false;
  }
};

// 格式化参数值
const formatParam = (value) => {
  if (value === null) {
    return "NULL";
  } else if (typeof value === "string") {
    // 转义单引号
    return `'${value.replace(/'/g, "''")}'`;
  } else if (typeof value === "number" || typeof value === "boolean") {
    return value.toString();
  } else if (value instanceof Date) {
    return `'${value.toISOString()}'`;
  } else if (Array.isArray(value)) {
    return `(${value.map((v) => formatParam(v)).join(", ")})`;
  } else if (typeof value === "object") {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  }
  return `'${value}'`;
};

// 添加到历史记录
const addToHistory = (inputSQL, paramsInput, outputSQL) => {
  const now = new Date();
  const historyItem = {
    id: now.getTime(),
    date: now.toLocaleString(),
    inputSQL: inputSQL,
    paramsInput: paramsInput,
    outputSQL: outputSQL,
  };

  env.history.unshift(historyItem);

  // 限制历史记录数量
  if (env.history.length > 10) {
    env.history.pop();
  }

  // 保存到本地存储
  try {
    localStorage.setItem("sql-params-history", JSON.stringify(env.history));
  } catch (e) {
    console.error("保存历史记录失败:", e);
  }
};

// 从历史记录加载
const loadFromHistory = (item) => {
  env.inputSQL = item.inputSQL;
  env.paramsInput = item.paramsInput;
  env.outputSQL = item.outputSQL;

  // 高亮显示
  setTimeout(() => {
    Prism.highlightAll();
  }, 0);

  ElMessage.success("已从历史记录加载");
};

// 应用模板
const applyTemplate = (template) => {
  env.inputSQL = template.sql;
  env.paramsInput = template.params;
  env.paramsType = template.type;

  ElMessage.success("已应用模板");
};

// 复制到剪贴板
const copyToClipboard = (text) => {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      ElMessage.success("复制成功");
    })
    .catch(() => {
      ElMessage.error("复制失败");
    });
};

// 格式化SQL
const formatSQL = () => {
  if (!env.inputSQL) {
    ElMessage.warning("请先输入SQL语句");
    return;
  }

  try {
    env.inputSQL = format(env.inputSQL, {
      language: env.formatOptions.language,
      uppercase: env.formatOptions.uppercase,
      indent: env.formatOptions.indent,
    });

    ElMessage.success("SQL格式化成功");
  } catch (e) {
    console.error("SQL格式化错误:", e);
    ElMessage.error("SQL格式化失败: " + e.message);
  }
};

// 清空表单
const clearForm = () => {
  env.inputSQL = "";
  env.paramsInput = "";
  env.outputSQL = "";

  ElMessage.success("已清空");
};

// 组件挂载时初始化
onMounted(() => {
  // 从本地存储加载历史记录
  try {
    const savedHistory = localStorage.getItem("sql-params-history");
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

// 解析MyBatis日志
const parseMybatisLog = () => {
  try {
    env.loading = true;

    if (!env.mybatisLog.input) {
      throw new Error("请输入MyBatis日志");
    }

    const logContent = env.mybatisLog.input;

    // 尝试提取SQL语句 - 同时支持带有 ==> 前缀和不带前缀的格式
    let sqlMatch = logContent.match(/(?:==>)?\s*Preparing:\s*([\s\S]+?)(?=(?:==>)?\s*Parameters:|$)/i);
    if (!sqlMatch || !sqlMatch[1]) {
      throw new Error("无法从日志中提取SQL语句");
    }

    // 提取SQL语句并清理
    let sql = sqlMatch[1].trim();

    // 尝试提取参数 - 同时支持带有 ==> 前缀和不带前缀的格式
    let paramsMatch = logContent.match(/(?:==>)?\s*Parameters:\s*([\s\S]+?)(?=\n|$)/i);
    let params = [];
    let paramsStr = "";

    if (paramsMatch && paramsMatch[1]) {
      // 解析参数字符串
      const paramsText = paramsMatch[1].trim();

      // 匹配所有参数，格式通常为: value(Type), value(Type), ...
      const paramRegex = /([^,]+?)(?:\(([\w\.]+)\))(?:,|$)/g;
      let match;

      while ((match = paramRegex.exec(paramsText)) !== null) {
        let value = match[1].trim();
        const type = match[2]; // 参数类型

        // 根据类型处理值
        if (type.includes("String")) {
          // 保持字符串格式
          params.push(value);
        } else if (type.includes("Integer") || type.includes("Long") || type.includes("Short")) {
          // 转换为数字
          params.push(parseInt(value, 10));
        } else if (type.includes("Double") || type.includes("Float") || type.includes("BigDecimal")) {
          // 转换为浮点数
          params.push(parseFloat(value));
        } else if (type.includes("Boolean")) {
          // 转换为布尔值
          params.push(value.toLowerCase() === "true");
        } else if (value.toLowerCase() === "null") {
          // 处理null值
          params.push(null);
        } else {
          // 其他类型保持原样
          params.push(value);
        }
      }

      // 生成JSON格式的参数字符串
      paramsStr = JSON.stringify(params, null, 2);
    }

    // 更新输入字段
    env.inputSQL = sql;
    env.paramsInput = paramsStr;
    env.paramsType = "json"; // 默认使用JSON格式

    // 关闭MyBatis日志输入框
    env.mybatisLog.enabled = false;

    ElMessage.success("MyBatis日志解析成功");

    // 自动填充参数
    setTimeout(() => {
      fillSQLParams();
    }, 100);
  } catch (error) {
    console.error("MyBatis日志解析错误:", error);
    ElMessage.error(error.message || "日志解析失败");
  } finally {
    env.loading = false;
  }
};

// 切换MyBatis日志输入
const toggleMybatisLogInput = () => {
  env.mybatisLog.enabled = !env.mybatisLog.enabled;
  if (!env.mybatisLog.enabled) {
    env.mybatisLog.input = "";
  }
};
</script>

<template>
  <div class="sql-params">
    <div class="sql-params__content">
      <!-- 头部信息 -->
      <div class="sql-params__header-container">
        <div class="sql-params__header">
          <div class="sql-params__header-inner">
            <h1 class="sql-params__header-title">SQL参数填充工具</h1>
            <p class="sql-params__header-subtitle">填充SQL预处理语句中的参数，支持问号占位符、数字占位符和命名参数</p>
          </div>
        </div>
      </div>

      <!-- 主要内容区域 -->
      <el-row :gutter="24">
        <!-- 左侧输入区域 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card class="sql-params__input-card" shadow="hover">
            <template #header>
              <div class="sql-params__card-header">
                <IconifyIconOnline icon="ri:database-2-line" class="sql-params__card-icon" />
                <span>SQL参数填充</span>
                <div class="sql-params__header-actions">
                  <el-button type="primary" link size="small" @click="toggleMybatisLogInput">
                    <IconifyIconOnline :icon="env.mybatisLog.enabled ? 'ri:arrow-go-back-line' : 'ri:file-search-line'" />
                    <span>{{ env.mybatisLog.enabled ? "返回手动输入" : "解析MyBatis日志" }}</span>
                  </el-button>
                </div>
              </div>
            </template>

            <el-form label-position="top" v-if="!env.mybatisLog.enabled">
              <!-- SQL输入 -->
              <el-form-item label="SQL语句 (包含占位符)">
                <el-input v-model="env.inputSQL" type="textarea" :rows="8" placeholder="例如: SELECT * FROM users WHERE username = ? AND status = ?" resize="vertical" />
              </el-form-item>

              <!-- 参数类型选择 -->
              <el-form-item label="参数类型">
                <el-radio-group v-model="env.paramsType" class="sql-params__radio-group">
                  <el-radio v-for="option in env.paramTypeOptions" :key="option.value" :label="option.value">
                    <div class="sql-params__radio-content">
                      <IconifyIconOnline :icon="option.value === 'json' ? 'ri:braces-line' : option.value === 'array' ? 'ri:list-ordered' : option.value === 'named' ? 'ri:hashtag' : 'ri:number-1'" />
                      <span>{{ option.label }}</span>
                    </div>
                  </el-radio>
                </el-radio-group>
              </el-form-item>

              <!-- 参数输入 -->
              <!-- 参数输入 -->
              <el-form-item :label="env.paramsType === 'json' ? 'JSON参数' : env.paramsType === 'array' ? '数组参数 (用逗号分隔)' : env.paramsType === 'named' ? '命名参数 (JSON对象)' : '数字占位符参数 (JSON数组)'">
                <el-input
                  v-model="env.paramsInput"
                  type="textarea"
                  :rows="5"
                  :placeholder="env.paramsType === 'json' ? '[&quot;value1&quot;, &quot;value2&quot;]' : env.paramsType === 'array' ? 'value1, value2, value3' : env.paramsType === 'named' ? '{&quot;name&quot;: &quot;value&quot;, &quot;status&quot;: 1}' : '[&quot;value1&quot;, &quot;value2&quot;]'"
                  resize="vertical"
                />
              </el-form-item>
              <!-- 分隔符设置 (仅数组模式) -->
              <el-form-item v-if="env.paramsType === 'array'" label="参数分隔符">
                <el-input v-model="env.paramsSeparator" placeholder="默认为逗号" style="width: 100px" />
              </el-form-item>

              <!-- 格式化选项 -->
              <el-form-item label="格式化选项">
                <div class="sql-params__format-options">
                  <el-switch v-model="env.formatOptions.enabled" active-text="启用格式化" />

                  <div v-if="env.formatOptions.enabled" class="sql-params__format-settings">
                    <el-select v-model="env.formatOptions.language" placeholder="SQL方言" class="sql-params__format-select">
                      <el-option v-for="option in env.sqlDialectOptions" :key="option.value" :label="option.label" :value="option.value" />
                    </el-select>

                    <el-switch v-model="env.formatOptions.uppercase" active-text="关键字大写" />
                  </div>
                </div>
              </el-form-item>

              <!-- 操作按钮 -->
              <div class="sql-params__actions">
                <el-button type="primary" :loading="env.loading" class="sql-params__fill-btn" @click="fillSQLParams">
                  <IconifyIconOnline icon="ri:play-fill" />
                  <span>填充参数</span>
                </el-button>

                <el-button type="success" class="sql-params__format-btn" @click="formatSQL">
                  <IconifyIconOnline icon="ri:format-line" />
                  <span>格式化SQL</span>
                </el-button>

                <el-button class="sql-params__clear-btn" @click="clearForm">
                  <IconifyIconOnline icon="ri:delete-bin-line" />
                  <span>清空</span>
                </el-button>
              </div>
            </el-form>
            <el-form label-position="top" v-else>
              <!-- MyBatis日志解析表单 -->
              <el-form-item label="粘贴MyBatis日志 (包含SQL和参数)">
                <el-input v-model="env.mybatisLog.input" type="textarea" :rows="12" placeholder="例如: Preparing: select * from users where id = ? Parameters: 123(Integer)" resize="vertical" />
              </el-form-item>

              <div class="sql-params__actions">
                <el-button type="primary" :loading="env.loading" class="sql-params__fill-btn" @click="parseMybatisLog">
                  <IconifyIconOnline icon="ri:search-line" />
                  <span>解析日志</span>
                </el-button>

                <el-button class="sql-params__clear-btn" @click="env.mybatisLog.input = ''">
                  <IconifyIconOnline icon="ri:delete-bin-line" />
                  <span>清空</span>
                </el-button>
              </div>
            </el-form>
          </el-card>

          <!-- SQL模板卡片 -->
          <el-card class="sql-params__templates-card" shadow="hover">
            <template #header>
              <div class="sql-params__card-header">
                <IconifyIconOnline icon="ri:file-list-3-line" class="sql-params__card-icon" />
                <span>常用SQL模板</span>
              </div>
            </template>

            <div class="sql-params__templates">
              <el-collapse accordion>
                <el-collapse-item v-for="(template, index) in env.templates" :key="index" :title="template.name" :name="index">
                  <div class="sql-params__template-content">
                    <div class="sql-params__template-sql">
                      <div class="sql-params__template-label">SQL:</div>
                      <div class="sql-params__template-code">{{ template.sql }}</div>
                    </div>
                    <div class="sql-params__template-params">
                      <div class="sql-params__template-label">参数:</div>
                      <div class="sql-params__template-code">{{ template.params }}</div>
                    </div>
                    <div class="sql-params__template-actions">
                      <el-button type="primary" size="small" @click.stop="applyTemplate(template)">
                        <IconifyIconOnline icon="ri:file-copy-line" />
                        <span>应用模板</span>
                      </el-button>
                    </div>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧结果区域 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <!-- 结果卡片 -->
          <el-card class="sql-params__result-card" shadow="hover">
            <template #header>
              <div class="sql-params__card-header">
                <IconifyIconOnline icon="ri:code-line" class="sql-params__card-icon" />
                <span>填充结果</span>
                <div class="sql-params__header-actions" v-if="env.outputSQL">
                  <el-button type="primary" link size="small" @click="copyToClipboard(env.outputSQL)">
                    <IconifyIconOnline icon="ri:file-copy-line" />
                    <span>复制</span>
                  </el-button>
                </div>
              </div>
            </template>

            <el-empty v-if="!env.outputSQL" description="请先填充SQL参数" class="sql-params__empty">
              <template #image>
                <IconifyIconOnline icon="ri:database-2-line" class="sql-params__empty-icon" />
              </template>
            </el-empty>

            <div v-else class="sql-params__result">
              <pre class="language-sql line-numbers"><code class="language-sql">{{ env.outputSQL }}</code></pre>
            </div>
          </el-card>

          <!-- 历史记录卡片 -->
          <el-card class="sql-params__history-card" shadow="hover">
            <template #header>
              <div class="sql-params__card-header">
                <IconifyIconOnline icon="ri:history-line" class="sql-params__card-icon" />
                <span>历史记录</span>
              </div>
            </template>

            <el-empty v-if="!env.history.length" description="暂无历史记录" class="sql-params__empty">
              <template #image>
                <IconifyIconOnline icon="ri:history-line" class="sql-params__empty-icon" />
              </template>
            </el-empty>

            <el-table v-else :data="env.history" style="width: 100%" max-height="400">
              <el-table-column label="SQL" show-overflow-tooltip>
                <template #default="scope">
                  <span>{{ scope.row.inputSQL }}</span>
                </template>
              </el-table-column>
              <el-table-column label="参数" show-overflow-tooltip>
                <template #default="scope">
                  <span>{{ scope.row.paramsInput }}</span>
                </template>
              </el-table-column>
              <el-table-column label="时间" width="180">
                <template #default="scope">
                  <span>{{ scope.row.date }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" fixed="right">
                <template #default="scope">
                  <el-button type="primary" link size="small" @click="loadFromHistory(scope.row)">
                    <IconifyIconOnline icon="ri:arrow-go-back-line" />
                    <span>加载</span>
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>

          <!-- 参考卡片 -->
          <el-card class="sql-params__reference-card" shadow="hover">
            <template #header>
              <div class="sql-params__card-header">
                <IconifyIconOnline icon="ri:information-line" class="sql-params__card-icon" />
                <span>使用说明</span>
              </div>
            </template>

            <div class="sql-params__reference">
              <el-collapse accordion>
                <el-collapse-item title="MyBatis日志解析" name="mybatis">
                  <div class="sql-params__reference-content">
                    <p>工具支持从MyBatis日志中提取SQL和参数：</p>
                    <ol>
                      <li>点击"解析MyBatis日志"按钮</li>
                      <li>粘贴包含SQL和参数的MyBatis日志</li>
                      <li>点击"解析日志"按钮</li>
                    </ol>
                    <p>支持的日志格式示例：</p>
                    <pre><code>Preparing: select * from users where id = ? 
Parameters: 123(Integer)</code></pre>
                    <p>或</p>
                    <pre><code>==>  Preparing: select * from users where username = ? and status = ? 
==> Parameters: admin(String), 1(Integer)</code></pre>
                  </div>
                </el-collapse-item>
                <el-collapse-item title="支持的占位符类型" name="placeholders">
                  <div class="sql-params__reference-content">
                    <h4>问号占位符</h4>
                    <p>最常见的占位符类型，用于JDBC预处理语句。</p>
                    <pre><code>SELECT * FROM users WHERE username = ? AND status = ?</code></pre>

                    <h4>数字占位符</h4>
                    <p>PostgreSQL等数据库使用的占位符，从$1开始。</p>
                    <pre><code>SELECT * FROM products WHERE category = $1 AND price > $2</code></pre>

                    <h4>命名参数</h4>
                    <p>使用名称作为占位符，更具可读性。</p>
                    <pre><code>SELECT * FROM orders WHERE customer_id = :customerId</code></pre>
                    <pre><code>SELECT * FROM employees WHERE department = #{departmentId}</code></pre>
                  </div>
                </el-collapse-item>
                <el-collapse-item title="参数格式说明" name="formats">
                  <div class="sql-params__reference-content">
                    <h4>JSON格式</h4>
                    <p>使用JSON数组表示参数列表：</p>
                    <pre><code>["value1", "value2", 123, true]</code></pre>

                    <h4>数组格式</h4>
                    <p>使用分隔符分隔的参数列表：</p>
                    <pre><code>value1, value2, 123, true</code></pre>

                    <h4>命名参数</h4>
                    <p>使用JSON对象，键为参数名：</p>
                    <pre><code>{"customerId": 12345, "status": "active"}</code></pre>
                  </div>
                </el-collapse-item>
                <el-collapse-item title="参数类型处理" name="types">
                  <div class="sql-params__reference-content">
                    <p>工具会根据参数类型自动处理：</p>
                    <ul>
                      <li><strong>字符串</strong>: 添加单引号并转义</li>
                      <li><strong>数字</strong>: 直接使用</li>
                      <li><strong>布尔值</strong>: 转换为1/0或true/false</li>
                      <li><strong>NULL</strong>: 转换为NULL关键字</li>
                      <li><strong>数组</strong>: 转换为(val1, val2, ...)</li>
                      <li><strong>对象</strong>: 转换为JSON字符串</li>
                    </ul>
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
.sql-params {
  width: 100%;
  height: 100%;
  background-color: var(--el-bg-color);

  &__content {
    margin: 0 auto;
    padding: 20px;
  }

  &__header-container {
    margin-bottom: 24px;
  }

  &__header {
    background: linear-gradient(135deg, #0891b2 0%, #155e75 100%);
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

    .sql-params__header-actions {
      margin-left: auto;
    }
  }

  &__card-icon {
    margin-right: 8px;
    font-size: 20px;
  }

  &__input-card,
  &__result-card,
  &__templates-card,
  &__history-card,
  &__reference-card {
    margin-bottom: 24px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  }

  &__radio-group {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }

  &__radio-content {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__format-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__format-settings {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 8px;
  }

  &__format-select {
    width: 150px;
  }

  &__actions {
    display: flex;
    gap: 12px;
    margin-top: 16px;
  }

  &__templates {
    .el-collapse-item {
      margin-bottom: 8px;
    }
  }

  &__template-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__template-sql,
  &__template-params {
    display: flex;
    gap: 8px;
  }

  &__template-label {
    font-weight: 600;
    min-width: 60px;
  }

  &__template-code {
    font-family: monospace;
    background-color: var(--el-fill-color-light);
    padding: 4px 8px;
    border-radius: 4px;
    flex: 1;
    white-space: pre-wrap;
    word-break: break-all;
  }

  &__template-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
  }

  &__empty {
    padding: 40px 0;
  }

  &__empty-icon {
    font-size: 48px;
    color: var(--el-text-color-secondary);
  }

  &__result {
    max-height: 400px;
    overflow: auto;

    pre {
      margin: 0;
      border-radius: 8px;
    }
  }

  &__reference-content {
    font-size: 14px;
    color: var(--el-text-color-regular);
    line-height: 1.6;

    h4 {
      margin: 12px 0 8px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    ul {
      padding-left: 20px;
      margin: 8px 0;
    }

    p {
      margin: 8px 0;
    }

    pre {
      background-color: var(--el-fill-color-light);
      padding: 8px;
      border-radius: 4px;
      margin: 8px 0;

      code {
        font-family: monospace;
      }
    }
  }

  @media (max-width: 768px) {
    &__radio-group {
      flex-direction: column;
      gap: 8px;
    }

    &__input-group {
      flex-direction: column;
    }

    &__format-settings {
      flex-direction: column;
      align-items: flex-start;
    }

    &__actions {
      flex-direction: column;
    }

    &__template-sql,
    &__template-params {
      flex-direction: column;
    }
  }
}
</style>

<script>
// 复制所有结果
const copyAllResults = () => {
  if (!env.outputSQL) {
    ElMessage.warning("没有可复制的结果");
    return;
  }

  copyToClipboard(env.outputSQL);
};

// 添加超网
const addSupernet = () => {
  env.supernetting.networks.push("");
};

// 移除超网
const removeSupernet = (index) => {
  env.supernetting.networks.splice(index, 1);
};

// 获取结果图标
const getResultIcon = (label) => {
  const iconMap = {
    网络地址: "ri:global-line",
    广播地址: "ri:broadcast-line",
    子网掩码: "ri:filter-line",
    CIDR前缀: "ri:slash-commands",
    IP范围: "ri:arrow-left-right-line",
    可用主机数: "ri:computer-line",
    IP类型: "ri:information-line",
    二进制表示: "ri:code-line",
    十六进制表示: "ri:hexagon-line",
    反向DNS: "ri:arrow-go-back-line",
    默认: "ri:question-line",
  };

  return iconMap[label] || iconMap["默认"];
};
</script>
