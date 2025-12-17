var jsPsychNormAgentPredict = (function (jspsych) {
  "use strict";

  const info = {
    name: "norm-agent-predict",
    parameters: {
      // config information for the gridworld
      trial_config: {
        type: jspsych.ParameterType.OBJECT,
        default: undefined,
      },
      // index of the agent to predict
      agent_index: {
        type: jspsych.ParameterType.INT,
        default: 0,
      },
      //whether to render previous path
      render_previous_path: {
        type: jspsych.ParameterType.BOOL,
        default: false,
      },
      //the path of the previous agent
      previous_path: {
        type: jspsych.ParameterType.ARRAY,
        default: [],
      },
    },
  };

  /**
   * **NORM-AGENT-PREDICT**
   *
   * A jsPsych plugin for a prediction trial in the Gridworld environment
   *
   * @author [Jinyi Kuang]
   */
  class NormAgentPredictPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(display_element, trial) {
      const trial_start = Date.now();
      const sequence_uuid = UUID();
      // TODO get rid of these eventually...(or update)
      const agent_name = gs.agent.names[trial.trial_config.agent_types[trial.agent_index]];
      const agent_hsl = convertToHSL(gs.agent.colors[trial.trial_config.agent_types[trial.agent_index]]);
      const agent0_name = gs.agent.names[trial.trial_config.agent_types[0]];
      const agent0_hsl = convertToHSL(gs.agent.colors[trial.trial_config.agent_types[0]]);
      const agent1_name = gs.agent.names[trial.trial_config.agent_types[1]];
      const agent1_hsl = convertToHSL(gs.agent.colors[trial.trial_config.agent_types[1]]);

      let html = `
  <div id="gridworldContainer">
    <div id="gridworldAndSteps">
      <canvas id="gridworldCanvas" width="800" height="800"></canvas>
    </div>

    <div id="sidebar">

      <div id="instructionText">
        Click the tree you think
        <span style="color: ${agent_hsl}; text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;">
          ${agent_name}
        </span> will harvest.
      </div>

      <!-- MOVE BUTTON HERE -->
      <button id="submitBtn">Continue</button>

      <!-- BASKETS BELOW -->
      <div class="baskets-container" style="display: flex; flex-direction: column; gap: 10px; margin-top: 15px;">

        <div class="basketContainer" id="yellowBasketContainer">
          <div class="basketLabel">
            <span style="color: ${agent0_hsl}; text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;">
              ${agent0_name}
            </span>'s Basket:
          </div>
          <canvas id="agent0BasketCanvas" width="100" height="200"></canvas>
          <div class="berryCounter" id="agent0BerriesCounter"></div>
        </div>

        <div class="basketContainer" id="purpleBasketContainer">
          <div class="basketLabel">
            <span style="color: ${agent1_hsl}; text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;">
              ${agent1_name}
            </span>'s Basket:
          </div>
          <canvas id="agent1BasketCanvas" width="100" height="200"></canvas>
          <div class="berryCounter" id="agent1BerriesCounter"></div>
        </div>

      </div>

    </div>
  </div>
`;


      display_element.innerHTML = html;

      const agent0BasketCanvas = document.getElementById('agent0BasketCanvas');
      const agent1BasketCanvas = document.getElementById('agent1BasketCanvas');
      const agent0BasketContainer = document.getElementById('agent0BasketContainer');
      const agent1BasketContainer = document.getElementById('agent1BasketContainer');
      const agent0BerriesCounter = document.getElementById('agent0BerriesCounter');
      const agent1BerriesCounter = document.getElementById('agent1BerriesCounter');

      // Create baskets
      const agent0Basket = new Basket('agent0BasketCanvas', 'optimist');
      agent0Basket.containerID = 'agent0BasketContainer';
      const agent1Basket = new Basket('agent1BasketCanvas', 'pessimist');
      agent1Basket.containerID = 'agent1BasketContainer';

      console.log('trial config', trial.trial_config);
      console.log('agent index', trial.agent_index);

      // create grid world
      const gridworld = new Gridworld(trial.trial_config, true, null, trial.agent_index, trial.render_previous_path, trial.previous_path);

      // create submit button
      const submitBtn = document.getElementById('submitBtn');
      submitBtn.innerText = "Submit";


      // disable button when no prediction is made
      submitBtn.disabled = true;
      submitBtn.style.opacity = 0.5;
      submitBtn.style.cursor = 'not-allowed';
      let hasPrediction = false;

      function checkPrediction() {
        const submitBtn = document.getElementById("submitBtn");
        if (hasPrediction) {
          submitBtn.disabled = false;
          submitBtn.style.opacity = 1;
          submitBtn.style.cursor = 'pointer';
        } else {
          submitBtn.disabled = true;
          submitBtn.style.opacity = 0.5;
          submitBtn.style.cursor = 'not-allowed';
        }
        return hasPrediction;
      }

      const canvas = document.getElementById("gridworldCanvas");

      canvas.addEventListener("click", (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Convert pixel → grid cell
        const col = Math.floor(x / gridworld.cellSize);
        const row = Math.floor(y / gridworld.cellSize);

        // Check if the clicked cell is a tree
        const clickedTree = gridworld.trees.some(tree =>
          tree.x === col && tree.y === row
        );

        if (clickedTree) {
          hasPrediction = true;
        } else {
          hasPrediction = false;
        }
        checkPrediction();
      });

      // create a warning element shown when participant tries to submit without predicting
      const sidebarEl = document.getElementById('sidebar');
      const warnEl = document.createElement('div');
      warnEl.id = 'predictWarning';
      warnEl.innerText = 'Please click at least one tree before submitting.';
      warnEl.style.color = '#b00000';
      warnEl.style.fontWeight = '600';
      warnEl.style.marginTop = '10px';
      warnEl.style.display = 'none';
      // Insert the warning *right after* the button
      submitBtn.insertAdjacentElement('afterend', warnEl);

      // show warning when submit button is clicked without a prediction
      submitBtn.addEventListener('click', () => {
        // check whether a prediction was made
        const hasPrediction =
          (gridworld.coordinateTrajectory && gridworld.coordinateTrajectory.length > 0) ||
          (gridworld.treeTrajectory && gridworld.treeTrajectory.length > 0);
        if (!hasPrediction) {
          // show warning briefly and block submission
          warnEl.style.display = 'block';
          setTimeout(() => { warnEl.style.display = 'none'; }, 2000);
          return;
        }

        const trial_end = Date.now();

         const trial_data = {
           ..._.omit(trial, 'on_finish', 'type', 'data'),
           sequence_uuid: sequence_uuid,
           agent_name: agent_name,
           agent_index: trial.agent_index,
           agent_types: trial.trial_config.agent_types,
           tree_trajectory: gridworld.treeTrajectory,
           coordinate_trajectory: gridworld.coordinateTrajectory,
           click_events: gridworld.clickEvents,
           trial_start: trial_start,
           trial_end: trial_end
        };

        gridworld.destroy();
        display_element.innerHTML = '';
        this.jsPsych.finishTrial(trial_data);
      });
    }
  }

  NormAgentPredictPlugin.info = info;

  return NormAgentPredictPlugin;

})(jsPsychModule);