<template>
	<sc-dialog v-model="dialog2" draggable :title="form.ossBucket" width="80%" height="80%" :loading="dialog2Loading" :close-for-modal="false" :destroy-on-close="true">
		<oss-view-inner :datas="data" :ossBucket="ossBucket" :ossId="ossId"></oss-view-inner>
		<template #footer>
			<scPagintion :pageSize="form.size" :total="total" @dataChange="doSearch"></scPagintion>
		</template>
	</sc-dialog>
</template>

<script>
import OssViewInner from './OssView2.vue'
export default {
	emits: ['success', 'closed'],
	components:{
		OssViewInner
	},
	data() {
		return {
			total: 0,
			form: {},
			mode: '',
			ossBucket: undefined,
			ossId: undefined,
			fromPath: undefined,
			path: undefined,
			data: undefined,
			dialog2: false,
			dialog2Loading: false
		}
	},
	mounted() {
		this.page = 1;
	},
	methods: {
		doSearch(param){
			this.$API.system.oss.listObject.get({
				ossId: this.form.ossId,
				ossBucket: this.form.ossBucket,
				fromPath: this.form.fromPath,
				path: this.form.path,
				page: param ? param.page : 1,
				pageSize: param ? param.pageSize : 20
			}).then(res => {
				if(res.code === '00000') {
					this.data = res.data;
					this.total = res.data.total;
					return !1;
				}
				this.$notify.error({title: '提示', message: res.msg});
			}).finally(() => {this.dialog2Loading = false})
		},
		initial() {
			this.doSearch({page:1, pageSize:20});	
		},
		//显示
		open(mode = 'add') {
			this.mode = mode;
			this.dialog2 = true;
			return this
		},
		//表单注入数据
		setData(data) {
			this.ossId = data.ossId;
			this.ossBucket = data.ossBucket;
			this.fromPath = data.fromPath;
			this.path = data.path;
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
