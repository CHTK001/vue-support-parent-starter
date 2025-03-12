import { message } from "@repo/utils";
import emitter from "../utils/emitter";
import { nanoid } from "nanoid";
import { reactive } from "vue";

// 对话框消息类型
type llmDialogMessage = { id: string; sendFrom: "llm" | "user"; content: string; type?: string; files?: any[] };

// 文件类型
export type llmDialogFile = { id: string; file: File; deleteSelf: () => void };

// 主题类型
export type llmDialogTheme = "light" | "dark";

/**
 * 创建一个新的 LLMDialog 实例。
 *
 * @param options 一个可选的配置对象
 * @return 一个新的 LLMDialog 实例。
 */
export function llmDialog(options?: { [key: string]: any }) {
  return reactive(new LLMDialog(options));
}

/**
 * 对话框逻辑类
 */
export class LLMDialog {
  private _isVisible: boolean;
  private _isSending: boolean;
  public isStop: boolean;
  readonly messages: llmDialogMessage[];
  readonly files: llmDialogFile[] = [];
  public editorText: string;
  private form: any;

  constructor(options?: { [key: string]: any }) {
    this._isVisible = options?.isVisible || true;
    this._isSending = false;
    this.messages = [];
    this.editorText = "9.11和9.8哪个大";
  }

  public getForm() {
    return this.form;
  }
  public setForm(value: any) {
    this.form = value;
  }
  public get isVisible() {
    return this._isVisible;
  }

  public show() {
    this._isVisible = true;
  }

  public hide() {
    this._isVisible = false;
  }

  public get isSending() {
    return this._isSending;
  }

  private set isSending(value: boolean) {
    this._isSending = value;
  }

  public setTheme(theme: llmDialogTheme) {
    document.documentElement.setAttribute("ld-theme", theme);
  }

  // 向大模型发送消息
  sendMessage() {
    const prompt = this.preSend() as string | boolean;
    if (prompt == false) {
      return false;
    }
    this.send(prompt as string);
  }

  clearMessage() {
    // 将状态设置为正在发送
    this.stopSend();
    // 清空输入框
    this.messages.length = 0;
  }
  // 发送预处理，获取用户输入的消息
  preSend() {
    // 保存用户输入的消息
    const userPrompt = this.editorText;

    // 如果用户没有输入内容，弹出提示框
    if (!userPrompt) {
      message("请输入内容！", { type: "warning" });
      return false;
    }
    // 清空输入框
    this.editorText = "";

    // 将状态设置为正在发送
    this.isSending = true;

    return userPrompt;
  }

  async send(prompt: string) {
    // 获取文件列表
    const fileList = this.files.map((f) => f.file);
    // 清空文件列表
    this.clearFiles();
    // 生成两个消息，一个是用户输入的消息，一个是空白消息
    this.messages.push({ id: nanoid(), sendFrom: "user", content: prompt });
    this.messages.push({ id: nanoid(), sendFrom: "user-file", content: "", type: "file", files: fileList });
    this.messages.push({ id: nanoid(), sendFrom: "llm", content: "" });

    // 调用大模型发送逻辑
    this.onSend(prompt, fileList);
  }

  // 外部传入：大模型发送逻辑
  onSend(prompt: string, files: File[]) {}

  // 外部传入：大模型的消息发送取消
  onCancel() {}

  // 停止发送逻辑
  stopSend() {
    // 将状态设置为发送完成
    this.isSending = false;
    this.isStop = true;
    // 调用取消发送逻辑
    this.onCancel();
  }

  // 外部调用：接收到大模型的消息
  onData(receivedText: string) {
    if (!this.isSending) {
      return;
    }
    // 更新最后一条消息
    this.updateLastMessage(receivedText);
  }

  // 外部调用：大模型的消息发送完成
  onFinish() {
    // 将状态设置为发送完成
    this.isSending = false;
    this.isStop = true;
  }

  // 外部调用：大模型的消息发送失败
  onError() {
    // 将状态设置为发送完成
    this.isSending = false;
    // 在最后一条消息中显示发送失败
    // this.updateLastMessage("\n\n发送错误，请重试！");
    this.editorText = "";
    if (this.messages.length == 0) {
      this.updateEditContent("系统繁忙, 请稍后重试!");
    }
  }

  // 更新最后一条消息
  updateLastMessage(newMessage: string) {
    this.messages[this.messages.length - 1].content += newMessage;
  }
  // 更新最后一条消息
  updateLastMessageItem(newMessage: llmDialogMessage) {
    this.messages.push(newMessage);
  }

  // 更新编辑器内容
  updateEditContent(newMessage: string) {
    this.editorText = newMessage;
    emitter.emit("input-editor-text", newMessage);
  }

  // 上传文件
  uploadFile(file: File) {
    this.files.push({ id: nanoid(), file, deleteSelf: () => this.deleteFile(file) });
  }

  // 删除文件
  deleteFile(file: File) {
    const index = this.files.findIndex((f) => f.file === file);
    if (index >= 0) {
      this.files.splice(index, 1);
    }
  }

  // 清空文件
  clearFiles() {
    this.files.splice(0, this.files.length);
  }
}
