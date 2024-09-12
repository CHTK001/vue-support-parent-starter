<template>
    <Layout v-if="!destroy" @lastPosition="doLastPosition"  @edage="doEdage" @outEdage="doOutEdage" :id="id" :value="status" :initHeight="height" :initWidth="width" :width="width" :height="height" :x="xV" :y="yV" :draggable="draggable" :resizable="resizable" :title="title">
        <div id="el-id-4421-104" class="el-dialog1" >
            <dv-border-box10 backgroundColor="transparent" :animate="false">
                <header class="el-dialog__header show-close">
                    <dv-decoration7 style="width:150px;height:30px;">
                        <div color-white font-300>
                            {{ title }}
                        </div>
                        <tool class="el-dialog__headerbtn" :closeable="closeable" @min="doMin" @close="doClose"/>
                    </dv-decoration7>
                </header>
                <div id="el-id-4421-104" class="el-dialog__body" :style="{height: (height - 50) + 'px'}">
                    <slot></slot>
                </div>
            </dv-border-box10>
        </div>
    </Layout>
    <Layout v-show="!status" v-if="!destroy" @clickEvent="doClickEvent"  @lastPosition="doLastPosition"  @edage="doEdage" @outEdage="doOutEdage" :id="id" :value="value" :initHeight="minWidth" :initWidth="minWidth" :width="minWidth" :height="minWidth" :x="xV" :y="yV" :draggable="draggable" :resizable="resizable" :title="title">
        <div @click="doShow" id="min-dialog" class="absolute" style="opacity: 1;" :title="title">
            <el-button :style="{height: minWidth + 'px', width: minWidth + 'px'}" size="large" :icon="icon"></el-button>
        </div>
    </Layout>
</template>

<script>
import Layout from './layout.vue'
import Tool from './tool.vue'

export default {
    components: { Layout, Tool },
    name: "dialog",
    props: {
        id: {
            type: String,
            default: 'el-dialog'
        },
        value: {
            type: Boolean,
            default: false
        },
        destroy: {
            type: Boolean,
            default: true
        },
        title: {
            type: String,
            default: '标题'
        },
        closeable: {
            type: Boolean,
            default: true
        },
        resizable: {
            type: Boolean,
            default: false
        },
        minable: {
            type: Boolean,
            default: false
        },
        icon: {
            type: String,
            default: 'el-icon-edit'
        },
        width: {
            type: Number,
            default: 450
        },
        height: {
            type: Number,
            default: 280
        },
        draggable: {
            type: Boolean,
            default: true
        },
        x: {
            type: Number,
            default: 0
        },
        y: {
            type: Number,
            default: 0
        },
    },
    data() {
        return {
            minWidth: 40,
            status: this.value,
            xV: this.x,
            yV: this.y,
            lastX: this.x,
            lastY: this.y,
            destroy: false,
        };
    },
    watch:{
        value: function (val) {
            this.status = val;
            if(val) {
                this.destroy = false;
            }
        }
    },
    methods: {
        doMin(){
            this.xV = 0;
            this.status = false;
            return false;
        },
        doClose(){
            this.status = false;
            this.destroy = true
            this.$emit('status', false, this.id)
            return false;
        },
        doClickEvent(){
            if(!this.status) {
                this.doOutEdage();
                return false;
            }
            return false;
        },
        doLastPosition(x, y) {
            this.lastX = x;
            this.lastY = y;
            console.log(x+"," + y)
            return false;
        },
        doEdage(position, x, y) {
            this.xV = this.lastX;
            this.yV = this.lastY;
            this.status = false;
            return false;
        },
        doOutEdage() {
            this.xV = this.lastX;
            this.yV = this.lastY;
            this.status = true;
            return false;
        },
    }
};
</script>
<style scoped lang="less">
.vdr.active:before {
    outline: inherit !important;
}

.el-dialog__header {
    padding: 10px;
}
.el-dialog__body {
    padding: 20px;
    color: #606266;
    overflow: hidden;
}
.el-dialog__body>div {
    overflow: auto;
}

.el-dialog1 {
    height: 100%;
    background-color: white;
    border-radius: 2px;
    width: 100%;
    overflow: hidden;
    --el-dialog-box-shadow: 0px 12px 32px 4px rgba(0, 0, 0, 0.04),0px 8px 20px rgba(0, 0, 0, 0.08);
}
.is-draggable {
    margin: 0 !important;
    min-height: 200px;
    min-width: 200px;
    width: 100% !important;
}

.el-dialog {
    box-shadow: inherit;
}

.draggable {
    border-style: inherit !important;
}
.el-dialog__headerbtn {
    top: 0
}
.resizable {
    z-index: 10000;
}</style>
