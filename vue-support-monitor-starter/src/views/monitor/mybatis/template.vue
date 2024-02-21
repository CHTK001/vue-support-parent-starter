<template>
    <el-button circle size="small" icon="el-icon-edit" @click="open"></el-button>
    <el-dialog :title="title" v-model="dialogStatus" :close-on-click-modal="false" width="60%" :destroy-on-close="true" @closed="$emit('closed')" draggable>
        <div class="code-toolbar">
            <el-button plain text icon="el-icon-magic-stick" style="margin-left: 0px;" @click="formatSql">美化</el-button>
            <el-button plain text icon="sc-icon-time">
                <el-icon class="animation" v-if="isExecute || isExplain" title="加载中">
                    <component is="sc-icon-loading-v2" circle />
                </el-icon>
                耗时: <el-tag style="margin-top:1px">{{ cost }}ms</el-tag></el-button>
        </div>
        <sc-code-editor style="width:100%" v-model="value" :options="options"  :mode="mode"></sc-code-editor>
        <template #footer>
            <span class="dialog-footer">
                <el-button type="primary" @click="dialogStatus = false">保存</el-button>
            </span>
        </template>
    </el-dialog>
</template>
<script>
import { format } from 'sql-formatter'

import { defineAsyncComponent } from 'vue';
const scCodeEditor = defineAsyncComponent(() => import('@/components/scCodeEditor/index.vue'));
export default {
    name: 'templateSave',
    components:{
        scCodeEditor
    },
    props:{
        formValue: {
            type: Object,
            default: () => {}
        },
        mode: {
            type: Object,
            default: () => {}
        },
    },
    data() {
        return {
            dialogStatus: false,
            isSave: false,
            title: '新增模板',
            form: {},
            cost: 0,
            value: '',
            rules: {
                templateName: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
                templateType: [{ required: true, message: '请选择模板类型', trigger: 'change' }],
                templateContent: [{ required: true, message: '请输入模板内容', trigger: 'blur' }],
                templatePath: [{ required: true, message: '请输入模板路径', trigger: 'blur' }],
            },
            options: {
                col: 300,
                height: 1000,
                hintOptions: { // 自定义提示选项
                    completeSingle: false,
                }
            },

        }
    },
    unmounted() {
        window.removeEventListener('keydown', this.handleEvent)
    },
    mounted(){
        window.addEventListener('keydown', this.handleEvent)
        this.value = this.formValue
    },
    watch:{
        "value": {
            handler(nv, ov) {
                this.$emit("success", nv)
            }
        }
    },
    methods: {
        formatSql() {
            const start = new Date().getTime();
			this.value = format(this.value)
            this.cost = new Date().getTime() - start;
		},
        open() {
            this.dialogStatus = true
        },
        async handleEvent(event) {
            console.log(event.keyCode);
            switch (event.keyCode) {
            }
        },
        onsubmit() {
            this.$refs.formRef.validate((v) => {
                if(v) {
                    this.isSave = true;
                    this.$API.gen.template.save.post(this.form).then(res => {
                        if (res.code == '00000') {
                            this.dialogStatus = false;
                            this.$emit('success');
                            this.$message.success('新增成功');
                            return;
                        }
                        this.$message.error(res.msg);
                    }).finally(() => this.isSave = false);
                }
            })
        }
    }
}
</script>