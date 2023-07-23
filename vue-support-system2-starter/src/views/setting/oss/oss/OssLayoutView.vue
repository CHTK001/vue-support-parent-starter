<template>
	<sc-dialog v-model="dialog2" draggable :title="form.ossBucket" width="80%" :loading="dialog2Loading" :close-for-modal="false">
		<el-empty v-if="!data || data.length == 0" description="暂无数据" :image-size="80"></el-empty>
		<oss-view :datas="data"></oss-view>
		<template #footer>
			<scPagintion :pageSize="form.size" :total="total" @dataChange="doSearch"></scPagintion>
		</template>
	</sc-dialog>
</template>

<script>
import OssView from './OssView.vue'
export default {
	emits: ['success', 'closed'],
	components:{
		OssView
	},
	data() {
		return {
			form: {},
			mode: '',
			data: undefined,
			dialog2: false,
			dialog2Loading: false
		}
	},
	mounted() {

	},
	methods: {
		initial() {
				this.$API.system.oss.listObject.get({
					ossId: this.form.ossId,
					ossBucket: this.form.ossBucket,
				}).then(res => {
					if(res.code === '00000') {
						this.data = res.data;
						return !1;
					}
					this.$notify.error({title: '提示', message: res.msg});
				}).finally(() => {this.dialog2Loading = false})
		},
		//显示
		open(mode = 'add') {
			this.mode = mode;
			this.dialog2 = true;
			return this
		},
		//表单注入数据
		setData(data) {
			Object.assign(this.form, data)
			this.initial();
		}
	}
}
</script>

<style>
.removeRadio .el-radio__inner {
	border-radius: 0;
	border: 0;
	width: 170px;
	height: 34px;
	background-color: transparent;
	cursor: pointer;
	box-sizing: border-box;
	position: absolute;
	top: -18px;
	left: -19px;
}

.removeRadio .el-radio__input.is-checked .el-radio__inner {
	background: transparent;
}
</style>
