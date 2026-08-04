/**
 * rsocket-js 旧版 alpha 包的 TS 声明补齐
 *
 * rsocket-core / rsocket-websocket-client 为 0.0.28 alpha（无类型声明），
 * 此处声明本项目用到的子集，避免 tsc 报 TS7016。
 */

declare module "rsocket-core" {
  export interface Payload<D = unknown, M = unknown> {
    data?: D | null;
    metadata?: M | null;
  }

  export interface SingleLike<T> {
    subscribe(subscriber: {
      onComplete?: (value: T) => void;
      onError?: (error: Error) => void;
      onSubscribe?: (subscription: { cancel: () => void; request: (n: number) => void }) => void;
    }): void;
  }

  export interface FlowableLike<T> {
    subscribe(subscriber: {
      onComplete?: () => void;
      onError?: (error: Error) => void;
      onNext?: (value: T) => void;
      onSubscribe?: (subscription: { cancel: () => void; request: (n: number) => void }) => void;
    }): void;
  }

  export interface ReactiveSocket<D = unknown, M = unknown> {
    fireAndForget(payload: Payload<D, M>): void;
    requestResponse(payload: Payload<D, M>): SingleLike<Payload<D, M>>;
    requestStream(payload: Payload<D, M>): FlowableLike<Payload<D, M>>;
    close(): void;
    availability(): number;
    connectionStatus(): FlowableLike<{ kind: "NOT_CONNECTED" | "CONNECTING" | "CONNECTED" | "CLOSED" | "ERROR"; error?: Error }>;
  }

  export interface DuplexConnection {
    connect(): void;
    close(): void;
    connectionStatus(): FlowableLike<{ kind: "NOT_CONNECTED" | "CONNECTING" | "CONNECTED" | "CLOSED" | "ERROR"; error?: Error }>;
  }

  export interface ClientConfig<D = unknown, M = unknown> {
    serializers?: unknown;
    setup: {
      dataMimeType: string;
      metadataMimeType: string;
      keepAlive: number;
      lifetime: number;
      payload?: Payload<D, M>;
    };
    transport: DuplexConnection;
    errorHandler?: (error: Error) => void;
  }

  export class RSocketClient<D = unknown, M = unknown> {
    constructor(config: ClientConfig<D, M>);
    connect(): SingleLike<ReactiveSocket<D, M>>;
    close(): void;
  }

  export const JsonSerializer: unknown;
  export const IdentitySerializer: unknown;
}

declare module "rsocket-websocket-client" {
  import type { DuplexConnection } from "rsocket-core";

  export interface RSocketWebSocketClientOptions {
    url: string;
    wsCreator?: (url: string) => WebSocket;
    debug?: boolean;
    lengthPrefixedFrames?: boolean;
  }

  export default class RSocketWebSocketClient implements DuplexConnection {
    constructor(options: RSocketWebSocketClientOptions, encoders?: unknown);
    connect(): void;
    close(): void;
    connectionStatus(): ReturnType<DuplexConnection["connectionStatus"]>;
  }
}

declare module "rsocket-flowable" {
  export class Single<T> {
    constructor(source?: (subscriber: unknown) => void);
    subscribe(subscriber: unknown): void;
    static of(value: T): Single<T>;
  }
  export class Flowable<T> {
    constructor(source?: (subscriber: unknown) => void);
    subscribe(subscriber: unknown): void;
    static just(...values: T[]): Flowable<T>;
  }
}
