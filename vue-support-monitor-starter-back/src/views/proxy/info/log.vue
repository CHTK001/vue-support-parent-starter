<template>
    <el-dialog :title="title" v-model="visible" :width="700" destroy-on-close @closed="$emit('closed')" draggable>


        <!-- <el-button type="danger" size="small" title="清除日志" icon="el-icon-delete" class="absolute" style="border: 0; right: 10px; top:50px " circle @click="data.length = 0"></el-button> -->
        <div style="max-height: 50vh; overflow-y: auto;">

            <div ref="containerRef" :style="{ 'height': height + 'px', 'overflow': 'auto' }" @keyup.native="keyEvent">
                <ul>
                    <li v-for="item in data">
                        <span v-html="'[' + form.proxyName + '] -> ' + item"></span>
                    </li>
                </ul>
                <el-empty v-if="!data || data.length == 0" class="h-full" />
            </div>
        </div>
    </el-dialog>
</template>
<script>
import  { inject } from "vue"

export default {
    data() {
        return {
            socket: inject('socket'),
            data: [],
            form: {},
            visible: false,
        }
    },
    beforeUnmount() {
        this.closeSocket();
    },
    created() {
      
    },
    methods: {
        open() {
            this.closeSocket();
            this.visible = true;
            return this;
        },
        setData(data) {
            Object.assign(this.form, data);
            this.title = data.proxyName;
            this.openSocket();
        },
     
        openSocket() {
            const _this = this;
            this.socket.on('log-' + this.form.proxyId, (msg) => {
                _this.data.push(msg);
                if (_this.data.length > 10000) {
                    _this.data.shift();
                }

                _this.$nextTick(() => {
                    let scrollEl = _this.$refs.containerRef;
                    scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' });
                });
            })

        },
        closeSocket() {
            this.socket.off('log-' + this.form.proxyId);
        },
    }
}
</script>