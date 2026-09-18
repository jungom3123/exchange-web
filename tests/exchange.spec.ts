import { test, expect, type Page } from "@playwright/test";

const MIDS: Record<string, number> = {
  USD: 1400, EUR: 1500, THB: 40, VND: .055, JPY: 10, TWD: 43,
  HKD: 180, SGD: 1050, PHP: 25, IDR: .09, MYR: 320, CNY: 195,
  GBP: 1800, CHF: 1600, AUD: 930, CAD: 1020, NZD: 850,
};
const fixture = (mids = MIDS) => ({ date: "2026-09-18", rates: Object.fromEntries(
  Object.entries(mids).map(([code, mid]) => [code, { mid, source: "test" }]),
) });
async function mockRates(page: Page, mids = MIDS) {
  await page.route("**/api/rates", (route) => route.fulfill({ json: fixture(mids) }));
  await page.route("https://api.frankfurter.dev/**", (route) => route.fulfill({ json: {
    rates: { "2026-09-16": { KRW: 39, USD: .027, EUR: .026 }, "2026-09-17": { KRW: 40, USD: .028, EUR: .027 } },
  } }));
}
async function start(page: Page, local = "THB") {
  await page.goto("/");
  await expect(page.getByText("환율 기준일: 2026-09-18")).toBeVisible();
  await page.getByLabel("여행지에서 쓸 돈", { exact: true }).selectOption(local);
}
const amount = (page: Page) => page.getByRole("textbox", { name: /얼마를 환전하나요/ });
const routeCard = (page: Page, key: string) => page.locator(`[data-route="${key}"]`);

test.beforeEach(async ({ page }) => { await mockRates(page); });

test("empty, one and multiple cash methods give matching recommendation states", async ({ page }) => {
  await start(page);
  await expect(page.locator(".comparison-status")).toContainText("0개");
  await expect(page.locator(".rank-badge")).toHaveCount(0);
  await amount(page).fill("1000000");
  await expect(page.getByText("현재 1개 방법만 계산할 수 있어요.")).toBeVisible();
  await expect(page.locator(".recommendation")).toHaveCount(0);
  await expect(routeCard(page, "heldFx")).toHaveCount(0);
  await page.getByRole("textbox", { name: "THB/USD", exact: true }).fill("35");
  await expect(page.locator(".comparison-status")).toContainText("2개");
  await expect(page.locator(".rank-badge")).toHaveCount(2);
  await expect(page.locator(".recommendation")).toHaveCount(1);
  await expect(page.getByRole("article", { name: "카드·ATM 참고 금액" })).toContainText("수수료를 반영하지 않은 금액이에요.");
  await page.getByRole("textbox", { name: "THB/USD", exact: true }).fill("");
  await expect(page.locator(".rank-badge")).toHaveCount(0);
  await expect(page.locator(".recommendation")).toHaveCount(0);
});

test("currency pair changes clear both display and calculations without clearing another pair", async ({ page }) => {
  await start(page);
  await amount(page).fill("1000000");
  await page.getByRole("textbox", { name: "KRW/THB", exact: true }).fill("40");
  await page.getByRole("textbox", { name: "THB/USD", exact: true }).fill("35");
  await expect(page.locator(".comparison-status")).toContainText("3개");
  await page.getByRole("radio", { name: "EUR", exact: true }).check();
  await expect(page.getByRole("textbox", { name: "THB/EUR", exact: true })).toHaveValue("");
  await expect(page.getByRole("textbox", { name: "KRW/THB", exact: true })).toHaveValue("40");
  await expect(routeCard(page, "double").locator(".receipt")).toHaveCount(0);
  await expect(page.locator(".comparison-status")).toContainText("2개");
  await page.getByRole("radio", { name: "USD", exact: true }).check();
  await expect(page.getByRole("textbox", { name: "THB/USD", exact: true })).toHaveValue("");
  await page.getByLabel("여행지에서 쓸 돈", { exact: true }).selectOption("USD");
  await expect(page.getByRole("radio", { name: "EUR", exact: true })).toBeChecked();
  await expect(page.getByRole("textbox", { name: "KRW/USD", exact: true })).toHaveValue("");
  await expect(page.getByRole("textbox", { name: "USD/EUR", exact: true })).toHaveValue("");
});

