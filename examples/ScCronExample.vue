<template>
  <div class="sc-cron-example">
    <h1>ScCron 组件示例</h1>
    <p>ScCron 是一个功能强大的 Cron 表达式生成器组件，支持可视化配置定时任务规则。</p>

    <!-- 基础用法 -->
    <div class="example-section">
      <h2>基础用法</h2>
      <p>最简单的用法，支持快捷选项和自定义配置。</p>
      <div class="example-demo">
        <el-form :model="form" label-width="120px">
          <el-form-item label="Cron表达式：">
            <ScCron v-model="form.basicCron" style="width: 400px" />
          </el-form-item>
          <el-form-item label="当前值：">
            <el-tag>{{ form.basicCron }}</el-tag>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 自定义快捷选项 -->
    <div class="example-section">
      <h2>自定义快捷选项</h2>
      <p>可以添加自定义的快捷选项，方便用户快速选择常用的时间规则。</p>
      <div class="example-demo">
        <el-form :model="form" label-width="120px">
          <el-form-item label="Cron表达式：">
            <ScCron 
              v-model="form.shortcutCron" 
              :shortcuts="shortcuts"
              style="width: 400px" 
            />
          </el-form-item>
          <el-form-item label="当前值：">
            <el-tag>{{ form.shortcutCron }}</el-tag>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 事件监听 -->
    <div class="example-section">
      <h2>事件监听</h2>
      <p>监听 Cron 表达式的变化事件。</p>
      <div class="example-demo">
        <el-form :model="form" label-width="120px">
          <el-form-item label="Cron表达式：">
            <ScCron 
              v-model="form.eventCron" 
              @update:modelValue="handleCronChange"
              style="width: 400px" 
            />
          </el-form-item>
          <el-form-item label="当前值：">
            <el-tag>{{ form.eventCron }}</el-tag>
          </el-form-item>
        </el-form>
        
        <div class="event-log">
          <h4>事件日志：</h4>
          <div class="log-content">
            <div v-for="(log, index) in eventLogs" :key="index" class="log-item">
              <span class="log-time">{{ log.time }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 表单集成 -->
    <div class="example-section">
      <h2>表单集成</h2>
      <p>在表单中使用 ScCron 组件，支持表单验证。</p>
      <div class="example-demo">
        <el-form 
          ref="formRef" 
          :model="taskForm" 
          :rules="formRules" 
          label-width="120px"
        >
          <el-form-item label="任务名称：" prop="name">
            <el-input v-model="taskForm.name" placeholder="请输入任务名称" />
          </el-form-item>
          <el-form-item label="执行规则：" prop="cron">
            <ScCron v-model="taskForm.cron" style="width: 400px" />
          </el-form-item>
          <el-form-item label="任务描述：">
            <el-input 
              v-model="taskForm.description" 
              type="textarea" 
              placeholder="请输入任务描述"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="submitForm">提交</el-button>
            <el-button @click="resetForm">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 常用表达式示例 -->
    <div class="example-section">
      <h2>常用表达式示例</h2>
      <p>一些常用的 Cron 表达式示例。</p>
      <div class="example-demo">
        <el-table :data="cronExamples" border>
          <el-table-column prop="description" label="描述" width="200" />
          <el-table-column prop="expression" label="Cron表达式" width="200" />
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button 
                type="primary" 
                size="small" 
                @click="applyCronExample(row.expression)"
              >
                应用
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div style="margin-top: 20px">
          <el-form :model="form" label-width="120px">
            <el-form-item label="测试表达式：">
              <ScCron v-model="form.testCron" style="width: 400px" />
            </el-form-item>
            <el-form-item label="当前值：">
              <el-tag>{{ form.testCron }}</el-tag>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>

    <!-- API 文档 -->
    <div class="example-section">
      <h2>API 文档</h2>
      
      <h3>Props</h3>
      <el-table :data="propsData" border>
        <el-table-column prop="name" label="参数" width="150" />
        <el-table-column prop="type" label="类型" width="100" />
        <el-table-column prop="default" label="默认值" width="150" />
        <el-table-column prop="description" label="说明" />
      </el-table>

      <h3>Events</h3>
      <el-table :data="eventsData" border>
        <el-table-column prop="name" label="事件名" width="200" />
        <el-table-column prop="params" label="参数" width="200" />
        <el-table-column prop="description" label="说明" />
      </el-table>

      <h3>Cron 表达式格式</h3>
      <p>Cron 表达式由 6 或 7 个字段组成，用空格分隔：</p>
      <pre class="cron-format">
秒 分 时 日 月 周 [年]

字段说明：
- 秒：0-59
- 分：0-59  
- 时：0-23
- 日：1-31
- 月：1-12
- 周：1-7 (1=周日)
- 年：可选，1970-2099

特殊字符：
* : 匹配任意值
? : 不指定值（仅用于日和周）
- : 范围，如 1-5
, : 列举，如 1,3,5
/ : 间隔，如 0/15（每15分钟）
L : 最后，如 L（月末）或 6L（最后一个周五）
# : 第几个，如 6#3（第3个周五）
      </pre>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import ScCron from '../packages/components/ScCron/index.vue'

// 表单数据
const form = reactive({
  basicCron: '0 0 0 * * ?',
  shortcutCron: '0 * * * * ?',
  eventCron: '0 0 * * * ?',
  testCron: '* * * * * ?'
})

// 自定义快捷选项
const shortcuts = [
  { text: '每5分钟', value: '0 0/5 * * * ?' },
  { text: '每10分钟', value: '0 0/10 * * * ?' },
  { text: '每30分钟', value: '0 0/30 * * * ?' },
  { text: '工作日上午9点', value: '0 0 9 ? * 2-6' },
  { text: '工作日下午6点', value: '0 0 18 ? * 2-6' }
]

// 事件日志
const eventLogs = ref([])

// 表单相关
const formRef = ref()
const taskForm = reactive({
  name: '',
  cron: '0 0 0 * * ?',
  description: ''
})

const formRules = {
  name: [
    { required: true, message: '请输入任务名称', trigger: 'blur' }
  ],
  cron: [
    { required: true, message: '请配置执行规则', trigger: 'blur' }
  ]
}

// 常用表达式示例
const cronExamples = [
  { description: '每秒执行', expression: '* * * * * ?' },
  { description: '每分钟执行', expression: '0 * * * * ?' },
  { description: '每小时执行', expression: '0 0 * * * ?' },
  { description: '每天零点执行', expression: '0 0 0 * * ?' },
  { description: '每周一零点执行', expression: '0 0 0 ? * 2' },
  { description: '每月1号零点执行', expression: '0 0 0 1 * ?' },
  { description: '每月最后一天零点', expression: '0 0 0 L * ?' },
  { description: '工作日上午9点', expression: '0 0 9 ? * 2-6' },
  { description: '每5分钟执行', expression: '0 0/5 * * * ?' },
  { description: '每年1月1日零点', expression: '0 0 0 1 1 ?' }
]

// API 文档数据
const propsData = [
  {
    name: 'modelValue',
    type: 'String',
    default: '* * * * * ?',
    description: 'Cron表达式值，支持v-model双向绑定'
  },
  {
    name: 'shortcuts',
    type: 'Array',
    default: '[]',
    description: '自定义快捷选项，格式：[{text: "描述", value: "表达式"}]'
  }
]

const eventsData = [
  {
    name: 'update:modelValue',
    params: 'value: string',
    description: 'Cron表达式值变化时触发'
  }
]

// 方法
const handleCronChange = (value) => {
  const now = new Date()
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
  
  eventLogs.value.unshift({
    time: timeStr,
    message: `Cron表达式变更为: ${value}`
  })
  
  // 保持日志数量不超过10条
  if (eventLogs.value.length > 10) {
    eventLogs.value = eventLogs.value.slice(0, 10)
  }
}

const submitForm = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      ElMessage.success('表单提交成功！')
      console.log('提交的表单数据：', taskForm)
    } else {
      ElMessage.error('请检查表单填写')
    }
  })
}

