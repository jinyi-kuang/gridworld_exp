
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
  gs.session_info.condition = trial_stims.condition;

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
  const time = '10';

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
        <p>In this experiment, your task is to watch two farmers as they harvest berries from a farm.</p>
        <p>We expect the experiment to take approximately 10 minutes to complete, including the time it takes to read these instructions.</p>
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
      <p>The experiment will switch to fullscreen when you press the button below.</p>
      <p>Please keep your browser maximized for the duration of this study.</p>
    `,
    fullscreen_mode: true
  };

  // Define task instructions language
  var taskInstructionsHTML = [
    `<p>Imagine you are a berry retailer. Your task is to observe two different farmers,
     ${yellow_text} and ${purple_text}, as they harvest berries from trees on a shared farm,
     and then you will decide how many berries to purchase from them.</p>`,

    `<p>The farm has a number of different <em>plots</em> that need harvesting.</p>
   <p>Each plot is <em>10</em> squares wide and <em>10</em> squares tall, just like this:</p>
   <img height="550" src="assets/image/gridworld.png">
   <p>There are <em>berry trees</em> spread throughout the plot.</p>`,

    `<p>Each tree produces two different type of berry, yellow berries and purple berries.</p>
   <p>${yellow_text} only harvest yellow berries, while ${purple_text} only harvest purple berries. </p>
   <img height="550" src="assets/image/harvest.png">`,

  // `<p>The farmers can harvest berries together or separately. If they come to harvest together, they will harvest all the berries from the same square.
  // <p>If they come to separate squares, they will only be able to harvest a portion of the berries from that square.</p>`,

    `<p>On each plot, you will first make prediction about which tree the two farmers will harvest one by one. </p>
    <p>You will click on one tree to make your prediction for ${yellow_text} first just like this: .</p>
    <img height="550" src="assets/image/predict_yellow.gif">`,

    `Next, you will click on one tree to make your prediction for ${purple_text} just like this: .</p>
    <img height="550" src="assets/image/predict_purple.gif">`,

    `<p>Next, you will observe the farmers as they harvest the berries from the trees. </p>
    <img height="550" src="assets/image/observe.png"> </p>
    <p>This process will repeat for several rounds. </p>`,

    `<p>After observing both farmers, you will decide how many berries to purchase from each farmer </p>
   <p>Each berry you purchase will bring the farmers $0.1 profit, no matter what type of berries. Any berries you did not purchase will go perished. </p>`,

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
          on_finish: function(data) {
            // Save the shuffled options for this trial
            const shuffledOptions = this.choices;
            // Mark correctness based on the shuffled options
            data.comp_correct = shuffledOptions[data.response] === correctAnswer;
            button_html: '<button class="jspsych-btn" style="display:block; width:100%; margin: 5px 0;">%choice%</button>'
          }
        }
      ],
      loop_function: function() {
        const lastTrial = jsPsych.data.get().last(1).values()[0];
        return lastTrial.comp_correct === false; // repeat until correct
      }
    };
  }

  // Example questions
  var compQ1 = makeCompQuestion(
    "1. What are you asked to do?",
    ["Harvest berries", "Purchase berries", "Play the agent role"],
    "Purchase berries"
  );

  var compQ2 = makeCompQuestion(
    "2. Which of the following is a type of berry the purple agent can harvest?",
    ["Blue berry", "Yellow berry", "Purple berry"],
    "Purple berry"
  );

  var compQ3 = makeCompQuestion(
    "3. Assume you only purchased half of the berries harvested by the yellow agent. What happens to the other half?",
    ["Yellow agent keeps them", "They perish", "They are given to the purple agent"],
    "They perish"
  );

  var comprehensionConclusion = {
    type: jsPsychHtmlButtonResponse,
    stimulus: '<p>Great job! \
                </br>You\'ve learned everything you need to know about how ' + yellow_text + ' and ' + purple_text + ' harvest their farm.</p>\
                <p>Now, your job is to <em>evaluate</em> them as they harvest a <em>new</em> set of plots.\
                </br>In the next part, you\'ll see both farmers harvest new plots.</p>',
    choices: ['Continue'],
    margin_vertical: "20px"
  }

  /* ---------------------------------------------------------
  TRIAL
--------------------------------------------------------- */
  var trialProcedure = {
    timeline: [
      {
        type: jsPsychHtmlButtonResponse,
        stimulus: function () {
          const idx = jsPsych.timelineVariable('index') + 1;
          return (
            '<p>Nice job! Now ' +
            yellow_text +
            ' and ' +
            purple_text +
            ' will harvest plot ' +
            '<span style="font-size: 36px; font-weight: bold;">' +
            idx +
            '</span>.</p>'
          );
        },
        choices: ['Continue'],
        margin_vertical: "20px"
      },
      _.extend({}, gs.study_metadata, gs.session_info, {
        type: jsPsychNormAgentPredict,
        trial_config: jsPsych.timelineVariable('data'),
        agent_index: 0,
        render_previous_path: false,
        on_finish: function (data) {
          // new code: Save agent 0's path for use in agent 1's trial
          var lastTrial = jsPsych.data.get().last(1).values()[0];
          agent0_path_predict = lastTrial.coordinate_trajectory || [];
        }
      }),
      //{
      //  type: jsPsychHtmlButtonResponse,
      //  stimulus: '<p>Nice job! Now it\'s time to predict what ' + purple_text + ' will do.</p>',
      //  choices: ['Continue'],
      //  margin_vertical: "20px"
      // },
      _.extend({}, gs.study_metadata, gs.session_info, {
        type: jsPsychNormAgentPredict,
        trial_config: jsPsych.timelineVariable('data'),
        agent_index: 1,
        render_previous_path: true,
        previous_path: function () { return agent0_path_predict; },
        on_finish: function (data) {
          // new code: Save agent 0's path for use in agent 1's trial
          var lastTrial = jsPsych.data.get().last(1).values()[0];
          agent1_path_predict = lastTrial.coordinate_trajectory || [];
          agents_path_predict = agent0_path_predict.concat(agent1_path_predict);
        }
      }),
      //{
      //  type: jsPsychHtmlButtonResponse,
      //  stimulus: '<p>Now it\'s time to observe what ' + yellow_text + ' and ' + purple_text + ' did.</p>',
      //  choices: ['Continue'],
      //  margin_vertical: "20px"
      //},
      _.extend({}, gs.study_metadata, gs.session_info, {
        type: jsPsychNormAgentObserve,
        trial_config: jsPsych.timelineVariable('data'),
        render_previous_path: true,
        on_finish: function (data) {
          // new code: Save agent 0's path for use in agent 1's trial
          var lastTrial = jsPsych.data.get().last(1).values()[0];
          // Save path info
          //agent0_path_observe = lastTrial.actual_trajectory || [];
          //agent0_end_position = lastTrial.actual_trajectory ? lastTrial.actual_trajectory.slice(-1)[0] : null;
          // Save basket info
          agent0_berries = lastTrial.berries_collected.agent0 || null;
          agent1_berries = lastTrial.berries_collected.agent1 || null;
        },
        previous_path: function () { return agents_path_predict; },

      }),
    ],
    timeline_variables: testTrials.map((stim, idx) => ({ data: stim, index: idx })),
  };

  /* ---------------------------------------------------------
     PURCHASE DECISION
 --------------------------------------------------------- */
  var purchaseIntro = {
    type: jsPsychHtmlButtonResponse,
    stimulus: '<p>Nice work! Now it is time to purchase berries.</p>  You will need to decide how many berries to purchase from each farmer from their most recent harvest.</p>' +
      '<p>Each berry you purchase will bring the farmers $0.1 profit, no matter what type of berries.</p>' + 
      '<p>Any berries you did not purchase will go perished. </p>',
    choices: ['Continue'],
    margin_vertical: "20px"
  };

  var purchaseDecision = {
    type: jsPsychNormAgentEvaluate,
    yellow_name: gs.agent.names['optimist'],
    purple_name: gs.agent.names['pessimist'],
    yellow_color: convertToHSL(gs.agent.colors['optimist']),
    purple_color: convertToHSL(gs.agent.colors['pessimist']),
    data: {
      task: 'berry_purchase'
    }
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
      const sessionMeta = {
        gameID: gs.session_info.gameID,
        prolificID: gs.prolific_info.prolificID,
        studyID: gs.prolific_info.prolificStudyID,
        sessionID: gs.prolific_info.prolificSessionID,
        condition: gs.session_info.condition
      };
      // Get jsPsych data as array of plain objects
      const allData = jsPsych.data.get().values().map(trialData => ({
        trial_index: trialData.trial_index,
        trial_type: trialData.trial_type,
        response: trialData.response,
        ...sessionMeta
      }));

      // Convert to JSON string
    return JSON.stringify(allData);

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
      var completion_url = "https://github.com/jinyi-kuang/gridworld_exp"

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
    purchaseIntro,
    purchaseDecision,
    preSurveyMessage,
    exitSurvey,
    saveData,
    goodbye
  ];

  jsPsych.run(trials);
}