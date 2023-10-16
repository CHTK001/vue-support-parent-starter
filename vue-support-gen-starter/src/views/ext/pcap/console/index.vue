<template>
    <el-container>
        <el-main>
            <div class="code-toolbar" >
				<el-button plain text v-if="eventStatus" :loading="isOpen" icon="sc-icon-end" @click="doStop">暂停</el-button>
				<el-button plain text v-else :loading="isOpen" icon="sc-icon-start" @click="doStart">启动</el-button>
				<el-button plain text icon="el-icon-delete" @click="data.length = 0">清除</el-button>
				<el-button plain text >
                    <el-input ref="input" v-model="input" placeholder="搜索" clearable prefix-icon="el-icon-search" @keyup.enter="enterQuery" 
                    :trigger-on-focus="false" />
                </el-button>
			</div>
            <div ref="containerRef" style="height: 91%; overflow: auto;" @keyup.native="keyEvent">
                <el-tree :data="data" :props="defaultProps" @node-click="handleNodeClick" class="custom-tree">
                    <template #default="{ node, data }">
                        <span class="custom-tree-node" :title="data.message" v-if="data.message">
                            <el-tag v-if="data.type === 'TCP'" style="margin-top: -5px; margin-right: 20px">{{ data.type }}</el-tag>
                            <el-tag type="success" v-else-if="data.type === 'HTTP'" style="margin-top: -5px; margin-right: 20px">{{ data.type }}</el-tag>
                            <span>{{ data.message }}</span>
                            <el-button text plain icon="el-icon-edit" style="margin-top: -5px"></el-button>
                        </span>
                    </template>
                </el-tree>
            </div>

        </el-main>
    </el-container>
</template>
<script>
import { format } from 'sql-formatter'
import { defineAsyncComponent } from 'vue';

const scCodeEditor = defineAsyncComponent(() => import('@/components/scCodeEditor/index.vue'));

import {EventSourcePolyfill } from "event-source-polyfill"
import { default as AnsiUp } from 'ansi_up';
const ansi_up = new AnsiUp();
export default {
    name: 'consoleLog',
    components:{scCodeEditor},
    data() {
        return {
            form: {},
            input: '',
            showFile: 0,
            data: [],
            isOpen: false,
            eventStatus: false,
            defaultProps: {
                children: 'children',
                label: 'message',
            },
            backupConfig: {},
            eventSource: null,
            options: {
				hintOptions: { // 自定义提示选项
					completeSingle: false,
					tables: {
						users: ['name', 'score', 'birthDate'],
						countries: ['name', 'population', 'size'],
						score: ['zooao']
					}
				}
			},
        }
    },
    beforeUnmount() {
       this.doStop();
    },
    mounted(){
        this.form.tabId = this.$route.params.tabId;
        this.form.genId = this.$route.params.genId;
        if(!this.form.tabId || this.form.tabId === 'null'|| this.form.tabId === 'undefined') {
            delete  this.form.tabId;
        }
        if(!this.form.genId || this.form.genId === 'null') {
            delete  this.form.genId;
        }
        this.initialBackupConfig();
    },
    methods: {
        enterQuery() {
            this.backupConfig.backupFilter = this.input;
            this.$API.gen.backup.update.put(this.backupConfig).then(res => {
                if (res.code == '00000') {
                    return;
                }
                this.$message.error(res.msg);
            }).finally(() => this.isSave = false);
        },
        async initialBackupConfig() {
            await this.$API.gen.backup.info.get(this.form).then(res => {
                if (res.code == '00000') {
                    this.mode = 'edit';
                    this.title = '编辑备份配置';
                    if(!res.data) {
                        this.title = '新增备份配置';
                        this.mode = 'add';
                        return;
                    }
                    this.backupConfig = res.data;
                    return;
                }
                this.$message.error(res.msg);
            });
        },
        doStop() {
            if (!!this.eventSource) {
                try {
                    this.eventSource.close();
                    this.eventSource = null;
                    this.eventStatus = false;
                } catch (e) { }
            }
        },
        doStart() {
            this.subscribe(!!this.form.tabId ? "TABLE" : "DATABASE");
        },
        formatSql(sql) {
            return format(sql);
        },
        subscribe: function (mode) {
            const _this = this;
            var ansi_up = new AnsiUp();
            this.doStop();

            this.eventSource = new EventSourcePolyfill(this.$API.gen.table.subscribe.url + this.form.genId + "/" + mode);
            this.eventStatus = true;
            this.eventSource.addEventListener(this.form.genId, (event) => {
                const data = JSON.parse(event.data);
                const json = JSON.parse(data.message);
                const message = JSON.parse(json.message);
                if (this.data.length > 50) {
                    this.data.shift();
                }

                this.data.push(message);
                this.$nextTick(() => {
                    let scrollEl = this.$refs.containerRef;
                    scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' });
                });
            });
            this.eventSource.onerror = function (event) {
            };
            this.eventSource.onopen = function (event) {
                _this.$notify.success({ title: '提示', dangerouslyUseHTMLString: true, message: '订阅成功' })
            };
        },
    }

}
</script>

<style lang="less" scoped>
:deep(.el-tree-node) {
	border-top: 1px solid #f1eaea;
	;
	border-bottom: 1px solid #f1eaea;
	;
	box-shadow: 0px 2px 3px 0px #f1eaea;
}

:deep(.el-tree) {
	width: 100%;
	overflow: scroll;
}

:deep(.el-tree>.el-tree-node) {
	display: inline-block;
	min-width: 100%;
}

.custom-tree-node {
	font-size: 12px;
	line-height: 20px;
	height: 20px;
    white-space:nowrap;/*强制单行显示*/
    text-overflow:ellipsis;/*超出部分省略号表示*/
    overflow:hidden;/*超出部分隐藏*/
    width: 100%;/*设置显示的最大宽度*/
}

.custom-icon {
	position: relative;
	top: 3px;
}

.custom-content {
	padding-left: 3px;
}
.custom-tree {
    height: 100%;
    box-shadow: 3px 3px 7px 2px #ccc;
    border-radius: 5px; 
    background: white;
    padding: 0 !important;
    margin: 0 !important;
}
.code-toolbar {
    box-shadow: 3px 3px 7px 2px #ccc;
    border-radius: 5px; 
    background: white;
	height: 38px;
	margin-top: 5px;
    padding-top: 3px;
    padding-bottom: 10px;
	margin-bottom: 15px;
}

.message {
	white-space: pre;
}
:deep(.el-tree-node__content) {
    background: white;
    box-shadow: 0px 3px 5px 0px #ccc;
    height: inherit !important;
    padding: 5px;
}

:deep(.el-tree-node .is-focusable) {
    margin-bottom: 6px;
    margin: 8px;
}

:deep(.el-tag),
span {
    font-size: 14px;
    white-space: normal;
    word-break: break-all;
    height: 100%;
}

.header-detail {
    padding: 5px;
    margin-left: 12px;
}
</style>