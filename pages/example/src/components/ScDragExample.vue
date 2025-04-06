<template>
  <div class="drag-example">
    <el-tabs type="border-card">
      <el-tab-pane label="基础用法">
        <h3>基础拖拽</h3>
        <p class="example-desc">基础的拖拽功能，可以自由拖动元素</p>

        <div class="example-row">
          <div class="drag-container">
            <ScDrag>
              <div class="drag-element basic">
                <div class="drag-handle">拖动区域</div>
                <div class="drag-content">
                  <p>这是一个可拖动的元素</p>
                  <p>点击上方区域进行拖动</p>
                </div>
              </div>
            </ScDrag>
          </div>
        </div>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;ScDrag&gt;
  &lt;div class="drag-element"&gt;
    &lt;div class="drag-handle"&gt;拖动区域&lt;/div&gt;
    &lt;div class="drag-content"&gt;
      &lt;p&gt;这是一个可拖动的元素&lt;/p&gt;
      &lt;p&gt;点击上方区域进行拖动&lt;/p&gt;
    &lt;/div&gt;
  &lt;/div&gt;
&lt;/ScDrag&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="限制范围">
        <h3>限制拖拽范围</h3>
        <p class="example-desc">可以限制元素拖拽的范围，防止元素被拖出容器</p>

        <div class="example-row">
          <div class="drag-boundary">
            <ScDrag :boundary="true">
              <div class="drag-element bounded">
                <div class="drag-handle">限制范围拖动</div>
                <div class="drag-content">
                  <p>此元素只能在父容器内拖动</p>
                  <p>不能拖出边界</p>
                </div>
              </div>
            </ScDrag>
          </div>
        </div>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;div class="drag-boundary"&gt;
  &lt;ScDrag :boundary="true"&gt;
    &lt;div class="drag-element"&gt;
      &lt;div class="drag-handle"&gt;限制范围拖动&lt;/div&gt;
      &lt;div class="drag-content"&gt;
        &lt;p&gt;此元素只能在父容器内拖动&lt;/p&gt;
        &lt;p&gt;不能拖出边界&lt;/p&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  &lt;/ScDrag&gt;
&lt;/div&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="自定义句柄">
        <h3>自定义拖拽句柄</h3>
        <p class="example-desc">可以指定元素的特定部分作为拖拽句柄</p>

        <div class="example-row">
          <div class="drag-container">
            <ScDrag handle=".custom-handle">
              <div class="drag-element custom">
                <div class="custom-handle">
                  <IconifyIconOnline icon="ri:drag-move-2-line" />
                  <span>拖动句柄</span>
                </div>
                <div class="drag-content">
                  <p>只能通过上方的句柄拖动</p>
                  <p>点击此区域不会触发拖动</p>
                  <el-button type="primary" size="small">点击测试</el-button>
                </div>
              </div>
            </ScDrag>
          </div>
        </div>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;ScDrag handle=".custom-handle"&gt;
  &lt;div class="drag-element"&gt;
    &lt;div class="custom-handle"&gt;
      &lt;IconifyIconOnline icon="ri:drag-move-2-line" /&gt;
      &lt;span&gt;拖动句柄&lt;/span&gt;
    &lt;/div&gt;
    &lt;div class="drag-content"&gt;
      &lt;p&gt;只能通过上方的句柄拖动&lt;/p&gt;
      &lt;p&gt;点击此区域不会触发拖动&lt;/p&gt;
      &lt;el-button type="primary" size="small"&gt;点击测试&lt;/el-button&gt;
    &lt;/div&gt;
  &lt;/div&gt;
&lt;/ScDrag&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="事件处理">
        <h3>拖拽事件处理</h3>
        <p class="example-desc">监听拖拽开始、拖拽中和拖拽结束事件</p>

        <div class="example-row">
          <div class="drag-container">
            <ScDrag @drag-start="handleDragStart" @dragging="handleDragging" @drag-end="handleDragEnd">
              <div class="drag-element event">
                <div class="drag-handle">拖动触发事件</div>
                <div class="drag-content">
                  <p>拖动此元素会触发事件</p>
                  <p>查看下方事件日志</p>
                </div>
              </div>
            </ScDrag>
          </div>

          <div class="event-log">
            <h4>事件日志：</h4>
            <div class="log-content">
              <div v-for="(log, index) in dragLogs" :key="index" class="log-item">
                {{ log }}
              </div>
              <div v-if="!dragLogs.length" class="empty-log">暂无事件记录，请拖动元素</div>
            </div>
            <el-button size="small" @click="clearLogs">清空日志</el-button>
          </div>
        </div>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;ScDrag 
  @drag-start="handleDragStart" 
  @dragging="handleDragging" 
  @drag-end="handleDragEnd"
