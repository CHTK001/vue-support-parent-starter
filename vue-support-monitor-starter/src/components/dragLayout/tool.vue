<template>
    <div class="relative" style="margin-top: 16px; padding: 2px;height: 20px">
        <el-icon style="margin-right: 8px" v-if="minable" @click="doMin"><component is="el-icon-minus"></component></el-icon>
        <el-icon v-if="closeable" @click="doClose"><component is="el-icon-close"></component></el-icon>
    </div>
</template>

<script>

export default {

    props: {
        closeable: {
            type: Boolean,
            default: true
        },
        minable: {
            type: Boolean,
            default: false
        },
    },
    methods: {
        doClose() {
            this.$emit('close')
        },
        doMin() {
            this.$emit('min')
        }
    }
}
</script>
<style scoped>
.el-button.is-text:not(.is-disabled):focus, .el-button.is-text:not(.is-disabled):hover {
    background-color: inherit !important;
}
</style>