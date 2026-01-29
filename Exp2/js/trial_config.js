/**
 * Generate coordination trials where optimal outcome requires agents to go to "opposite" tree
 * @param {number} numRounds - 2 or 6
 * @param {boolean} dependency - whether Purple's choice affects Yellow
 * @returns {Array} Trials
 * */



function generateCoordinationTrials(numRounds, payoffCondition) {

  const trials = [];

const trees = [
  {
    position: [3, 5],
    reward_yellow: 5,
    reward_purple: 8
  },
  {
    position: [8, 6],
    reward_yellow: 8,
    reward_purple: 5
  }
];

  if (!trees || trees.length !== 2) {
    throw new Error("Expected exactly 2 trees");
  }

  const tree_positions = trees.map(t => t.position);

  const tree_rewards = trees.map(t => ([
    t.reward_yellow,   // agent 0
    t.reward_purple    // agent 1
  ]));

  for (let i = 0; i < numRounds; i++) {

    trials.push({

      trial_number: i + 1,
      trial_type: "coordination",
      name: `coordination_${i + 1}`,

      rows: 10,
      cols: 10,

      agent_types: ["optimist", "pessimist"],

      agent_start_positions: [
        [1, 1],    // Yellow
        [10, 10]   // Purple
      ],

      tree_positions: tree_positions,
      tree_configs: [
        {
          isCenter: false,
          joint_rewards: payoffCondition === "interdependent" ? [5, 1] : [5, 8]
        },
        {
          isCenter: false,
          joint_rewards: payoffCondition === "interdependent" ? [1, 5] : [8, 5]
        },
      ],
      // joint_rewards: dependency === "interdependent" ? [1, 5] : [8, 5],
      tree_rewards: tree_rewards,

      tree_visibility: [1, 1],

      total_steps: 10,

      // Both travel far (coordination)
      target_tree_positions: [
        trees[1].position,
        trees[0].position
      ]
    });
  }

  return trials;
}


function generateCriticalTrial(trialNumber, payoffCondition) {
console.log("Generating critical trial with condition:", payoffCondition);
  const trees = [
  {
    position: [3, 5],
    reward_yellow: 5,
    reward_purple: 8
  },
  {
    position: [8, 6],
    reward_yellow: 8,
    reward_purple: 5
  }
];

const tree_positions = trees.map(t => t.position);

  const tree_rewards = trees.map(t => ([
    t.reward_yellow,   // agent 0
    t.reward_purple    // agent 1
  ]));

  return {
    trial_number: trialNumber,
    trial_type: "critical",
    name: "critical_trial",

    rows: 10,
    cols: 10,

    agent_types: ["optimist", "pessimist"],

    agent_start_positions: [
      [1, 1],
      [10, 10]
    ],

    tree_positions: tree_positions,
    tree_configs: [
      {
        isCenter: false,
        joint_rewards: payoffCondition === "interdependent" ? [5, 1] : [5, 8]
      },
      {
        isCenter: false,
        joint_rewards: payoffCondition === "interdependent" ? [1, 5] : [8, 5]
      },
    ],
    tree_rewards: tree_rewards,
    tree_visibility: [1, 1],
    total_steps: 10,

    // Purple defects to near tree
    target_tree_positions: [
      trees[1].position,  // Yellow goes far
      trees[1].position   // Purple defects
    ]
  };
}


/**
 * Generate all trials for repetition & dependency condition
 */
function generateAllTrials(repetitionCondition, payoffCondition) {
  const numRounds = gs.experiment.repetition_conditions[repetitionCondition] || 2;
  const dependency = gs.experiment.payoff_conditions[payoffCondition] || gs.experiment.payoff_conditions.interdependent;

  const coordinationTrials = generateCoordinationTrials(numRounds, payoffCondition);
  const criticalTrial = generateCriticalTrial(numRounds + 1, payoffCondition);

  return [...coordinationTrials, criticalTrial];
}