&gt;
  &lt;div class="drag-element"&gt;
    &lt;div class="drag-handle"&gt;拖动触发事件&lt;/div&gt;
    &lt;div class="drag-content"&gt;
      &lt;p&gt;拖动此元素会触发事件&lt;/p&gt;
    &lt;/div&gt;
  &lt;/div&gt;
&lt;/ScDrag&gt;

&lt;script setup&gt;
import { ref } from 'vue';

const dragLogs = ref([]);

const handleDragStart = (e) => {
  dragLogs.value.unshift(`开始拖动: x=${e.x}, y=${e.y}`);
};

const handleDragging = (e) => {
  // 为了避免日志过多，可以限制记录频率
  dragLogs.value.unshift(`拖动中: x=${e.x}, y=${e.y}`);
  if (dragLogs.value.length > 5) {
    dragLogs.value = dragLogs.value.slice(0, 5);
  }
};

const handleDragEnd = (e) => {
  dragLogs.value.unshift(`结束拖动: x=${e.x}, y=${e.y}`);
};

const clearLogs = () => {
  dragLogs.value = [];
};
&lt;/script&gt;
        </code></pre>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { message } from "@repo/utils";

// 事件处理
const dragLogs = ref([]);

const handleDragStart = (e) => {
  dragLogs.value.unshift(`开始拖动: x=${Math.round(e.x)}, y=${Math.round(e.y)}`);
  message("开始拖动", { type: "info" });
};

const handleDragging = (e) => {
  // 为了避免日志过多，只在特定条件下记录
  if (dragLogs.value.length === 0 || dragLogs.value[0].startsWith("开始") || dragLogs.value[0].startsWith("结束")) {
    dragLogs.value.unshift(`拖动中: x=${Math.round(e.x)}, y=${Math.round(e.y)}`);
  } else {
    // 更新最新的拖动记录
    dragLogs.value[0] = `拖动中: x=${Math.round(e.x)}, y=${Math.round(e.y)}`;
  }

  // 限制日志数量
  if (dragLogs.value.length > 10) {
    dragLogs.value = dragLogs.value.slice(0, 10);
  }
};

const handleDragEnd = (e) => {
  dragLogs.value.unshift(`结束拖动: x=${Math.round(e.x)}, y=${Math.round(e.y)}`);
  message("结束拖动", { type: "success" });
};

const clearLogs = () => {
  dragLogs.value = [];
  message("日志已清空", { type: "info" });
};
</script>

<style lang="scss" scoped>
.drag-example {
  padding: 20px;

  .example-desc {
    color: #666;
    margin-bottom: 20px;
  }

  .example-row {
    margin-bottom: 20px;
  }

  .drag-container {
    height: 300px;
    position: relative;
    background-color: #f5f7fa;
    border-radius: 8px;
    padding: 20px;
    overflow: hidden;
  }

  .drag-boundary {
    height: 300px;
    position: relative;
    background-color: #f0f9eb;
    border: 2px dashed #67c23a;
    border-radius: 8px;
    padding: 20px;
    overflow: hidden;
  }

  .drag-element {
    width: 250px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    overflow: hidden;
    cursor: move;

    &.basic {
      border-top: 4px solid #409eff;
    }

    &.bounded {
      border-top: 4px solid #67c23a;
    }

    &.custom {
      border-top: 4px solid #e6a23c;
    }

    &.event {
      border-top: 4px solid #f56c6c;
    }

    .drag-handle {
      padding: 10px 15px;
      background-color: #ecf5ff;
      color: #409eff;
      font-weight: bold;
      border-bottom: 1px solid #d9ecff;
    }

    .custom-handle {
      padding: 10px 15px;
      background-color: #fdf6ec;
      color: #e6a23c;
      font-weight: bold;
      border-bottom: 1px solid #faecd8;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: move;
    }

    .drag-content {
      padding: 15px;

      p {
        margin: 0 0 10px;
        color: #606266;
      }
    }
  }

  .event-log {
    margin-top: 20px;
    padding: 15px;
    background-color: #f5f7fa;
    border-radius: 8px;
    border: 1px solid #dcdfe6;

    h4 {
      margin-top: 0;
      margin-bottom: 10px;
      font-weight: 500;
      color: #606266;
    }

    .log-content {
      height: 150px;
      overflow-y: auto;
      padding: 10px;
      background-color: #fff;
      border-radius: 4px;
      border: 1px solid #dcdfe6;
      margin-bottom: 10px;

      .log-item {
        padding: 5px 8px;
        border-bottom: 1px dashed #ebeef5;
        font-size: 14px;
        color: #606266;
        font-family: monospace;

        &:last-child {
          border-bottom: none;
        }
      }

      .empty-log {
        color: #909399;
        text-align: center;
        padding: 30px 0;
        font-style: italic;
      }
    }
  }

  pre {
    background-color: #f5f7fa;
    padding: 15px;
    border-radius: 4px;
    overflow-x: auto;
  }
}
</style>
