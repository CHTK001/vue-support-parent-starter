<template>
    <div :id="pid">
        <div :class="minCustom" v-if="!show" :style="minStyle" :id="miniId"  @dblclick="minClick"  @click.stop="minMouseover">
        </div>

        <VueDragResize v-show="show" :parentW="parentW" :parentH="parentH" :id="id" :parentLimitation="true"
            class="drag-dialog " :isActive="active" :style="style" :isResizable="resizable" :minw="250" :minh="410"
            :w="width" :h="height" @dragging="resize" @dragstop="dragstop" v-on:resizing="resize">
            <div class="popup-window popup-window-fixed popup-fiex popup-fiex-column">
                <div class="popup-window-bar popup-fiex popup-fiex-row">
                    <div class="popup-window-bar-title popup-flex-center popup-fiex popup-fiex-row">
                        <div class="title-icon popup-flex-center popup-fiex ">
                        </div>
                        <div class="title-message popup-flex-center popup-fiex-column popup-fiex">
                            <label class="title-message-label">sdsadsdsd</label>
                        </div>
                    </div>
                    <div class="popup-window-bar-handler popup-flex"></div>
                    <div class="popup-window-bar-tools popup-fiex popup-flex-center popup-fiex-row">
                        <el-button icon="el-icon-minus"
                            class="popup-icon tools-min popup-tools  popup-fiex popup-fiex-column popup-flex-center"></el-button>
                        <el-button icon="el-icon-close"
                            class="popup-icon tools-close popup-tools popup-fiex popup-fiex-column popup-flex-center"></el-button>
                    </div>
                </div>
                <div class="popup-window-content popup-flex">
                    {{ left }} x {{ top }}
                    <br />
                    {{ width }} x {{ height }}
                    <br />
                    {{ parentW }} x {{ parentH }}
                </div>
            </div>
        </VueDragResize>
    </div>
</template>
<script>
import sysConfig from "@/config"
import VueDragResize from 'vue-drag-resize/src'

