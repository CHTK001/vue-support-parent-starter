import { createClient, rootHttp } from '@/framework/context';
import type { ApiContext } from "./api-context";
import type { UploadResponse } from "@/types/service";

/**
 * /api/** 管理接口客户端：不解包，返回值与后端统一响应体 {code,data,msg} 一致。
 *
 * <p>后端 {@code ApiFsController} 的路径是 {@code /api/fs/**}（**不带 /v2 前缀**），
 * 必须走 rootHttp。用 {@code this.client}（v2Http，baseURL 带 /v2）会拼成
 * {@code /v2/api/fs/upload} → 后端 404「资源不存在」（2026-11-13 实测：
 * 会话附件发出去后助手没收到文件就是这个原因）。</p>
 */
const rawApi = createClient(rootHttp, { unwrap: false });

export interface FileUploadApi {
  uploadAvatar(uid: string, file: File, type?: "character" | "session"): Promise<UploadResponse>;
  uploadUserAvatar(file: File): Promise<UploadResponse>;
  uploadWallpaper(file: File): Promise<UploadResponse>;
  deleteWallpaper(): Promise<{ success: boolean }>;
  uploadFile(sessionId: string, file: File): Promise<UploadResponse>;
}

export const fileUploadApi: FileUploadApi = {
  async uploadAvatar(this: ApiContext, uid: string, file: File, type: "character" | "session" = "character") {
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const url = type === "character" ? "characters" : "sessions";
      return await this.client.post(`/${url}/${uid}/avatars`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } catch (error) {
      console.error("上传错误:", error);
      throw error;
    }
  },

  async uploadUserAvatar(this: ApiContext, file: File) {
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      return await this.client.post("/user/avatars", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } catch (error) {
      console.error("上传错误:", error);
      throw error;
    }
  },

  async uploadWallpaper(this: ApiContext, file: File) {
    const formData = new FormData();
    formData.append("wallpaper", file);

    try {
      return await this.client.post("/user/wallpaper", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } catch (error) {
      console.error("壁纸上传错误:", error);
      throw error;
    }
  },

  async deleteWallpaper(this: ApiContext) {
    try {
      return await this.client.delete("/user/wallpaper");
    } catch (error) {
      console.error("壁纸删除错误:", error);
      throw error;
    }
  },

  async uploadFile(this: ApiContext, sessionId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file, file.name);
    formData.append("conversation_id", sessionId);

    try {
      // 必须用 rawApi（rootHttp）：后端路径是 /api/fs/upload，不带 /v2 前缀。
      // 用 this.client（v2Http）会拼成 /v2/api/fs/upload → 404。
      const body = await rawApi.post(
        `/api/fs/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      // 后端 ApiResult<String>：data 是落盘后的绝对路径（不是 {id,url} 对象）。
      // 调用方（useMessageOperations）把返回值展开进文件对象、并读 result.id 收集
      // fileIds，故这里把路径同时映射成 id/url，文件名与大小用本地 File 补齐。
      const raw = (body as any)?.data ?? body;
      const path = typeof raw === "string" ? raw : String(raw ?? "");
      return {
        id: path,
        url: path,
        name: file.name,
        size: file.size,
        type: file.type,
      } as UploadResponse;
    } catch (error) {
      console.error("上传错误:", error);
      throw error;
    }
  },
};
