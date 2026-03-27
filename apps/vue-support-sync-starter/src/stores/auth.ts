import { defineStore } from "pinia";
import { ref } from "vue";
import { authApi, type LoginRequest, type UserInfo } from "../api/auth";
import { isApiSuccess } from "../api/sync";

export const useAuthStore = defineStore("auth", () => {
  const userInfo = ref<UserInfo | null>(null);
  const isAuthenticated = ref(false);

  const login = async (data: LoginRequest) => {
    const res = await authApi.login(data);
    if (isApiSuccess(res.code)) {
      sessionStorage.setItem("authenticated", "true");
      if (data.rememberMe) {
        localStorage.setItem("rememberMe", "true");
      }
      isAuthenticated.value = true;
      userInfo.value = { username: res.data.username };
      return true;
    }
    return false;
  };

  const logout = async () => {
    await authApi.logout();
    sessionStorage.removeItem("authenticated");
    localStorage.removeItem("rememberMe");
    isAuthenticated.value = false;
    userInfo.value = null;
  };

  const checkAuth = () => {
    const authMode = import.meta.env.VITE_AUTH_MODE || "embedded";
    if (authMode === "none") {
      isAuthenticated.value = true;
      return true;
    }
    const authenticated = sessionStorage.getItem("authenticated") === "true";
    isAuthenticated.value = authenticated;
    return authenticated;
  };

  return {
    userInfo,
    isAuthenticated,
    login,
    logout,
    checkAuth,
  };
});
