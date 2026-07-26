import request from "@/utils/request";

export interface LoginData {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
}

export function loginApi(data: LoginData) {
  return request.post<any, LoginResult>("/login", data);
}

export function getUserInfo() {
  return request.get<any, any>("/getInfo");
}

export function logout() {
  return request.post("/logout");
}