<template>
    <div>
        <el-row>
            <el-col :span="4" style="margin-top: 10px;padding-left: 4px;padding-right: 4px;" v-for="row in data" class="relative">
                <img  @click="doDetail(row)" class="absolute z-10 top-2 left-1 w-16 h-16 rounded-full shadow-lg" :src="getIcon(row.suffix)">
                <div  @click="doDetail(row)"  :class="(row.directory == true ? 'folder' : '' ) + ' item overflow-hidden  relative max-w-sm mx-auto bg-white shadow-lg ring-1 ring-black/5 rounded-xl flex items-center gap-6 dark:bg-slate-800 dark:highlight-white/5'">
                    <div class="flex flex-col py-5 pl-24">
                        <strong v-if="row.userMetadata.lastModified" class=" text-slate-900 text-sm font-medium dark:text-slate-200" v-time="parseInt(row.userMetadata.lastModified)"></strong>
                        <span :title="row.filename" class="truncate width-100 text-ellipsis text-slate-500 text-sm font-medium dark:text-slate-400">{{ row.filename }}</span>
                    </div>
                    <span v-if="row.suffix" :title="$TOOL.sizeFormat(row.fileSize)" class="truncate width-50 overflow-hidden text-ellipsis text-slate-500 text-sm font-medium dark:text-slate-400">
                        {{ row.fileSize == 0 ? '0KB' : $TOOL.sizeFormat(row.fileSize) }}
                    </span>
                </div>
                <span v-if="canPreview && !row.directory" class="absolute cursor-pointer" @click="doCopy(row)" style="bottom: 0; right: 25px">
                    <el-icon>
                        <component is="el-icon-copy-document" />
                    </el-icon>
                </span>
                <span v-if="canDownload && !row.directory" class="absolute cursor-pointer" @click="doDownload(row)" style="bottom: 0; right: 10px">
                    <el-icon>
                        <component is="sc-icon-download" />
                    </el-icon>
                </span>
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
        menu: {
            type: Array,
            default: () => {
                return []
            }
        },
        parentPath: {
            type: String,
            default: ''
        },
        canPreview: {
            type: Boolean,
            default: false
        },
        canDownload: {
            type: Boolean,
            default: false
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
        doCopy(row) {
            if (row.directory == true) {
                return;
            }
            if(this.canPreview) {
                this.$emit('copy', row.absolutePath, row);
            }
        },
        doDownload(row){
            if (row.directory == true) {
                return;
            }
            if(this.canDownload) {
                this.$emit('download', row.absolutePath, row);
            }
        },
        doDetail(row) {
            if (row.directory != true) {
                if(this.canPreview) {
                    this.$emit('preview', row.absolutePath, row);
                }
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