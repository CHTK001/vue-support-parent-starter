<template>
	<sc-dialog custom-class="view-iframe-dialog" :pageSize="10" v-model="dialog2" draggable :title="form.ossBucket" width="80%" height="80%" :loading="dialog2Loading" :close-for-modal="false" :destroy-on-close="true">
		<template #header="{ close, titleId, titleClass }">
		<div class="my-header">
			<h4 :id="titleId" >			
				<el-button v-if="!!form.name"  icon="sc-icon-backup" circle @click="backup"></el-button>
				{{ form.name }}  
				bucket: {{ form.ossBucket }}
			</h4>

		</div>
		</template>
		<oss-view @handleDelete="handleDelete" @infoFolder="infoFolder" :datas="data" :ossBucket="ossBucket" :ossId="ossId"></oss-view>
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
		handleDelete(){
			this.doSearch();
		},
		backup() {
			const p = this.form;
			Object.assign(this.form, p)
			const item = this.form.name.split('/');
			item.splice(item.length - 1, 1);
			this.form.name = item.join('/');
			this.doSearch();
		},
		infoFolder(p) {
			Object.assign(this.form, p)
			this.doSearch();
		},
		doSearch(param){
			this.$API.system.oss.listObject.get({
				ossId: this.form.ossId,
				ossBucket: this.form.ossBucket,
				name: this.form.name,
				fromPath: this.form.fromPath,
				path: this.form.path,
				page: param ? param.page : this.form.page ,
				pageSize: param ? param.pageSize : this.form.pageSize
			}).then(res => {
				if(res.code === '00000') {
					this.data = res.data;
					if(!this.data.data) {
						this.data.data = [];
					}
					this.data.data.push({code: 'plus'});
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
			this.form.name = '';
			this.initial();
		}
	}
}
</script>
<style lang="less">
.content-card .el-card__body {
	padding: 0;
}

.view-iframe-dialog {
	.el-dialog__body {
		padding: 0;
		overflow: hidden;
	}
}
</style>
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
.my-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
</style>
