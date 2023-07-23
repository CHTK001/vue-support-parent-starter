<!--
 * @Descripttion: 弹窗扩展组件
 * @version: 2.0
 * @Author: sakuya
 * @Date: 2021年8月27日08:51:52
 * @LastEditors: sakuya
 * @LastEditTime: 2022年5月14日15:13:41
-->

<template>
	<div class="sc-dialog" ref="scDialog">
		<el-dialog :class="isminimize ? 'isminimize' : ''" :close-on-click-modal="closeForModal" ref="dialog"
			v-model="dialogVisible" :fullscreen="isFullscreen" v-bind="$attrs" :show-close="false">
			<template #header>
				<slot name="header">
					<span class="el-dialog__title">{{ title }}</span>
				</slot>
				<div class="sc-dialog__headerbtn">
					<button v-if="showIsminimize" slot="title" class="medium" @click="miniDialog">
						<el-icon class="el-dialog__minus"><el-icon-minus /></el-icon>
					</button>
					<button v-if="showFullscreen" aria-label="fullscreen" type="button" @click="setFullscreen">
						<el-icon v-if="isFullscreen" class="el-dialog__close"><el-icon-bottom-left /></el-icon>
						<el-icon v-else class="el-dialog__close"><el-icon-full-screen /></el-icon>
					</button>
					<button v-if="showClose" aria-label="close" type="button" @click="closeDialog">
						<el-icon class="el-dialog__close"><el-icon-close /></el-icon>
					</button>
				</div>
			</template>
			<div v-loading="loading">
				<slot></slot>
			</div>
			<template #footer>
				<slot name="footer"></slot>
			</template>
		</el-dialog>
	</div>
</template>

<script>
export default {
	props: {
		closeForModal: { type: Boolean, default: true },
		modelValue: { type: Boolean, default: false },
		title: { type: String, default: "" },
		showClose: { type: Boolean, default: true },
		showFullscreen: { type: Boolean, default: true },
		showIsminimize: { type: Boolean, default: true },
		loading: { type: Boolean, default: false },
		isFooter: { type: Boolean, default: true }
	},
	data() {
		return {
			dialogVisible: false,
			isFullscreen: false,
			isminimize: false
			
		}
	},
	watch: {
		modelValue() {
			this.dialogVisible = this.modelValue
			if (this.dialogVisible) {
				this.isFullscreen = false
			}
		}
	},
	mounted() {
		this.dialogVisible = this.modelValue
	},
	methods: {
		 // 最小化
		 miniDialog() {
			this.isminimize = !this.isminimize
			if (this.isFullscreen) this.isFullscreen = !this.isFullscreen
		},
		//关闭
		closeDialog() {
			this.dialogVisible = false
		},
		//最大化
		setFullscreen() {
			this.isFullscreen = !this.isFullscreen
		}
	}
}
</script>

<style scoped>
.sc-dialog__headerbtn {
	position: absolute;
	top: var(--el-dialog-padding-primary);
	right: var(--el-dialog-padding-primary);
}

.sc-dialog__headerbtn button {
	padding: 0;
	background: transparent;
	border: none;
	outline: none;
	cursor: pointer;
	font-size: var(--el-message-close-size, 16px);
	margin-left: 15px;
	color: var(--el-color-info);
}

.sc-dialog__headerbtn button:hover .el-dialog__close {
	color: var(--el-color-primary);
}

.sc-dialog:deep(.el-dialog).is-fullscreen {
	display: flex;
	flex-direction: column;
	top: 0px !important;
	left: 0px !important;
}

.sc-dialog:deep(.el-dialog).is-fullscreen .el-dialog__header {}

.sc-dialog:deep(.el-dialog).is-fullscreen .el-dialog__body {
	flex: 1;
	overflow: auto;
}

.sc-dialog:deep(.el-dialog).is-fullscreen .el-dialog__footer {
	padding-bottom: 10px;
	border-top: 1px solid var(--el-border-color-base);
}

.isminimize {
	left: 20px;
	bottom: 20px;
	top: auto;
	right: auto;
	overflow: hidden;

	.el-dialog {
		margin: 0 !important;
		width: 240px !important;
		height: 40px;
		top: 0 !important;
		left: 0 !important;
	}

	.el-dialog__header {
		cursor: auto !important;

		.el-dialog__headerbtn {
			display: none;
		}
	}

	.dialogFooter {
		position: absolute;
		bottom: 0;

	}
}</style>
