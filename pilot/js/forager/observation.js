/**
 * Starts the observation of the agent's trajectory in the Gridworld.
 * @param {Gridworld} gridworld - The Gridworld instance.
 * @param {Object} trial_config - Data containing the observed trajectory and agent start position.
 */
function startObservation(gridworld, currentAgentIdx, agentType, startPosition, endPosition, offsetEndPosition) {

  console.log("Starting observation with:", {
    gridworld: gridworld,
    agentType: agentType,
    trees: gridworld.trees,
  });

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

      if (targetTree) {
        // Shake the tree if found
        targetTree.shakeTree(agentType, () => {
          gridworld.inObservation = false;
          const numBerries = agentType === 'optimist' ? targetTree.optimistBerries.length : targetTree.pessimistBerries.length;
          gridworld.collectBerries(numBerries, agentType);
          document.getElementById('submitBtn').disabled = false;
        });
      } else {
        // If no tree found, just finish the observation
        gridworld.inObservation = false;
        document.getElementById('submitBtn').disabled = false;
      }
    });
}


// /**
//  * Moves the agent to the next step in the observed trajectory.
//  * @param {number} stepIndex - Index of the current step in the observed trajectory.
//  */
// function nextStep(stepIndex) {
//   if (stepIndex < trial_config.observed_trajectory.length) {
//     const currentPosition = stepIndex === 0 ?
//       [trial_config.agent_start_positions[0] - 1, trial_config.agent_start_positions[1] - 1] :
//       [trial_config.observed_trajectory[stepIndex - 1][0] - 1, trial_config.observed_trajectory[stepIndex - 1][1] - 1];

//     const nextPosition = [
//       trial_config.observed_trajectory[stepIndex][0] - 1,
//       trial_config.observed_trajectory[stepIndex][1] - 1
//     ];

//     gridworld.animateAgentMovement(currentPosition, nextPosition, gs.agent.animations.speed, false, false, () => {
//       const treeIndex = gridworld.trees.findIndex(tree => tree.x === nextPosition[0] && tree.y === nextPosition[1]);

//       if (treeIndex !== -1) {
//         const berriesCollected = gridworld.trees[treeIndex].shakeTree(() => {
//           nextStep(stepIndex + 1);
//         });
//         //gridworld.basket.addBerries(berriesCollected);
//       } else {
//         nextStep(stepIndex + 1);
//       }
//     });
//   } else {
//     returnHome(stepIndex - 1);
//   }
// }
// Animate agent from start to target tree



// /**
//  * Returns the agent to the starting position.
//  * @param {number} stepIndex - Index of the current step in the observed trajectory.
//  */
// function returnHome(stepIndex) {
//   if (stepIndex >= 0) {
//     const currentPosition = [
//       trial_config.observed_trajectory[stepIndex][0] - 1,
//       trial_config.observed_trajectory[stepIndex][1] - 1
//     ];

//     const nextPosition = stepIndex === 0 ?
//       [trial_config.agent_start_position[0] - 1, trial_config.agent_start_position[1] - 1] :
//       [trial_config.observed_trajectory[stepIndex - 1][0] - 1, trial_config.observed_trajectory[stepIndex - 1][1] - 1];

//     gridworld.animateAgentMovement(currentPosition, nextPosition, gs.agent.animations.return_speed, true, true, () => {
//       returnHome(stepIndex - 1);
//     });
//   } else {
//     gridworld.inObservation = false;
//     setTimeout(() => {
//       document.getElementById('submitBtn').click();
//     }, end_delay);
//   }
// }

//  nextStep(0); // Start the observation
//}