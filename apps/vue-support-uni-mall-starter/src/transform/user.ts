import type { UserEntity } from "../entity/user";

export interface UserView {
  id: string;
  nickname: string;
  avatar: string;
  phone: string;
  genderLabel: string;
  level: number;
  points: number;
}

const genderMap: Record<number, string> = {
  0: "未设置",
  1: "男",
  2: "女",
};

const DEFAULT_AVATAR = "/static/images/default-avatar.png";

/** 后端 UserEntity → 前端视图数据 */
export const toUserView = (entity: UserEntity): UserView => ({
  id: entity.id,
  nickname: entity.nickname || "未设置昵称",
  avatar: entity.avatar || DEFAULT_AVATAR,
  phone: entity.phone ? maskPhone(entity.phone) : "未绑定",
  genderLabel: genderMap[entity.gender ?? 0] ?? "未设置",
  level: entity.level ?? 0,
  points: entity.points ?? 0,
});

/** 手机号脱敏：138****8888 */
const maskPhone = (phone: string): string =>
  phone.length === 11
    ? `${phone.slice(0, 3)}****${phone.slice(7)}`
    : phone;
