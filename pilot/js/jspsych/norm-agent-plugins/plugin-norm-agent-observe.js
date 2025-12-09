var jsPsychNormAgentObserve = (function(jspsych) {
  "use strict";

  const info = {
    name: "norm-agent-observe",
    parameters: {
      // config information for the gridworld
      trial_config: {
        type: jspsych.ParameterType.OBJECT,
        default: undefined,
      },
      // index of the agent
      agent_index: {
        type: jspsych.ParameterType.INT,
        default: 0,
      },
      previous_path: {
        type: jspsych.ParameterType.ARRAY,
        default: [],
      },
      previous_end_position: {
        type: jspsych.ParameterType.ARRAY,
        default: [],
      },
      previous_berries_info: {
        type: jspsych.ParameterType.OBJECT,
        default: null,
        },
      cue_duration: {
        type: jspsych.ParameterType.INT,
        default: 0,
      },
      start_delay: {
        type: jspsych.ParameterType.INT,
        default: 2000,
      },
      end_delay: {
        type: jspsych.ParameterType.INT,
        default: 2000,
      },
      post_trial_gap: {
        type: jspsych.ParameterType.INT,
        default: 0,
      }
    },
  };

  /**
   * **NORM-AGENT-OBSERVE**
   *
   * A jsPsych plugin for an observation trial in the Gridworld environment
   *
   * @author [Jinyi Kuang]
   */
  class NormAgentObservePlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(display_element, trial) {
      const trial_start = Date.now();
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
        Now watch the path <br>
        <span style="color: ${agent0_hsl}; text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;">
          ${agent0_name}
        </span>
        and <br>
        <span style="color: ${agent1_hsl}; text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;">
          ${agent1_name}
        </span> took!
      </div>

      <!-- BUTTON MOVED HERE -->
      <button id="submitBtn">Continue</button>

      <!-- BASKETS BELOW -->
      <div class="baskets-container" style="display: flex; flex-direction: column; gap: 10px; margin-top: 15px;">

        <div class="basketContainer" id="yellowBasketContainer">
          <div class="basketLabel">
            <span style="color: ${agent0_hsl}; text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;">
              ${agent0_name}
            </span>'s Basket:
          </div>
          <canvas id="agent0BasketCanvas" width="200" height="200"></canvas>
          <div class="berryCounter" id="agent0BerriesCounter"></div>
        </div>

        <div class="basketContainer" id="purpleBasketContainer">
          <div class="basketLabel">
            <span style="color: ${agent1_hsl}; text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;">
              ${agent1_name}
            </span>'s Basket:
          </div>
          <canvas id="agent1BasketCanvas" width="200" height="200"></canvas>
          <div class="berryCounter" id="agent1BerriesCounter"></div>
        </div>

      </div>

    </div>
  </div>
`;

      display_element.innerHTML = html;
      const previous_berries_info = typeof trial.previous_berries_info === 'function'
        ? trial.previous_berries_info()
        : trial.previous_berries_info;

      const submitBtn = document.getElementById('submitBtn');
      
      // disable button initially 
      submitBtn.disabled = true; 
      submitBtn.style.opacity = 0.5; 
      submitBtn.style.cursor = 'not-allowed';

      // Initialize the Gridworld with the trial data
      const gridworld = new Gridworld(trial.trial_config, false, null, trial.agent_index, true, trial.previous_path, trial.previous_end_position, previous_berries_info);
      gridworld.agent0Basket.updateCounter();
      gridworld.agent1Basket.updateCounter();
      try {
        // Render each agent's path
        // TODO consider a variable to keep track of which agent is being observed
        // rather than hardcoding the 0 and 1 below
        let optimistStartPosition = [
          trial.trial_config.agent_start_positions[0][0] - 1,
          trial.trial_config.agent_start_positions[0][1] - 1
        ];
        let pessimistStartPosition = [
          trial.trial_config.agent_start_positions[1][0] - 1,
          trial.trial_config.agent_start_positions[1][1] - 1
        ];
        let optimistEndPosition = [
          trial.trial_config.target_tree_positions[0][0] - 1,
          trial.trial_config.target_tree_positions[0][1] - 1
        ];
        let pessimistEndPosition = [
          trial.trial_config.target_tree_positions[1][0] - 1,
          trial.trial_config.target_tree_positions[1][1] - 1
        ];
        let sameEndPosition = trial.trial_config.target_tree_positions[0][0] - 1 == trial.trial_config.target_tree_positions[1][0] - 1 &&
          trial.trial_config.target_tree_positions[0][1] - 1 == trial.trial_config.target_tree_positions[1][1] - 1;

        startObservation(gridworld, 0, trial.trial_config.agent_types[0], optimistStartPosition, optimistEndPosition, sameEndPosition);
        startObservation(gridworld, 1, trial.trial_config.agent_types[1], pessimistStartPosition, pessimistEndPosition, sameEndPosition);
      } catch (error) {
        console.error("Error starting observation:", error);
      }


      // enable submit button after animation duration
      // replace 500 with the actual duration of your animation in ms
      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.style.opacity = 1;
        submitBtn.style.cursor = 'pointer';
      }, 3000);

      // create a warning element shown when participant tries to submit without predicting
      const sidebarEl = document.getElementById('sidebar');
      const warnEl = document.createElement('div');
      warnEl.id = 'predictWarning';
      warnEl.innerText = 'Please finish observation before submitting.';
      warnEl.style.color = '#b00000';
      warnEl.style.fontWeight = '600';
      warnEl.style.marginTop = '10px';
      warnEl.style.display = 'none';
      // Insert the warning *right after* the button
      submitBtn.insertAdjacentElement('afterend', warnEl);

      // click listener
      submitBtn.addEventListener('click', () => {
        const hasObservation =
          (gridworld.agent0Basket ? gridworld.agent0Basket.getBerryInfo().count > 0 : false) ||
          (gridworld.agent1Basket ? gridworld.agent1Basket.getBerryInfo().count > 0 : false);
        if (!hasObservation) {
          // show warning briefly and block submission
          warnEl.style.display = 'block';
          setTimeout(() => { warnEl.style.display = 'none'; }, 2000);
          return;
        }

        const trial_end = Date.now();
  
        // Collect data from the Gridworld
        const trial_data = {
          ..._.omit(trial, 'on_finish', 'type', 'data'),
          actual_trajectory: gridworld.actualTrajectory,
          berries_collected: {
            agent0: gridworld.agent0Basket ? gridworld.agent0Basket.getBerryInfo() : null,
            agent1: gridworld.agent1Basket ? gridworld.agent1Basket.getBerryInfo() : null
          },
          trial_start: trial_start,
          trial_end: trial_end,
          gridworld: gridworld
        };
        //console.log("Trial data collected:", trial_data);

        gridworld.inObservation = true;
        if (trial.post_trial_gap) {
          gridworld.destroy();
          display_element.innerHTML = "";
        }

        // End the trial
        this.jsPsych.finishTrial(trial_data);
      });
    }
  }

  NormAgentObservePlugin.info = info;

  return NormAgentObservePlugin;

})(jsPsychModule);