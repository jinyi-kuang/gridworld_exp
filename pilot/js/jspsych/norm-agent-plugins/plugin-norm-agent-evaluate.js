var jsPsychNormAgentEvaluate = (function (jspsych) {
  "use strict";

  const info = {
    name: 'norm-agent-evaluate',
    parameters: {
      yellow_name: {
        type: jspsych.ParameterType.STRING,
        default: 'Yellow',
      },
      purple_name: {
        type: jspsych.ParameterType.STRING,
        default: 'Purple',
      },
      yellow_color: {
        type: jspsych.ParameterType.STRING,
        default: undefined,
      },
      purple_color: {
        type: jspsych.ParameterType.STRING,
        default: undefined,
      }
    }
  };

  class NormAgentEvaluatePlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(display_element, trial) {
      const trial_start = Date.now();
      display_element.innerHTML = '';

      // Create the HTML content
      const yellow_text = trial.yellow_color ?
        `<span style="color: ${trial.yellow_color}; text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;">${trial.yellow_name}</span>` :
        trial.yellow_name;

      const purple_text = trial.purple_color ?
        `<span style="color: ${trial.purple_color}; text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;">${trial.purple_name}</span>` :
        trial.purple_name;

      display_element.innerHTML = `
        <div class="berry-purchase-container">
    <div style="display: flex; justify-content: space-around; margin: 20px 0;">
      <div id="yellowBasketContainer" class="basketContainer">
        <div class="basketLabel">${yellow_text}'s Basket</div>
        <canvas id="purchaseYellowBasketCanvas" width="300" height="200"></canvas>
        <div id="purchaseYellowBerriesCounter" class="berryCounter"></div>
      </div>
      <div id="purpleBasketContainer" class="basketContainer">
        <div class="basketLabel">${purple_text}'s Basket</div>
        <canvas id="purchasePurpleBasketCanvas" width="300" height="200"></canvas>
        <div id="purchasePurpleBerriesCounter" class="berryCounter"></div>
      </div>
    </div>
          <p>Please decide how many berries you would like to purchase from each farmer:</p>
          <div class="purchase-form">
            <div class="purchase-input">
              <label>How many berries would you like to buy from ${yellow_text}?</label>
              <input type="number" id="yellowCount" min="0" placeholder="Enter a number">
            </div>
            <div class="purchase-input">
              <label>How many berries would you like to buy from ${purple_text}?</label>
              <input type="number" id="purpleCount" min="0" placeholder="Enter a number">
            </div>
        <button type="button" id="submitBtn">Submit Purchase</button>
          </div>
        </div>
      `;

      // Add CSS
      const css = `
        .berry-purchase-container {
          max-width: 1000px;
          margin: 0 auto;
        }
        .basketContainer {
          position: relative;
        }

        .purchase-form {
          margin-top: 20px;
        }
        .purchase-input {
          margin: 10px 0;
        }
        .purchase-input label {
          display: block;
          margin-bottom: 5px;
        }
        .purchase-input input {
          width: 100px;
          padding: 5px;
        }
        
      `;
      const styleSheet = document.createElement("style");
      styleSheet.innerText = css;
      document.head.appendChild(styleSheet);

      // Function to initialize baskets
      const initializeBaskets = () => {
        const yellowCanvas = document.getElementById('purchaseYellowBasketCanvas');
        const purpleCanvas = document.getElementById('purchasePurpleBasketCanvas');
        const yellowContainer = document.getElementById('yellowBasketContainer');
        const purpleContainer = document.getElementById('purpleBasketContainer');
        const yellowCounter = document.getElementById('purchaseYellowBerriesCounter');
        const purpleCounter = document.getElementById('purchasePurpleBerriesCounter');

        if (!yellowCanvas || !purpleCanvas || !yellowContainer || !purpleContainer) {
          requestAnimationFrame(initializeBaskets);
          return;
        }

        try {
          // Get observe trials data
          const observeTrials = this.jsPsych.data.get().filter({ trial_type: 'norm-agent-observe' }).values();
          const agent0_berries = observeTrials.length > 0 ? observeTrials[observeTrials.length - 1].berries_collected.agent0 : null;
          const agent1_berries = observeTrials.length > 0 ? observeTrials[observeTrials.length - 1].berries_collected.agent1 : null;

          // Create baskets
          // Create baskets with correct IDs - these need to match the HTML exactly
          const yellowBasket = new Basket('purchaseYellowBasketCanvas', 'optimist');
          yellowBasket.containerID = 'yellowBasketContainer';

          const purpleBasket = new Basket('purchasePurpleBasketCanvas', 'pessimist');
          purpleBasket.containerID = 'purpleBasketContainer';
          // Add berries
          if (agent0_berries) {
            yellowBasket.addBerries(agent0_berries.count);
            yellowBasket.counterId = 'purchaseYellowBerriesCounter';
            yellowBasket.updateCounter();
          }
          if (agent1_berries) {
            purpleBasket.addBerries(agent1_berries.count);
            purpleBasket.counterId = 'purchasePurpleBerriesCounter';
            purpleBasket.updateCounter();
          }
        } catch (error) {
          console.error('Error initializing baskets:', error);
        }
      };


      requestAnimationFrame(initializeBaskets);

      // Debug the submit button
      const submitBtn = display_element.querySelector('#submitBtn');
      if (!submitBtn) {
        console.error('Submit button not found!');
        return;
      }

      submitBtn.addEventListener('click', () => {
        // Use display_element to query for inputs
        const yellowInput = display_element.querySelector('#yellowCount');
        const purpleInput = display_element.querySelector('#purpleCount');

        if (!yellowInput || !purpleInput) {
          console.error('Input fields not found');
          return;
        }

        const yellowCount = parseInt(yellowInput.value);
        const purpleCount = parseInt(purpleInput.value);

        if (
          isNaN(yellowCount) ||
          isNaN(purpleCount) ||
          yellowCount < 0 ||
          purpleCount < 0 ||
          yellowCount > agent0_berries.count ||
          purpleCount > agent1_berries.count
        ) {
          alert(`Please enter valid numbers. Yellow must be between 0 and ${agent0_berries.count}, and Purple must be between 0 and ${agent1_berries.count}.`);
          return;
        }


        // End trial
        this.jsPsych.finishTrial({
          yellow_purchase: yellowCount,
          purple_purchase: purpleCount,
          rt: Date.now() - trial_start
        });
      });
    }
  }

  NormAgentEvaluatePlugin.info = info;

  return NormAgentEvaluatePlugin;
})(jsPsychModule);