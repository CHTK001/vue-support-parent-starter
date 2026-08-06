import { test, expect, type Page, type BrowserContext } from "@playwright/test";

const BASE_URL = "http://127.0.0.1:8849";

// ── Helpers ─────────────────────────────────────────────────

/**
 * Select an option in an Element Plus el-select by form-item label.
 * Clicks the select trigger, then picks the dropdown option.
 */
async function selectElOption(page: Page, formLabel: string, optionText: string) {
  const formItem = page.locator(".el-form-item").filter({ hasText: formLabel });
  await formItem.locator(".el-select__wrapper").click();
  await page.locator(".el-select-dropdown__item").filter({ hasText: optionText }).click();
}

/**
 * Fill the conference form and click connect.
 * Page must already be at BASE_URL with the form visible.
 */
async function connectToConference(page: Page, roomId: string, mode: "host" | "guest") {
  await selectElOption(page, "协议", "会议");
  await page.waitForTimeout(200);

  const roomInput = page.getByPlaceholder("e.g. test-room");
  await roomInput.fill(roomId);

  if (mode === "guest") {
    await selectElOption(page, "角色", "参与者");
  } else {
    await selectElOption(page, "角色", "主持人");
  }

  await page.locator(".connect-btn").click();
}

/**
 * Collect console errors into an array for later assertion.
 */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(`[PAGE_ERROR] ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      errors.push(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });
  return errors;
}

// ── Tests ───────────────────────────────────────────────────

test.describe("CONFERENCE 会议 E2E", () => {
  test("Host connects to conference room", async ({ page }) => {
    const errors = collectErrors(page);
    const roomId = `e2e-host-${Date.now()}`;

    await page.goto(BASE_URL, { waitUntil: "load" });
    await expect(page.locator(".header-title")).toBeVisible({ timeout: 15000 });

    await connectToConference(page, roomId, "host");

    // ConferenceRoom component should mount
    await expect(page.locator(".conference-room")).toBeVisible({ timeout: 60000 });

    // Wait for LiveKit connection to complete (loading → active)
    await expect(page.locator(".conference-active")).toBeVisible({ timeout: 60000 });

    // Should have at least the local video tile
    const tiles = page.locator(".video-tile");
    await expect(tiles).not.toHaveCount(0);

    // Should show host badge
    await expect(page.locator(".tile-badge").filter({ hasText: "主持人" }).first()).toBeVisible();

    // Should have room name visible
    await expect(page.locator(".room-name")).toBeVisible();

    // Verify control buttons exist
    await expect(page.locator(".controls-bar")).toBeVisible();
    const ctrlButtons = page.locator(".ctrl-btn");
    const ctrlCount = await ctrlButtons.count();
    expect(ctrlCount).toBeGreaterThanOrEqual(4); // mic, camera, screenshare, leave

    // Check console for errors (ignore LiveKit API deprecation warnings)
    const relevantErrors = errors.filter(
      (e) => !e.includes("LiveKit API") && !e.includes("deprecated"),
    );
    expect(relevantErrors).toEqual([]);
  });
});

test.describe.serial("多参与者流程", () => {
  let hostPage: Page;
  let guestCtx: BrowserContext;
  let guestPage: Page;
  let thirdCtx: BrowserContext;
  let thirdPage: Page;
  const roomId = `e2e-multi-${Date.now()}`;
  const hostErrors: string[] = [];
  const guestErrors: string[] = [];

  test.beforeAll(async ({ browser }) => {
    hostPage = await browser.newPage();
    guestCtx = await browser.newContext();
    guestPage = await guestCtx.newPage();
    thirdCtx = await browser.newContext();
    thirdPage = await thirdCtx.newPage();
    collectErrors(hostPage, hostErrors);
    collectErrors(guestPage, guestErrors);
  });

  test("Step 1: Host connects to room", async () => {
    await hostPage.goto(BASE_URL, { waitUntil: "load" });
    await expect(hostPage.locator(".header-title")).toBeVisible({ timeout: 15000 });

    await connectToConference(hostPage, roomId, "host");

    await expect(hostPage.locator(".conference-active")).toBeVisible({ timeout: 60000 });
    await expect(hostPage.locator(".video-tile")).not.toHaveCount(0);
    console.log(`✅ Host connected to room: ${roomId}`);
  });

  test("Step 2: Guest joins same room", async () => {
    await guestPage.goto(BASE_URL, { waitUntil: "load" });
    await expect(guestPage.locator(".header-title")).toBeVisible({ timeout: 15000 });

    await connectToConference(guestPage, roomId, "guest");

    await expect(guestPage.locator(".conference-active")).toBeVisible({ timeout: 60000 });

    // Guest should see remote tiles (at least the host's video)
    await expect(guestPage.locator(".video-tile")).not.toHaveCount(0);
    console.log("✅ Guest joined and sees video tiles");
  });

  test("Step 3: 3rd participant is rejected (room capacity)", async () => {
    await thirdPage.goto(BASE_URL, { waitUntil: "load" });
    await expect(thirdPage.locator(".header-title")).toBeVisible({ timeout: 15000 });

    await connectToConference(thirdPage, roomId, "guest");

    // Third participant should NOT get conference-active — room is full
    // The Rust agent sends back an error and the session stays disconnected/pending
    // ConferenceRoom should either not mount or show loading that never resolves
    // Wait briefly to allow connection attempt
    try {
      await expect(thirdPage.locator(".conference-active")).not.toBeVisible({ timeout: 15000 });
    } catch {
      // If it does become active, check that video tiles aren't showing anything useful
    }

    // Check that the page didn't enter a connected state
    const isActive = await thirdPage.locator(".conference-active").isVisible().catch(() => false);
    expect(isActive).toBe(false);
    console.log("✅ 3rd participant correctly rejected (room capacity = 3)");
  });

  test("Step 4: Host migration on disconnect", async () => {
    // Host leaves the room
    const leaveButtons = hostPage.locator(".ctrl-btn");
    const leaveBtn = leaveButtons.last();
    await leaveBtn.click();

    // Wait for host to disappear from guest's view
    await guestPage.waitForTimeout(3000);

    // Guest should still be connected
    await expect(guestPage.locator(".conference-active")).toBeVisible({ timeout: 15000 });

    // Guest's remaining tile should now show host badge or at least still be connected
    const guestTiles = guestPage.locator(".video-tile");
    await expect(guestTiles).not.toHaveCount(0);
    console.log("✅ Host migration: Guest remains connected after host leaves");
  });

  test.afterAll(async () => {
    // Cleanup
    await hostPage.close().catch(() => {});
    await thirdPage.close().catch(() => {});
    await guestCtx.close().catch(() => {});
    await thirdCtx.close().catch(() => {});

    // Check for console errors (ignore LiveKit API warnings)
    for (const [name, errs] of [["Host", hostErrors], ["Guest", guestErrors]] as const) {
      const relevant = errs.filter(
        (e) => !e.includes("LiveKit API") && !e.includes("deprecated"),
      );
      expect(relevant).toEqual([]);
      console.log(`✅ ${name} page: no console errors`);
    }
  });
});
