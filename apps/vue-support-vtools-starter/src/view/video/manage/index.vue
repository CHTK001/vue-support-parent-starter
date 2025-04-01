<template>
  <div class="video-manage-container relative">
    <div class="header-actions">
      <div class="flex-1"></div>
      <div class="flex items-center gap-2">
        <el-input v-model="queryParams.keyword" placeholder="请输入视频标题/名称" class="search-input" @keyup.enter="handleSearch" clearable>
          <template #append>
            <el-button @click="handleSearch">
              <IconifyIconOnline icon="ep:search" />
            </el-button>
          </template>
        </el-input>
        <el-select v-model="queryParams.videoType" placeholder="选择类型" clearable @change="handleSearch">
          <el-option label="全部" value="" />
          <el-option label="电影" value="电影" />
          <el-option label="电视剧" value="电视剧" />
          <el-option label="动漫" value="动漫" />
          <el-option label="综艺" value="综艺" />
          <el-option label="纪录片" value="纪录片" />
        </el-select>
        <el-button type="primary" @click="handleAdd">
          <IconifyIconOnline icon="ep:plus" />
        </el-button>
        <el-button @click="handleRefresh">
          <IconifyIconOnline icon="ep:refresh" />
        </el-button>
      </div>
    </div>

    <div class="table-container relative h-[calc(100vh-200px)]">
      <ScTable ref="tableRef" layout="card" :url="getVideoList" :params="queryParams" row-key="videoId" v-loading="loading" class="h-full">
        <template #card="{ row }">
          <div class="video-card">
            <div class="video-cover">
              <el-image v-if="row.videoCover" :src="row.videoCover" :preview-src-list="[row.videoCover]" fit="cover" />
              <div v-else class="no-cover">暂无封面</div>
            </div>
            <div class="video-info">
              <div class="video-header">
                <h3 class="video-title">{{ row.videoTitle }}</h3>
                <div class="video-score" v-if="row.videoScore">
                  <el-rate v-model="row.videoScore" disabled text-color="#ff9900" :max="10" />
                  <span class="score-value">{{ row.videoScore }}</span>
                </div>
              </div>
              <div class="video-meta">
                <el-tag size="small" class="type-tag">{{ row.videoType || "未分类" }}</el-tag>
                <el-tag :type="row.videoStatus === 0 ? 'success' : 'info'" size="small">
                  {{ row.videoStatus === 0 ? "启用" : "禁用" }}
                </el-tag>
                <span class="year-tag" v-if="row.videoYear">{{ row.videoYear }}年</span>
              </div>
              <div class="video-details">
                <span v-if="row.videoDirector">导演: {{ row.videoDirector }}</span>
                <span v-if="row.videoDistrict">地区: {{ row.videoDistrict }}</span>
                <span v-if="row.videoDuration">时长: {{ row.videoDuration }}分钟</span>
              </div>
              <div class="video-time">发布时间: {{ formatDateTime(row.createTime) }}</div>
              <div class="video-actions">
                <el-button type="primary" size="small" @click="handleEdit(row)">
                  <IconifyIconOnline icon="ep:edit" />
                </el-button>
                <el-button type="info" size="small" @click="handleView(row)">
                  <IconifyIconOnline icon="ep:view" />
                </el-button>
                <el-popconfirm title="确定要删除该视频吗?" @confirm="handleDelete(row)">
                  <template #reference>
                    <el-button type="danger" size="small">
                      <IconifyIconOnline icon="ep:delete" />
                    </el-button>
                  </template>
                </el-popconfirm>
              </div>
            </div>
          </div>
        </template>
      </ScTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { message } from "@repo/utils";
import { getVideoList, deleteVideo } from "@/api/video";
import { formatDateTime } from "@repo/utils";

// 根据Java实体类定义的视频类型
interface VideoItem {
  videoId: number;
  videoTitle: string;
  videoName: string;
  videoAliasName?: string;
  videoScore?: number;
  videoYear?: number | string;
  videoPlatform?: string;
  videoLanguage?: string;
  videoQuality?: string;
  videoThumbnail?: string;
  videoCover: string;
  videoUrl: string;
  videoViews?: number;
  videoLikes?: number;
  videoStatus: number;
  videoDuration?: number;
  videoDouBanId?: string;
  videoPublishDate?: string;
  videoType: string;
  videoRelease?: string;
  videoDistrict?: string;
  videoSize?: string;
  videoAuthor?: string;
  videoDirector?: string;
  videoWriter?: string;
  videoActor?: string;
  videoDescription?: string;
  createTime: string;
  updateTime: string;
}

const router = useRouter();
const tableRef = ref();
const loading = ref(false);

const queryParams = reactive({
  keyword: "",
  videoType: "",
  pageNum: 1,
  pageSize: 10,
});

// 刷新
const handleRefresh = () => {
  queryParams.keyword = "";
  queryParams.videoType = "";
  if (tableRef.value) {
    tableRef.value.refresh();
  }
};

// 搜索
const handleSearch = () => {
  if (tableRef.value) {
    tableRef.value.refresh();
  }
};

// 新增视频
const handleAdd = () => {
  router.push("/video/manage/edit");
};

// 编辑视频
const handleEdit = (record: VideoItem) => {
  router.push(`/video/manage/edit?id=${record.videoId}`);
};

// 查看视频
const handleView = (record: VideoItem) => {
  router.push(`/video/manage/detail?id=${record.videoId}`);
};

// 删除视频
const handleDelete = async (record: VideoItem) => {
  loading.value = true;
  try {
    const res = await deleteVideo(record.videoId);
    if (res.data && res.data.code === 0) {
      message("删除成功", { type: "success" });
      if (tableRef.value) {
        tableRef.value.refresh();
      }
    } else {
      message(res.data?.message || "删除失败", { type: "error" });
    }
  } catch (error) {
    console.error("删除视频出错:", error);
    message("删除失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.video-manage-container {
  padding: 24px;
  background-color: #fff;
  border-radius: 4px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header-actions {
  margin-bottom: 24px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex-shrink: 0;
}

.table-container {
  flex: 1;
  overflow: hidden;
}

.search-input {
  width: 250px;
}

.video-card {
  display: flex;
  width: 100%;
  height: 160px;
  border-radius: 8px;
  background-color: #f8f9fa;
  overflow: hidden;
  transition: all 0.3s;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.video-card:hover {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.video-cover {
  width: 220px;
  height: 160px;
  overflow: hidden;
}

.video-cover .el-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-cover {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e0e0e0;
  color: #909399;
  font-size: 14px;
}

.video-info {
  flex: 1;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.video-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.video-title {
  margin: 0 0 10px 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.video-score {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: 12px;
}

.score-value {
  margin-left: 8px;
  color: #ff9900;
  font-weight: bold;
}

.video-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}

.type-tag {
  background-color: #e6f7ff;
  color: #1890ff;
  border: none;
}

.year-tag {
  color: #606266;
  font-size: 12px;
}

.video-details {
  display: flex;
  gap: 16px;
  color: #606266;
  font-size: 13px;
  margin-bottom: 8px;
}

.video-time {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.video-actions {
  display: flex;
  gap: 8px;
}
</style>
