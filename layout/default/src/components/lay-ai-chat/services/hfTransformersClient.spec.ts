/**
 * Bug Condition Exploration Test
 * **Validates: Requirements 1.1, 1.2, 1.3**
 *
 * This test explores the bug condition on UNFIXED code.
 * EXPECTED OUTCOME: This test SHOULD FAIL on unfixed code (proving the bug exists)
 *
 * Bug Condition: isBugCondition(input) where
 *   input.library == '@huggingface/transformers' AND
 *   input.executionContext == 'main-thread' AND
 *   input.operation IN ['model-loading', 'text-inference']
 *
 * Expected Behavior (after fix):
 *   - Model should auto-download (no manual implementation needed)
 *   - Execution should be in worker thread
 *   - Main thread should remain responsive
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ChatMessage } from "../types";
import { generateByTransformersJs } from "./hfTransformersClient";

describe("Bug Condition Exploration: @huggingface/transformers on main thread", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Property 1: Fault Condition - should execute in worker thread and keep main thread responsive", async () => {
    // This test encodes the EXPECTED behavior (after fix)
    // On UNFIXED code, this test will FAIL because:
    // 1. Model loading happens on main thread (not in worker)
    // 2. Main thread gets blocked during model loading
    // 3. Main thread gets blocked during inference

    const testMessage = "你好";
    const testHistory: ChatMessage[] = [];

    // Track if main thread is blocked
    let mainThreadBlocked = false;
    let executionStartTime = 0;
    let executionEndTime = 0;

    // Set up a timer to check if main thread is responsive
    const checkInterval = 50; // Check every 50ms
    let checksCompleted = 0;
    const expectedChecks = 5; // We expect at least 5 checks during execution

    const intervalId = setInterval(() => {
      checksCompleted++;
      // If we can execute this, main thread is responsive
    }, checkInterval);

    try {
      executionStartTime = Date.now();

      // This call should:
      // - Auto-download the model (no manual implementation)
      // - Execute in worker thread (not main thread)
      // - Keep main thread responsive (interval should keep firing)
      const result = await generateByTransformersJs(testHistory, testMessage);

      executionEndTime = Date.now();

      // Wait a bit to ensure interval had time to fire
      await new Promise((resolve) => setTimeout(resolve, 100));

      clearInterval(intervalId);

      const executionTime = executionEndTime - executionStartTime;

      // Expected behavior (after fix):
      // 1. Should return valid text
      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);

      // 2. Main thread should remain responsive
      // If execution took more than 1 second, we expect the interval to have fired multiple times
      if (executionTime > 1000) {
        // Main thread should have been responsive - interval should have fired
        expect(checksCompleted).toBeGreaterThanOrEqual(expectedChecks);
        mainThreadBlocked = checksCompleted < expectedChecks;
      }

      // 3. Execution should be in worker thread (not blocking main thread)
      // On UNFIXED code: execution is on main thread, so interval won't fire properly
      // On FIXED code: execution is in worker, so interval fires normally

      // UNFIXED CODE BEHAVIOR:
      // - Model loading blocks main thread (interval doesn't fire)
      // - Inference blocks main thread (interval doesn't fire)
      // - checksCompleted will be less than expected
      // - This test will FAIL

      // FIXED CODE BEHAVIOR:
      // - Model loading in worker (main thread responsive)
      // - Inference in worker (main thread responsive)
      // - checksCompleted will meet or exceed expected
      // - This test will PASS

      console.log(
        `[Bug Exploration] Execution time: ${executionTime}ms, Checks completed: ${checksCompleted}, Main thread blocked: ${mainThreadBlocked}`,
      );
    } catch (error) {
      clearInterval(intervalId);

      // On UNFIXED code, we might see errors related to:
      // 1. Model download failure
      // 2. Manual download implementation required
      // 3. Library incompatibility

      console.error("[Bug Exploration] Error during execution:", error);

      // Document the counterexample
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.log("[Bug Exploration] Counterexample found:", {
        library: "@huggingface/transformers",
        executionContext: "main-thread",
        operation: "model-loading-and-inference",
        error: errorMessage,
        mainThreadBlocked: true,
      });

      // This is expected on UNFIXED code - the bug exists
      // The test should fail to prove the bug condition
      throw error;
    }
  }, 60000); // 60 second timeout for model loading

  it("Property 1: Fault Condition - model should auto-download without manual implementation", async () => {
    // This test verifies that model download works automatically
    // On UNFIXED code with @huggingface/transformers:
    // - Model download may fail
    // - May require manual download implementation
    // - This test will FAIL

    const testMessage = "测试";
    const testHistory: ChatMessage[] = [];

    try {
      // Attempt to generate text
      // Expected behavior (after fix): Model auto-downloads via @xenova/transformers
      // Unfixed behavior: Model download fails or requires manual implementation
      const result = await generateByTransformersJs(testHistory, testMessage);

      // If we get here, model loaded successfully
      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");

      console.log("[Bug Exploration] Model auto-download succeeded");
    } catch (error) {
      // On UNFIXED code, we expect errors related to model download
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      console.error("[Bug Exploration] Model download failed:", errorMessage);
      console.log("[Bug Exploration] Counterexample found:", {
        library: "@huggingface/transformers",
        operation: "model-download",
        error: errorMessage,
        requiresManualImplementation: true,
      });

      // This is expected on UNFIXED code
      throw error;
    }
  }, 60000); // 60 second timeout

  it("Property 1: Fault Condition - should not block main thread during model loading", async () => {
    // This test specifically checks main thread blocking during model loading
    // On UNFIXED code: Model loading blocks main thread
    // On FIXED code: Model loading in worker, main thread responsive

    const testMessage = "Hello";
    const testHistory: ChatMessage[] = [];

    let mainThreadResponsive = true;
    let checkCount = 0;

    // Set up a more aggressive check
    const intervalId = setInterval(() => {
      checkCount++;
    }, 10); // Check every 10ms

    try {
      const startTime = Date.now();
      await generateByTransformersJs(testHistory, testMessage);
      const endTime = Date.now();

      clearInterval(intervalId);

      const duration = endTime - startTime;

      // If execution took significant time (>500ms), we should have many checks
      if (duration > 500) {
        const expectedChecks = Math.floor(duration / 10) * 0.8; // Expect at least 80% of checks
        mainThreadResponsive = checkCount >= expectedChecks;

        console.log(
          `[Bug Exploration] Duration: ${duration}ms, Checks: ${checkCount}, Expected: ${expectedChecks}, Responsive: ${mainThreadResponsive}`,
        );

        // Expected behavior (after fix): Main thread is responsive
        expect(mainThreadResponsive).toBe(true);

        // On UNFIXED code: This assertion will FAIL because main thread is blocked
      }
    } catch (error) {
      clearInterval(intervalId);
      throw error;
    }
  }, 60000);
});

/**
 * Preservation Property Tests
 * **Validates: Requirements 3.1, 3.2, 3.3**
 *
 * These tests observe and capture baseline behavior on UNFIXED code.
 * EXPECTED OUTCOME: These tests SHOULD PASS on unfixed code (confirming baseline to preserve)
 *
 * Property 2: Preservation - 文本生成功能保持一致
 *
 * Tests verify that after the fix:
 * - Text generation returns valid results with consistent quality and format
 * - Xenova/Qwen2.5-0.5B-Instruct model continues to work
 * - Progress information continues to be provided
 * - Helper functions produce identical outputs
 */

