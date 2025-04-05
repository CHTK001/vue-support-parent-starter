<template>
  <div class="sc-calendar-example">
    <el-tabs type="border-card">
      <el-tab-pane label="基础用法">
        <h3>基础日历</h3>
        <p class="example-desc">ScCalendar 组件基于 Element Plus 的日历组件封装，提供了更便捷的日程管理功能</p>

        <el-card class="example-card">
          <template #header>
            <div class="card-header">
              <span>基础日历</span>
            </div>
          </template>

          <ScCalendar v-model="selectedDate" @date-click="handleDateClick" />
        </el-card>

        <el-divider content-position="left">代码示例</el-divider>

        <pre><code>
&lt;ScCalendar v-model="selectedDate" @date-click="handleDateClick" /&gt;

// script setup 部分
const selectedDate = ref(new Date())

const handleDateClick = (date) => {
  // 处理日期点击事件
  console.log('点击的日期:', date)
}
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="自定义单元格">
        <h3>自定义单元格</h3>
        <p class="example-desc">自定义日历单元格内容，可以添加标记、行程等信息</p>

        <el-card class="example-card">
          <template #header>
            <div class="card-header">
              <span>自定义单元格</span>
            </div>
          </template>

          <ScCalendar>
            <template #date-cell="{ data }">
              <div class="custom-cell">
                <div class="cell-date">{{ data.day.split("-").slice(2).join("") }}</div>
                <div v-if="hasSchedule(data.day)" class="cell-schedule">
                  <div v-for="(item, index) in getScheduleItems(data.day)" :key="index" class="schedule-item" :class="item.type">
                    <div class="schedule-dot"></div>
                    <div class="schedule-text">{{ item.title }}</div>
                  </div>
                </div>
              </div>
            </template>
          </ScCalendar>
        </el-card>

        <el-divider content-position="left">代码示例</el-divider>

        <pre><code>
&lt;ScCalendar&gt;
  &lt;template #date-cell="{ data }"&gt;
    &lt;div class="custom-cell"&gt;
      &lt;div class="cell-date"&gt;{{ data.day.split('-').slice(2).join('') }}&lt;/div&gt;
      &lt;div v-if="hasSchedule(data.day)" class="cell-schedule"&gt;
        &lt;div v-for="(item, index) in getScheduleItems(data.day)" :key="index" 
             class="schedule-item" :class="item.type"&gt;
          &lt;div class="schedule-dot"&gt;&lt;/div&gt;
          &lt;div class="schedule-text"&gt;{{ item.title }}&lt;/div&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  &lt;/template&gt;
