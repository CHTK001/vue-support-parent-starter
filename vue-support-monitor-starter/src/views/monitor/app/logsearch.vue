<template>
    <el-dialog v-model="visiable" title="日志管理" width="80%" :close-on-click-modal="false" :close-on-press-escape="false" :destroy-on-close="true" @close="close">
        <template #header="{ close, titleId, titleClass }">
            <div class="my-header">
                <h4 :id="titleId" :class="titleClass">日志管理
                    <div class="absolute" style="left: 120px; top: 20px">
                        <el-form :inline="true" class="demo-form-inline">
                            <el-form-item>
                                <el-input v-model="keyword"  placeholder="输入检索条件" style="width: 300px"/>
                            </el-form-item>
                            <el-form-item>
                                <el-button type="primary" @click="doSearch" icon="el-icon-search" :loading="loading"></el-button>
                            </el-form-item>
                        </el-form>
                    </div>
                </h4>
            </div>
        </template>
        <div class="relative h-full">
            <div v-if="!loading" style="overflow: auto" class="infinite-list-wrapper">
                <div v-if="total > 0">
                    <ul v-infinite-scroll="load" class="infinite-list" style="overflow-anchor: none"  :infinite-scroll-disabled="disabled" :infinite-scroll-immediate="false" >
                        <li v-for="item in data" :key="i" class="infinite-list-item">
                            <span v-html="toHtml((item?.properties && item?.properties.length > 1) ? item?.properties[1] ?.text : '')"></span>
                        </li>
                    </ul>
                    <p v-if="loading" style="text-align: center; margin-top: 20px">加载中...</p>
                    <p v-if="noMore" style="text-align: center; margin-top: 20px">无更多数据</p>
                </div>
                <el-empty v-else></el-empty>
            </div>
            <el-skeleton animated v-else></el-skeleton>
        </div>
    </el-dialog>
</template>

<script>
import { default as AnsiUp } from 'ansi_up';
const ansi_up = new AnsiUp();
export default {

    data(){
        return {
            visiable: false,
            keyword: '*',
            form: {},
            disabled: false,
            total: 0,
            noMore: false,
            loading: false,
            data: null,
            offset: 0,
            current: 0,
        }
    },
    mounted() {

    },
    methods: {
        toHtml(vl){
            return ansi_up.ansi_to_html(vl).replaceAll('\n', '<br/>');
        },
        load(){
            setTimeout(() => {
                if(this.current >= this.total) {
                    this.noMore = true;
                    this.disabled = true;
                    return;
                }
                this.$API.monitor.logSearch.get({
                    id: this.form.serverHost,
                    serverHost: this.form.serverHost,
                    serverPort: this.form.serverPort,
                    keyword: this.keyword,
                    appName: this.form.appName,
                    type: 'LOG',
                    offset: this.offset + this.current,
                    count: 20,
                }).then(res => {
                    if(res.code == '00000') {
                        (res.data?.documents ||[]).forEach(it => this.data.push(it));
                        this.current = this.data.length;
                        this.total = res.data.total;
                    }
                }).finally(() => {
                    this.loading = false;
                })
            }, 500);
        },
        doSearch(){
            setTimeout(() => {
                this.data = null;
                this.loading = true;
                this.$API.monitor.logSearch.get({
                    id: this.form.serverHost,
                    serverHost: this.form.serverHost,
                    serverPort: this.form.serverPort,
                    keyword: this.keyword,
                    appName: this.form.appName,
                    type: 'LOG',
                    offset: this.offset,
                    count: 30,
                }).then(res => {
                    if(res.code == '00000') {
                        this.data = res.data?.documents;
                        this.current = this.data.length;
                        this.total = res.data.total;
                    }
                }).finally(() => {
                    this.loading = false;
                })
            }, 500);
           
        },
        open(item) {
            this.visiable = true;
            Object.assign(this.form, item);
            window.addEventListener('keydown', this.handleEvent)
         },
        close() {
            this.visiable = false;
            this.form = {};
            this.data.length = 0;
            window.removeEventListener('keydown', this.handleEvent)

        },
        async handleEvent(event) {
            switch (event.keyCode) {
                case 13:
                    this.doSearch();
                    break
            }
        }
    }
}

</script>

<style scoped>
.infinite-list-wrapper {
  height: 600px;
}
.infinite-list-wrapper .list {
  padding: 0;
  margin: 0;
  list-style: none;
}

.infinite-list-wrapper .list-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px;
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}
.infinite-list-wrapper .list-item + .list-item {
  margin-top: 10px;
}
</style>