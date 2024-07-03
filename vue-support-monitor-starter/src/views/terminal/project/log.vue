<template>
    <el-dialog :title="title" width="80%" v-model="visiable" top="10px" :close-on-click-modal="false"
        :destroy-on-close="true" draggable @close="distroy">
    <template #header="{ close, titleId, titleClass }">
            <div class="my-header">
                <h4 :id="titleId" :class="titleClass">{{ title }}
                    <span>
                        <el-icon @click="afterPropertiesSet">
                            <component is="el-icon-refresh" />
                        </el-icon>
                    </span>
                </h4>
            </div>
        </template>
        <div ref="containerRef" :style="{ 'height': height + 'px', 'overflow': 'auto' }" >
            <ul>
                <li v-for="item in data">
                    <span v-html="item"></span>
                </li>
            </ul>
            <el-empty v-if="!data || data.length == 0" class="h-full" />
        </div>

    </el-dialog>
</template>

<script>
import { inject, markRaw, ref } from 'vue'
import { default as AnsiUp } from 'ansi_up';
const ansi_up = new AnsiUp();
export default {

    data() {
        return {
            height: 700,
            visiable: false,
            data: [],
            form: {},
            socket: inject('socket'),
            event: 'terminal-project-' + new Date().getTime()
        }
    },
    updated() {
        this.$refs.containerRef.scrollTop = this.$refs.containerRef.scrollHeight
    },
    unmounted() {
        this.distroy();

    },

    beforeDestroy() {
        this.distroy()
    },
    beforeUnmount() {
        this.distroy();
    },
    methods: {
        open() {
            return this;
        },
        setData(item) {
            Object.assign(this.form, item);
            this.title = "[" + this.form.terminalProjectName + ']日志'
            this.afterPropertiesSet();
            this.visiable = true;
            this.openSocket();
            window.addEventListener('keydown', this.handleEvent)
        },
        async handleEvent(event) {
            switch (event.keyCode) {
                case 37:
                    console.log('ctrl + ←')
                    break
                case 38:
                    console.log('ctrl + ↑')
                    break
                case 39:
                    console.log('ctrl + →')
                    break
                case 40:
                    console.log('ctrl + ↓')
                    break
                case 67:
                    console.log('ctrl + c')
                    this.$API.project.logpause.get({ id: this.form.terminalProjectId, event: this.event }).then(res => {})
                    break
                case 83:
                    console.log('ctrl + s')
                    event.preventDefault()
                    event.returnValue = false // 阻止直接保存网页
                    // eslint-disable-next-line no-prototype-builtins
                    if (event.ctrlKey && event.code === 'KeyS') {
                        // 在这里写保存需要执行的逻辑
                        this.$API.project.logstart.get({ id: this.form.terminalProjectId, event: this.event }).then(res => {})
                    }
                    if (event.ctrlKey && event.code === 'KeyS') return false
                    break
                case 86:
                    console.log('ctrl + v')
                    break
                case 89:
                    console.log('ctrl + y')
                    if (event.ctrlKey && event.code === 'KeyY') {
                        this.$router.go(+1)
                    }
                    break
                case 90:
                    if (this.$route.path === '登录成功重定向的路由，比如控制台：/dashboard') return // 防止退出项目
                    if (event.ctrlKey && event.code === 'KeyZ') {
                        this.$router.go(-1)
                    }
                    break
            }
        },
        distroy() {
            window.removeEventListener('keydown', this.handleEvent) // 在页面销毁的时候记得解除
            this.closeSocket();
            if (this.form.terminalProjectLog) {
                this.$API.project.logstop.get({ id: this.form.terminalProjectId, event: this.event }).then(res => {
                    if (res.code != '00000') {
                        this.$message.error(res.msg);
                    }
                })
            }
            this.data.length = 0;
            this.visiable = false;
            this.form = {};
        },
        afterPropertiesSet() {
            if (!this.form.terminalProjectLog) {
                return;
            }
            this.$API.project.logstart.get({ id: this.form.terminalProjectId, event: this.event }).then(res => {
                if (res.code != '00000') {
                    this.$message.error(res.msg);
                }
            })
        },
        openSocket() {
            const _this = this;
            this.socket.on(this.event, (it) => {
                if (this.data.length > 10000) {
                    this.data.shift();
                }

                this.data.push(ansi_up.ansi_to_html(it).replaceAll('\n', '<br/>')
                    .replaceAll('color:rgb(0,0,187)', 'color: rgb(96 215 59)')
                    .replaceAll('color:rgb(187,0,0)', 'color: rgb(255 154 154)'));

                _this.$nextTick(() => {
                    let scrollEl = _this.$refs.containerRef;
                    scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' });
                });
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