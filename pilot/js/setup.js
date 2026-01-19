
function setupGame() {
  const yellow_hsl = convertToHSL(gs.agent.colors['optimist']);
  const purple_hsl = convertToHSL(gs.agent.colors['pessimist']);
  const yellow_name = gs.agent.names['optimist'];
  const purple_name = gs.agent.names['pessimist'];
  const yellow_text = `<span style="color: ${yellow_hsl}; text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;">${yellow_name}</span>`
  const purple_text = `<span style="color: ${purple_hsl}; text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;">${purple_name}</span>`
  const north_hsl = convertToHSL(gs.tile.colors['Ncorner']);
  const south_hsl = convertToHSL(gs.tile.colors['Scorner']);
  const north_text = `<span style="color: ${north_hsl}; text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;">NORTH</span>`
  const south_text = `<span style="color: ${south_hsl}; text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;">SOUTH</span>`

  // Initialize jsPsych
  const jsPsych = initJsPsych({
    show_progress_bar: true,
    auto_update_progress_bar: false
  });

 /* ---------------------------------------------------------
    GET EXP INFO FROM URL
 --------------------------------------------------------- */
  var queryString = window.location.search;
  var urlParams = new URLSearchParams(queryString);
  gs.prolific_info.prolificID = urlParams.get('PROLIFIC_PID');
  gs.prolific_info.prolificStudyID = urlParams.get('STUDY_ID');
  gs.prolific_info.prolificSessionID = urlParams.get('SESSION_ID');
  gs.session_info.gameID = UUID();

  // Assign repetition condition (between-subjects: 'low' = 2 rounds, 'high' = 6 rounds)
  const conditionParam = urlParams.get('CONDITION');
  gs.session_info.repetition_condition = conditionParam || (Math.random() < 0.5 ? 'low' : 'high');

  // Assign payoff condition (between-subjects: 'interdependent' or 'independent')
  const payoffParam = urlParams.get('PAYOFF_CONDITION');
  gs.session_info.payoff_condition = payoffParam || (Math.random() < 0.5 ? 'interdependent' : 'independent');

  // Generate trials based on conditions
  const experimentTrials = generateAllTrials(gs.session_info.repetition_condition, gs.session_info.payoff_condition);
  const numCoordinationRounds = gs.experiment.repetition_conditions[gs.session_info.repetition_condition];

  console.log("Experiment conditions:", {
    repetition: gs.session_info.repetition_condition,
    payoff: gs.session_info.payoff_condition,
    trials: experimentTrials.length
  });

  // jsdatapipe data filename
  // Random 10-character ID
  const subject_id = jsPsych.randomization.randomID(10);
  const filename = `${subject_id}.csv`;

  gs.session_info.on_finish = function (data) {
    var updatedData = _.omit(data, 'on_finish', 'on_start', 'on_timeline_finish', 'on_timeline_start', 'gridworld')
    console.log('emitting trial data', updatedData)
    //???
    // const total_trials = jsPsych.getProgress().total_trials +
    //                       foragingProcedure.timeline.length * foragingProcedure.timeline_variables.length +
    //                       practiceProcedure.timeline.length * practiceProcedure.timeline_variables.length - 2
    const total_trials = 1; // new code: testing
    jsPsych.setProgressBar(updatedData.trial_index / total_trials);
  };


  /* ---------------------------------------------------------
    LOAD ASSETS
 --------------------------------------------------------- */
  var preload = {
    type: jsPsychPreload,
    images: [
      'assets/image/gridworld.png',
      'assets/image/agent.png',
      'assets/image/harvest.png',
      'assets/image/basket_yellow.png',
      'assets/image/basket_purple.png',
      'assets/image/predict_yellow.gif',
      'assets/image/predict_purple.gif',
      'assets/image/observe.png',
      'assets/image/purchase.png',
    ]
  }
  // set estimated study time in mins
  const time = '5';

  /* ---------------------------------------------------------
    INSTRUCTIONS
 --------------------------------------------------------- */

  var landingPage = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div>
        <p><u>Welcome!</u></p>
      </div>
      <div>
        <p>In this experiment, your task is to evaluate two farmers as they harvest berries from a farm.</p>
        <p>We expect the experiment to take approximately <b>five minutes</b> to complete, including the time it takes to read these instructions.</p>
        <p>Click <b>Get Started</b> to begin.</p>
      </div>`,
    choices: ['Get Started'],
    margin_vertical: "20px"
  };

  var consentPage = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <p><u> Consent Form </u></p>
      <div style="text-align: left; background-color: lightblue; overflow: auto; height: 500px; padding: 20px; max-width: 900px;">
        <p>
          By completing this study, you are participating in research
          being performed by cognitive scientists in the Stanford University
          Department of Psychology. The purpose of this research is to find out
          how people learn about each other using language and conversation.
        </p>
        <p>
          You must be at least 18 years old to participate. There are neither
          specific benefits nor anticipated risks associated with participation
          in this study. Your participation is completely voluntary and you can
          withdraw at any time by simply exiting the study. You may decline to
          answer any or all of the following questions. Choosing not to participate
          or withdrawing will result in no penalty.
        </p>
        <p>Your anonymity is assured: the researchers will not receive any personal
          information about you, and any information you provide will not be shared
          in association with any personally identifying information.</p>
        <p>
          We expect the study to last about ${time} minutes, including the time
          it takes to read these instructions.
        </p>
        <p>
          If you have questions about this research, please contact the researchers
          by sending an email to <b><a href="mailto:jkuang@sas.upenn.edu">jkuang@sas.upenn.edu</a></b>.
          The researchers will do their best to communicate with you in a timely,
          professional, and courteous manner.
        </p>
        <p>
          If you have questions regarding your rights as a research subject, or if
          problems arise which you do not feel you can discuss with the researchers,
          please contact the Stanford University Institutional Review Board.
        </p>
        <p>
          <b>Click <b>I Agree</b> to continue participating in this study.</b>
        </p>
      </div>
    `,
    choices: ['I Agree'],
    margin_vertical: "20px"
  };


  var enterFullscreen = {
    type: jsPsychFullscreen,
    message: `
      <p>The experiment will switch to fullscreen when you press <b>Continue</b> below.</p>
      <p>Please keep your browser maximized for the duration of this study.</p>
    `,
    fullscreen_mode: true
  };

  // Define task instructions language based on payoff condition
  const isInterdependent = gs.session_info.payoff_condition === 'interdependent';
  const payoffs = gs.experiment.payoff_conditions[gs.session_info.payoff_condition];

  // Center tree instruction varies by payoff condition
  const centerTreeInstruction = isInterdependent
    ? `<p><strong>Important:</strong> The <em>large tree in the center</em> has the most berries,
       but it requires <strong>both farmers working together</strong> to harvest fully. The branches
       are too high for one farmer to reach alone.</p>
       <p>When both farmers go to the center tree together, they each get <strong>${payoffs.center_joint} berries</strong>.</p>
       <p>If only one farmer goes to the center tree alone, they can only reach <strong>${payoffs.center_solo} berry</strong>.</p>`
    : `<p>All trees yield the same number of berries.</p>
       <p>The <em>center tree</em> and the <em>corner trees</em> each give <strong>${payoffs.center_solo} berries</strong> per farmer,
       whether they harvest together or alone.</p>`;

  // Corner tree instruction varies by payoff condition
  const cornerTreeInstruction = isInterdependent
    ? `<p>The <em>smaller trees in the corners</em> can be harvested by one farmer alone.</p>
       <p>A farmer who goes to a corner tree will get <strong>${payoffs.corner} berries</strong>.</p>`
    : `<p>The <em>smaller trees in the corners</em> also give <strong>${payoffs.corner} berries</strong> per farmer.</p>`;

  var taskInstructionsHTML = [
    `<p>Imagine you are observing two farmers, ${yellow_text} and ${purple_text},
     as they harvest berries from trees on a shared farm.</p>
     <p>Your job is to watch how they work together over several rounds,
     and then answer some questions about what you observed.</p>`,

    `<p>The farm is a <em>10</em> squares wide and <em>10</em> squares tall grid, just like this:</p>
   <img height="500" src="assets/image/gridworld.png">
   <p>There are <em>berry trees</em> located on the farm.</p>`,

    `<p>Each tree produces two types of berries: yellow berries and purple berries.</p>
   <p>${yellow_text} only harvests yellow berries, while ${purple_text} only harvests purple berries.</p>
   <img height="500" src="assets/image/harvest.png">`,

    centerTreeInstruction,

    cornerTreeInstruction,

    `<p>You will observe ${yellow_text} and ${purple_text} harvest berries over
    <strong>${numCoordinationRounds + 1} rounds</strong>.</p>
    <p>Watch carefully how they coordinate (or don't) at each tree!</p>`,

    `<p>After observing the farmers, you will answer some questions about what you saw
    and what you think about their behavior.</p>`,

   '<p>Let\'s get started!</p> \
      <p>We\'re going to ask you three questions to check your understanding.</p>'
  ];

  var taskInstructions = {
    type: jsPsychInstructions,
    pages: taskInstructionsHTML,
    show_clickable_nav: true,
    allow_keys: false,
    allow_backward: true,
    on_start: function () {
      gs.session_data.startInstructionTS = Date.now();
    }
  }

  /* ---------------------------------------------------------
   COMPREHENSION CHECK
--------------------------------------------------------- */

  function makeCompQuestion(promptText, options, correctAnswer) {
    return {
      timeline: [
        {
          type: jsPsychHtmlButtonResponse,
          stimulus: function() {
            // check last attempt
            const lastTrial = jsPsych.data.get().last(1).values()[0];
            const showError = lastTrial && lastTrial.comp_correct === false;
            return `
              ${showError ? '<p style="color:red; font-weight:bold;">Incorrect, please try again.</p>' : ''}
              <p>${promptText}</p>
            `;
          },
          choices: function() {
            // Shuffle options every time this trial is shown
            return jsPsych.randomization.shuffle(options.slice());
          },
          button_html: '<button class="jspsych-btn" style="display:block; margin: 10px auto; min-width: 150px;">%choice%</button>',
          margin_vertical: "20px",
          on_finish: function(data) {
            // Save the shuffled options for this trial
            const shuffledOptions = this.choices;
            // Mark correctness based on the shuffled options
            data.comp_correct = shuffledOptions[data.response] === correctAnswer;
          }
        }
      ],
      loop_function: function() {
        const lastTrial = jsPsych.data.get().last(1).values()[0];
        return lastTrial.comp_correct === false; // repeat until correct
      }
    };
  }

  // Comprehension questions - vary by payoff condition
  var compQ1, compQ2, compQ3;

  if (isInterdependent) {
    // Interdependent: test understanding of coordination requirement
    compQ1 = makeCompQuestion(
      "1. How many berries does each farmer get if BOTH go to the center tree together?",
      ["1 berry each", "5 berries each", "8 berries each"],
      "8 berries each"
    );

    compQ2 = makeCompQuestion(
      "2. How many berries does a farmer get if they go to the center tree ALONE?",
      ["1 berry", "5 berries", "8 berries"],
      "1 berry"
    );

    compQ3 = makeCompQuestion(
      "3. How many berries does a farmer get from a corner tree?",
      ["1 berry", "5 berries", "8 berries"],
      "5 berries"
    );
  } else {
    // Independent: test understanding that all trees give same reward
    compQ1 = makeCompQuestion(
      "1. How many berries does a farmer get from the center tree?",
      ["1 berry", "5 berries", "8 berries"],
      "5 berries"
    );

    compQ2 = makeCompQuestion(
      "2. How many berries does a farmer get from a corner tree?",
      ["1 berry", "5 berries", "8 berries"],
      "5 berries"
    );

    compQ3 = makeCompQuestion(
      "3. Does the number of berries change if both farmers go to the same tree?",
      ["Yes, they get more berries", "Yes, they get fewer berries", "No, they each get the same amount"],
      "No, they each get the same amount"
    );
  }

  var comprehensionConclusion = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <p>Great job! You understand how ${yellow_text} and ${purple_text} harvest their farm.</p>
      <p>Now you will observe them harvest berries over <strong>${numCoordinationRounds + 1} rounds</strong>.</p>
      <p>Pay close attention to which trees they go to and how many berries they collect!</p>
    `,
    choices: ['Start Observing'],
    margin_vertical: "20px",
  };

  /* ---------------------------------------------------------
  TRIAL - Observation Only (no predictions)
--------------------------------------------------------- */
  var trialProcedure = {
    timeline: [
      // Round intro
      {
        type: jsPsychHtmlButtonResponse,
        stimulus: function () {
          const trialData = jsPsych.timelineVariable('data');
          const idx = trialData.trial_number;
          const isCritical = trialData.trial_type === 'critical';
          const roundLabel = isCritical ? 'Final Round' : `Round ${idx}`;

          return (
            '<p>' +
            yellow_text +
            ' and ' +
            purple_text +
            ' will now harvest berries.</p>' +
            '<p style="font-size: 36px; font-weight: bold;">' +
            roundLabel +
            '</p>'
          );
        },
        choices: ['Watch'],
        margin_vertical: "20px"
      },
      // Observation trial (no predictions)
      _.extend({}, gs.study_metadata, gs.session_info, {
        type: jsPsychNormAgentObserve,
        trial_config: jsPsych.timelineVariable('data'),
        render_previous_path: false,
        previous_path: [],
        on_finish: function (data) {
          var lastTrial = jsPsych.data.get().last(1).values()[0];
          // Save basket info for DV display
          agent0_berries = lastTrial.berries_collected.agent0 || null;
          agent1_berries = lastTrial.berries_collected.agent1 || null;

          // Log trial type for debugging
          const trialData = jsPsych.timelineVariable('data');
          console.log("Completed trial:", trialData.trial_type, "Berries:", agent0_berries, agent1_berries);
        },
      }),
    ],
    timeline_variables: experimentTrials.map((stim, idx) => ({ data: stim, index: idx })),
  };

  /* ---------------------------------------------------------
     TRANSITION TO DV QUESTIONS (after critical trial)
 --------------------------------------------------------- */
  var dvTransition = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <p>You've finished observing ${yellow_text} and ${purple_text}!</p>
      <p>In that last round, ${purple_text} went to a <strong>different tree</strong> than ${yellow_text}.</p>
      <p>Now we'd like to ask you some questions about what you observed.</p>
    `,
    choices: ['Continue to Questions'],
    margin_vertical: "20px",
    post_trial_gap: 500
  };

  // DV Questions - one per page using standard jsPsych slider
  const dvQuestionConfigs = [
    {
      name: 'agreement',
      prompt: `To what extent do you think ${yellow_text} and ${purple_text} had <strong>an unspoken agreement</strong> to harvest the center tree together?`,
      labels: ['Not at all', 'Very much']
    },
    {
      name: 'commitment',
      prompt: `To what extent was ${purple_text} and ${yellow_text} <strong>committed</strong> to harvesting the center tree together?`,
      labels: ['Not at all', 'Very much']
    },
    {
      name: 'anger',
      prompt: `How <strong>angry</strong> would ${yellow_text} feel that ${purple_text} went to a different tree?`,
      labels: ['Not at all angry', 'Very angry']
    },
    {
      name: 'guilt',
      prompt: `How <strong>guilty</strong> would ${purple_text} feel about going to a different tree?`,
      labels: ['Not at all guilty', 'Very guilty']
    }
  ];

  var dvQuestions = {
    timeline: dvQuestionConfigs.map((q, idx) => ({
      type: jsPsychHtmlSliderResponse,
      stimulus: `<p style="font-size: 22px; max-width: 700px; margin: 0 auto; line-height: 1.5;">${q.prompt}</p>`,
      labels: q.labels,
      min: 0,
      max: 100,
      start: 50,
      slider_width: 500,
      require_movement: false,
      button_label: 'Continue',
      data: {
        task: 'dv_question',
        dv_name: q.name,
        question_number: idx + 1,
        repetition_condition: gs.session_info.repetition_condition,
        payoff_condition: gs.session_info.payoff_condition
      }
    }))
  };

  /* ---------------------------------------------------------
    SURVEY
--------------------------------------------------------- */
  var preSurveyMessage = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <p>You have completed the experiment!</p>
      <p>On the next page, you\'ll be shown a brief set of questions about how the experiment went.</p>
      <p>Once you submit your answers, you will be redirected back to Prolific and credited for participation.</p>
    `,
    choices: ['Continue'],
    margin_vertical: "20px"
  }

  // define survey trial
  var exitSurvey = _.extend({},
  gs.study_metadata,
  _.omit(gs.session_info, 'on_finish'),
  gs.prolific_info, {
    type: jsPsychSurveyHtmlForm,
    html: `
    <div style="
        font-size: 26px;        /* base font for all text */
      ">
      <h3 style="text-align:left;">Please answer the following questions:</h3>

      <!-- Gender -->
      <p style="text-align:left;"><strong>What is your gender?</strong></p>
      <label style="display:block; text-align:left;"><input type="radio" name="participantGender" value="Male" required> Male</label>
      <label style="display:block; text-align:left;"><input type="radio" name="participantGender" value="Female"> Female</label>
      <label style="display:block; text-align:left;"><input type="radio" name="participantGender" value="Non-binary"> Non-binary</label>
      <label style="display:block; text-align:left;"><input type="radio" name="participantGender" value="Other"> Other</label><br>

      <!-- Age -->
      <p style="text-align:left;"><strong>How many years old are you?</strong></p>
      <div style="text-align:left; margin-bottom:15px;">
        <input type="number" name="participantYears" placeholder="18" style="width:60px; display:block; font-size: 26px;" required>
      </div>


      <!-- Race -->
      <p style="text-align:left;"><strong>What is your race?</strong></p>
      <label style="display:block; text-align:left;"><input type="radio" name="participantRace" value="White" required> White</label>
      <label style="display:block; text-align:left;"><input type="radio" name="participantRace" value="Black/African American"> Black/African American</label>
      <label style="display:block; text-align:left;"><input type="radio" name="participantRace" value="American Indian/Alaska Native"> American Indian/Alaska Native</label>
      <label style="display:block; text-align:left;"><input type="radio" name="participantRace" value="Asian"> Asian</label>
      <label style="display:block; text-align:left;"><input type="radio" name="participantRace" value="Native Hawaiian/Pacific Islander"> Native Hawaiian/Pacific Islander</label>
      <label style="display:block; text-align:left;"><input type="radio" name="participantRace" value="Multiracial/Mixed"> Multiracial/Mixed</label>
      <label style="display:block; text-align:left;"><input type="radio" name="participantRace" value="Other"> Other</label><br>

      <!-- Ethnicity -->
      <p style="text-align:left;"><strong>What is your ethnicity?</strong></p>
      <label style="display:block; text-align:left;"><input type="radio" name="participantEthnicity" value="Hispanic" required> Hispanic</label>
      <label style="display:block; text-align:left;"><input type="radio" name="participantEthnicity" value="Non-Hispanic"> Non-Hispanic</label><br>

      <!-- Device -->
      <p style="text-align:left;"><strong>Which of the following devices did you use to complete this study?</strong></p>
      <label style="display:block; text-align:left;"><input type="radio" name="inputDevice" value="Mouse" required> Mouse</label>
      <label style="display:block; text-align:left;"><input type="radio" name="inputDevice" value="Trackpad"> Trackpad</label>
      <label style="display:block; text-align:left;"><input type="radio" name="inputDevice" value="Touch Screen"> Touch Screen</label>
      <label style="display:block; text-align:left;"><input type="radio" name="inputDevice" value="Stylus"> Stylus</label>
      <label style="display:block; text-align:left;"><input type="radio" name="inputDevice" value="Other"> Other</label><br>

      <!-- Difficulty -->
      <p style="text-align:left;"><strong>How difficult did you find this study?</strong></p>
      <div style="text-align:left; margin-bottom:15px;">
        <label style="display:inline-block; margin-right:15px;">
          <input type="radio" name="judgedDifficulty" value="1" required> 1 (Very Easy)
        </label>
        <label style="display:inline-block; margin-right:15px;">
          <input type="radio" name="judgedDifficulty" value="2"> 2
        </label>
        <label style="display:inline-block; margin-right:15px;">
          <input type="radio" name="judgedDifficulty" value="3"> 3
        </label>
        <label style="display:inline-block; margin-right:15px;">
          <input type="radio" name="judgedDifficulty" value="4"> 4
        </label>
        <label style="display:inline-block; margin-right:15px;">
          <input type="radio" name="judgedDifficulty" value="5"> 5 (Very Hard)
        </label>
      </div>

      <!-- Effort -->
      <p style="text-align:left;"><strong>How much effort did you put into the game? Your response will not affect your final compensation.</strong></p>
      <div style="text-align:left; margin-bottom:15px;">
        <label style="display:inline-block; margin-right:15px;">
          <input type="radio" name="participantEffort" value="1" required> 1 (Low Effort)
        </label>
        <label style="display:inline-block; margin-right:15px;">
          <input type="radio" name="participantEffort" value="2"> 2
        </label>
        <label style="display:inline-block; margin-right:15px;">
          <input type="radio" name="participantEffort" value="3"> 3
        </label>
        <label style="display:inline-block; margin-right:15px;">
          <input type="radio" name="participantEffort" value="4"> 4
        </label>
        <label style="display:inline-block; margin-right:15px;">
          <input type="radio" name="participantEffort" value="5"> 5 (High Effort)
        </label>
      </div>

      <!-- Comments -->
      <p style="text-align:left;"><strong>What factors influenced how you decided to respond? Any other comments?</strong></p>
      <textarea name="participantComments" rows="4" style="width:100%; text-align:left;" placeholder="I had a lot of fun!"></textarea><br><br>

      <!-- Technical difficulties -->
      <p style="text-align:left;">If you encountered any technical difficulties, please briefly describe the issue.</p>
      <textarea name="TechnicalDifficultiesFreeResp" rows="4" style="width:100%; text-align:left;" placeholder="I did not encounter any technical difficulties."></textarea>
    `,
    button_label: "Submit",
    on_start: function () {
      gs.session_data.endExperimentTS = Date.now(); // collect end experiment time
    },
    on_finish: function (data) {
      var updatedData = _.extend({}, gs.session_data, _.omit(data, 'on_start'));
      console.log('emitting trial data', updatedData)
      jsPsych.setProgressBar(1);
    }
  });

  /* ---------------------------------------------------------
     SAVE DATA
 --------------------------------------------------------- */
  const saveData = {
    type: jsPsychPipe,
    action: "save",
    experiment_id: "y12O7vwqUMve",
    filename: filename,
    data_string: () => {

      // Session metadata (saved only once)
    const sessionMeta = {
      gameID: gs.session_info.gameID,
      prolificID: gs.prolific_info.prolificID,
      studyID: gs.prolific_info.prolificStudyID,
      sessionID: gs.prolific_info.prolificSessionID,
      condition: gs.session_info.condition,
      repetition_condition: gs.session_info.repetition_condition,
      payoff_condition: gs.session_info.payoff_condition
    };

    // Trial-level data only
    const trialData = jsPsych.data.get().values().map(trialData => ({
      trial_index: trialData.trial_index,
      trial_type: trialData.trial_type,
      response: trialData.response ?? null,
      rt: trialData.rt ?? null,
      dv_name: trialData.data.dv_name ?? null
    }));

    // Combine session meta and trial data
    const dataToSave = {
      sessionMeta,
      trials: trialData
    };

    return JSON.stringify(dataToSave);  

    }
  };

  /* ---------------------------------------------------------
     GOODBYE SCREEN
 --------------------------------------------------------- */
  var goodbye = {
    type: jsPsychInstructions,
    pages: function () {
      return [
        `<p>Thanks for participating in our experiment!</p>\
              <p>Please click the <em>Submit</em> button to complete the study.</p>
              <p>Once you click <em>Submit</em>, you will be redirected to Prolific and receive credit for your participation.</p>`
      ]
    },
    show_clickable_nav: true,
    allow_backward: false,
    button_label_next: '< Submit',
    on_finish: () => {
      window.onbeforeunload = null;

      //change this to prolific url
      var completion_url = "https://app.prolific.com/submissions/complete?cc=C1OZN55Q"

      window.open(completion_url, "_self")
    }
  };

  /* ---------------------------------------------------------
     RUN THE EXPERIMENT
 --------------------------------------------------------- */
  trials = [
    preload,
    landingPage,
    consentPage,
    enterFullscreen,
    taskInstructions,
    compQ1,
    compQ2,
    compQ3,
    comprehensionConclusion,
    trialProcedure,
    dvTransition,
    dvQuestions,
    preSurveyMessage,
    exitSurvey,
    saveData,
    goodbye
  ];

  jsPsych.run(trials);
}