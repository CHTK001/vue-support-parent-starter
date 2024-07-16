<template>
    <el-dialog v-model="editDialogStatus" :close-on-click-modal="false" :destroy-on-close="true" height="80%" width="80%" draggable :title="title">
        <el-container>
            <el-main>
                <div ref="containerRef" style="height: 100%; overflow: auto;" @keyup.native="keyEvent">
                    <ul>
                        <li v-for="(item,index) in data">
                            <el-card>
                                <el-tag >{{ data[index]['action'] }}</el-tag>
                                <sc-code-editor :options="options" :read-only="true" v-model="data[index]['message']" mode="sql"></sc-code-editor>
                            </el-card>
                        </li>
                    </ul>

                    <el-empty v-if="!data || data.length == 0" />

                </div>

                <el-button type="primary" icon="el-icon-delete"
                    style="position: fixed; right: 0; top: 50%; width: 40px; height: 40px;" @click="data.length = 0"></el-button>

            </el-main>
        </el-container>
    </el-dialog>
</template>
<script>
import { format } from 'sql-formatter'
import  { inject, defineAsyncComponent } from "vue"

const scCodeEditor = defineAsyncComponent(() => import('@/components/scCodeEditor/index.vue'));

import { default as AnsiUp } from 'ansi_up';
const ansi_up = new AnsiUp();
export default {
    name: 'consoleLog',
    components:{scCodeEditor},
    data() {
        return {
            editDialogStatus: false,
            form: {},
            input: '',
            showFile: 0,
            title: '',
            data: [],
            socket: inject('socket'),
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
        this.closeSocket();
    },
    created() {
        this.openSocket();
    },
    methods: {
        open(row) {
            this.form = row;
            this.editDialogStatus = true;
            this.title = row.genName + '日志';
            return this;
        },
        openSocket() {
            const _this = this;
            this.socket.on('log-gen-' + this.form.genId, (data) => {
                const value = data;
                data = value;
                data.data =  ansi_up.ansi_to_html(data.data)
                    .replaceAll('\n', '<br/>')
                    .replaceAll('color:rgb(0,0,187)', 'color: rgb(96 215 59)')
                    .replaceAll('color:rgb(187,0,0)', 'color: rgb(255 154 154)')
                ;
                _this.data.push(data);
                if (_this.data.length > 10000) {
                    _this.data.shift();
                }

                _this.$nextTick(() => {
                    let scrollEl = _this.$refs.containerRef;
                    scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' });
                });
            })
        },
        closeSocket(){
            this.socket.off('log-gen-' + this.form.genId)
        },
    }

}
</script>