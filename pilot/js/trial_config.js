
// Trial configuration for joint commitment experiment
// Generates trials dynamically based on repetition and payoff conditions

/**
 * Generate coordination trials where both agents go to center tree
 * @param {number} numRounds - Number of coordination rounds (2 or 6)
 * @param {Object} payoffs - Payoff structure { center_solo, center_joint, corner }
 * @returns {Array} Array of trial configurations
 */
function generateCoordinationTrials(numRounds, payoffs) {
  const trials = [];
  const centerPos = gs.experiment.center_tree.position;

  for (let i = 0; i < numRounds; i++) {
    trials.push({
      trial_number: i + 1,
      trial_type: "coordination",
      name: `coordination_${i + 1}`,
      rows: 10,
      cols: 10,
      agent_types: ["optimist", "pessimist"],
      agent_start_positions: [[1, 1], [10, 10]],
      tree_positions: [
        gs.experiment.center_tree.position,
        ...gs.experiment.corner_trees.map(t => t.position)
      ],
      tree_configs: [
        {
          isCenter: true,
          solo_reward: payoffs.center_solo,
          joint_reward: payoffs.center_joint
        },
        ...gs.experiment.corner_trees.map(t => ({
          isCenter: false,
          solo_reward: payoffs.corner,
          joint_reward: payoffs.corner
        }))
      ],
      // Legacy format for compatibility - will be overridden by new logic
      tree_rewards: [
        [payoffs.center_joint, payoffs.center_joint],
        ...gs.experiment.corner_trees.map(t => [payoffs.corner, payoffs.corner])
      ],
      tree_visibility: [1, 1, 1],
      total_steps: 10,
      // Both agents go to center
      target_tree_positions: [centerPos, centerPos],
    });
  }

  return trials;
}

/**
 * Generate the critical trial where Purple deviates to corner
 * @param {number} trialNumber - The trial number (after coordination rounds)
 * @param {Object} payoffs - Payoff structure { center_solo, center_joint, corner }
 * @returns {Object} Critical trial configuration
 */
function generateCriticalTrial(trialNumber, payoffs) {
  return {
    trial_number: trialNumber,
    trial_type: "critical",
    name: "critical_trial",
    rows: 10,
    cols: 10,
    agent_types: ["optimist", "pessimist"],
    agent_start_positions: [[1, 1], [10, 10]],
    tree_positions: [
      gs.experiment.center_tree.position,
      ...gs.experiment.corner_trees.map(t => t.position)
    ],
    tree_configs: [
      {
        isCenter: true,
        solo_reward: payoffs.center_solo,
        joint_reward: payoffs.center_joint
      },
      ...gs.experiment.corner_trees.map(t => ({
        isCenter: false,
        solo_reward: payoffs.corner,
        joint_reward: payoffs.corner
      }))
    ],
    tree_rewards: [
      // Show joint reward for both initially - actual payout determined after movement
      [payoffs.center_joint, payoffs.center_joint],
      ...gs.experiment.corner_trees.map(t => [payoffs.corner, payoffs.corner])
    ],
    tree_visibility: [1, 1, 1],
    total_steps: 10,
    // Yellow goes to center (alone), Purple deviates to corner
    target_tree_positions: [
      gs.experiment.critical_trial.yellow_target,
      gs.experiment.critical_trial.purple_target
    ],
  };
}

/**
 * Generate all trials for the experiment based on conditions
 * @param {string} repetitionCondition - 'low' or 'high' repetition condition
 * @param {string} payoffCondition - 'interdependent' or 'independent' payoff condition
 * @returns {Array} All trial configurations
 */
function generateAllTrials(repetitionCondition, payoffCondition) {
  const numRounds = gs.experiment.repetition_conditions[repetitionCondition] || 2;
  const payoffs = gs.experiment.payoff_conditions[payoffCondition] || gs.experiment.payoff_conditions.interdependent;

  const coordinationTrials = generateCoordinationTrials(numRounds, payoffs);
  const criticalTrial = generateCriticalTrial(numRounds + 1, payoffs);

  return [...coordinationTrials, criticalTrial];
}

// Legacy export for backward compatibility during transition
// This will be replaced by dynamic generation in setup.js
const testTrials = [
  {
    trial_number: 1,
    trial_type: "coordination",
    name: "coordination_1",
    rows: 10,
    cols: 10,
    agent_types: ["optimist", "pessimist"],
    agent_start_positions: [[1, 1], [10, 10]],
    tree_positions: [[5, 5], [2, 9], [9, 2]],
    tree_configs: [
      { isCenter: true, solo_reward: 1, joint_reward: 8 },
      { isCenter: false, solo_reward: 5, joint_reward: 5 },
      { isCenter: false, solo_reward: 5, joint_reward: 5 }
    ],
    tree_rewards: [[8, 8], [5, 5], [5, 5]],
    tree_visibility: [1, 1, 1],
    total_steps: 10,
    target_tree_positions: [[5, 5], [5, 5]],
  }
];