&lt;/ScCalendar&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="事件日历">
        <h3>事件日历</h3>
        <p class="example-desc">添加事件到日历中，支持查看、添加、编辑和删除事件</p>

        <el-card class="example-card">
          <template #header>
            <div class="card-header">
              <span>事件日历</span>
              <el-button type="primary" size="small" @click="openAddEventDialog">添加事件</el-button>
            </div>
          </template>

          <div class="calendar-wrapper">
            <ScCalendar v-model="currentDate" @date-click="handleEventDateClick">
              <template #date-cell="{ data }">
                <div class="event-cell">
                  <div class="event-date">{{ data.day.split("-").slice(2).join("") }}</div>
                  <div v-if="hasEvents(data.day)" class="event-list">
                    <div v-for="event in getEvents(data.day)" :key="event.id" class="event-item" :class="event.type" @click.stop="viewEvent(event)">
                      {{ event.title }}
                    </div>
                  </div>
                </div>
              </template>
            </ScCalendar>
          </div>

          <!-- 事件详情对话框 -->
          <el-dialog v-model="eventDialogVisible" :title="dialogMode === 'add' ? '添加事件' : '事件详情'" width="500px">
            <el-form :model="currentEvent" label-width="80px">
              <el-form-item label="标题">
                <el-input v-model="currentEvent.title" :disabled="dialogMode === 'view'" placeholder="请输入事件标题"></el-input>
              </el-form-item>
              <el-form-item label="日期">
                <el-date-picker v-model="currentEvent.date" type="date" :disabled="dialogMode === 'view'" placeholder="选择日期" format="YYYY/MM/DD" value-format="YYYY-MM-DD"></el-date-picker>
              </el-form-item>
              <el-form-item label="时间">
                <el-time-picker v-model="currentEvent.time" :disabled="dialogMode === 'view'" placeholder="选择时间" format="HH:mm"></el-time-picker>
              </el-form-item>
              <el-form-item label="类型">
                <el-select v-model="currentEvent.type" :disabled="dialogMode === 'view'" placeholder="选择事件类型">
                  <el-option label="普通" value="normal"></el-option>
                  <el-option label="重要" value="important"></el-option>
                  <el-option label="紧急" value="urgent"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="描述">
                <el-input v-model="currentEvent.description" :disabled="dialogMode === 'view'" type="textarea" :rows="3" placeholder="请输入事件描述"></el-input>
              </el-form-item>
            </el-form>
            <template #footer>
              <span class="dialog-footer">
                <template v-if="dialogMode === 'view'">
                  <el-button @click="eventDialogVisible = false">关闭</el-button>
                  <el-button type="primary" @click="editEvent">编辑</el-button>
                  <el-button type="danger" @click="confirmDeleteEvent">删除</el-button>
                </template>
                <template v-else>
                  <el-button @click="eventDialogVisible = false">取消</el-button>
                  <el-button type="primary" @click="saveEvent">保存</el-button>
                </template>
              </span>
            </template>
          </el-dialog>

          <!-- 确认删除对话框 -->
          <el-dialog v-model="deleteConfirmVisible" title="确认删除" width="300px">
            <div>确定要删除事件 "{{ currentEvent.title }}" 吗？</div>
            <template #footer>
              <span class="dialog-footer">
                <el-button @click="deleteConfirmVisible = false">取消</el-button>
                <el-button type="danger" @click="deleteEvent">删除</el-button>
              </span>
            </template>
          </el-dialog>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="日历视图">
        <h3>不同日历视图</h3>
        <p class="example-desc">支持不同类型的日历视图：月视图、周视图、日视图</p>

        <el-card class="example-card">
          <template #header>
            <div class="card-header">
              <span>日历视图</span>
              <el-radio-group v-model="calendarView" size="small">
                <el-radio-button label="month">月视图</el-radio-button>
                <el-radio-button label="week">周视图</el-radio-button>
                <el-radio-button label="day">日视图</el-radio-button>
              </el-radio-group>
            </div>
          </template>

          <div class="calendar-container">
            <ScCalendar v-if="calendarView === 'month'" :view="calendarView"></ScCalendar>
            <ScCalendar v-else-if="calendarView === 'week'" :view="calendarView"></ScCalendar>
            <ScCalendar v-else :view="calendarView"></ScCalendar>
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="API说明">
        <h3>ScCalendar 组件 API</h3>

        <el-descriptions title="属性" :column="1" border>
          <el-descriptions-item label="v-model / modelValue">当前选中的日期，类型: Date</el-descriptions-item>
          <el-descriptions-item label="view">日历视图类型，类型: String，可选值: month/week/day，默认: month</el-descriptions-item>
          <el-descriptions-item label="first-day-of-week">周起始日，类型: Number，默认: 1（周一）</el-descriptions-item>
          <el-descriptions-item label="range">可选择的日期范围，类型: [Date, Date]</el-descriptions-item>
          <el-descriptions-item label="events">事件数据，类型: Array</el-descriptions-item>
          <el-descriptions-item label="height">日历高度，类型: String/Number，默认: 100%</el-descriptions-item>
          <el-descriptions-item label="border">是否显示边框，类型: Boolean，默认: true</el-descriptions-item>
        </el-descriptions>

        <h4 class="mt-4">事件</h4>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="date-click">日期点击事件，参数: date</el-descriptions-item>
          <el-descriptions-item label="event-click">事件点击事件，参数: event</el-descriptions-item>
          <el-descriptions-item label="view-change">视图变化事件，参数: view</el-descriptions-item>
          <el-descriptions-item label="month-change">月份变化事件，参数: year, month</el-descriptions-item>
        </el-descriptions>

        <h4 class="mt-4">插槽</h4>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="date-cell">自定义日期单元格的内容，参数: { data }</el-descriptions-item>
          <el-descriptions-item label="header">自定义日历头部，参数: { date, view }</el-descriptions-item>
        </el-descriptions>

        <h4 class="mt-4">方法</h4>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="prev()">切换到上一月/周/日视图</el-descriptions-item>
          <el-descriptions-item label="next()">切换到下一月/周/日视图</el-descriptions-item>
          <el-descriptions-item label="today()">跳转至今天</el-descriptions-item>
          <el-descriptions-item label="changeView(view)">切换日历视图</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";

