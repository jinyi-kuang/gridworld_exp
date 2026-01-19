// @ts-check
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8080';

// Helper to navigate through initial pages
async function navigateToInstructions(page, condition = 'low') {
  await page.goto(`${BASE_URL}?CONDITION=${condition}`);
  await expect(page.locator('text=Welcome')).toBeVisible({ timeout: 10000 });
  await page.locator('button', { hasText: 'Get Started' }).click();
  await page.locator('button', { hasText: 'I Agree' }).click();
  await page.locator('button', { hasText: 'Continue' }).click();
  await page.waitForTimeout(500);
}

// Helper to navigate through instructions (8 pages total)
async function navigateThroughInstructions(page) {
  // Click Next through all 8 instruction pages
  // The last click will be on the last page which has "Next" to exit
  for (let i = 0; i < 7; i++) {
    await page.locator('button', { hasText: 'Next' }).click();
    await page.waitForTimeout(100);
  }
  // Click final Next to exit instructions (labeled "Next >" on last page)
  await page.locator('button', { hasText: 'Next' }).click();
  await page.waitForTimeout(200);
}

// Helper to answer comprehension questions correctly
async function answerComprehensionQuestions(page) {
  // Q1: 8 berries each
  await page.locator('button', { hasText: '8 berries each' }).click();
  await page.waitForTimeout(200);
  // Q2: 1 berry
  await page.locator('button', { hasText: '1 berry' }).click();
  await page.waitForTimeout(200);
  // Q3: 5 berries
  await page.locator('button', { hasText: '5 berries' }).click();
  await page.waitForTimeout(200);
}

// Helper to wait for observation to complete (berries collected)
async function waitForObservationComplete(page, expectedBerries = '8') {
  // Wait for berries to appear in basket counter (indicates animation complete)
  await page.waitForFunction(
    (expected) => {
      const counter = document.getElementById('agent0BerriesCounter');
      return counter && counter.textContent && counter.textContent.includes(expected);
    },
    expectedBerries,
    { timeout: 15000 }
  );
  await page.waitForSelector('#submitBtn:not([disabled])', { timeout: 5000 });
}

// Helper to go through observation rounds
async function goThroughRound(page, isCritical = false) {
  await page.locator('button', { hasText: 'Watch' }).click();
  // Critical trial: Yellow gets 1, coordination: Yellow gets 8
  const expectedBerries = isCritical ? '1' : '8';
  await waitForObservationComplete(page, expectedBerries);
  await page.click('#submitBtn');
}

