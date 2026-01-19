// @ts-check
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8080';

// Helper to navigate through initial pages
async function navigateToInstructions(page, condition = 'low', payoffCondition = 'interdependent') {
  await page.goto(`${BASE_URL}?CONDITION=${condition}&PAYOFF_CONDITION=${payoffCondition}`);
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

// Helper to answer comprehension questions correctly (interdependent condition)
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

// Helper to answer comprehension questions (independent condition)
async function answerComprehensionQuestionsIndependent(page) {
  // Q1: 5 berries from center
  await page.locator('button', { hasText: '5 berries' }).first().click();
  await page.waitForTimeout(200);
  // Q2: 5 berries from corner
  await page.locator('button', { hasText: '5 berries' }).first().click();
  await page.waitForTimeout(200);
  // Q3: No, same amount
  await page.locator('button', { hasText: 'No, they each get the same amount' }).click();
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
      await expect(page.locator('text=center tree')).toBeVisible();
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

    // Regression test: Critical trial config should specify joint reward (8) for display
    // Bug: Previously tree_rewards showed solo reward (1) before movement decision was made
    // Fix: tree_rewards now shows joint_reward so participants see 8 before agents move
    test('REGRESSION: critical trial config shows joint reward for initial display', async ({ page }) => {
      // Navigate to page to load global config
      await page.goto(`${BASE_URL}?CONDITION=low&PAYOFF_CONDITION=interdependent`);
      await expect(page.locator('text=Welcome')).toBeVisible({ timeout: 10000 });

      // Verify the trial configuration has correct values
      // The tree_rewards array should show joint reward (8) not solo reward (1)
      const trialConfig = await page.evaluate(() => {
        // Access the global game settings
        if (window.gs && window.gs.experiment && window.gs.experiment.payoff_conditions) {
          const payoffs = window.gs.experiment.payoff_conditions.interdependent;
          return {
            center_joint: payoffs.center_joint,
            center_solo: payoffs.center_solo,
            corner: payoffs.corner
          };
        }
        return null;
      });

      // Verify the config exists
      expect(trialConfig).not.toBeNull();

      // The key fix: config should specify joint reward (8), not solo (1) for display
      expect(trialConfig.center_joint).toBe(8);
      expect(trialConfig.center_solo).toBe(1);
      expect(trialConfig.corner).toBe(5);

      // Also verify the generateCriticalTrial function uses joint reward for tree_rewards
      const criticalTrialConfig = await page.evaluate(() => {
        if (window.generateCriticalTrial && window.gs) {
          const payoffs = window.gs.experiment.payoff_conditions.interdependent;
          const trial = window.generateCriticalTrial(3, payoffs);
          return {
            tree_rewards_center: trial.tree_rewards[0],
            tree_config_joint: trial.tree_configs[0].joint_reward,
            tree_config_solo: trial.tree_configs[0].solo_reward
          };
        }
        return null;
      });

      // If generateCriticalTrial is accessible, verify it shows joint reward
      if (criticalTrialConfig) {
        // tree_rewards should show [8, 8] for center tree, not [1, 1]
        expect(criticalTrialConfig.tree_rewards_center[0]).toBe(8);
        expect(criticalTrialConfig.tree_rewards_center[1]).toBe(8);
        expect(criticalTrialConfig.tree_config_joint).toBe(8);
        expect(criticalTrialConfig.tree_config_solo).toBe(1);
      }
    });

  });

  test.describe('Independent Payoff Condition', () => {

    test('shows correct instructions for independent condition', async ({ page }) => {
      await navigateToInstructions(page, 'low', 'independent');

      // Navigate through first few instruction pages to payoff description
      for (let i = 0; i < 3; i++) {
        await page.locator('button', { hasText: 'Next' }).click();
        await page.waitForTimeout(100);
      }

      // Should see "All trees yield the same number of berries"
      await expect(page.locator('text=All trees yield the same number of berries')).toBeVisible();
      await expect(page.locator('text=5 berries')).toBeVisible();
    });

    test('comprehension questions test uniform payoff understanding', async ({ page }) => {
      await navigateToInstructions(page, 'low', 'independent');
      await navigateThroughInstructions(page);

      // Q1: How many berries from center tree?
      await expect(page.locator('text=from the center tree')).toBeVisible();
      await page.locator('button', { hasText: '5 berries' }).first().click();

      // Q2: How many berries from corner tree?
      await expect(page.locator('text=from a corner tree')).toBeVisible();
      await page.locator('button', { hasText: '5 berries' }).first().click();

      // Q3: Does coordination change berries?
      await expect(page.locator('text=both farmers go to the same tree')).toBeVisible();
      await page.locator('button', { hasText: 'No, they each get the same amount' }).click();

      // Should see comprehension conclusion
      await expect(page.locator('text=understand how')).toBeVisible();
    });

    test('critical trial: Yellow gets 5 at center (same as coordinated)', async ({ page }) => {
      await navigateToInstructions(page, 'low', 'independent');
      await navigateThroughInstructions(page);
      await answerComprehensionQuestionsIndependent(page);
      await page.locator('button', { hasText: 'Start Observing' }).click();

      // Go through coordination rounds (both get 5 at center)
      for (let round = 0; round < 2; round++) {
        await page.locator('button', { hasText: 'Watch' }).click();
        await waitForObservationComplete(page, '5');
        await page.click('#submitBtn');
      }

      // Critical trial - Yellow gets 5 even going to center alone
      await page.locator('button', { hasText: 'Watch' }).click();
      await waitForObservationComplete(page, '5');

      // Check berry counters: Yellow gets 5 (no penalty for solo), Purple gets 5 (corner)
      const yellowCounter = page.locator('#agent0BerriesCounter');
      const purpleCounter = page.locator('#agent1BerriesCounter');

      await expect(yellowCounter).toContainText('5');
      await expect(purpleCounter).toContainText('5');
    });

    test('coordination rounds: both agents get 5 berries in independent condition', async ({ page }) => {
      await navigateToInstructions(page, 'low', 'independent');
      await navigateThroughInstructions(page);
      await answerComprehensionQuestionsIndependent(page);
      await page.locator('button', { hasText: 'Start Observing' }).click();

      // Start Round 1
      await page.locator('button', { hasText: 'Watch' }).click();
      await waitForObservationComplete(page, '5');

      // Check berry counters show 5 each (independent condition)
      const yellowCounter = page.locator('#agent0BerriesCounter');
      const purpleCounter = page.locator('#agent1BerriesCounter');

      await expect(yellowCounter).toContainText('5');
      await expect(purpleCounter).toContainText('5');
    });

  });

  test.describe('2x2 Design Conditions', () => {

    test('high repetition + independent condition works correctly', async ({ page }) => {
      await navigateToInstructions(page, 'high', 'independent');

      // Navigate through instructions
      for (let i = 0; i < 5; i++) {
        await page.locator('button', { hasText: 'Next' }).click();
        await page.waitForTimeout(100);
      }

      // Should see "7 rounds" (6 coordination + 1 critical)
      await expect(page.locator('text=7 rounds')).toBeVisible();
    });

    test('condition parameters are logged correctly', async ({ page }) => {
      // Listen for console logs
      const consoleLogs = [];
      page.on('console', msg => {
        if (msg.type() === 'log') {
          consoleLogs.push(msg.text());
        }
      });

      await navigateToInstructions(page, 'high', 'independent');

      // Find the experiment conditions log
      const conditionLog = consoleLogs.find(log => log.includes('Experiment conditions'));
      expect(conditionLog).toBeDefined();
      expect(conditionLog).toContain('high');
      expect(conditionLog).toContain('independent');
    });

  });

});
