<template>
	<el-container style="overflow: hidden;">
		<el-main class="nopadding">
			<div class="code-toolbar">
				 <el-button plain text icon="el-icon-plus" @click="doHttpConfig('add')">http参数配置</el-button>
				<!--<el-button plain text :loading="isOpen" icon="el-icon-monitor" @click="doMonitor">服务器信息</el-button> -->
				<el-button plain text :loading="isOpen" icon="el-icon-refresh" @click="doRefresh">刷新</el-button>
				<!-- <el-button plain text :loading="isSaveBtn" icon="sc-icon-save" @click="doSaveBtn">保存</el-button> -->
				<!-- <el-button plain text  icon="el-icon-warning" @click="doLog">日志</el-button> -->
			</div>
			<div class="code-toolbar">
			</div>
			<div>
			</div>
		</el-main>

	</el-container>

	<!-- <monitor-dialog v-if="openMonitor" ref="monitorRef"></monitor-dialog> -->
</template>

<script>
import { ElNotification, ElMessageBox } from 'element-plus';

import { defineAsyncComponent } from 'vue';
const scCodeEditor = defineAsyncComponent(() => import('@/components/scCodeEditor/index.vue'));
import { default as AnsiUp } from 'ansi_up';
const ansi_up = new AnsiUp();
export default {
	name: 'WebSql',
	components: {
		scCodeEditor
	},
	data() {
		return {
            form: {}
		}
	},
	mounted() {
		this.form.genId = this.$route.params.genId;
		if (!this.form.genId || this.form.genId === 'null') {
			delete this.form.genId;
		}
	},
	methods: {
		doHttpConfig(mode) {
            this.$router.push({ path: '/ext/nginx/config/' + this.form.genId  });
        },
	}
}
</script>

<style scoped lang="less">
:deep(.el-tree-node) {
	border-top: 1px solid #f1eaea;
	;
	border-bottom: 1px solid #f1eaea;
	;
	box-shadow: 0px 2px 3px 0px #f1eaea;
}

:deep(.el-tree) {
	width: 100%;
	overflow: scroll;
}

:deep(.el-tree>.el-tree-node) {
	display: inline-block;
	min-width: 100%;
}

.custom-icon {
	position: relative;
	top: 3px;
}

.custom-content {
	padding-left: 3px;
}

.code-toolbar {
	height: 38px;
	margin: 5px;
}

.custom-tree-node {
	flex: 1;
	display: flex;
	font-size: 14px;
	line-height: 38px;
	height: 38px;
	width: 200px;
	align-items: center;
	justify-content: space-between;
	font-size: 14px;
	padding-right: 8px;
	position: relative;
}

.show-hide:hover :nth-child(4){
	display: inline-block !important;
}

.message {
	white-space: pre;
}
.op {
	width: 20px;
	height: 20px;
	margin: 0;
	padding: 0;
}
</style>
