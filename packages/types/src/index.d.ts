// 此文件跟同级目录的 global.d.ts 文件一样也是全局类型声明，只不过这里存放一些零散的全局类型，无需引入直接在 .vue 、.ts 、.tsx 文件使用即可获得类型提示
import { ViteEnv } from "./global";

export type RefType<T> = T | null;

export type EmitType = (event: string, ...args: any[]) => void;

export type TargetContext = "_self" | "_blank";

export type ComponentRef<T extends HTMLElement = HTMLDivElement> = ComponentElRef<T> | null;

export type ElRef<T extends HTMLElement = HTMLDivElement> = Nullable<T>;

// type ForDataType<T> = {
//   [P in T]?: ForDataType<T[P]>;
// };

export type AnyFunction<T> = (...args: any[]) => T;

//type PropType<T> = VuePropType<T>;

export type Writable<T> = {
  -readonly [P in keyof T]: T[P];
};

export type Nullable<T> = T | null;

export type NonNullable<T> = T extends null | undefined ? never : T;

export type Recordable<T = any> = Record<string, T>;

export type ReadonlyRecordable<T = any> = {
  readonly [key: string]: T;
};

export type Indexable<T = any> = {
  [key: string]: T;
};

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

export type Exclusive<T, U> = (Without<T, U> & U) | (Without<U, T> & T);

export type TimeoutHandle = ReturnType<typeof setTimeout>;

export type IntervalHandle = ReturnType<typeof setInterval>;

export type Effect = "light" | "dark";

export interface ChangeEvent extends Event {
  target: HTMLInputElement;
}

export interface WheelEvent {
  path?: EventTarget[];
}

export interface ImportMetaEnv extends ViteEnv {
  __: unknown;
}

export interface Fn<T = any, R = T> {
  (...arg: T[]): R;
}

export interface PromiseFn<T = any, R = T> {
  (...arg: T[]): Promise<R>;
}

export interface ComponentElRef<T extends HTMLElement = HTMLDivElement> {
  $el: T;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function parseInt(s: string | number, radix?: number): number;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function parseFloat(string: string | number): number;
