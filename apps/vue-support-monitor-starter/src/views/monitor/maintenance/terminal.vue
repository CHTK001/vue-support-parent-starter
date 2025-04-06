<template>
  <div class="terminal-container">
    <!-- 顶部工具栏 -->
    <div class="terminal-header">
      <div class="terminal-info">
        <el-tag class="host-tag" type="primary">主机: {{ hostAddress }}:{{ hostPort }}</el-tag>
        <el-tag v-if="taskId" class="session-tag" type="info">会话ID: {{ taskId }}</el-tag>
      </div>
      <div class="terminal-actions">
        <el-button type="default" size="small" @click="handleBack">
          <IconifyIconOnline icon="ri:arrow-go-back-line" class="mr-1" />
          返回
        </el-button>
        <el-button type="warning" size="small" @click="clearTerminal">
          <IconifyIconOnline icon="ri:delete-back-2-line" class="mr-1" />
          清屏
        </el-button>
        <el-button type="danger" size="small" @click="closeConnection">
          <IconifyIconOnline icon="ri:close-circle-line" class="mr-1" />
          关闭连接
        </el-button>
      </div>
    </div>

    <!-- 终端显示区域 -->
    <div class="terminal-content">
      <div id="terminal" ref="terminalRef" class="terminal-view" />
    </div>
  </div>
</template>

<script setup>
import { getConfig } from "@repo/config";
import { getRandomString, message } from "@repo/utils";
import { socket, useConfigStore } from "@repo/core";
import { inject, onMounted, onUnmounted, reactive, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

const router = useRouter();
const route = useRoute();

const _config = getConfig();
// 获取路由参数
const hostId = route.params.maintenanceHostId;
const taskId = route.query.maintenanceHostId;
const hostAddress = route.query.maintenanceHostAddress || "未知";
const hostPort = route.query.maintenanceHostPort || "未知";

// 终端配置
const config = reactive({
  eventName: `maintenance-${taskId}`,
  opened: false
});

// 初始化socket
let _socket = useConfigStore().socket;
if (null == _socket) {
  message("未开启socket连接，终端功能不可用", { type: "error" });
}

// 终端引用
const terminalRef = ref(null);
const terminal = ref(null);
const fitAddon = ref(null);

// 初始化终端
const initTerminal = () => {
  terminal.value = new Terminal({
    fontFamily: "Monaco, Menlo, Consolas, 'Courier New', monospace",
    rendererType: "canvas",
    rows: 40,
    cols: 120,
    convertEol: true,
    disableStdin: false,
    cursorBlink: true,
    scrollback: 1000,
    theme: {
      foreground: "#ECECEC",
      background: "#000000",
      cursor: "help",
      lineHeight: 20
    }
  });
};

// 配置终端
const configTerminal = () => {
  // 创建terminal实例
  terminal.value.open(terminalRef.value);
  // 换行并输入起始符 $
  terminal.value.prompt = _ => {
    terminal.value.write("\r\n\x1b[33m$\x1b[0m ");
  };

  // 创建并加载FitAddon
  fitAddon.value = new FitAddon();
  terminal.value.loadAddon(fitAddon.value);
  fitAddon.value.fit();

  // 窗口大小变化时自适应调整
  window.addEventListener("resize", resizeScreen);
};

// 调整终端大小
const resizeScreen = () => {
  try {
    if (fitAddon.value) {
      fitAddon.value.fit();
    }
  } catch (e) {
    console.error("调整终端大小失败:", e.message);
  }
};

// 发送命令到服务器
const send = data => {
  if (!_socket) return;

  _socket.emit(
    "maintenance",
    JSON.stringify({
      command: data,
      genId: taskId,
      hostId: taskId
    })
  );
};

// 启动终端
const runTerminal = () => {
  if (terminal.value._initialized) return;

  // 初始化
  terminal.value._initialized = true;
  terminal.value.writeln("欢迎使用 \x1b[1;32m维护主机终端\x1b[0m - 连接到 \x1b[1;32m" + hostAddress + ":" + hostPort + "\x1b[0m");
  terminal.value.writeln("请输入命令开始操作，输入 'exit' 关闭连接。");

  // 发送回车以初始化连接
  send("\r");

  // 监听键盘输入
  terminal.value.onData(key => {
    send(key);
  });

  config.opened = true;
};

// 清屏
const clearTerminal = () => {
  if (terminal.value) {
    terminal.value.clear();
  }
};

// 处理Socket事件
const handleEvent = data => {
  if (!terminal.value) return;

  if (data?.code === "00000") {
    if (data?.msg) {
      message(data?.msg, { type: "warning" });
      return;
    }
    terminal.value.write(data?.data);
    return;
  }

  message(data?.msg || "终端操作失败", { type: "warning" });
};

// 关闭连接
const closeConnection = () => {
  if (_socket) {
    send("exit\r");
    setTimeout(() => {
      handleBack();
    }, 500);
  } else {
    handleBack();
  }
};

// 返回上一页
const handleBack = () => {
  router.go(-1);
};

// 组件挂载时初始化终端
onMounted(() => {
  if (_socket) {
    _socket.on(config.eventName, handleEvent);
  }

  initTerminal();
  configTerminal();
  runTerminal();
});

// 组件卸载时清理资源
onUnmounted(() => {
  if (_socket) {
    _socket.off(config.eventName);
  }

  window.removeEventListener("resize", resizeScreen);

  if (terminal.value) {
    try {
      terminal.value?.dispose();
    } catch (error) {}
  }
});
</script>

<style lang="scss" scoped>
.terminal-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #1e1e1e;
  padding: 10px;
  box-sizing: border-box;
  color: #f0f0f0;
  border-radius: 4px;

  .terminal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background-color: #2d2d2d;
    border-radius: 4px 4px 0 0;
    margin-bottom: 5px;

    .terminal-info {
      display: flex;
      align-items: center;
      gap: 10px;

      .host-tag,
      .session-tag {
        font-family: monospace;
      }
    }

    .terminal-actions {
      display: flex;
      gap: 8px;
    }
  }

  .terminal-content {
    flex: 1;
    background-color: #000;
    border-radius: 0 0 4px 4px;
    overflow: hidden;
    position: relative;

    .terminal-view {
      height: 100%;
      width: 100%;
    }
  }
}
</style>
