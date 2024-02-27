<template>
    <el-dialog v-if="showStatus" v-model="dialogStatus" width="60%" style="height: 700px" scrolling="no" draggable title="数据库文档" :destroy-on-close="true" :close-on-click-modal="false">
        <template #header="{ close, titleId, titleClass }">
            <span style="    font-size: 18px; font-weight: 800; }">数据库文档</span>
             <el-button plain text :loading="isLoadDatabase" icon="el-icon-refresh" @click="doRefreshDatabase">刷新</el-button>
             <el-button plain text :loading="isLoadDatabaseDownload" icon="el-icon-download" @click="doDownload('MD')">下载MD</el-button>
             <el-button plain text :loading="isLoadDatabaseDownload" icon="el-icon-download" @click="doDownload('DOC')">下载DOC</el-button>
        </template>
        <div class="input-box-iframe">
            <el-skeleton :animated="true" :loading="isLoadDatabase" :rows="10">
                <iframe :src="src" frameborder="0" height="600px" width="100%" style="overflow: hidden" id="bdIframe"></iframe>
            </el-skeleton>
        </div>
    </el-dialog>
    <div v-else  style="background: white; height: 100%; overflow: hidden">
        <el-button plain text :loading="isLoadDatabase" icon="el-icon-refresh" @click="doRefreshDatabase">刷新</el-button>
        <el-button plain text :loading="isLoadDatabaseDownload" icon="el-icon-download" @click="doDownload('MD')">下载MD</el-button>
        <el-button plain text :loading="isLoadDatabaseDownload" icon="el-icon-download" @click="doDownload('DOC')">下载DOC</el-button>
        <div class="input-box-iframe" >
            <el-skeleton :animated="true" :loading="isLoadDatabase" :rows="10">
                <iframe :src="src" frameborder="0" style="min-height: 700px; overflow: hidden" height="100%" width="100%" id="bdIframe"></iframe>
            </el-skeleton>
        </div>
    </div>
</template>
<script>

import config from "@/config"

export default {
    name: 'Home',
    components: {},
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
        this.form.genId = this.$route.params.genId;
        if (!this.form.genId || this.form.genId === 'null') {
            delete this.form.genId;
        }
        if(this.form.genId) {
            this.showStatus = false;
            this.src = this.$API.gen.session.previewDoc.url + `?genId=${this.form.genId}`
        }
    },
    methods: {
        // 方法
        open(data) {
            this.showStatus = true;
            this.dialogStatus = true;
            this.isLoadDatabase = false
            Object.assign(this.form, data);
            this.src = this.$API.gen.session.previewDoc.url + `?genId=${this.form.genId}`
        },
        doRefreshDatabase() {
            this.isLoadDatabase = true;
            this.$API.gen.session.syncDoc.post(this.form).then(res => {
                if(res.code == '00000') {
                    this.$message.success('同步成功');
                    return;
                }
                this.$message.error(res.msg);
            }).finally(() => this.isLoadDatabase = false);
        },
        doDownload(type) {
            const fileUrl = this.$API.gen.session.downloadDoc.url + `?genId=${this.form.genId}&type=${type}` 
            window.open(fileUrl);
        }
    }
}
</script>
<style lang="less" scoped>
:deep(.el-dialog__body) {
    padding: 0px;
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