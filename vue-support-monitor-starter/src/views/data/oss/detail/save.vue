<template>
    <el-col :lg="12">
        <h2>{{ form.fileStorageProtocolDesc || "新增菜单" }}</h2>
        <el-form :model="row" :rules="rules" ref="dialogForm" label-width="80px" label-position="left">
            <el-form-item label="显示名称" prop="fileStorageName">
                <el-input v-model="row.fileStorageName" clearable placeholder="名称"></el-input>
            </el-form-item>
            <el-form-item label="类型" prop="fileStorageType">
                <el-radio-group v-model="row.fileStorageType">
                    <el-radio-button :label=" item.name" :value="item.name" v-for="item in options?.fileStorage || []">{{ item.describe || item.name }}</el-radio-button>
                </el-radio-group>
            </el-form-item>

            <el-form-item label="bucket" prop="fileStorageBucket">
                <el-input v-model="row.fileStorageBucket" clearable placeholder="bucket"></el-input>
            </el-form-item>
            <el-form-item label="图标" prop="fileStorageIcon">
                <sc-icon-select v-model="row.fileStorageIcon" clearable></sc-icon-select>
            </el-form-item>
            <el-form-item label="账号" prop="fileStorageUser">
                <el-input v-model="row.fileStorageUser" clearable placeholder="账号"></el-input>
                <div class="el-form-item-msg">部分类型需要填写</div>
            </el-form-item>
            <el-form-item label="密码" prop="fileStoragePassword">
                <el-input v-model="row.fileStoragePassword" clearable placeholder="密码"></el-input>
                <div class="el-form-item-msg">部分类型需要填写</div>
            </el-form-item>
            <el-form-item label="端点" prop="fileStorageEndpoint">
                <el-input v-model="row.fileStorageEndpoint" clearable placeholder="端点"></el-input>
                <div class="el-form-item-msg">部分类型需要填写, 本地存储需要填写本地地址</div>
            </el-form-item>

            <el-form-item label="启用" prop="fileStorageStatus">
                <el-switch v-model="row.fileStorageStatus"  :active-value="1" :inactive-value="0" ></el-switch>
            </el-form-item>

            <el-form-item label="描述" prop="fileStorageDesc">
                <el-input v-model="row.fileStorageDesc" clearable placeholder="描述" type="textarea"></el-input>
            </el-form-item>

            <el-form-item>
                <el-button type="primary" @click="doSubmit" :loading="loading">保 存</el-button>
            </el-form-item>
        </el-form>

    </el-col>
</template>
<script>
import scIconSelect from '@/components/scIconSelect/index.vue'

import Base64 from '@/utils/base64'
export default {
    components:{scIconSelect},
    props: {
        form: {
            type: Object,
            default: () => {
                return {}
            }
        },
        menu: {
            type: Object,
            default: () => {
                return {}
            }
        }
    },
    watch: {
        menu: {
            handler(val) {
                this.row = {};
                Object.assign(this.row, val);
            },
            deep: true
        }
    },
    data(){
        return {
            row: {},
            loading: false,
            options: {},
            rules: {
                fileStorageName: [
                    { required: true, message: '请输入名称', trigger: 'blur' }
                ],
                fileStorageType: [
                    { required: true, message: '请选择类型', trigger: 'blur' }
                ],
                fileStorageBucket: [
                    { required: true, message: '请输入bucket', trigger: 'blur'}
                ]
            }
        }
    },
    mounted(){
        Object.assign(this.row, this.menu);
        this.row.fileStorageProtocolId = this.form.fileStorageProtocolId;
        this.afterPropertiesSet();
    },
    methods: {
        close(){
            this.visible = false;
            this.loading = false;
            this.$emit('close');
            this.row = {};
            Object.assign(this.row, this.menu);
            this.row.fileStorageProtocolId = this.form.fileStorageProtocolId;
        },
        async afterPropertiesSet(){
            const res = await this.$API.spi.list.get({type: Base64.encode('fileStorage')});
            if(res.code === '00000') {
                this.options = res.data;
            }
        },
        doSubmit(){
            this.$refs.dialogForm.validate(valid => {
                if (valid) {
                    this.loading = true;
                    if(this.row.fileStorageId) {
                        this.$API.filestorage.update.put(this.row).then(res => {
                            if(res.code === '00000') {
                                this.$message.success('保存成功');
                                this.$emit('success');
                                Object.assign(this.menu, this.row);
                                this.close();
                            } else {
                                this.$message.error(res.msg);
                            }
                        }).finally(() => {
                            this.loading = false;
                        })
                        return false;
                    }
                    this.$API.filestorage.save.post(this.row).then(res => {
                        if(res.code === '00000') {
                            this.$message.success('保存成功');
                            this.$emit('success');
                            this.close();
                        } else {
                            this.$message.error(res.msg);
                       }
                    }).finally(() => {
                        this.loading = false;
                    })
                }
            })
        },
    }
}
</script>