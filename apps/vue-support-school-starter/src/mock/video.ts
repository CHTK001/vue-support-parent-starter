import type { VideoItem, VideoSyncItem } from '@/types/video';
import { MockMethod } from 'vite-plugin-mock';

const videoList: VideoItem[] = Array.from({ length: 20 }).map((_, index) => ({
  videoId: index + 1,
  videoName: `视频${index + 1}`,
  videoDescription: `这是视频${index + 1}的描述`,
  videoCover: `https://picsum.photos/300/200?random=${index}`,
  videoPath: `/path/to/video${index + 1}.mp4`,
  videoUrl: `https://example.com/video${index + 1}.mp4`,
  videoSize: Math.floor(Math.random() * 1000000),
  videoDuration: Math.floor(Math.random() * 3600),
  videoStatus: Math.floor(Math.random() * 2),
  videoType: ['mp4', 'avi', 'mkv'][Math.floor(Math.random() * 3)],
  videoTags: `标签${index + 1},标签${index + 2}`,
  createTime: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
  updateTime: new Date().toISOString(),
  createBy: 'admin',
  updateBy: 'admin'
}));

const videoSyncList: VideoSyncItem[] = Array.from({ length: 15 }).map((_, index) => ({
  syncId: index + 1,
  syncName: `同步任务${index + 1}`,
  syncUrl: `https://example.com/sync${index + 1}`,
  syncPath: `/path/to/sync${index + 1}`,
  syncStatus: Math.floor(Math.random() * 3),
  syncType: ['定时', '手动', '自动'][Math.floor(Math.random() * 3)],
  syncCron: '0 0 * * * ?',
  syncLastTime: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString(),
  syncNextTime: new Date(Date.now() + Math.floor(Math.random() * 86400000)).toISOString(),
  syncCount: Math.floor(Math.random() * 100),
  createTime: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
  updateTime: new Date().toISOString(),
  createBy: 'admin',
  updateBy: 'admin'
}));

export default [
  {
    url: '/api/video/list',
    method: 'get',
    response: (req: any) => {
      const { videoName, videoType, videoStatus, pageNum = 1, pageSize = 10 } = req.query;

      let results = [...videoList];
      
      if (videoName) {
        results = results.filter(item => item.videoName.includes(videoName));
      }
      
      if (videoType) {
        results = results.filter(item => item.videoType === videoType);
      }
      
      if (videoStatus !== undefined) {
        results = results.filter(item => item.videoStatus === parseInt(videoStatus));
      }
      
      const startIndex = (pageNum - 1) * pageSize;
      const endIndex = pageNum * pageSize;
      const pageData = results.slice(startIndex, endIndex);
      
      return {
        code: 200,
        message: '获取成功',
        data: {
          list: pageData,
          total: results.length,
          pageNum: parseInt(pageNum),
          pageSize: parseInt(pageSize)
        }
      };
    }
  },
  {
    url: '/api/video/:id',
    method: 'get',
    response: (req: any) => {
      const { id } = req.params;
      const video = videoList.find(item => item.videoId.toString() === id);
      
      if (video) {
        return {
          code: 200,
          message: '获取成功',
          data: video
        };
      }
      
      return {
        code: 404,
        message: '视频不存在',
        data: null
      };
    }
  },
  {
    url: '/api/video',
    method: 'post',
    response: (req: any) => {
      return {
        code: 200,
        message: '创建成功',
        data: {
          ...req.body,
          videoId: videoList.length + 1,
          createTime: new Date().toISOString(),
          updateTime: new Date().toISOString()
        }
      };
    }
  },
  {
    url: '/api/video',
    method: 'put',
    response: (req: any) => {
      return {
        code: 200,
        message: '更新成功',
        data: {
          ...req.body,
          updateTime: new Date().toISOString()
        }
      };
    }
  },
  {
    url: '/api/video/:id',
    method: 'delete',
    response: (req: any) => {
      return {
        code: 200,
        message: '删除成功',
        data: null
      };
    }
  },
  // 视频同步相关接口
  {
    url: '/api/video/sync/list',
    method: 'get',
    response: (req: any) => {
      const { syncName, syncType, syncStatus, pageNum = 1, pageSize = 10 } = req.query;

      let results = [...videoSyncList];
      
      if (syncName) {
        results = results.filter(item => item.syncName.includes(syncName));
      }
      
      if (syncType) {
        results = results.filter(item => item.syncType === syncType);
      }
      
      if (syncStatus !== undefined) {
        results = results.filter(item => item.syncStatus === parseInt(syncStatus));
      }
      
      const startIndex = (pageNum - 1) * pageSize;
      const endIndex = pageNum * pageSize;
      const pageData = results.slice(startIndex, endIndex);
      
      return {
        code: 200,
        message: '获取成功',
        data: {
          list: pageData,
          total: results.length,
          pageNum: parseInt(pageNum),
          pageSize: parseInt(pageSize)
        }
      };
    }
  },
  {
    url: '/api/video/sync/:id',
    method: 'get',
    response: (req: any) => {
      const { id } = req.params;
      const sync = videoSyncList.find(item => item.syncId.toString() === id);
      
      if (sync) {
        return {
          code: 200,
          message: '获取成功',
          data: sync
        };
      }
      
      return {
        code: 404,
        message: '同步任务不存在',
        data: null
      };
    }
  },
  {
    url: '/api/video/sync',
    method: 'post',
    response: (req: any) => {
      return {
        code: 200,
        message: '创建成功',
        data: {
          ...req.body,
          syncId: videoSyncList.length + 1,
          createTime: new Date().toISOString(),
          updateTime: new Date().toISOString()
        }
      };
    }
  },
  {
    url: '/api/video/sync',
    method: 'put',
    response: (req: any) => {
      return {
        code: 200,
        message: '更新成功',
        data: {
          ...req.body,
          updateTime: new Date().toISOString()
        }
      };
    }
  },
  {
    url: '/api/video/sync/:id',
    method: 'delete',
    response: (req: any) => {
      return {
        code: 200,
        message: '删除成功',
        data: null
      };
    }
  },
  {
    url: '/api/video/sync/:id/execute',
    method: 'post',
    response: (req: any) => {
      return {
        code: 200,
        message: '执行成功',
        data: {
          syncId: req.params.id,
          success: true,
          executeTime: new Date().toISOString(),
          executeResult: '同步任务执行成功'
        }
      };
    }
  }
] as MockMethod[]; 