test("decimal typing, actual clipboard paste and caret edits preserve the amount", async ({ page, context }) => {
  await start(page, "EUR");
  await page.getByRole("radio", { name: /이미 가진 달러/ }).check();
  await page.getByRole("textbox", { name: "EUR/USD", exact: true }).fill("2");
  await amount(page).pressSequentially("100.");
  await expect(amount(page)).toHaveValue("100.");
  await amount(page).pressSequentially("5");
  await expect(amount(page)).toHaveValue("100.5");
  await expect(routeCard(page, "heldFx").locator(".receipt")).toContainText("201.00 EUR");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.evaluate(() => navigator.clipboard.writeText("100.5"));
  await amount(page).fill("");
  await amount(page).press("Control+V");
  await expect(amount(page)).toHaveValue("100.5");
  await expect(routeCard(page, "heldFx").locator(".receipt")).toContainText("201.00 EUR");
  for (const [raw, receipt] of [["0.5", "1.00 EUR"], ["1,000.50", "2,001.00 EUR"]]) {
    await amount(page).fill(raw);
    await expect(routeCard(page, "heldFx").locator(".receipt")).toContainText(receipt);
    await expect(amount(page)).toHaveValue(raw);
  }
  await amount(page).fill("100.5");
  await amount(page).press("Home");
  await amount(page).press("ArrowRight");
  await amount(page).pressSequentially("2");
  await expect(amount(page)).toHaveValue("1200.5");
  expect(await amount(page).evaluate((element: HTMLInputElement) => element.selectionStart)).toBe(2);
  await amount(page).fill("100.5");
  await amount(page).press("End");
  await amount(page).press("ArrowLeft");
  await amount(page).press("Backspace");
  await expect(amount(page)).toHaveValue("1005");
  await amount(page).pressSequentially(".");
  await expect(amount(page)).toHaveValue("100.5");
  expect(await amount(page).evaluate((element: HTMLInputElement) => element.selectionStart)).toBe(4);
  for (const raw of ["", "0", "-2", "1.2.3", "100abc", "1,00"]) {
    await amount(page).fill(raw);
    await amount(page).blur();
    await expect(amount(page)).toHaveValue(raw);
    await expect(amount(page)).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator(".rank-badge")).toHaveCount(0);
    await expect(page.locator(".comparison-status")).toContainText("0개");
  }
  await amount(page).fill("100.5");
  await expect(routeCard(page, "heldFx").locator(".receipt")).toContainText("201.00 EUR");
});

test("holding selections control eligibility, intermediate currency and equal-currency references", async ({ page }) => {
  await start(page);
  await page.getByRole("radio", { name: /이미 가진 달러/ }).check();
  await amount(page).fill("100.5");
  await page.getByRole("textbox", { name: "THB/USD", exact: true }).fill("35");
  await expect(routeCard(page, "heldFx")).toBeVisible();
  await expect(page.getByText("같은 원화 가치의 금액으로 비교합니다.")).toBeVisible();
  await expect(page.getByRole("radio", { name: "EUR", exact: true })).toHaveCount(0);
  await page.getByRole("radio", { name: /이미 가진 유로/ }).check();
  await expect(amount(page)).toHaveValue("");
  await expect(page.getByRole("textbox", { name: "THB/EUR", exact: true })).toHaveValue("");
  await amount(page).fill("100");
  await page.getByLabel("여행지에서 쓸 돈", { exact: true }).selectOption("EUR");
  await expect(page.getByRole("article", { name: "환전 없이 사용", exact: true })).toContainText("100.00 EUR");
  await expect(routeCard(page, "heldFx")).toHaveCount(0);
  await expect(routeCard(page, "double")).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "EUR/EUR", exact: true })).toHaveCount(0);
  await expect(page.locator(".comparison-status")).toContainText("원화 출발 환전 방법: 1개");
  await page.getByRole("textbox", { name: "KRW/EUR", exact: true }).fill("1550");
  await expect(page.locator(".comparison-status")).toContainText("원화 출발 환전 방법: 2개");
  await page.getByRole("radio", { name: /원화/ }).check();
  await expect(page.getByRole("article", { name: "환전 없이 사용", exact: true })).toHaveCount(0);
  await expect(routeCard(page, "heldFx")).toHaveCount(0);
});

