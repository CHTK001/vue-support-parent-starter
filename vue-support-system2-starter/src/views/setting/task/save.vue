<template>
	<el-dialog draggable status-icon v-model="visible" title="任务配置" width="30%">
        <el-form ref="dialogForm" :model="form" :rules="rules" label-width="120px">
            <el-form-item label="taskId" prop="taskId" v-if="false">
                <el-input v-model="form.taskId" readonly disable />
            </el-form-item>
            <el-form-item label="任务名称" prop="taskName">
                <el-input v-model="form.taskName" clearable placeholder="请输入任务名称" />
            </el-form-item>

            <el-form-item label="任务类型" prop="taskType" class="select-width">
                <div v-if="isUpdate">
                    <el-input v-model="form.taskType" readonly disabled placeholder="请输入总量" style="width: 100%;"/>
                </div>
                <div v-else>
					<sc-select v-model="form.taskType" :apiObj="apiObj"  clearable filterable  style="width: 100%;" @change="handleDirChange">
						<template #option="{data}">
							<span style="float: left">{{ data.value }}</span>
							<span style="float: right; color: #999; font-size: 13px">{{data.label }}</span>
						</template>
					</sc-select>
                    <!-- <el-select  class="select-width"	v-model="form.taskType" @change="handleDirChange" style="width: 100%;">.
                        <el-option :value="item.type + ',' + item.value" :label="item.label" v-for="item in taskType" style="width: 100%;">
                            <span style="float: left">{{ item.value }}</span>
                            <span style=" float: right; color: var(--el-text-color-secondary); font-size: 13px;">{{
                                item.label
                            }}</span>
                        </el-option>
                    </el-select> -->
                </div>
            </el-form-item>

            <el-tooltip class="box-item" effect="dark" content=" (个)" placement="right">
                <el-form-item label="总量" prop="taskTotal">
                    <div v-if="mode === 'edit'">
                        <el-input-number v-model="form.taskTotal" readonly disabled style="width: 100%;"/>
                    </div>
                    <div v-else>
                        <el-input-number v-model="form.taskTotal" :min="1" type="number" clearable placeholder="请输入总量" style="width: 100%;"/>
                    </div>
                </el-form-item>
            </el-tooltip>
            
            <el-tooltip class="box-item" effect="dark" content=" (秒)" placement="right">
                <el-form-item label="过期时间" prop="taskExpire">
                    <el-input v-model="form.taskExpire" type="number" clearable placeholder="请输入配置名称" />
                </el-form-item>
            </el-tooltip>

			<el-form-item label="是否覆盖" prop="taskOver">
				<el-checkbox v-model="form.taskOver" :true-label="1" :false-label="0">覆盖</el-checkbox>
				<!-- <el-checkbox v-model="form.meta.hiddenBreadcrumb">隐藏面包屑</el-checkbox> -->
				<div class="el-form-item-msg">当任务ID相同是否进行任务覆盖</div>
			</el-form-item>
            
            <el-form-item label="参数" prop="value">
                <el-input v-model="form.taskParams" :rows="10" type="textarea" clearable placeholder="请输入参数" />
            </el-form-item>

            <el-form-item>
                <el-button @click="visible = false">取消</el-button>
                <el-button type="primary" @click="submit()" :loading="isSaveing">提交</el-button>
            </el-form-item>
        </el-form>
    </el-dialog>
</template>

<script>
	import scCron from '@/components/scCron/index.vue';
	
	export default {
		components: {
			scCron
		},
		emits: ['success', 'closed'],
		data() {
			return {
				mode: "add",
				titleMap: {
					add: '新增计划任务',
					edit: '编辑计划任务'
				},
				form: {
				},
				apiObj: this.$API.system.tasks.options,
				taskType: [],
				rules: {
					taskName: [{ required: true, message: "任务名称不能为空", trigger: 'blur' }],
                    taskType: [{ required: true, message: "任务类型不能为空", trigger: 'blur' }],
                    taskTotal: [{ required: true, message: "总量不能为空", trigger: 'blur' }]
				},
				visible: false,
				isSaveing: false,
				shortcuts: [
					
				]
			}
		},
		mounted() {
			// this.initial();
		},
		methods: {
			getValue(row) {
				debugger
			},
			initial() {
				this.$API.system.tasks.options.get().then((res) => {
					if (res.code === '00000') {
						this.taskType = res.data;
					} else {
						this.$notify.error({ title: '提示', message: res.msg })
					}
				}).finally(() => {
					this.loading = false
				})
			},
			//显示
			open(mode='add'){
				this.mode = mode;
				if(this.mode == 'add') {
					this.form = {};
				}
				this.visible = true;
				return this;
			},
			handleDirChange: function (data) {
				this.form.taskType = data.split(',')[0];
				this.form.taskCid = data.split(',')[1];
			},
			//表单提交方法
			submit(){
				this.$refs.dialogForm.validate((valid) => {
					if (valid) {
						this.isSaveing = true;
						this.form.taskCid = this.form.taskType;
						this.$API.system.tasks.save.post(this.form).then(res => {
							if (res.code === '00000') {
								this.$emit('success', res.data, this.mode)
								this.visible = false;
							} else {
								this.$notify.error({title: '提示', message: res.msg})
							}
						}).finally(() =>{this.isSaveing = false})
					}
				})
			},
			//表单注入数据
			setData(data){
				Object.assign(this.form, data)
			}
		}
	}
</script>

<style>
.select-width {
	width: 100%;
}
</style>
