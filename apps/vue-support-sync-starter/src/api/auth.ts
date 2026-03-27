import api from "./sync";

export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  token: string;
  username: string;
}

export interface UserInfo {
  username: string;
}

export const authApi = {
  login: (data: LoginRequest) => api.post<any, any>("/auth/login", data),
  logout: () => api.post<any, any>("/auth/logout"),
  getUserInfo: () => api.get<any, any>("/auth/info"),
};
