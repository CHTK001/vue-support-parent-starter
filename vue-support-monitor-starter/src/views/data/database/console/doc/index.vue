<template>
    <div style="">
        <div class="relative" style="top: -30px">
            <el-button plain text :loading="isLoadDatabase" icon="el-icon-refresh" @click="doRefreshDatabase">刷新</el-button>
            <el-button plain text :loading="isLoadDatabaseDownload" icon="el-icon-download" @click="doDownload('MD')">下载MD</el-button>
            <el-button plain text :loading="isLoadDatabaseDownload" icon="el-icon-download" @click="doDownload('DOC')">下载DOC</el-button>
        </div>
        <div class="input-box-iframe">
            <el-skeleton :animated="true" :loading="isLoadDatabase" :rows="10">
                <div class="iframe-view">
                    <iframe class="iframe-view" :src="src" frameborder="0" style="height: 100%; overflow: hidden;" height="100%" :width="width" id="bdIframe"></iframe>
                </div>
            </el-skeleton>
        </div>
    </div>
</template>
<script>

import config from "@/config"

export default {
    name: 'Home',
    components: {},
    props: {
        data: { type: Object, default: () => ({}) },
        width: { type: String, default: "100%" },
    },
    data() {
        return {
            // 数据
            dialogStatus: false,
            showStatus: true,
            isLoadDatabase: false,
            isLoadDatabaseDownload: false,
            form: {},
            src: null,
        }
    },
    mounted() {
        Object.assign(this.form, this.data);
        if (this.form.genId) {
            this.showStatus = false;
            this.src = this.$API.gen.database.previewDoc.url + `?genId=${this.form.genId}`
        }
    },
    methods: {
        // 方法
        open(data) {
            this.showStatus = true;
            this.dialogStatus = true;
            this.isLoadDatabase = false
            Object.assign(this.form, data);
            this.src = this.$API.gen.database.previewDoc.url + `?genId=${this.form.genId}`
        },
        doRefreshDatabase() {
            this.isLoadDatabase = true;
            this.$API.gen.database.syncDoc.get(this.form).then(res => {
                if (res.code == '00000') {
                    this.$message.success('同步成功');
                    return;
                }
                this.$message.error(res.msg);
            }).finally(() => this.isLoadDatabase = false);
        },
        doDownload(type) {
            const fileUrl = this.$API.gen.database.downloadDoc.url + `?genId=${this.form.genId}&type=${type}`
            window.open(fileUrl);
        }
    }
}
</script>
<style lang="less" scoped>
.iframe-view,
.input-box-iframe {
    height: 100%;
}
iframe::-webkit-scrollbar {
    width: 5px;
    height: 5px;
}

.iframe-view {
    &::-webkit-scrollbar {
        width: 5px;
        height: 5px;
    }

    &::-webkit-scrollbar-thumb {
        background-color: rgba(50, 50, 50, 0.3);
    }

    &::-webkit-scrollbar-thumb:hover {
        background-color: rgba(50, 50, 50, 0.6);
    }

    &::-webkit-scrollbar-track {
        background-color: rgba(50, 50, 50, 0.1);
    }

    &::-webkit-scrollbar-track:hover {
        background-color: rgba(50, 50, 50, 0.2);
    }
}

:deep(.el-dialog__body) {
    padding: 0px;
    height: calc(100% - 60px) !important;

}

#bdIframe::-webkit-scrollbar {
    width: 12px;
    height: 12px;
}

#bdIframe::-webkit-scrollbar-button {
    width: 0px;
    height: 0px;
    display: none;
}

#bdIframe::-webkit-scrollbar-corner {
    background-color: transparent;
}

#bdIframe::-webkit-scrollbar-thumb {
    border: 4px solid rgba(0, 0, 0, 0);
    height: 6px;
    border-radius: 25px;
    background-clip: padding-box;
    background-color: rgba(0, 0, 0, 0.30);
}
</style>