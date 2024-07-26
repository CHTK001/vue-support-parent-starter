<template>
    <div>
        <el-row>
            <el-col :span="4" style="margin-top: 10px;padding-left: 4px;padding-right: 4px;" v-for="row in data">
                <div  @click="doDetail(row)" :class="(row.directory == true ? 'folder' : '' ) + ' item overflow-hidden  relative max-w-sm mx-auto bg-white shadow-lg ring-1 ring-black/5 rounded-xl flex items-center gap-6 dark:bg-slate-800 dark:highlight-white/5'">
                    <img class="absolute -left-4 w-24 h-24 rounded-full shadow-lg" :src="getIcon(row.suffix)">
                    <div class="flex flex-col py-5 pl-24">
                        <strong class=" text-slate-900 text-sm font-medium dark:text-slate-200" v-time="parseInt(row.userMetadata.lastModified)"></strong>
                        <span :title="row.filename" class="truncate width-100 text-ellipsis text-slate-500 text-sm font-medium dark:text-slate-400">{{ row.filename }}</span>
                    </div>
                    <span v-if="row.suffix" :title="$TOOL.sizeFormat(row.fileSize)" class="truncate width-50 overflow-hidden text-ellipsis text-slate-500 text-sm font-medium dark:text-slate-400">
                        {{ row.fileSize == 0 ? '0KB' : $TOOL.sizeFormat(row.fileSize) }}
                    </span>
                </div>
            </el-col>
        </el-row>
    </div>
</template>
<script>
import { getQueryString, getAssetsImages, getQueryPathString } from '@/utils/Utils';
export default {
    props: {
        data: {
            type: Array,
            default: () => {
                return []
            }
        },
        parentPath: {
            type: String,
            default: ''
        }
    },
    watch: {
        data: {
            handler(val) {
                this.data = val;
            },
            deep: true
        }
    },
    methods: {
        getPath(path) {
            return this.$TOOL.normalizePath(path);
        },
        doDetail(row) {
            if (row.directory != true) {
                this.$emit('preview', row.absolutePath, row);
                return;
            }
            this.$emit('search', row.absolutePath);
        },
        getIcon(name) {
            return getAssetsImages(!name ? 'folder' : name);
        }
    }
}
</script>
<style scoped lang="less">
:deep(.el-card__body) {
    padding: 6px !important;
}

.icon {
    width: 20px;
    height: 20px;
    margin-right: 5px;
    position: relative;
    top: 4px;
}

.title {
    cursor: default;
}

.text {
    color: blue;
    line-height: 16px;
    font-size: 16px;
}

.width-50 {
    width: 50px;
}
.width-100 {
    width: 100px;
}
.folder {
    cursor: pointer;
}
.item {
    cursor: pointer;
}
</style>