export default {
    name: "Drag",
    components: {
        VueDragResize
    },
    props: {
        w: { type: Number, default: 250 },
        h: { type: Number, default: 410 },
        resizable: { type: Boolean, default: true },
        active: { type: Boolean, default: true },
    },
    data() {
        return {
            postion: '',
            width: this.w,
            height: this.h,
            show: true,
            top: 0,
            parentW: 0,
            parentH: 0,
            changeW: 0,
            changeH: 0,
            left: 0,
            changeRect: {},
            node: undefined,
            pnode: undefined,
            nodeMini: undefined,
            style: {},
            id: undefined,
            miniId: undefined,
            minStyle: {},
            minCustom: '',
            minLeft: ' popup-salver-button-left-1 popup-salver-right salver-right-active active',
            minRight: ' popup-salver-button-right-1 popup-salver-left salver-left-active active',
            minTop: ' popup-salver-button-top-1 popup-salver-bottom salver-bottom-active active',
            minBottom: ' popup-salver-button-bottom-1 popup-salver-top salver-top-active active',
            minClass: 'popup-fiex popup-fiex-column popup-fiex-mini popup-flex-center '
        }
    },
    mounted() {
        const ids = this.uuid();
        this.miniId = 'Mini' + ids;
        this.id = 'dialog' + ids;
        this.pid =  ids;
        this.minCustom = this.minClass;
        const _this = this;
        _this.resizeLimit();
        this.$nextTick(() => {
            this.nodeMini = document.getElementById(this.miniId);
            this.node = document.getElementById(this.id);
            this.pnode = document.getElementById(this.pid);
            if (this.pnode) {
                document.body.appendChild(this.pnode);
            }
            // if (this.nodeMini) {
            //     document.body.appendChild(this.nodeMini);
            // }
            this.changeRect = this.node.getBoundingClientRect()
        });
        window.addEventListener('resize', (e) => {
            _this.resizeLimit();
            //  _this.resetOffset();
        })
    },
    methods: {
        minClick(e) {
            this.show = !this.show
        },
        minMouseover(e) {
            if (this.postion == 'left') {
                this.minCustom = this.minClass + ' popup-salver-right popup-salver-button-left inactive';
            }
            if (this.postion == 'right') {
                if(this.minCustom.indexOf(" active") > -1) {
                    const rect = document.getElementById(this.miniId).getBoundingClientRect();
                    this.minStyle = { left: rect.left - 40 + 'px', top: rect.top }
                }
                this.minCustom = this.minClass + ' popup-salver-left popup-salver-button-right inactive';
            }
            if (this.postion == 'top') {
                this.minCustom = this.minClass + ' popup-salver-bottom popup-salver-button-top inactive';
            }
            if (this.postion == 'bottom') {
                if(this.minCustom.indexOf(" active") > -1) {
                    const rect = document.getElementById(this.miniId).getBoundingClientRect();
                    this.minStyle = { left: rect.left, top: rect.top - 40 + 'px' }
                }
                this.minCustom = this.minClass + ' popup-salver-top popup-salver-button-bottom inactive';
            }
        },
        minMouseout(e) {
            if (this.postion == 'left') {
                this.minCustom = this.minClass + this.minLeft;
            }
            if (this.postion == 'right') {
                this.minCustom = this.minClass + this.minRight;
            }
            if (this.postion == 'top') {
                this.minCustom = this.minClass + this.minTop;
            }
            if (this.postion == 'bottom') {
                this.minCustom = this.minClass + this.minBottom;
            }
        },
        resetOffset() {
            const rect = this.node.getBoundingClientRect();
            this.resetX(rect.x);
        },
        resetY(y) {
            if (y > this.parentH / 2) {
                this.$refs.vueDrag.$el.style.bottom = y + this.changeH;
                return;
            }
        },
        resetX(x) {
            if (x > this.parentW / 2) {
                this.style.left = x + this.changeW - this.width + 'px';
                return;
            }
        },
        resizeLimit() {
            this.parentW = (document.documentElement.clientWidth || document.body.clientWidth);
            this.parentH = (document.documentElement.clientHeight || document.body.clientHeight);
        },
        resize(newRect) {
            this.width = newRect.width;
            this.height = newRect.height;
            this.top = newRect.top;
            this.left = newRect.left;
        },
        dragstop(rect) {
            this.postion = '';
            if (this.left === 0) {
                this.postion = 'left';
                this.show = false;
                this.minStyle = { left: 0, top: rect.top + 'px' }
                this.minCustom = this.minClass + '' + this.minLeft;
                return !1;
            }
            if (this.top === 0) {
                this.postion = 'top';
                this.show = false;
                this.minStyle = { left: rect.left + 'px', top: 0 }
                this.minCustom = this.minClass + '' + this.minTop;
                return !1;
            }

            if (this.left + this.width === this.parentW) {
                this.postion = 'right';
                this.show = false;
                this.minStyle = { left: this.parentW - 15 + 'px', top: rect.top + 'px' }
                this.minCustom = this.minClass + '' + this.minRight;
                return !1;
            }

            if (this.top + this.height === this.parentH) {
                this.postion = 'bottom';
                this.show = false;
                this.minStyle = { left: rect.left + 'px', top: this.parentH - 5 + 'px' }
                this.minCustom = this.minClass + '' + this.minBottom;
                return !1;
            }
            this.show = true;
        },
        uuid: function () {
            var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
            var uuid = [],
                i, len = 12;
            let radix = chars.length;

            if (len) {
                for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
            } else {
                var r;
                uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
                uuid[14] = '4';
                for (i = 0; i < 36; i++) {
                    if (!uuid[i]) {
                        r = 0 | Math.random() * 16;
                        uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
                    }
                }
            }

            return uuid.join('');
        }
    }
}
</script>
<style  lang="scss" scope>
.popup-salver-bar {
    position: fixed;
    bottom: 0;
    height: 50px;
    width: 100%;
}

.popup-fiex {
    display: flex;
    display: -webkit-flex;
    display: -ms-flexbox;
}

.popup-fiex-mini {
    position: absolute;
    background: white;
}

.title-message>.title-message-label {
    display: inline-block;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    max-width: 100%;
    word-wrap: break-word;
    line-height: normal;
}

.title-message {
    min-width: 0;
    line-height: 0;
}

.popup-fiex-column {
    flex-flow: column;
    -ms-flex-flow: column;
    -webkit-flex-flow: column;
}

.popup-fiex-row {
    flex-flow: row;
    -ms-flex-flow: row;
    -webkit-flex-flow: row;
}

.popup-window {
    z-index: 20200420;
    min-width: 250px;
    min-height: 410px;
}

body {
    z-index: 0
}

