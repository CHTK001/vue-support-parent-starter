<template>
	<el-dialog :before-close="closeDialog" :title="title" top="10px" v-model="visible" width="80%" destroy-on-close
		@closed="$emit('closed')" draggable :close-on-click-modal="false">
			<div id="terminal" ref="terminal"></div>
	</el-dialog>
</template>

<script>
import pinyin from 'js-pinyin'
import { inject } from 'vue'
import { default as AnsiUp } from 'ansi_up';
const ansi_up = new AnsiUp();
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'
import 'xterm/lib/xterm.js'

export default {
	emits: ['success', 'closed'],
	data() {
		return {
			consoleLoading: false,
			visible: false,
			isSaveing: false,
			configList: [],
			data: [],
			term: null,
			title: '终端',
			mode: '',
			rows: 36,
      		cols: 120,
			socket: inject('socket'),
			terminalId: null,
			command: [],
			item: {},
		}
	},
	beforeUnmount() {
		this.closeSocket();
	},
	created() {
	},
	methods: {
		//显示
		open(mode = 'add') {
			this.visible = true;
			return this
		},
		setData(item) {
			this.item = item;
			this.terminalId = item.terminalId;
			this.consoleLoading = true
			this.closeSocket();
			this.openSocket();
			this.$nextTick(() => {
				this.initTerm();
			});
		},
		send(message) {
			this.socket.emit("terminal", JSON.stringify({
				command: message,
				requestId: this.terminalId
			}))
		},
		openSocket() {
			const _this = this;
			this.socket.on("terminal-" + this.terminalId, (it) => {
				this.term.write(it?.data)
			})
		},
		closeDialog() {
			this.closeSocket();
			this.visible = false;
		},
		closeSocket() {
			this.socket.off("terminal-" + this.terminalId);
		},

		// 初始化终端
		initTerm() {
			let _this = this
			let term = new Terminal({
				fontFamily: "Monaco, Menlo, Consolas, 'Courier New', monospace",
				rendererType: "canvas", //渲染类型
				rows: _this.rows, //行数
				cols: _this.cols, // 不指定行数，自动回车后光标从下一行开始
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
			})
			// 创建terminal实例
			term.open(this.$refs["terminal"])
			// 换行并输入起始符 $
			term.prompt = _ => {
				term.write("\r\n\x1b[33m$\x1b[0m ")
			}
			term.prompt()
			// canvas背景全屏
			const fitAddon = new FitAddon()
			term.loadAddon(fitAddon)
			fitAddon.fit()

			window.addEventListener("resize", resizeScreen)
			function resizeScreen() {
				try { // 窗口大小改变时，触发xterm的resize方法使自适应
				fitAddon.fit()
				} catch (e) {
				console.log("e", e.message)
				}
			}
			_this.term = term
			_this.runFakeTerminal()
			
		},
		runFakeTerminal() {
			let _this = this
			let term = _this.term
			if (term._initialized) return
			// 初始化
			term._initialized = true
			term.writeln("Welcome to \x1b[1;32m"+ this.item.terminalHost+"\x1b[0m.")
			term.writeln('This is Web Terminal of Modb; Good Good Study, Day Day Up.')
			_this.send("\r")
			term.onData(key => {  
				_this.send(key);
			})
		}
	}
}
</script>

<style></style>
