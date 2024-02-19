<template>
	<el-dialog :before-close="closeDialog" :title="title" top="10px" v-model="visible" width="80%"  destroy-on-close @closed="$emit('closed')" draggable  :close-on-click-modal="false">
		<el-button plain text  icon="el-icon-delete" @click="data.length = 0">清空</el-button>
		<div  ref="containerRef" style="height: 100%; max-height: 80vh; overflow: auto;" @keyup.native="keyEvent">
			<ul>
				<li v-for="item in data">
					<span v-html="item"></span>
				</li>
			</ul>

			<el-empty v-if="!data || data.length == 0" class="h-full"/>

		</div>
	</el-dialog>
</template>

<script>
import pinyin from 'js-pinyin'
import {inject} from 'vue'
import { default as AnsiUp } from 'ansi_up';
const ansi_up = new AnsiUp();

export default {
	emits: ['success', 'closed'],
	data() {
		return {
			visible: false,
			isSaveing: false,
			configList: [],
			data:[],
			title: '日志',
			mode: '',
			socket: inject('socket'),
			//表单数据
			form: {},
			item: {},
			//验证规则
			rules: {
				shellName: [
					{ required: true, message: '请输入脚本名称' }
				],
				shellScriptPath: [
					{ required: true, message: '请输入脚本路径' }
				],
			},
		}
	},
	beforeUnmount() {
        this.closeSocket();
    },
    created() {
    },
	methods: {
		//显示
		open(form, item) {
			this.visible = true;
			this.item = item;
			this.form = form;
			this.closeSocket();
			this.openSocket();
			return this
		},
		openSocket() {
			this.doStart();
			const _this = this;
			this.socket.on(this.item.shellId, (it) => {
                _this.data.push(ansi_up.ansi_to_html(it).replaceAll('\n', '<br/>'));
                if (_this.data.length > 10000) {
                    _this.data.shift();
                }

				_this.$nextTick(() => {
                    let scrollEl = _this.$refs.containerRef;
                    scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' });
                });
            })
        },
		closeDialog(){
			this.closeSocket();
			this.visible = false;
		},
        closeSocket() {
			this.doStop();
			this.socket.off(this.item.shellId);
			
        },
		doStart(){
            this.$API.gen.shell.open.put({genId: this.form.genId, dataId: this.item.shellId}).then(res => {
                if (res.code === '00000') {
                    return;
                }
                this.$message.error(res.msg);
            });
        },
        doStop(){
            this.$API.gen.shell.close.put({genId: this.form.genId, dataId: this.item.shellId}).then(res => {
                if (res.code === '00000') {
                    return;
                }
                this.$message.error(res.msg);
            })
        },
	}
}
</script>

<style></style>
