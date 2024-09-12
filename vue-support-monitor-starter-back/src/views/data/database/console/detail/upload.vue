<template>
    <el-dialog v-model="visible" :title="title" width="50%" :before-close="close" @close="close" :destroy-on-close="true" draggable>
        <el-upload :action="$API.gen.database.install.url" ref="uploadRef" :data="{
            type: this.form.type,
            genId: this.form.genId
        }" name="file" drag :on-success="doSuccess" :limit="1">
            <el-icon class="el-icon--upload"><component is="sc-icon-upload" /></el-icon>
                <div class="el-upload__text">
                拖拽文件或者 <em>点击上传</em>
                </div>
                <template #tip>
                <div class="el-upload__tip">
                </div>
                </template>
        </el-upload>
    </el-dialog>
</template>
<script>
export default {

    data() {
        return {
            visible: false,
            title: '上传',
            mode: '',
            //表单数据
            form: {
            },
            //验证规则
            rules: {
                genName: [
                    { required: true, message: '请输入数据库名称' }
                ],
                genHost: [
                    { required: true, message: '请输入访问地址' }
                ]
            }
        }
    },
    methods: {
        doSuccess(res){
            if(res.code === '00000') {
                this.$message.success('上传成功!');
                this.close();
                return;
            }
            this.$message.error(res.msg);
            this.$nextTick(() => {
                this.$refs.uploadRef.clearFiles();
            })
        },
        setData(data){
          Object.assign(this.form, data) ;
          if(data.type == 'data') {
            this.title = '上传数据';
          }
          if(data.type == 'driver') {
            this.title = '上传驱动';
          }
          return this;
        },
        //显示
        open(mode = 'add') {
            this.visible = true;
            return this
        },
        close() {
            this.isSaveing = false;
            this.visible = false;
            this.form = {};
        },
        //表单提交方法
        submit() {
        }
    }
}
</script>