test.describe('Joint Commitment Experiment', () => {

  test.describe('Low Repetition Condition (2 rounds)', () => {

    test('loads experiment and shows correct number of rounds', async ({ page }) => {
      await navigateToInstructions(page, 'low');

      // Navigate through instructions
      for (let i = 0; i < 5; i++) {
        await page.locator('button', { hasText: 'Next' }).click();
        await page.waitForTimeout(100);
      }

      // Should see "3 rounds" in instructions (2 coordination + 1 critical)
      await expect(page.locator('text=3 rounds')).toBeVisible();
    });

    test('comprehension questions test interdependence understanding', async ({ page }) => {
      await navigateToInstructions(page, 'low');
      await navigateThroughInstructions(page);

      // Q1: How many berries if BOTH go to center?
      await expect(page.locator('text=BOTH go to the center tree together')).toBeVisible();
      await page.locator('button', { hasText: '8 berries each' }).click();

      // Q2: How many berries if alone at center?
      await expect(page.locator('text=center tree ALONE')).toBeVisible();
      await page.locator('button', { hasText: '1 berry' }).click();

      // Q3: How many berries from corner tree?
      await expect(page.locator('text=corner tree')).toBeVisible();
      await page.locator('button', { hasText: '5 berries' }).click();

      // Should see comprehension conclusion
      await expect(page.locator('text=understand how')).toBeVisible();
    });

    test('shows 2 coordination rounds then critical trial', async ({ page }) => {
      await navigateToInstructions(page, 'low');
      await navigateThroughInstructions(page);
      await answerComprehensionQuestions(page);

      // Click start observing
      await page.locator('button', { hasText: 'Start Observing' }).click();

      // Round 1
      await expect(page.locator('text=Round 1')).toBeVisible();
      await page.locator('button', { hasText: 'Watch' }).click();

      // Wait for observation to complete (berries collected)
      await waitForObservationComplete(page, '8');
      await page.click('#submitBtn');

      // Round 2
      await expect(page.locator('text=Round 2')).toBeVisible();
      await page.locator('button', { hasText: 'Watch' }).click();

      await waitForObservationComplete(page, '8');
      await page.click('#submitBtn');

      // Final Round (critical trial)
      await expect(page.locator('text=Final Round')).toBeVisible();
    });

  });

  test.describe('High Repetition Condition (6 rounds)', () => {

    test('shows correct number of rounds in instructions', async ({ page }) => {
      await navigateToInstructions(page, 'high');

      // Navigate through instructions
      for (let i = 0; i < 5; i++) {
        await page.locator('button', { hasText: 'Next' }).click();
        await page.waitForTimeout(100);
      }

      // Should see "7 rounds" (6 coordination + 1 critical)
      await expect(page.locator('text=7 rounds')).toBeVisible();
    });

  });

  test.describe('DV Questions', () => {

    test('shows DV questions one at a time after critical trial', async ({ page }) => {
      await navigateToInstructions(page, 'low');
      await navigateThroughInstructions(page);
      await answerComprehensionQuestions(page);
      await page.locator('button', { hasText: 'Start Observing' }).click();

      // Go through all 3 rounds (2 coordination + 1 critical)
      for (let round = 0; round < 2; round++) {
        await goThroughRound(page, false);
      }
      await goThroughRound(page, true);

      // Should see DV transition
      await expect(page.locator('text=different tree')).toBeVisible();
      await page.locator('button', { hasText: 'Continue to Questions' }).click();

      // Question 1: Counterfactual
      await expect(page.locator('text=sick tomorrow')).toBeVisible();
      await page.locator('button', { hasText: 'Continue' }).click();

      // Question 2: Agreement
      await expect(page.locator('text=unspoken agreement')).toBeVisible();
      await page.locator('button', { hasText: 'Continue' }).click();

      // Question 3: Commitment
      await expect(page.locator('text=committed to harvesting')).toBeVisible();
      await page.locator('button', { hasText: 'Continue' }).click();

      // Question 4: Anger
      await expect(page.locator('text=How angry would')).toBeVisible();
      await page.locator('button', { hasText: 'Continue' }).click();

      // Question 5: Guilt
      await expect(page.locator('text=How guilty would')).toBeVisible();
    });

    test('completing all DV questions leads to survey', async ({ page }) => {
      await navigateToInstructions(page, 'low');
      await navigateThroughInstructions(page);
      await answerComprehensionQuestions(page);
      await page.locator('button', { hasText: 'Start Observing' }).click();

      // Go through all rounds (2 coordination + 1 critical)
      for (let round = 0; round < 2; round++) {
        await goThroughRound(page, false);
      }
      await goThroughRound(page, true);

      await page.locator('button', { hasText: 'Continue to Questions' }).click();

      // Go through all 5 DV questions
      for (let q = 0; q < 5; q++) {
        await page.locator('button', { hasText: 'Continue' }).click();
      }

      // Should proceed to survey
      await expect(page.locator('text=completed the experiment')).toBeVisible({ timeout: 5000 });
    });

  });

  test.describe('Berry Reward Logic', () => {

    test('coordination rounds: both agents get 8 berries at center', async ({ page }) => {
      await navigateToInstructions(page, 'low');
      await navigateThroughInstructions(page);
      await answerComprehensionQuestions(page);
      await page.locator('button', { hasText: 'Start Observing' }).click();

      // Start Round 1
      await page.locator('button', { hasText: 'Watch' }).click();

      // Wait for harvest animation to complete
      await waitForObservationComplete(page, '8');

      // Check berry counters show 8 each (coordination)
      const yellowCounter = page.locator('#agent0BerriesCounter');
      const purpleCounter = page.locator('#agent1BerriesCounter');

      await expect(yellowCounter).toContainText('8');
      await expect(purpleCounter).toContainText('8');
    });

    test('critical trial: Yellow gets 1 berry alone, Purple gets 5 at corner', async ({ page }) => {
      await navigateToInstructions(page, 'low');
      await navigateThroughInstructions(page);
      await answerComprehensionQuestions(page);
      await page.locator('button', { hasText: 'Start Observing' }).click();

      // Go through coordination rounds
      for (let round = 0; round < 2; round++) {
        await goThroughRound(page, false);
      }

      // Critical trial - watch but don't click submit yet
      await page.locator('button', { hasText: 'Watch' }).click();
      await waitForObservationComplete(page, '1');

      // Check berry counters: Yellow gets 1 (solo at center), Purple gets 5 (corner)
      const yellowCounter = page.locator('#agent0BerriesCounter');
      const purpleCounter = page.locator('#agent1BerriesCounter');

      await expect(yellowCounter).toContainText('1');
      await expect(purpleCounter).toContainText('5');
    });

  });

});
