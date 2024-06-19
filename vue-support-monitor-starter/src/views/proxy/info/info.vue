<template>
	<el-drawer direction="rtl" size="80%" :before-close="closeInterval2" :destroy-on-close="true"
	 :close-on-click-modal="false" :title="title" v-model="visible" width="600" class="bg-blue-gray-50/50" style="background-color: #f6f8f9;" 
	 destroy-on-close @closed="$emit('closed')">
	 	<el-button plain text :loading="isOpen" icon="el-icon-monitor">服务器信息</el-button>
		<el-select v-model="period">
			<el-option label="全部" value=""></el-option>
			<el-option label="每隔10秒刷新" :value="10"></el-option>
			<el-option label="每隔20秒刷新" :value="20"></el-option>
			<el-option label="每隔30秒刷新" :value="30"></el-option>
			<el-option label="每隔40秒刷新" :value="40"></el-option>
		</el-select>
		<el-button v-if="intervalRefTimeValue" plain text icon="sc-icon-time" >刷新倒计时: {{ intervalRefTimeValue }}秒</el-button>
		<el-divider></el-divider>
	 	<redis-layout :data="data"></redis-layout>
	</el-drawer>

</template>

<script>

export default {
	emits: ['success', 'closed'],
	data() {
		return {
			period: 30,
			isOpen: false,
			logDialogVisible: false,
			envDialogVisible: false,
			configpropsDialogVisible: false,
			redisDialogVisible: false,
			visible: false,
			isSaveing: false,
			configList: [],
			title: '详情',
			mode: '',
			appName: '',
			form:{},
			data: {},
			endpoint: 'gen-redis',
			intervalRef: null,
			intervalRefTime: null,
			intervalRefTimeValue: 30,

		}
	},
	watch:{
		period: {
			handler: function(nv, ov) {
				if(nv) {
					this.openInterval(nv);
					this.intervalRefTimeValue = nv;
					return;
				}
				this.closeInterval();
			}
		}
	},
	beforeUnmount() {
        this.closeInterval();
    },
	unmount() {
        this.closeInterval();
    },
	methods: {
		afterPropertiesSet(){
			this.$API.gen.session.info.post({genId: this.form.genId}).then(res => {
				if (res.code == '00000') {
					this.data = res.data?.data;
					return;
				}
			});
		},
		openInterval(time){
			this.closeInterval();
			const _this = this;
			this.intervalRef = setInterval(() => {
				this.afterPropertiesSet();
				this.intervalRefTimeValue = time + 1;
			}, time * 1000);
			this.intervalRefTime = setInterval(() => {
				this.intervalRefTimeValue = this.intervalRefTimeValue - 1 ;
			}, 1000);
		},
		//显示
		open(mode = 'add') {
			this.mode = mode;
			this.visible = true;
			return this
		},
		//表单注入数据
		setData(data) {
			//可以和上面一样单个注入，也可以像下面一样直接合并进去
			Object.assign(this.form, data);
			this.title = data.genName;
			this.afterPropertiesSet();
			this.intervalRefTimeValue = this.period;
			this.openInterval(this.period);
		},
	}
}
</script>

<style lang="less">
::deep(.redis path) {
	fill: red
}
</style>
