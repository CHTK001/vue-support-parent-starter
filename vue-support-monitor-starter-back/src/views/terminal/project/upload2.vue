<template>
    <el-dialog v-model="visiable" :before-close="distroy" draggable :title="title" :close-on-click-modal="false" :close-on-press-escape="false">
        <el-progress :percentage="percentage[item]?.p || 0" :stroke-width="15" striped striped-flow style="margin-top: 10px"
            v-for="item in Object.keys(percentage)">
            <span>{{ percentage[item]?.p.toFixed(1) }}% {{ item }}</span>
        </el-progress>

        <template #footer>
            <el-button @click="distroy">取 消</el-button>
        </template>
    </el-dialog>

</template>

<script>
import { inject, markRaw, ref } from 'vue'

export default {

    data() {
        return {
            event: 'terminal-upload-' + new Date().getTime(),
            isUpload: false,
            visiable: false,
            dialogVisible: false,
            form: {},
            imageUrl: '',
            dialogImageUrl: '',
            title: '',
            socket: inject('socket'),
            fileList: [],
            percentage: {},
            uploadFile: undefined,
        }
    },
    methods: {
        distroy() {
            if (!this.isUpload && this.fileList.length == 0) {
                this.percentage = {};
                this.closeSocket();
                this.visiable = !1;
                return;
            }
        },
        open() {
            this.visiable = !0;
            return this;
        },
        doSubmit() {
            if (this.fileList.length == 0) {
                this.$message.error('请选择上传文件');
                return;
            }

            this.isUpload = !0;
            this.$API.project.uploadFile.post({ id: this.form.terminalProjectId, event: this.event, file: this.fileList[0].raw }).then(res => {
                if (res.code != '00000') {
                    this.$message.error(res.msg);
                    return;
                }
                this.$emit('success', res);
            })
        },
        handleChange(file, fileList) {
            this.fileList = fileList;
            // 你可以在这里处理文件，例如上传到服务器
        },
        handleRemove(file, fileList) {
            this.fileList = fileList;
            // 如果需要，你可以在这里处理文件移除逻辑
        },
        progress(d) {
            debugger
        },
        handlePictureCardPreview(uploadFile) {
            this.dialogImageUrl = uploadFile.url
            this.dialogVisible = true
        },
        setData(data, files) {
            this.title = '[' + data.terminalProjectName + '] 上传'
            this.fileList.length = 0;
            for(var i = 0; i < files.length; i ++) {
                this.fileList.push({raw: files[i]})
            }
            Object.assign(this.form, data);
            this.afterProperties();
        },

        afterProperties() {
            this.event = "terminal-upload-" + this.form.terminalProjectId;
            this.openSocket();
            this.doSubmit();

        },
        openSocket() {
            const _this = this;
            this.socket.on(this.event, (it) => {
                if(it?.progressEventType == 'FINISH') {
                    this.isUpload = false;
                    this.fileList.length = 0;
                    this.$message.success('上传成功');
                    return;
                }
                this.percentage[it?.fileName] = { p: (it?.bytesTransferred || 1) / (it?.total || 1) * 100, n: it?.fileName };
            })
        },
        closeSocket() {
            if (!this.socket) {
                return;
            }
            this.socket.off(this.event);
        }
    }


}
</script>
<style scoped lang="less">
:deep(.el-upload-dragger) {
    height: 100%;
}

:deep(.el-upload-dragger .el-icon) {
    top: 42%;
}

.avatar-uploader .avatar {
    width: 178px;
    height: 178px;
    display: block;
}
</style>

<style>
.avatar-uploader .el-upload {
    border: 1px dashed var(--el-border-color);
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
    border-color: var(--el-color-primary);
}

.el-icon.avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 178px;
    height: 178px;
    text-align: center;
}
</style>