const resetForm = () => {
  formRef.value.resetFields()
  taskForm.cron = '0 0 0 * * ?'
}

const applyCronExample = (expression) => {
  form.testCron = expression
  ElMessage.success(`已应用表达式: ${expression}`)
}
</script>

<style scoped>
.sc-cron-example {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.example-section {
  margin-bottom: 40px;
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.example-section h2 {
  color: #409eff;
  margin-bottom: 10px;
  font-size: 18px;
}

.example-section h3 {
  color: #606266;
  margin: 20px 0 10px 0;
  font-size: 16px;
}

.example-section p {
  color: #606266;
  margin-bottom: 15px;
  line-height: 1.6;
}

.example-demo {
  padding: 20px;
  background-color: #fafafa;
  border-radius: 6px;
  border: 1px solid #ebeef5;
}

.event-log {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 6px;
  border: 1px solid #dcdfe6;
}

.event-log h4 {
  margin: 0 0 10px 0;
  color: #606266;
  font-size: 14px;
}

.log-content {
  max-height: 200px;
  overflow-y: auto;
}

.log-item {
  padding: 5px 0;
  border-bottom: 1px solid #e4e7ed;
  font-size: 12px;
}

.log-item:last-child {
  border-bottom: none;
}

.log-time {
  color: #909399;
  margin-right: 10px;
  font-family: monospace;
}

.log-message {
  color: #606266;
}

.cron-format {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #dcdfe6;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #606266;
  white-space: pre-wrap;
  overflow-x: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sc-cron-example {
    padding: 10px;
  }
  
  .example-section {
    padding: 15px;
  }
  
  .example-demo {
    padding: 15px;
  }
  
  :deep(.el-form-item__label) {
    width: 100px !important;
  }
}
</style>