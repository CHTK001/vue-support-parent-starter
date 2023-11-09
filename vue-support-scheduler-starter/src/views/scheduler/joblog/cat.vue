<template>
    <div class="container" ref="containerRef">
        <el-skeleton :animated="true" :loading="loadingStatus">
            <el-empty description="暂无日志" v-if="!returnResult"></el-empty>
            <div v-else>
                <highlightjs language="yaml" :autodetect="false" :code="returnResult.logContent.replaceAll('<br>', '\r\n')" style="
                    overflow-y: auto;
                    height: 600px;
                    font-size: 14px;
                    font-family:  Microsoft YaHei, Consolas, Monaco, Menlo, Consolas, 'Courier New', monospace;
                    "></highlightjs>
            </div>

            <el-button style="position: fixed; right: 0; top: 20%" icon="el-icon-refresh" type="primary" @click="initial"></el-button>
        </el-skeleton>

    </div>

</template>

<script>
import { default as AnsiUp } from 'ansi_up';
const ansi_up = new AnsiUp();
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-light.css';
export default {
    data() {
        return {
            form: {},
            loadingStatus: false,
            returnResult: {
                logContent: ''
            }
        }
    },
    updated() {
        this.$refs.containerRef.scrollTop = this.$refs.containerRef.scrollHeight
    },
    mounted: function () {
        this.form.logId = ~~this.$route.params.logId;
        this.initial();
    },
    methods: {
        initial() {
            // this.loadingStatus = true;
            // this.$API.scheduler.logDetailCat.get({
            //     logId: this.form.logId,
            //     fromLineNum: 0
            // }).then(res => {
            //     if (res.code === '00000' && res?.data.code == 200) {
            //         this.returnResult = res.data.content;
            //          this.$nextTick(() => {
                //         let scrollEl = this.$refs.containerRef;
                //         scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' });
                //     });
            //         return !1;
            //     }
            //     this.$message.error(res?.data?.msg);
            // }).finally(() => this.loadingStatus = false);
            this.returnResult = {
                "fromLineNum": 0,
                "toLineNum": 6,
                "logContent": "2023-11-09 09:33:30 [com.xxl.job.core.thread.JobThread#run]-[133]-[xxl-job, JobThread-5-1699490445106] <br>----------- xxl-job job execute start -----------<br>----------- Param:null\n2023-11-09 09:33:30 [com.chua.starter.scheduler.client.support.JobLogService#info]-[50]-[xxl-job, JobThread-5-1699490445106] [INFO ]启动定时检测策略任务\n2023-11-09 09:33:30 [com.chua.starter.scheduler.client.support.JobLogService#info]-[50]-[xxl-job, JobThread-5-1699490445106] [INFO ]开始获取未完成任务\n2023-11-09 09:33:30 [com.chua.starter.scheduler.client.support.JobLogService#info]-[50]-[xxl-job, JobThread-5-1699490445106] [INFO ]定时检测策略任务完成\n2023-11-09 09:33:30 [com.xxl.job.core.thread.JobThread#run]-[179]-[xxl-job, JobThread-5-1699490445106] <br>----------- xxl-job job execute end(finish) -----------<br>----------- Result: handleCode=200, handleMsg = null\n2023-11-09 09:33:30 [com.xxl.job.core.thread.TriggerCallbackThread#callbackLog]-[197]-[xxl-job, executor TriggerCallbackThread] <br>----------- xxl-job job callback finish.\n",
                "end": false
            }
        }
    }
}

</script>