// 基础日历
const selectedDate = ref(new Date());

// 事件日历
const currentDate = ref(new Date());
const eventDialogVisible = ref(false);
const deleteConfirmVisible = ref(false);
const dialogMode = ref("add"); // add, edit, view
const currentEvent = ref({
  id: "",
  title: "",
  date: "",
  time: "",
  type: "normal",
  description: "",
});

// 日历视图
const calendarView = ref("month");

// 模拟日程数据
const scheduleData = reactive({
  // 今天
  [new Date().toISOString().split("T")[0]]: [
    { title: "产品会议", type: "important" },
    { title: "提交周报", type: "normal" },
  ],
  // 明天
  [new Date(Date.now() + 86400000).toISOString().split("T")[0]]: [{ title: "客户拜访", type: "urgent" }],
  // 本周内某天
  [new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0]]: [{ title: "团队建设", type: "normal" }],
  [new Date(Date.now() + 86400000 * 4).toISOString().split("T")[0]]: [
    { title: "季度总结", type: "important" },
    { title: "新员工入职", type: "normal" },
  ],
});

// 模拟事件数据
const eventsData = ref([
  {
    id: "1",
    title: "产品发布会",
    date: new Date().toISOString().split("T")[0],
    time: "10:00",
    type: "important",
    description: "新产品发布会，需要全员参加",
  },
  {
    id: "2",
    title: "团队会议",
    date: new Date().toISOString().split("T")[0],
    time: "14:30",
    type: "normal",
    description: "每周例行团队会议",
  },
  {
    id: "3",
    title: "客户电话",
    date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    time: "09:00",
    type: "urgent",
    description: "与重要客户的电话会议",
  },
]);

// 检查日期是否有日程
const hasSchedule = (day) => {
  return scheduleData[day] && scheduleData[day].length > 0;
};

// 获取日期的日程项
const getScheduleItems = (day) => {
  return scheduleData[day] || [];
};

// 处理日期点击事件
const handleDateClick = (date) => {
  ElMessage.info(`点击日期: ${date.toLocaleDateString()}`);
};

// 检查日期是否有事件
const hasEvents = (day) => {
  return eventsData.value.some((event) => event.date === day);
};

// 获取日期的事件列表
const getEvents = (day) => {
  return eventsData.value.filter((event) => event.date === day);
};

// 处理事件日历的日期点击
const handleEventDateClick = (date) => {
  // 格式化日期为字符串格式 YYYY-MM-DD
  const formattedDate = date.toISOString().split("T")[0];

  // 重置事件对象
  currentEvent.value = {
    id: Date.now().toString(),
    title: "",
    date: formattedDate,
    time: "",
    type: "normal",
    description: "",
  };

  dialogMode.value = "add";
  eventDialogVisible.value = true;
};

// 打开添加事件对话框
const openAddEventDialog = () => {
  currentEvent.value = {
    id: Date.now().toString(),
    title: "",
    date: new Date().toISOString().split("T")[0],
    time: "",
    type: "normal",
    description: "",
  };

  dialogMode.value = "add";
  eventDialogVisible.value = true;
};

