<template>
  <div class="h-full relative">
    <div class="absolute right-0 z-[19]">
      <el-button :icon="useRenderIcon('ep:arrow-left')" circle @click="handleMore" />
    </div>
    <div id="terminal" ref="terminalRef" class="h-full" />
  </div>
</template>

<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { useConfigStore } from "@repo/core";
import { message } from "@repo/utils";
import { onMounted, onUnmounted, reactive, ref } from "vue";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import "xterm/lib/xterm.js";

const props = defineProps({
  data: Object
});

const config = reactive({
  eventName: null
});

const visible = reactive({
  showMore: false
});

const handleMore = () => {
  visible.showMore = true;
  message("暂未实现", { type: "warning" });
};

config.eventName = "terminal-" + props.data.genId;
const socket = useConfigStore().socket;
const terminalRef = ref(null);
const terminal = ref(null);
const initTerminal = () => {
  terminal.value = new Terminal({
    fontFamily: "Monaco, Menlo, Consolas, 'Courier New', monospace",
    rendererType: "canvas", //渲染类型
    rows: 72, //行数
    cols: 250, // 不指定行数，自动回车后光标从下一行开始
    convertEol: true, //启用时，光标将设置为下一行的开头
    // scrollback: 50, //终端中的回滚量
    disableStdin: false, //是否应禁用输入
    // cursorStyle: "underline", //光标样式
    cursorBlink: true, //光标闪烁
    theme: {
      foreground: "#ECECEC", //字体
      background: "#000000", //背景色
      cursor: "help", //设置光标
      lineHeight: 20
    }
  });
};

const configTerminal = () => {
  // 创建terminal实例
  terminal.value.open(terminalRef.value);
  // 换行并输入起始符 $
  terminal.value.prompt = _ => {
    terminal.value.write("\r\n\x1b[33m$\x1b[0m ");
  };
  terminal.value.prompt();
  // canvas背景全屏
  const fitAddon = new FitAddon();
  terminal.value.loadAddon(fitAddon);
  fitAddon.fit();

  window.addEventListener("resize", resizeScreen);
  function resizeScreen() {
    try {
      // 窗口大小改变时，触发xterm的resize方法使自适应
      fitAddon.fit();
    } catch (e) {
      console.log("e", e.message);
    }
  }
};

const send = data => {
  socket.emit(
    "terminal",
    JSON.stringify({
      command: data,
      genId: props.data.genId
    })
  );
};
const runTerminal = () => {
  if (terminal.value._initialized) return;
  // 初始化
  terminal.value._initialized = true;
  terminal.value.writeln("Welcome to \x1b[1;32m" + props.data.genHost + ":" + props.data.genPort + "\x1b[0m.");
  terminal.value.writeln("This is Web Terminal of Modb; Good Good Study, Day Day Up.");
  send("\r");
  terminal.value.onData(key => {
    send(key);
  });
};

const handleEvent = data => {
  if (data?.code === "00000") {
    if (data?.msg) {
      message(data?.msg, { type: "warning" });
      return;
    }
    terminal.value.write(data?.data);
    return;
  }
  message(data?.msg, { type: "warning" });
};

onMounted(async () => {
  socket?.on(config.eventName, handleEvent);
  initTerminal();
  configTerminal();
  runTerminal();
});
onUnmounted(async () => {
  socket?.off(config.eventName);
});
</script>

<style></style>