test("city and country search, same-currency cities, recents and direct currency selection", async ({ page }) => {
  await page.goto("/");
  const city = page.getByRole("combobox", { name: "여행 도시", exact: true });
  await city.fill("방콕");
  await expect(page.getByRole("option", { name: "방콕 태국" })).toBeVisible();
  await city.fill("태국");
  await expect(page.getByRole("listbox").getByRole("option")).toHaveCount(4);
  await city.press("ArrowDown");
  await city.press("Enter");
  await expect(page.getByLabel("여행지에서 쓸 돈", { exact: true })).toHaveValue("THB");
  await expect(page.getByText("방콕에서 쓸 돈: 태국 바트(THB)")).toBeVisible();
  await page.getByRole("textbox", { name: "KRW/THB", exact: true }).fill("40");
  await city.fill("치앙마이");
  await city.press("ArrowDown");
  await city.press("Enter");
  await expect(page.getByRole("textbox", { name: "KRW/THB", exact: true })).toHaveValue("40");
  await page.reload();
  const recents = page.locator(".destination-shortcuts").filter({ has: page.getByText("최근 선택", { exact: true }) });
  await expect(recents.getByRole("button")).toHaveCount(2);
  await recents.getByRole("button", { name: /치앙마이/ }).click();
  await page.getByLabel("여행지에서 쓸 돈", { exact: true }).selectOption("JPY");
  await expect(city).toHaveValue("");
  await expect(page.getByRole("heading", { name: "치앙마이 환전 팁" })).toHaveCount(0);
  await city.fill("없는도시");
  await expect(page.getByText("찾는 도시가 없나요? 통화를 직접 선택해 주세요.")).toBeVisible();
  await page.getByRole("button", { name: /통화로 직접 선택/ }).click();
  await expect(page.getByLabel("여행지에서 쓸 돈", { exact: true })).toBeFocused();
});

test("invalid local storage does not prevent destination selection", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("exchange-recent-cities-v1", "not-json"));
  await page.goto("/");
  await page.getByRole("button", { name: "방콕 · 태국", exact: true }).click();
  await expect(page.getByLabel("여행지에서 쓸 돈", { exact: true })).toHaveValue("THB");
});

test("rate direction warning, reciprocal mirror and invalid rate remain visible", async ({ page }) => {
  await start(page);
  const krw = page.getByRole("textbox", { name: "KRW/THB", exact: true });
  const inverse = page.getByRole("textbox", { name: "THB/KRW", exact: true });
  await krw.fill("0.025");
  await expect(inverse).toHaveValue("40");
  await expect(page.getByText("환율 방향을 확인해 주세요. 반대로 입력했을 수 있어요.")).toBeVisible();
  await page.getByRole("button", { name: "반대 방향으로 바꾸기" }).click();
  await expect(krw).toHaveValue("40");
  await expect(inverse).toHaveValue("0.025");
  await amount(page).fill("1000000");
  await expect(routeCard(page, "localKrw").locator(".receipt")).toContainText("25,000 THB");
  await krw.fill("40abc");
  await expect(krw).toHaveAttribute("aria-invalid", "true");
  await expect(inverse).toHaveValue("");
  await expect(routeCard(page, "localKrw")).toContainText("환율을 입력하면 비교할 수 있어요.");
});

test("partial rates only exclude dependent methods", async ({ page }) => {
  await page.route("**/api/rates", (route) => route.fulfill({ json: fixture({ THB: 40 }) }));
  await start(page);
  await amount(page).fill("1000000");
  await expect(page.locator(".comparison-status")).toContainText("1개");
  await page.getByRole("textbox", { name: "KRW/THB", exact: true }).fill("40");
  await expect(page.locator(".comparison-status")).toContainText("2개");
  await expect(routeCard(page, "double")).toContainText("기준 환율을 확인할 수 없어요");
});

test("loading and failed rates are announced while manual KRW exchange still works", async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/rates", async (route) => { await gate; await route.fulfill({ status: 500, json: { error: "test" } }); });
  await page.goto("/");
  await expect(page.getByText("환율을 불러오고 있어요.", { exact: true })).toBeVisible();
  release();
  await expect(page.getByText("환율을 불러오지 못했어요. 잠시 후 새로고침해 주세요.")).toBeVisible();
  await page.getByLabel("여행지에서 쓸 돈", { exact: true }).selectOption("THB");
  await amount(page).fill("1000000");
  await expect(page.locator(".comparison-status")).toContainText("0개");
  await page.getByRole("textbox", { name: "KRW/THB", exact: true }).fill("40");
  await expect(page.locator(".comparison-status")).toContainText("1개");
  await expect(routeCard(page, "localKrw").locator(".receipt")).toContainText("25,000 THB");
  await expect(page.locator(".recommendation")).toHaveCount(0);
});

