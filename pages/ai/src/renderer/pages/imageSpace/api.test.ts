/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Image Space API 契约测试：XHR 传输 + ReturnResult 信封解析 + 409 映射。
 *
 * 注：仓库 vitest 类型声明缺少 `vi` / async matchers，这里通过 `globalThis`
 * 手工打桩 XHR、用 `Promise.catch` 捕获结果断言，保持 typecheck 零新增错误。
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { imageSpaceApi, IMAGE_SPACE_NOT_ENABLED, type OcrRecognizeResult } from './api';

/** 最小 XHR 桩：记录 URL/headers，可按脚本触发 load/error 事件 */
class FakeXHR {
  /** 全部实例 */
  static instances: FakeXHR[] = [];

  /** 打开的 URL */
  url = '';
  /** 响应状态码 */
  status = 200;
  /** 状态文本 */
  statusText = 'OK';
  /** JSON 响应体 */
  responseText = '';
  /** 二进制响应体 */
  response: unknown = null;
  /** 表单数据 */
  formData: FormData | null = null;

  private listeners: Record<string, Array<(...args: never[]) => void>> = {};

  constructor() {
    FakeXHR.instances.push(this);
  }

  /** open */
  open(_method: string, url: string): void {
    this.url = url;
  }

  /** setRequestHeader */
  setRequestHeader(_name: string, _value: string): void {}

  /** addEventListener */
  addEventListener(type: string, fn: (...args: never[]) => void): void {
    (this.listeners[type] ??= []).push(fn);
  }

  /** send */
  send(body?: FormData): void {
    if (body instanceof FormData) {
      this.formData = body;
    }
  }

  /** 触发 load 事件 */
  fireLoad(): void {
    for (const fn of this.listeners['load'] ?? []) {
      fn();
    }
  }

  /** 触发 error 事件 */
  fireError(): void {
    for (const fn of this.listeners['error'] ?? []) {
      fn();
    }
  }
}

const originalXhr = (globalThis as Record<string, unknown>)['XMLHttpRequest'];

beforeEach(() => {
  FakeXHR.instances = [];
  (globalThis as Record<string, unknown>)['XMLHttpRequest'] = FakeXHR;
});

afterEach(() => {
  (globalThis as Record<string, unknown>)['XMLHttpRequest'] = originalXhr;
});

/** 取最近一个 XHR 实例 */
function lastXhr(): FakeXHR {
  return FakeXHR.instances[FakeXHR.instances.length - 1];
}

/** 断言 Promise 成功 resolve 为期望值 */
async function expectResolved<T>(promise: Promise<T>, expected: T): Promise<void> {
  const outcome = await promise.catch(() => {
    throw new Error('expected resolve, but promise rejected');
  });
  expect(outcome).toEqual(expected);
}

/** 断言 Promise 以包含指定文本的 Error reject */
async function expectRejected(promise: Promise<unknown>, messagePart: string): Promise<void> {
  const outcome = await promise.catch((error: unknown) => error);
  expect(outcome instanceof Error).toBe(true);
  expect((outcome as Error).message).toContain(messagePart);
}

describe('imageSpaceApi multipart transport', () => {
  it('resolves envelope data on success', async () => {
    const ocrResult: OcrRecognizeResult = {
      count: 1,
      text: 'hello',
      results: [{ text: 'hello', confidence: 0.99, boundingBox: null, angle: 0 }],
      elapsedMs: 42,
    };
    const pending = imageSpaceApi.ocrRecognize(new File(['img'], 'a.png'));
    const xhr = lastXhr();
    expect(xhr.url.endsWith('/v2/ocr/recognize')).toBe(true);
    xhr.status = 200;
    xhr.responseText = JSON.stringify({ code: 'SUCCESS', success: true, data: ocrResult, msg: 'ok' });
    xhr.fireLoad();
    await expectResolved(pending, ocrResult);
  });

  it('rejects with backend msg when success is false', async () => {
    const pending = imageSpaceApi.layoutDetect(new File(['img'], 'a.png'));
    const xhr = lastXhr();
    xhr.status = 200;
    xhr.responseText = JSON.stringify({ code: 'ERROR', success: false, data: null, msg: '版面分析模型未配置' });
    xhr.fireLoad();
    await expectRejected(pending, '版面分析模型未配置');
  });

  it('rejects with backend msg when data is null and success flag is absent', async () => {
    const pending = imageSpaceApi.faceDetect(new File(['img'], 'a.png'));
    const xhr = lastXhr();
    xhr.status = 200;
    // 旧版后端信封可能不含 success 字段：data 为 null 且有 msg 时按失败处理
    xhr.responseText = JSON.stringify({ code: 'ERROR', data: null, msg: '文字识别失败: x' });
    xhr.fireLoad();
    await expectRejected(pending, '文字识别失败: x');
  });

  it('resolves a Blob for binary endpoints', async () => {
    const blob = new Blob(['jpeg'], { type: 'image/jpeg' });
    const pending = imageSpaceApi.ocrAnnotate(new File(['img'], 'a.png'));
    const xhr = lastXhr();
    xhr.status = 200;
    xhr.response = blob;
    xhr.fireLoad();
    const outcome = (await pending.catch(() => {
      throw new Error('expected resolve, but promise rejected');
    })) as Blob;
    expect(outcome).toBe(blob);
  });

  it('maps 409 to NOT_ENABLED for super-resolution', async () => {
    const pending = imageSpaceApi.imageSuperResolution(new File(['img'], 'a.png'));
    const xhr = lastXhr();
    xhr.status = 409;
    xhr.response = new Blob([], { type: 'application/octet-stream' });
    xhr.fireLoad();
    await expectRejected(pending, IMAGE_SPACE_NOT_ENABLED);
  });

  it('rejects on network error', async () => {
    const pending = imageSpaceApi.layoutParse(new File(['img'], 'a.png'));
    const xhr = lastXhr();
    xhr.fireError();
    await expectRejected(pending, '网络错误');
  });

  it('appends the topK query for analyze', async () => {
    const pending = imageSpaceApi.imageAnalyze(new File(['img'], 'a.png'), 3);
    const xhr = lastXhr();
    expect(xhr.url).toContain('/v2/image-recognition/analyze?topK=3');
    xhr.status = 200;
    xhr.responseText = JSON.stringify({
      code: 'SUCCESS',
      success: true,
      data: { classification: null, detections: null, caption: null, elapsedMs: 1 },
    });
    xhr.fireLoad();
    await pending;
  });

  it('attaches the file to the form data', async () => {
    const file = new File(['img'], 'a.png');
    const pending = imageSpaceApi.ocrRecognize(file);
    const xhr = lastXhr();
    xhr.status = 200;
    xhr.responseText = JSON.stringify({
      code: 'SUCCESS',
      success: true,
      data: { count: 0, text: '', results: [], elapsedMs: 0 },
    });
    xhr.fireLoad();
    await pending;
    expect(xhr.formData?.get('file')).toBe(file);
  });
});
