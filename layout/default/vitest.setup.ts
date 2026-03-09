import { vi } from "vitest";

// Mock Worker for testing
class MockWorker {
  url: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;

  constructor(url: string | URL) {
    this.url = url.toString();
  }

  postMessage(message: unknown) {
    // Simulate async worker response
    setTimeout(() => {
      if (this.onmessage) {
        const { type, id, payload } = message as {
          type: string;
          id: number;
          payload: unknown;
        };

        if (type === "load") {
          // Simulate model loading
          this.onmessage(
            new MessageEvent("message", {
              data: {
                type: "progress",
                id,
                payload: { status: "loading", progress: 0.5 },
              },
            }),
          );

          setTimeout(() => {
            if (this.onmessage) {
              this.onmessage(
                new MessageEvent("message", {
                  data: {
                    type: "loaded",
                    id,
                    payload: { success: true },
                  },
                }),
              );
            }
          }, 100);
        } else if (type === "generate") {
          // Simulate text generation
          const { prompt } = payload as { prompt: string };
          const mockResponse = "这是一个模拟的AI回复。";

          setTimeout(() => {
            if (this.onmessage) {
              this.onmessage(
                new MessageEvent("message", {
                  data: {
                    type: "result",
                    id,
                    payload: {
                      result: [
                        { generated_text: `${prompt}\n${mockResponse}` },
                      ],
                    },
                  },
                }),
              );
            }
          }, 50);
        }
      }
    }, 10);
  }

  terminate() {
    // Mock terminate
  }
}

// Make Worker available globally
global.Worker = MockWorker as unknown as typeof Worker;
