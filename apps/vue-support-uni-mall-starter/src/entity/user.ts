/** 用户实体（后端响应原始结构） */
export interface UserEntity {
  id: string;
  nickname: string;
  avatar?: string;
  phone?: string;
  email?: string;
  gender?: 0 | 1 | 2; // 0 未知 1 男 2 女
  birthday?: string;
  level?: number;
  points?: number;
  createdAt: string;
  updatedAt: string;
}

/** 登录响应实体 */
export interface LoginResultEntity {
  token: string;
  refreshToken?: string;
  expiresIn: number;
  user: UserEntity;
}

/** 统一后端响应包装 */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  success: boolean;
  timestamp?: number;
}
