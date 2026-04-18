import { inject, provide, type InjectionKey } from "vue";
import { emitter } from "@repo/core";

export type MessageCenterLevel = "success" | "warning" | "info" | "error";

export interface MessageCenterInput {
  title?: string;
  content: string;
  type?: string;
  level?: MessageCenterLevel;
  url?: string;
}

export interface MessageCenterProvider {
  notify(input: MessageCenterInput): void;
  success(content: string, input?: Omit<MessageCenterInput, "content" | "level">): void;
  warning(content: string, input?: Omit<MessageCenterInput, "content" | "level">): void;
  info(content: string, input?: Omit<MessageCenterInput, "content" | "level">): void;
  error(content: string, input?: Omit<MessageCenterInput, "content" | "level">): void;
}

const emitToLayMessage = (input: MessageCenterInput) => {
  emitter.emit("devMessagePush", {
    id: Date.now(),
    title: input.title || "系统通知",
    content: input.content,
    type: input.type || "system",
    level: input.level || "info",
    time: new Date().toLocaleString(),
    url: input.url,
  });
};

export const messageCenterProvider: MessageCenterProvider = {
  notify(input) {
    emitToLayMessage(input);
  },
  success(content, input = {}) {
    this.notify({
      ...input,
      content,
      level: "success",
    });
  },
  warning(content, input = {}) {
    this.notify({
      ...input,
      content,
      level: "warning",
    });
  },
  info(content, input = {}) {
    this.notify({
      ...input,
      content,
      level: "info",
    });
  },
  error(content, input = {}) {
    this.notify({
      ...input,
      content,
      level: "error",
    });
  },
};

export const MessageCenterProviderKey: InjectionKey<MessageCenterProvider> =
  Symbol("MessageCenterProvider");

export const provideMessageCenter = () => {
  provide(MessageCenterProviderKey, messageCenterProvider);
  return messageCenterProvider;
};

export const useMessageCenter = () =>
  inject(MessageCenterProviderKey, messageCenterProvider);

export const tryUseMessageCenter = () =>
  inject<MessageCenterProvider | null>(MessageCenterProviderKey, null);
