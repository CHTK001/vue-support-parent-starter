<template>
    <div ref="containerRef" style="height: 100%; overflow: auto;" @keyup.native="keyEvent">
        <ul>
            <li v-for="item in data">
                <span v-html="item"></span>
            </li>
        </ul>

        <el-empty v-if="!data || data.length == 0" />

    </div>

    <el-button type="primary" icon="el-icon-search" style="position: fixed; right: 0; top: 50%; width: 40px; height: 40px;" @click="showFile = !0"></el-button>

    <el-dialog draggable v-model="showFile" >
        <el-input ref="input" v-model="input" placeholder="搜索" size="large" clearable prefix-icon="el-icon-search"
        @keyup.enter="enterQuery" 
			:trigger-on-focus="false" />
    </el-dialog>
</template>

<script>
import { ref, reactive, onMounted, onUpdated } from 'vue'
import { default as AnsiUp } from 'ansi_up';
const ansi_up = new AnsiUp();
export default {
    name: 'UniformLog',
    data() {
        return {
            input: '',
            showFile: 0,
            data: []
        }
    },
    updated() {
        this.$refs.containerRef.scrollTop = this.$refs.containerRef.scrollHeight
    },
    mounted() {
        this.subscribe('log');
    },
    created(){
        var _this=this;
        document.onkeydown=function(e){
            let key= window.event.keyCode;
            if(key== 113){
                _this.showFile = !0;
                _this.input = '';
                _this.nextTick(() => {
                    _this.$refs.input.focus();
                })
            }
        }
    },
    methods: {
        enterQuery() {
            this.$API.config.search.get({
                keyword: this.input,
            }).then(res => {
                if(res.code === '00000') {
                    this.data.length = 0;
                    this.data = res.data.map(it => ansi_up.ansi_to_html(it?.message));
                    this.showFile = 0;
                }
            })
        },
        subscribe: function (mode) {
            const _this = this;
            var ansi_up = new AnsiUp();
            const eventSource = new EventSource(this.$API.config.uniform.url + mode);
            eventSource.addEventListener("log", (event) => {
                const data = JSON.parse(event.data);
                this.data.push(ansi_up.ansi_to_html(data.message));
                if(this.data.length > 10000) {
                    this.data.shift();
                }
            });
            eventSource.onerror = function (event) {
            };
            eventSource.onopen = function (event) {
                _this.$notify.success({ title: '提示', dangerouslyUseHTMLString: true, message: '订阅成功' })
            };
        },
    }
}
</script>