// 查看事件详情
const viewEvent = (event) => {
  currentEvent.value = { ...event };
  dialogMode.value = "view";
  eventDialogVisible.value = true;
};

// 编辑事件
const editEvent = () => {
  dialogMode.value = "edit";
};

// 确认删除事件
const confirmDeleteEvent = () => {
  deleteConfirmVisible.value = true;
};

// 删除事件
const deleteEvent = () => {
  const index = eventsData.value.findIndex((e) => e.id === currentEvent.value.id);
  if (index !== -1) {
    eventsData.value.splice(index, 1);
    ElMessage.success("事件已删除");
  }
  deleteConfirmVisible.value = false;
  eventDialogVisible.value = false;
};

// 保存事件
const saveEvent = () => {
  if (!currentEvent.value.title) {
    ElMessage.warning("请输入事件标题");
    return;
  }

  if (!currentEvent.value.date) {
    ElMessage.warning("请选择事件日期");
    return;
  }

  if (dialogMode.value === "add") {
    // 添加新事件
    eventsData.value.push({ ...currentEvent.value });
    ElMessage.success("事件已添加");
  } else {
    // 更新现有事件
    const index = eventsData.value.findIndex((e) => e.id === currentEvent.value.id);
    if (index !== -1) {
      eventsData.value[index] = { ...currentEvent.value };
      ElMessage.success("事件已更新");
    }
  }

  eventDialogVisible.value = false;
};
</script>

<style lang="scss" scoped>
.sc-calendar-example {
  padding: 16px;

  .example-desc {
    color: #666;
    margin-bottom: 16px;
  }

  .example-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .calendar-wrapper {
    height: 600px;
  }

  .calendar-container {
    height: 600px;
  }

  // 自定义单元格样式
  .custom-cell {
    height: 100%;
    padding: 2px;
    display: flex;
    flex-direction: column;

    .cell-date {
      text-align: right;
      padding: 2px;
    }

    .cell-schedule {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;

      .schedule-item {
        display: flex;
        align-items: center;
        font-size: 12px;
        padding: 2px 4px;
        border-radius: 2px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;

        &.normal {
          background-color: rgba(64, 158, 255, 0.1);
        }

        &.important {
          background-color: rgba(230, 162, 60, 0.1);
        }

        &.urgent {
          background-color: rgba(245, 108, 108, 0.1);
        }

        .schedule-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          margin-right: 4px;

          .normal & {
            background-color: var(--el-color-primary);
          }

          .important & {
            background-color: var(--el-color-warning);
          }

          .urgent & {
            background-color: var(--el-color-danger);
          }
        }

        .schedule-text {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }
  }

  // 事件单元格样式
  .event-cell {
    height: 100%;
    padding: 2px;
    display: flex;
    flex-direction: column;

    .event-date {
      text-align: right;
      padding: 2px;
    }

    .event-list {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;

      .event-item {
        font-size: 12px;
        padding: 2px 6px;
        border-radius: 3px;
        margin-bottom: 2px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        cursor: pointer;

        &.normal {
          background-color: var(--el-color-primary-light-9);
          color: var(--el-color-primary);
          border-left: 2px solid var(--el-color-primary);
        }

        &.important {
          background-color: var(--el-color-warning-light-9);
          color: var(--el-color-warning);
          border-left: 2px solid var(--el-color-warning);
        }

        &.urgent {
          background-color: var(--el-color-danger-light-9);
          color: var(--el-color-danger);
          border-left: 2px solid var(--el-color-danger);
        }

        &:hover {
          opacity: 0.8;
        }
      }
    }
  }

  .mt-4 {
    margin-top: 16px;
  }

  pre {
    background-color: #f5f7fa;
    border-radius: 4px;
    padding: 16px;
    overflow-x: auto;

    code {
      font-family: Consolas, Monaco, "Andale Mono", monospace;
      font-size: 14px;
      color: #333;
    }
  }
}
</style>