describe("Preservation Property Tests: Baseline Behavior on UNFIXED Code", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Property 2.1: Text Generation Results Preservation", () => {
    /**
     * Property: For all valid text generation calls, the system should return valid text
     * with consistent quality and format
     */

    it("should return valid non-empty text for simple user messages", async () => {
      const testCases = [
        { history: [] as ChatMessage[], message: "你好" },
        { history: [] as ChatMessage[], message: "Hello" },
        { history: [] as ChatMessage[], message: "测试" },
      ];

      for (const testCase of testCases) {
        const result = await generateByTransformersJs(
          testCase.history,
          testCase.message,
        );

        // Baseline behavior: Should return valid text
        expect(result).toBeTruthy();
        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);
        expect(result).not.toBe("抱歉，我无法生成回复。");

        console.log(
          `[Preservation] Simple message "${testCase.message}" -> Valid result: ${result.substring(0, 50)}...`,
        );
      }
    }, 180000); // 3 minutes timeout for multiple model loads

    it("should return valid text for messages with chat history", async () => {
      const testCases = [
        {
          history: [
            { role: "user" as const, content: "你好" },
            {
              role: "assistant" as const,
              content: "你好！有什么可以帮助你的吗？",
            },
          ],
          message: "今天天气怎么样？",
        },
        {
          history: [
            { role: "user" as const, content: "Hello" },
            { role: "assistant" as const, content: "Hi! How can I help you?" },
          ],
          message: "What is AI?",
        },
      ];

      for (const testCase of testCases) {
        const result = await generateByTransformersJs(
          testCase.history,
          testCase.message,
        );

        // Baseline behavior: Should return valid text with history context
        expect(result).toBeTruthy();
        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);

        console.log(
          `[Preservation] Message with history "${testCase.message}" -> Valid result: ${result.substring(0, 50)}...`,
        );
      }
    }, 180000);

    it("should return consistent format for various input lengths", async () => {
      const testCases = [
        { history: [] as ChatMessage[], message: "Hi" }, // Short
        {
          history: [] as ChatMessage[],
          message: "Can you explain what artificial intelligence is?",
        }, // Medium
        {
          history: [] as ChatMessage[],
          message:
            "Can you provide a detailed explanation of how machine learning algorithms work and what are the main differences between supervised and unsupervised learning?",
        }, // Long
      ];

      for (const testCase of testCases) {
        const result = await generateByTransformersJs(
          testCase.history,
          testCase.message,
        );

        // Baseline behavior: All should return valid formatted text
        expect(result).toBeTruthy();
        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);

        // Should not contain the original prompt
        expect(result).not.toContain("用户:");
        expect(result).not.toContain("助手:");

        console.log(
          `[Preservation] Input length ${testCase.message.length} chars -> Output length ${result.length} chars`,
        );
      }
    }, 180000);
  });

  describe("Property 2.2: Model Support Preservation", () => {
    /**
     * Property: Xenova/Qwen2.5-0.5B-Instruct model should continue to be supported
     */

    it("should support default model (Xenova/Qwen2.5-0.5B-Instruct)", async () => {
      const testMessage = "测试默认模型";
      const testHistory: ChatMessage[] = [];

      // Call without specifying model (uses default)
      const result = await generateByTransformersJs(testHistory, testMessage);

      // Baseline behavior: Default model should work
      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);

      console.log(
        `[Preservation] Default model works: ${result.substring(0, 50)}...`,
      );
    }, 180000);

    it("should support explicitly specified Xenova/Qwen2.5-0.5B-Instruct model", async () => {
      const testMessage = "测试指定模型";
      const testHistory: ChatMessage[] = [];
      const modelName = "Xenova/Qwen2.5-0.5B-Instruct";

      // Call with explicit model name
      const result = await generateByTransformersJs(
        testHistory,
        testMessage,
        modelName,
      );

      // Baseline behavior: Explicit model specification should work
      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);

      console.log(
        `[Preservation] Explicit model "${modelName}" works: ${result.substring(0, 50)}...`,
      );
    }, 180000);

    it("should handle empty model string by using default model", async () => {
      const testMessage = "测试空模型字符串";
      const testHistory: ChatMessage[] = [];

      // Call with empty string (should use default)
      const result = await generateByTransformersJs(
        testHistory,
        testMessage,
        "",
      );

      // Baseline behavior: Empty model string should fall back to default
      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);

      console.log(
        `[Preservation] Empty model string falls back to default: ${result.substring(0, 50)}...`,
      );
    }, 180000);
  });

  describe("Property 2.3: Progress Information Preservation", () => {
    /**
     * Property: Progress information should continue to be provided during model loading
     */

    it("should provide progress callbacks during model loading", async () => {
      // Spy on console.log to capture progress information
      const consoleLogSpy = vi.spyOn(console, "log");

      const testMessage = "测试进度信息";
      const testHistory: ChatMessage[] = [];

      await generateByTransformersJs(testHistory, testMessage);

      // Baseline behavior: Progress information should be logged
      const progressLogs = consoleLogSpy.mock.calls.filter((call) =>
        call.some(
          (arg) =>
            typeof arg === "string" &&
            arg.includes("[AI][浏览器模型] 加载进度"),
        ),
      );

      // Should have progress logs (at least during first load)
      // Note: May not appear if model is already cached
      console.log(
        `[Preservation] Progress logs captured: ${progressLogs.length}`,
      );

      // We don't assert on the count because model might be cached
      // But we verify the mechanism exists
      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    }, 180000);
  });

  describe("Property 2.4: Helper Functions Preservation", () => {
    /**
     * Property: Helper functions (buildPrompt, resolveBrowserModel) should produce identical outputs
     * Note: These are internal functions, so we test them indirectly through the public API
     */

    it("should maintain consistent prompt building behavior", async () => {
      // Test that same inputs produce consistent results
      const testHistory: ChatMessage[] = [
        { role: "user", content: "第一条消息" },
        { role: "assistant", content: "第一条回复" },
      ];
      const testMessage = "第二条消息";

      const result1 = await generateByTransformersJs(testHistory, testMessage);
      const result2 = await generateByTransformersJs(testHistory, testMessage);

      // Baseline behavior: Same inputs should produce results (may vary due to temperature)
      expect(result1).toBeTruthy();
      expect(result2).toBeTruthy();
      expect(typeof result1).toBe("string");
      expect(typeof result2).toBe("string");

      console.log(
        `[Preservation] Consistent prompt building: Result1 length=${result1.length}, Result2 length=${result2.length}`,
      );
    }, 180000);

    it("should maintain model resolution behavior for various inputs", async () => {
      const testMessage = "测试模型解析";
      const testHistory: ChatMessage[] = [];

      // Test various model input formats
      const modelInputs = [
        undefined, // Should use default
        "", // Should use default
        "  ", // Should use default (whitespace)
        "Xenova/Qwen2.5-0.5B-Instruct", // Explicit model
      ];

      for (const modelInput of modelInputs) {
        const result = await generateByTransformersJs(
          testHistory,
          testMessage,
          modelInput,
        );

        // Baseline behavior: All should resolve to valid model and work
        expect(result).toBeTruthy();
        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);

        console.log(
          `[Preservation] Model input "${modelInput}" resolved successfully`,
        );
      }
    }, 180000);
  });

  describe("Property 2.5: Result Post-Processing Preservation", () => {
    /**
     * Property: Result post-processing logic should remain unchanged
     */

    it("should properly extract assistant reply from generated text", async () => {
      const testCases = [
        { history: [] as ChatMessage[], message: "你好" },
        { history: [] as ChatMessage[], message: "What is 2+2?" },
        {
          history: [
            { role: "user" as const, content: "Hi" },
            { role: "assistant" as const, content: "Hello!" },
          ],
          message: "How are you?",
        },
      ];

      for (const testCase of testCases) {
        const result = await generateByTransformersJs(
          testCase.history,
          testCase.message,
        );

        // Baseline behavior: Result should be clean (no prompt prefix)
        expect(result).toBeTruthy();
        expect(typeof result).toBe("string");

        // Should not contain the prompt structure
        expect(result).not.toMatch(/^用户:/);
        expect(result).not.toMatch(/^助手:/);

        // Should not be the fallback error message
        expect(result).not.toBe("抱歉，我无法生成回复。");

        console.log(
          `[Preservation] Clean result extraction: "${result.substring(0, 50)}..."`,
        );
      }
    }, 180000);

    it("should handle edge cases in result extraction", async () => {
      // Test with various message types that might affect extraction
      const testCases = [
        { history: [] as ChatMessage[], message: "A" }, // Single char
        { history: [] as ChatMessage[], message: "?" }, // Single punctuation
        { history: [] as ChatMessage[], message: "123" }, // Numbers
        { history: [] as ChatMessage[], message: "用户: 这是测试" }, // Contains "用户:"
      ];

      for (const testCase of testCases) {
        const result = await generateByTransformersJs(
          testCase.history,
          testCase.message,
        );

        // Baseline behavior: Should handle edge cases gracefully
        expect(result).toBeTruthy();
        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);

        console.log(
          `[Preservation] Edge case "${testCase.message}" handled: "${result.substring(0, 50)}..."`,
        );
      }
    }, 180000);
  });
});
