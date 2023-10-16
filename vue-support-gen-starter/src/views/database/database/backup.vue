<template>
    <el-dialog :title="title" v-model="dialogStatus" :close-on-click-modal="false" width="30%" destroy-on-close
        @closed="$emit('closed')" draggable>
        <el-form :model="form" label-width="80px" status-icon  :rules="rules">
            <el-form-item label="保存周期" prop="backupPeriod">
                <el-input v-model="form.backupPeriod" type="number"/>
                <span class="el-form-item-msg" style="margin-left: 10px;">数据保存的周期(天)</span>
            </el-form-item>
            <el-form-item label="备份目录" prop="backupPath">
                <el-input v-model="form.backupPath"/>
                <span class="el-form-item-msg" style="margin-left: 10px;">数据保存的目录</span>
            </el-form-item>
            <el-form-item label="保存策略" prop="backupStrategy">
                <el-select v-model="form.backupStrategy">
                    <el-option value="day">
                        day
                        <span class="el-form-item-msg" style="margin-left: 10px;">数据保存的方式</span>
                    </el-option>
                </el-select>
                <span class="el-form-item-msg" style="margin-left: 10px;">数据备份的策略</span>
            </el-form-item>
            <el-form-item label="忽略名单" prop="backupIgnore">
                <el-tag v-for="tag in dynamicTags" :key="tag" class="mx-1" closable :disable-transitions="false" @close="handleClose(tag)" >
                    {{ tag }}
                </el-tag>
                <el-input v-if="inputVisible" ref="InputRef" v-model="inputValue" class="ml-1 w-20" size="small" @keyup.enter="handleInputConfirm" @blur="handleInputConfirm" />
                <el-button v-else class="button-new-tag ml-1" size="small" @click="showInput">
                    + 
                </el-button>
                <span class="el-form-item-msg" style="margin-left: 10px;">名单内的将被排除</span>
            </el-form-item>
            <el-form-item label="过滤信息" prop="backupFilter">
                <el-input v-model="form.backupFilter"/>
                <span class="el-form-item-msg" style="margin-left: 10px;">备份过滤信息</span>
            </el-form-item>

            <el-form-item label="驱动名称" prop="backupDriver" v-if="!driver || driver.length == 0">
                <el-input v-model="form.backupDriver"/>
                <span class="el-form-item-msg" style="margin-left: 10px;">数据备份的驱动信息</span>
            </el-form-item>

            <el-form-item label="驱动名称" prop="backupDriver" v-else>
                <el-select v-model="form.backupDriver">
                    <el-option v-for="item in driver" :value="item.name">
                        <span>{{ item.desc }}</span>
                        <span class="el-form-item-msg" style="margin-left: 10px;">
                        {{item.ext}}</span>
                    </el-option>
                </el-select>
                <span class="el-form-item-msg" style="margin-left: 10px;">数据备份的驱动信息</span>
            </el-form-item>

        </el-form>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="dialogStatus = false">取消</el-button>
                <el-button type="primary" :loading="isSave" @click="onsubmit">
                    提交
                </el-button>
            </span>
        </template>
    </el-dialog>
</template>
<script>
export default {
    name: 'SaveIndices',
    data() {
        return {
            dialogStatus: false,
            dynamicTags: [],
            inputValue : '',
            inputVisible: false,
            form: {
                genId: null,
                backupPath: './',
                backupPeriod: 3,
                backupStrategy: 'day',
            },
            driver: [],
            title: '',
            mode: 'add',
            rules: {
                backupPeriod: [{ required: true, message: '请输入保存周期', trigger: 'blur' }],
                backupPath: [{ required: true, message: '请输入保存目录', trigger: 'blur' }],
                backupStrategy: [{ required: true, message: '请选择保存策略', trigger: 'change' }],
            }
        }
    },
    methods: {
        handleClose (tag) {
            this.dynamicTags.splice( this.dynamicTags.indexOf(tag), 1)
        },
        showInput (){
            this.inputVisible = true
            this.$nextTick(() => {
                this.$refs.InputRef?.input?.focus()
            })
        },
        handleInputConfirm () {
            if (this.inputValue) {
                this.dynamicTags.push(this.inputValue)
            }
            this.inputVisible = false
            this.inputValue = ''
        },
        open(data, mode) {
            this.mode = mode || 'add';
            this.title = '新增备份配置';
            this.dialogStatus = true;
            return this;
        },
        async setData(data) {
            this.form.genId = data?.genId;
            await this.$API.gen.backup.info.get(this.form).then(res => {
                if (res.code == '00000') {
                    this.mode = 'edit';
                    this.title = '编辑备份配置';
                    if(!res.data) {
                        this.title = '新增备份配置';
                        this.mode = 'add';
                        return;
                    }
                    this.form = res.data;
                    this.dynamicTags = this.form.backupIgnore ? this.form.backupIgnore.split(',') : [];
                    return;
                }
                this.$message.error(res.msg);
            });

            await this.$API.gen.backup.driver.get(this.form).then(res => {
                if (res.code == '00000') {
                    this.driver = res.data;
                    return;
                }
                this.$message.error('获取驱动失败:' + res.msg);
            });
        },
        onsubmit() {
            this.isSave = true;
            this.form.backupIgnore = this.dynamicTags.join(',');
            if (this.mode === 'add') {
                this.$API.gen.backup.save.post(this.form).then(res => {
                    if (res.code == '00000') {
                        this.$message.success('保存成功');
                        this.dialogStatus = false;
                        this.$emit('success', this.form, this.mode)
                        return;
                    }
                    this.$message.error(res.msg);
                }).finally(() => this.isSave = false);
                return;
            }

            this.$API.gen.backup.update.put(this.form).then(res => {
                if (res.code == '00000') {
                    this.$message.success('修改成功');
                    this.dialogStatus = false;
                    this.$emit('success', this.form, this.mode)
                    return;
                }
                this.$message.error(res.msg);
            }).finally(() => this.isSave = false);
        }
    }

}
</script>