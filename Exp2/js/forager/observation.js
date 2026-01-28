/**
 * Observation module for joint commitment experiment
 * Handles agent movement and interdependent berry collection
 */

// Track agent arrivals for coordinated harvest
let agentArrivals = {
  agent0: { arrived: false, endPosition: null, tree: null },
  agent1: { arrived: false, endPosition: null, tree: null }
};

/**
 * Reset arrival tracking for new trial
 */
function resetAgentArrivals() {
  agentArrivals = {
    agent0: { arrived: false, endPosition: null, tree: null },
    agent1: { arrived: false, endPosition: null, tree: null }
  };
}

/**
 * Check if both agents are at the same tree (center tree coordination)
 * @param {Gridworld} gridworld - The Gridworld instance
 * @returns {boolean} True if both agents ended at the same tree
 */
function areBothAgentsAtSameTree(gridworld) {
  const pos0 = agentArrivals.agent0.endPosition;
  const pos1 = agentArrivals.agent1.endPosition;

  if (!pos0 || !pos1) return false;

  return pos0[0] === pos1[0] && pos0[1] === pos1[1];
}

/**
 * Determine berry reward for an agent based on coordination
 * @param {Tree} tree - The target tree
 * @param {string} agentType - 'optimist' or 'pessimist'
 * @param {boolean} notCoordinated - Whether both agents are at this tree
 * @returns {number} Number of berries to harvest
 */
function determineBerryReward(tree, agentType, notCoordinated) {
  if (!tree) return 0;

  if (notCoordinated && tree.isCenter){
    return agentType === 'optimist' ? 1:5

  }
  if (notCoordinated && !tree.isCenter){
    return agentType === 'optimist' ? 8 : 5;
}
else{ 
  return agentType === 'optimist' ? 8 : 8;
}
};


/**
 * Perform harvest animation after both agents have arrived
 * @param {Gridworld} gridworld - The Gridworld instance
 */
function performCoordinatedHarvest(gridworld) {
  const notCoordinated = areBothAgentsAtSameTree(gridworld);

  console.log("Performing coordinated harvest:", {
    notCoordinated,
    agent0Pos: agentArrivals.agent0.endPosition,
    agent1Pos: agentArrivals.agent1.endPosition
  });

  // Process each agent's harvest
  ['agent0', 'agent1'].forEach((agentKey, idx) => {
    const arrival = agentArrivals[agentKey];
    const tree = arrival.tree;
    const agentType = idx === 0 ? 'optimist' : 'pessimist';

    if (tree) {
      const berryCount = determineBerryReward(tree, agentType, notCoordinated);

      // Use partial harvest animation for solo center tree attempt
      if (notCoordinated) {
        tree.partialHarvest(agentType, berryCount, () => {
          gridworld.inObservation = false;
          gridworld.collectBerries(berryCount, agentType);
        });
      } else {
        // Normal full harvest
        tree.shakeTree(agentType, () => {
          gridworld.inObservation = false;
          gridworld.collectBerries(berryCount, agentType);
        }, berryCount);
      }
    }
  });

  // Enable submit button after harvest
  setTimeout(() => {
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.disabled = false;
  }, gs.tree.animations.shake.duration * 1.5 + 100);
}

/**
 * Starts the observation of an agent's trajectory in the Gridworld.
 * Waits for both agents to arrive before harvesting.
 * @param {Gridworld} gridworld - The Gridworld instance.
 * @param {number} currentAgentIdx - Index of the current agent (0 or 1)
 * @param {string} agentType - 'optimist' or 'pessimist'
 * @param {Array} startPosition - [x, y] start position
 * @param {Array} endPosition - [x, y] target position
 * @param {boolean} offsetEndPosition - Whether to offset position when both at same spot
 */
function startObservation(gridworld, currentAgentIdx, agentType, startPosition, endPosition, offsetEndPosition) {
  gridworld.animateAgentMovement(
    currentAgentIdx,
    startPosition,
    endPosition,
    offsetEndPosition,
    gs.agent.animations.speed,
    false,
    false,
    () => {
      // Find the tree at the end position
      const targetTree = gridworld.trees.find(tree =>
        tree.x === endPosition[0] && tree.y === endPosition[1]
      );

      // Record this agent's arrival
      const agentKey = currentAgentIdx === 0 ? 'agent0' : 'agent1';
      agentArrivals[agentKey] = {
        arrived: true,
        endPosition: endPosition,
        tree: targetTree
      };

      // Check if both agents have arrived
      if (agentArrivals.agent0.arrived && agentArrivals.agent1.arrived) {
        // Both arrived - perform coordinated harvest
        performCoordinatedHarvest(gridworld);
      }
    });
}

/**
 * Legacy function for simple observation without coordination tracking
 * Used for backward compatibility
 */
function startSimpleObservation(gridworld, currentAgentIdx, agentType, startPosition, endPosition, offsetEndPosition) {
  gridworld.animateAgentMovement(
    currentAgentIdx,
    startPosition,
    endPosition,
    offsetEndPosition,
    gs.agent.animations.speed,
    false,
    false,
    () => {
      const targetTree = gridworld.trees.find(tree =>
        tree.x === endPosition[0] && tree.y === endPosition[1]
      );

      if (targetTree) {
        targetTree.shakeTree(agentType, () => {
          gridworld.inObservation = false;
          const numBerries = agentType === 'optimist' ? targetTree.optimistBerries.length : targetTree.pessimistBerries.length;
          gridworld.collectBerries(numBerries, agentType);
          document.getElementById('submitBtn').disabled = false;
        });
      } else {
        gridworld.inObservation = false;
        document.getElementById('submitBtn').disabled = false;
      }
    });
}