for (const width of [360, 390, 768, 1280]) {
  test(`long VND receipts fit at ${width}px with readable layout and result navigation`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await start(page, "VND");
    await amount(page).fill("999999999999");
    await page.getByRole("textbox", { name: "VND/KRW", exact: true }).fill("18");
    await expect(page.locator(".comparison-status")).toContainText("2개");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    for (const card of await page.locator(".result-card, .reference-card").all()) {
      expect(await card.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    }
    const inputBox = await page.locator(".input-panel").boundingBox();
    const resultBox = await page.locator(".results-panel").boundingBox();
    if (width >= 1024) expect(resultBox!.x).toBeGreaterThan(inputBox!.x + inputBox!.width);
    else {
      expect(resultBox!.y).toBeGreaterThan(inputBox!.y + inputBox!.height);
      const jump = page.getByRole("button", { name: /비교 결과 보기/ });
      await jump.focus();
      await jump.press("Enter");
      await expect(page.getByRole("heading", { name: /환전 방법별 예상 수령액/ })).toBeFocused();
    }
    await page.screenshot({ path: testInfo.outputPath(`vnd-${width}-light.png`), fullPage: true });
    await page.getByRole("button", { name: "다크모드", exact: true }).click();
    await expect(page.getByRole("button", { name: "다크모드", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("html")).toHaveClass(/dark/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`vnd-${width}-dark.png`), fullPage: true });
  });
}

test("tooltip only opens on hover, stays under pointer, fits screen and does not shift layout", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await start(page);
  const info = page.getByRole("img", { name: "환율 출처와 계산 기준 설명" });
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  const before = await page.locator(".input-panel").boundingBox();
  await info.hover();
  await expect(page.getByRole("tooltip")).toBeVisible();
  const tip = await page.getByRole("tooltip").boundingBox();
  expect(tip!.x).toBeGreaterThanOrEqual(0);
  expect(tip!.x + tip!.width).toBeLessThanOrEqual(360);
  expect(tip!.y + tip!.height).toBeLessThanOrEqual(800);
  await page.getByRole("tooltip").hover();
  await expect(page.getByRole("tooltip")).toBeVisible();
  await info.hover();
  await expect(page.getByRole("tooltip")).toBeVisible();
  expect(await page.locator(".input-panel").boundingBox()).toEqual(before);
  await page.mouse.move(1, 1);
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await info.click();
  await page.mouse.move(1, 1);
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await info.hover();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
});

test("keyboard alone completes required inputs and quick selections", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "다크모드", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: /이미 가진 달러/ })).toBeChecked();
  await page.keyboard.press("Tab");
  const search = page.getByRole("combobox", { name: "여행 도시", exact: true });
  await expect(search).toBeFocused();
  await page.keyboard.type("태국");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  for (let step = 0; step < 20; step++) {
    await page.keyboard.press("Tab");
    if (await amount(page).evaluate((el) => el === document.activeElement)) break;
  }
  await expect(amount(page)).toBeFocused();
  await page.keyboard.type("100.5");
  // KRW/THB, THB/KRW, USD/THB, THB/USD.
  for (let step = 0; step < 4; step++) await page.keyboard.press("Tab");
  await expect(page.getByRole("textbox", { name: "THB/USD", exact: true })).toBeFocused();
  await page.keyboard.type("35");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: /비교 결과 보기/ })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: /환전 방법별 예상 수령액/ })).toBeFocused();
  await expect(page.locator(".comparison-status")).toContainText("3개");
});

test("touch can complete comparison without opening tooltips", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, baseURL: "http://127.0.0.1:3100" });
  const page = await context.newPage();
  await mockRates(page);
  await page.goto("/");
  await page.getByRole("img", { name: "환율 출처와 계산 기준 설명" }).tap();
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await page.getByRole("button", { name: "방콕 · 태국", exact: true }).tap();
  await amount(page).fill("1000000");
  await page.getByRole("textbox", { name: "THB/USD", exact: true }).fill("35");
  await page.getByRole("button", { name: /비교 결과 보기/ }).tap();
  await expect(page.locator(".comparison-status")).toContainText("2개");
  await expect(page.getByText(/내가 내는 돈의/)).toBeAttached();
  for (const selector of [".theme-button", ".currency-option > span", ".city-chip", ".fx-option span", ".primary-button"]) {
    for (const target of await page.locator(selector).all()) {
      const box = await target.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  }
  await context.close();
});
