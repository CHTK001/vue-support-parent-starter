/* Sign-in module types (@pages/signin) */

/** API response wrapper */
export interface ApiResult<T = unknown> {
  code?: number;
  msg?: string;
  data?: T;
}

/** Paginated response */
export interface PageResult<T> {
  records?: T[];
  total?: number;
  page?: number;
  pageSize?: number;
}

/** Sign-in result */
export interface SignInResult {
  success: boolean;
  alreadySigned: boolean;
  msg: string;
  todayPoints: number;
  streak: number;
  totalPoints: number;
  totalDays: number;
  pointsBreakdown?: SignInPoint[];
}

/** Sign-in point breakdown */
export interface SignInPoint {
  ruleType: string;
  points: number;
  description: string;
}

/** Sign-in stats */
export interface SignInStats {
  userId: number;
  totalDays: number;
  currentStreak: number;
  maxStreak: number;
  totalPoints: number;
  signedToday: boolean;
}

/** Calendar day */
export interface SignInDay {
  date: string;
  signed: boolean;
  points: number;
}

/** Today status */
export interface TodayStatus {
  signed: boolean;
  userId: number;
}

/** User sign-in summary (admin) */
export interface UserSignInSummary {
  userId: number;
  signInDays: number;
  totalPoints: number;
}