.popup-window>.popup-window-bar {
    height: 30px;
    background: rgb(255, 255, 255);
    border-radius: 10px;
}

.popup-flex {
    flex: 1;
    -ms-flex: 1;
    -webkit-flex: 1;
}

.popup-flex-center {
    text-align: center;
    justify-content: center;
    -webkit-justify-content: center;
    -ms-justify-content: center;
    align-content: center;
    -ms-align-content: center;
    -webkit-align-content: center;
}

.popup-window-bar-handler {
    cursor: move;
}

.popup-salver-bar .popup-icon,
.popup-window-bar-tools .popup-icon,
.popup-window-bar-title .popup-icon {
    height: inherit !important;
    border: inherit !important;
}

.popup-icon {
    width: 50px;
    height: 50px;
    padding: 12px 0 !important;
    vertical-align: -.15em;
    fill: currentColor;
    border: 1px solid #cccccc;
    overflow: hidden;
    font-size: 14px;
    display: inline-block;
    line-height: normal;
}

.title-message-label {
    display: inline-block;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    max-width: 100%;
    word-wrap: break-word;
    line-height: normal;
}

label {
    margin-bottom: 0 !important;
}

.popup-tools:hover {
    cursor: pointer;
    background-color: #e5e5e5;
    z-index: 2000;
}

.popup-salver-button {
    width: 50px;
    height: 50px;
    background-color: #f5f5f5;
    position: relative;
    overflow: hidden;
}

.popup-salver-button-down {
    -webkit-animation-name: popup-salver-button-down;
    animation-name: popup-salver-button-down;
    -webkit-animation-duration: .3s;
    animation-duration: .3s;
    -webkit-animation-fill-mode: both;
    animation-fill-mode: both;
}

.popup-salver-button-up {
    -webkit-animation-name: popup-salver-button-up;
    animation-name: popup-salver-button-up;
    -webkit-animation-duration: .3s;
    animation-duration: .3s;
    -webkit-animation-fill-mode: both;
    animation-fill-mode: both;
}

.popup-salver-button-left {
    -webkit-animation-name: popup-salver-button-left;
    animation-name: popup-salver-button-left;
    -webkit-animation-duration: .3s;
    animation-duration: .3s;
    -webkit-animation-fill-mode: both;
    animation-fill-mode: both;
}

.popup-salver-button-left-1 {
    -webkit-animation-name: popup-salver-button-left-1;
    animation-name: popup-salver-button-left-1;
    -webkit-animation-duration: .3s;
    animation-duration: .3s;
    -webkit-animation-fill-mode: both;
    animation-fill-mode: both;
}

.popup-salver-button-right {
    -webkit-animation-name: popup-salver-button-right;
    animation-name: popup-salver-button-right;
    -webkit-animation-duration: .3s;
    animation-duration: .3s;
    -webkit-animation-fill-mode: both;
    animation-fill-mode: both;
}

.popup-salver-button-right-1 {
    -webkit-animation-name: popup-salver-button-right-1;
    animation-name: popup-salver-button-right-1;
    -webkit-animation-duration: .3s;
    animation-duration: .3s;
    -webkit-animation-fill-mode: both;
    animation-fill-mode: both;
}

.popup-salver-button-bottom {
    -webkit-animation-name: popup-salver-button-bottom;
    animation-name: popup-salver-button-bottom;
    -webkit-animation-duration: .3s;
    animation-duration: .3s;
    -webkit-animation-fill-mode: both;
    animation-fill-mode: both;
}

.popup-salver-button-bottom-1 {
    -webkit-animation-name: popup-salver-button-bottom-1;
    animation-name: popup-salver-button-bottom-1;
    -webkit-animation-duration: .3s;
    animation-duration: .3s;
    -webkit-animation-fill-mode: both;
    animation-fill-mode: both;
}

.popup-salver-button-top {
    -webkit-animation-name: popup-salver-button-top;
    animation-name: popup-salver-button-top;
    -webkit-animation-duration: .3s;
    animation-duration: .3s;
    -webkit-animation-fill-mode: both;
    animation-fill-mode: both;
}

.popup-salver-button-top-1 {
    -webkit-animation-name: popup-salver-button-top-1;
    animation-name: popup-salver-button-top-1;
    -webkit-animation-duration: .3s;
    animation-duration: .3s;
    -webkit-animation-fill-mode: both;
    animation-fill-mode: both;
}

