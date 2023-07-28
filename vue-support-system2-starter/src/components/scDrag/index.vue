<template>
    <div>
        <VueDragResize class="drag-dialog " :isActive="true"  :isResizable="true" :w="200" :h="200" v-on:resizing="resize"
            v-on:dragging="resize">
            <header class="drag-header">
                <span class="drag-title">这是Title</span>
                <button class="dialog-header-btn" icon="el-icon-close"></button>
            </header>
            <div class="dialog-body">
                <h3>Hello World!</h3>
                <p>{{ top }} х {{ left }} </p>
                <p>{{ width }} х {{ height }}</p>
            </div>
            <footer class="dialog-foot">
                <el-button>取消</el-button>
                <el-button type="primary">确定</el-button>
            </footer>
        </VueDragResize>
    </div>
</template>
<script>
import sysConfig from "@/config"

export default {
    name: "Drag",
    data() {
        return {
            width: 200,
            height: 200,
            top: 0,
            left: 0
        }
    },

    methods: {
        resize(newRect) {
            this.width = newRect.width;
            this.height = newRect.height;
            this.top = newRect.top;
            this.left = newRect.left;
        }
    }
}
</script>
<style  lang="scss" scope>
.drag-dialog {
    display: block;
    position: relative;
    z-index: 20230728;
    cursor: default;
    background: bisque;
    // background: var(--el-dialog-bg-color);
    border-radius: var(--el-dialog-border-radius);
    box-shadow: var(--el-dialog-box-shadow);
}

.drag-header {
    padding: var(--el-dialog-padding-primary);
    padding-bottom: 10px;
    margin-right: 16px;
}

.drag-title {
    line-height: var(--el-dialog-font-line-height);
    font-size: var(--el-dialog-title-font-size);
    color: var(--el-text-color-primary);
}

.dialog-header-btn {
    position: absolute;
    top: 6px;
    right: 0;
    padding: 0;
    width: 54px;
    height: 54px;
    background: 0 0;
    border: none;
    outline: 0;
    cursor: pointer;
    font-size: var(--el-message-close-size, 16px);
}

.dialog-body {
    padding: calc(var(--el-dialog-padding-primary) + 10px) var(--el-dialog-padding-primary);
    color: var(--el-text-color-regular);
    font-size: var(--el-dialog-content-font-size);
}

.dialog-foot {
    padding: var(--el-dialog-padding-primary);
    padding-top: 10px;
    text-align: right;
    box-sizing: border-box;
}</style>