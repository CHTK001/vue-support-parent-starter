<template>
    <el-button circle size="small" icon="el-icon-edit" @click="open"></el-button>
    <el-dialog :title="title" v-model="dialogStatus" :close-on-click-modal="false" width="60%" :destroy-on-close="true" @closed="$emit('closed')" draggable>
        <sc-code-editor style="width:100%" v-model="value" :options="options"  :mode="mode"></sc-code-editor>
        <template #footer>
            <span class="dialog-footer">
                <el-button type="primary" @click="dialogStatus = false">保存</el-button>
            </span>
        </template>
    </el-dialog>
</template>
<script>
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