.popup-salver-button::after {
    position: absolute;
    content: "";
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
}

.popup-window-action {
    z-index: 20200421;
}

.popup-salver-button {
    border-top: 3px solid #d6e4ec;
}

.popup-salver-right,
.popup-salver-top,
.popup-salver-bottom,
.popup-salver-left {
    width: 50px;
    height: 50px;
    box-shadow: 1px 1px 3px 1px #CCC;
    border-radius: 5px;
    position: absolute;
}

.popup-salver-top {
    border-top: 10px solid #d6e4ec;
}

.popup-salver-bottom {
    border-bottom: 10px solid #d6e4ec;
}

.popup-salver-left {
    border-left: 10px solid #d6e4ec;
}

.popup-salver-right {
    border-right: 10px solid #d6e4ec;
}

.salver-button-active {
    border-top: 10px solid #3baced;
}

.salver-top-active {
    border-top: 10px solid #3baced;
}

.salver-bottom-active {
    border-bottom: 10px solid #3baced;
}

.salver-left-active {
    border-left: 10px solid #3baced;
}

.salver-right-active {
    border-right: 10px solid #3baced;

}

.salver-button-active>svg {
    color: #3baced;
    border-radius: 5px;
}

.popup-window-shadow {
    position: absolute;
    left: 0;
    top: 0;
}

@-webkit-keyframes popup-salver-button-up {
    0% {
        bottom: -40px;
    }

    to {
        bottom: 0;
    }
}

@keyframes popup-salver-button-up {
    0% {
        bottom: -40px;
    }

    to {
        bottom: 0;
    }
}

@-webkit-keyframes popup-salver-button-left {
    0% {
        left: -40px;
    }

    to {
        left: 0;
    }
}

@keyframes popup-salver-button-left {
    0% {
        left: -40px;
    }

    to {
        left: 0;
    }
}

@-webkit-keyframes popup-salver-button-left-1 {
    0% {
        left: 0;
    }

    to {
        left: -40px;
    }
}

@keyframes popup-salver-button-left-1 {
    0% {
        left: 0;
    }

    to {
        left: -40px;
    }
}



@-webkit-keyframes popup-salver-button-right {
    0% {
        right: -40px;
    }

    to {
        right: 0;
    }
}

@keyframes popup-salver-button-right {
    0% {
        right: -40px;
    }

    to {
        right: 0;
    }
}

@-webkit-keyframes popup-salver-button-right-1 {
    0% {
        right: 0;
    }

    to {
        right: -40px;
    }
}

@keyframes popup-salver-button-right-1 {
    0% {
        right: 0;
    }

    to {
        right: -40px;
    }
}

@-webkit-keyframes popup-salver-button-down {
    0% {
        bottom: 0
    }

    to {
        bottom: -40px
    }
}

@keyframes popup-salver-button-down {
    0% {
        bottom: 0
    }

    to {
        bottom: -40px
    }
}


@-webkit-keyframes popup-salver-button-right {
    0% {
        bottom: 0
    }

    to {
        right: -40px
    }
}

@keyframes popup-salver-button-right {
    0% {
        bottom: 0
    }

    to {
        bottom: -40px
    }
}



@-webkit-keyframes popup-salver-button-top {
    0% {
        top: -40px;
    }

    to {
        top: 0;
    }
}

@keyframes popup-salver-button-top {
    0% {
        top: -40px;
    }

    to {
        top: 0;
    }
}

@-webkit-keyframes popup-salver-button-top-1 {
    0% {
        top: 0;
    }

    to {
        top: -40px;
    }
}

@keyframes popup-salver-button-top-1 {
    0% {
        top: 0;
    }

    to {
        top: -40px;
    }
}



@-webkit-keyframes popup-salver-button-bottom {
    0% {
        bottom: -40px;
    }

    to {
        bottom: 0;
    }
}

@keyframes popup-salver-button-bottom {
    0% {
        bottom: -40px;
    }

    to {
        bottom: 0;
    }
}

@-webkit-keyframes popup-salver-button-bottom-1 {
    0% {
        bottom: 0;
    }

    to {
        bottom: -40px;
    }
}

@keyframes popup-salver-button-bottom-1 {
    0% {
        bottom: 0;
    }

    to {
        bottom: -40px;
    }
}

.popup-window-content {
    background: white;
}
</style>