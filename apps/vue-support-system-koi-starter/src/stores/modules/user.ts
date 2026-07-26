import { defineStore } from "pinia";

const userStore = defineStore("user", {
  state: () => ({
    token: "",
    userName: "",
    avatar: "",
    roles: [] as string[],
    permissions: [] as string[]
  }),
  actions: {
    setToken(token: string) { this.token = token; },
    setUserName(name: string) { this.userName = name; },
    setAvatar(url: string) { this.avatar = url; },
    setRoles(roles: string[]) { this.roles = roles; },
    setPermissions(permissions: string[]) { this.permissions = permissions; },
    reset() {
      this.token = "";
      this.userName = "";
      this.avatar = "";
      this.roles = [];
      this.permissions = [];
    }
  }
});

export default userStore;