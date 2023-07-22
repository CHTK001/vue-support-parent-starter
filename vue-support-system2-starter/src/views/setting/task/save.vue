<template>
	<el-dialog draggable status-icon v-model="visible" title="任务配置" width="30%">
        <el-form ref="dialogForm" :model="form" :rules="rules" label-width="120px">
            <el-form-item label="taskId" prop="taskId" v-if="false">
                <el-input v-model="form.taskId" readonly disable />
            </el-form-item>
            <el-form-item label="任务名称" prop="taskName">
                <el-input v-model="form.taskName" clearable placeholder="请输入任务名称" />
            </el-form-item>

            <el-form-item label="任务类型" prop="taskType">
                <div v-if="isUpdate">
                    <el-input v-model="form.taskType" readonly disabled placeholder="请输入总量" />
                </div>
                <div v-else>
                    <el-select v-model="form.taskType" @change="handleDirChange">
                        <el-option :value="item.type + ',' + item.value" :label="item.label" v-for="item in taskType">
                            <span style="float: left">{{ item.value }}</span>
                            <span style=" float: right; color: var(--el-text-color-secondary); font-size: 13px;">{{
                                item.label
                            }}</span>
                        </el-option>
                    </el-select>
                </div>
            </el-form-item>

            <el-tooltip class="box-item" effect="dark" content=" (个)" placement="right">
                <el-form-item label="总量" prop="taskTotal">
                    <div v-if="mode === 'edit'">
                        <el-input v-model="form.taskTotal" readonly disabled />
                    </div>
                    <div v-else>
                        <el-input v-model="form.taskTotal" type="number" clearable placeholder="请输入总量" />
                    </div>
                </el-form-item>
            </el-tooltip>
            
            <el-tooltip class="box-item" effect="dark" content=" (秒)" placement="right">
                <el-form-item label="过期时间" prop="taskExpire">
                    <el-input v-model="form.taskExpire" type="number" clearable placeholder="请输入配置名称" />
                </el-form-item>
            </el-tooltip>
            
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
				taskType: [],
				rules: {
					taskName: [{ required: true, message: "键不能为空", trigger: 'blur' }],
                    taskType: [{ required: true, message: "任务类型不能为空", trigger: 'blur' }],
                    taskTotal: [{ required: true, message: "总量不能为空", trigger: 'blur' }]
				},
				visible: false,
				isSaveing: false,
				shortcuts: [
					{
						text: "每天8点和12点 (自定义追加)",
						value: "0 0 8,12 * * ?"
					}
				]
			}
		},
		mounted() {
			this.initial();
		},
		methods: {
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
						this.$API.system.tasks.save.post(this.form).then(res => {
							if (res.code === '00000') {
								this.$emit('success', this.form, this.mode)
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
</style>
