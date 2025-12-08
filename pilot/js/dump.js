  // Add practice/familiarization set
  var practiceSet = {
    // NB: prac1 and prac_rest are really similar, can probably just combine
    prac1_prompt: (color) => `<p>On the next screen, you\'ll see a plot that ${color} is harvesting.</p>`,
    prac_rest_prompt: (color) => `This time, you\'ll see a plot that ${color} is harvesting.`,
    prac_feedback: (correct, total, color, last) => `You got ${correct} out of the ${total} trees that ${color} harvested.\n\
                                        ${last ? '' : 'Let\'s do another one.'}`,
  };

  // NOTE: observed_trajectory is only the trees in the path, not the full path
  var pracData = _.shuffle([
    {
      "name": "trial_806",
      "rows": 10,
      "cols": 10,
      "agent_type": "optimist",
      "agent_start_position": [1, 1],
      "tree_positions": [[1, 2], [1, 7], [10, 4], [2, 10], [4, 8], [8, 2], [8, 5], [10, 9], [3, 6], [4, 4]],
      "tree_rewards": [5, 8, 1, 5, 8, 3, 4, 6, 5, 1],
      "tree_visibility": [1, 0, 1, 1, 1, 1, 1, 1, 1, 1],
      "observed_trajectory": [[1, 2], [1, 7], [4, 8]],
      "total_steps": 10,
      "practice": true
    },{
      "name": "trial_980",
      "rows": 10,
      "cols": 10,
      "agent_type": "optimist",
      "agent_start_position": [1, 1],
      "tree_positions": [[6, 4], [8, 5], [9, 8], [2, 6], [4, 8], [2, 1], [1, 5], [10, 4], [7, 3], [5, 8]],
      "tree_rewards": [5, 6, 4, 1, 3, 3, 3, 5, 9, 6],
      "tree_visibility": [1, 0, 1, 0, 0, 1, 0, 1, 1, 1],
      "observed_trajectory": [[1, 5], [2, 6], [4, 8]],
      "total_steps": 10,
      "practice": true
    },{
      "name": "trial_830",
      "rows": 10,
      "cols": 10,
      "agent_type": "optimist",
      "agent_start_position": [10, 10],
      "tree_positions": [[5, 9], [8, 2], [6, 3], [1, 3], [10, 4], [7, 8], [10, 9], [3, 10], [10, 1], [9, 1]],
      "tree_rewards": [7, 6, 9, 4, 4, 8, 3, 5, 2, 9],
      "tree_visibility": [1, 0, 1, 1, 1, 1, 1, 1, 0, 0],
      "observed_trajectory": [[10, 9], [10, 4], [10, 1], [9, 1]],
      "total_steps": 10,
      "practice": true
    },{
      "name": "trial_761",
      "rows": 10,
      "cols": 10,
      "agent_type": "pessimist",
      "agent_start_position": [1, 1],
      "tree_positions": [[6, 6], [2, 8], [6, 4], [4, 2], [8, 8], [8, 9], [1, 4], [4, 4], [10, 8], [7, 10]],
      "tree_rewards": [9, 7, 9, 5, 4, 4, 2, 4, 3, 8],
      "tree_visibility": [1, 1, 1, 1, 1, 1, 0, 1, 1, 0],
      "observed_trajectory": [[4, 2], [4, 4], [6, 4], [6, 6]],
      "total_steps": 10,
      "practice": true
    },{
      "name": "trial_458",
      "rows": 10,
      "cols": 10,
      "agent_type": "pessimist",
      "agent_start_position": [10, 10],
      "tree_positions": [[1, 2], [9, 4], [3, 10], [10, 3], [8, 7], [3, 2], [10, 2], [5, 5], [3, 1], [4, 6]],
      "tree_rewards": [8, 5, 3, 2, 8, 4, 6, 6, 9, 7],
      "tree_visibility": [1, 1, 0, 0, 1, 1, 0, 1, 1, 1],
      "observed_trajectory": [[8, 7], [4, 6]],
      "total_steps": 10,
      "practice": true
    },{
      "name": "trial_536",
      "rows": 10,
      "cols": 10,
      "agent_type": "pessimist",
      "agent_start_position": [10, 10],
      "tree_positions": [[8, 1], [3, 1], [6, 1], [9, 10], [4, 1], [5, 1], [5, 5], [3, 3], [9, 4], [2, 8]],
      "tree_rewards": [4, 7, 1, 9, 1, 3, 8, 8, 8, 1],
      "tree_visibility": [1, 0, 1, 1, 0, 1, 1, 1, 0, 1],
      "observed_trajectory": [[9, 10], [5, 5]],
      "total_steps": 10,
      "practice": true
    }
  ]);

  var practiceProcedure = {
    timeline: [
      {
        type: jsPsychHtmlButtonResponse,
        stimulus: function() {
          let first_loop = jsPsych.timelineVariable('index') === 0;
          let color = jsPsych.timelineVariable('data').agent_type === 'optimist' ? yellow_text : purple_text;
          return first_loop ? practiceSet.prac1_prompt(color) : practiceSet.prac_rest_prompt(color)},
        choices: ['Continue'],
        margin_vertical: "20px"
      },
      _.extend({}, gs.study_metadata, gs.session_info, {
        type: jsPsychForagePredict,
        data: jsPsych.timelineVariable('data'),
        cue_duration: gs.game_info.cue_duration,
        progress_prompt: function() {
          return `Practice trial ${jsPsych.timelineVariable('index') + 1} of ${pracData.length}`
        }
      }),
      _.extend({}, gs.study_metadata, gs.session_info, {
        type: jsPsychForageObserve,
        data: jsPsych.timelineVariable('data'),
        tree_trajectory: function() { return getFromLastTrial('forage-predict', 'tree_trajectory') },
        coordinate_trajectory: function() { return getFromLastTrial('forage-predict', 'coordinate_trajectory') },
        trees_data: function() { return getFromLastTrial('forage-predict', 'trees_data') },
        sequence_uuid: function() { return getFromLastTrial('forage-predict', 'sequence_uuid') },
        berries_needed: gs.game_info.berries_needed,
        cue_duration: gs.game_info.cue_duration,
        start_delay: gs.game_info.start_delay,
        post_trial_gap: 500,
        progress_prompt: function() {
          return `Practice trial ${jsPsych.timelineVariable('index') + 1} of ${pracData.length}`
        }
      }),
      _.extend({}, gs.study_metadata, gs.session_info, {
        type: jsPsychHtmlButtonResponse,
        stimulus: function() {
          let pred_trees = getFromLastTrial('forage-predict', 'tree_trajectory').map(e => [e[0]+1, e[1]+1]);
          let real_trees = jsPsych.timelineVariable('data').observed_trajectory;
          let last = jsPsych.timelineVariable('index') === (pracData.length - 1);

          let color = jsPsych.timelineVariable('data').agent_type === 'optimist' ? yellow_text : purple_text;
          return practiceSet.prac_feedback(findCommonElements(pred_trees, real_trees).length, real_trees.length, color, last) },
        choices: ['Continue'],
        margin_vertical: "20px"
      }),
    ],
    on_timeline_start: function() {
        gs.session_data.startPracticeTS = Date.now();
    },
    timeline_variables: pracData.map((stim, idx) => ({ data: stim, index: idx })),
    // timeline_variables: trialData // TESTING ONLY
  }
  var comprehensionCheck1 = _.extend({}, gs.study_metadata, gs.session_info, {
    type: jsPsychHtmlButtonResponse,
    stimulus: `<p id = promptid>Someting about ${yellow_text} </p>\
                <img src="assets/comprehension/comprehension1_stim.png" height="400">
                <p style="margin-bottom:0px;"><em>Click the most likely path.</em></p>`,
    choices: _.shuffle([
      '<img src="assets/comprehension/comprehension1_correct.png" height="300"><p style="margin:0px;">HARVESTED: 17</p>',
      '<img src="assets/comprehension/comprehension1_alt1.png" height="300"><p style="margin:0px;">HARVESTED: 15</p>',
      '<img src="assets/comprehension/comprehension1_alt3.png" height="300"><p style="margin:0px;">HARVESTED: 15</p>',
    ]),
    margin_vertical: '10px',
    margin_horizontal: '10px'
  });

  var comprehensionCheck2 = _.extend({}, gs.study_metadata, gs.session_info, {
    type: jsPsychHtmlButtonResponse,
    stimulus: `<p id = promptid>Which path would ${purple_text} take in the plot below?</p>\
                <img src="assets/comprehension/comprehension2_stim.png" height="400">
                <p style="margin-bottom:0px;"><em>Click the most likely path.</em></p>`,
    choices: _.shuffle([
      '<img src="assets/comprehension/comprehension2_correct.png" height="300"><p style="margin:0px;">HARVESTED: 28</p>',
      '<img src="assets/comprehension/comprehension2_alt1.png" height="300"><p style="margin:0px;">HARVESTED: 26</p>',
      '<img src="assets/comprehension/comprehension2_alt2.png" height="300"><p style="margin:0px;">HARVESTED: 28</p>'
    ]),
    margin_vertical: '10px',
    margin_horizontal: '10px'
  });

  var loop_prompt = _.extend({}, gs.study_metadata, gs.session_info, {
    type: jsPsychHtmlButtonResponse,
    stimulus: function() {
      var data = jsPsych.data.get()
      var resp1 = data.values()[data.values().length - 2].responsehtml.includes('correct');
      var resp2 = data.values()[data.values().length - 1].responsehtml.includes('correct');
      var resp = !resp1 && !resp2 ? 'You got both wrong.' : !resp1 ? 'You got the first one wrong.' : 'You got the second one wrong.'

      return `<p>Oh no! ${resp} Let\'s give it another shot.</p>\
      <p>For each question, pay close attention to the available paths and choose the one the farmer is <em>most likely</em> to take.</p>`
    },
    choices: ['Retry'],
    margin_vertical: "20px"
  });

  var ifLoop = {
    timeline: [loop_prompt],
    conditional_function: function() {
      var data = jsPsych.data.get()
      resp1 = data.values()[data.values().length - 2].responsehtml.includes('correct');
      resp2 = data.values()[data.values().length - 1].responsehtml.includes('correct');
      if (resp1 && resp2) {
        return false
      } else {
        gs.session_data.comprehensionAttempts += 1;
        return true
      }
    }
  }

  // redo familiarization if comprehension check failed
  var loopNode = {
    timeline: [comprehensionCheck1, comprehensionCheck2, ifLoop],
    // timeline: [practiceProcedure, comprehensionCheck1, comprehensionCheck2, ifLoop],
    loop_function: function(data) {
      resp1 = data.values()[data.values().length - 2].responsehtml.includes('correct');
      resp2 = data.values()[data.values().length - 1].responsehtml.includes('correct');

      if (resp1 && resp2) {
        return false
      } else {
        return true
      }
    }
  }

    var practiceConclusion = {
    type: jsPsychHtmlButtonResponse,
    stimulus: '<p>Nice work!\
                </br>Now you\'ve had a chance to see how ' + yellow_text + ' and ' + purple_text + ' harvest their farm.\
                </br>On the next screen, you\'ll be asked <em>two</em> questions confirming that everything is crystal clear.</p>\
                <p>Please do your best.\
                </br>You will not be able to proceed to the next part of the experiment until you answer both questions correctly.',
    choices: ['Continue'],
    margin_vertical: "20px"
  }






  

  var getFromLastTrial = function (trialType, selector) {
    return jsPsych.data.get().filter({ trial_type: trialType }).last().select(selector).values[0]
  };

  var foragingProcedure = {
    timeline: [
      _.extend({}, gs.study_metadata, gs.session_info, {
        type: jsPsychForageObserve,
        data: jsPsych.timelineVariable('data'),
        sequence_uuid: function() { return UUID() },
        berries_needed: gs.game_info.berries_needed,
        cue_duration: gs.game_info.cue_duration,
        start_delay: gs.game_info.start_delay,
        end_delay: gs.game_info.end_delay,
        progress_prompt: function() {
          return `Trial ${jsPsych.timelineVariable('index') + 1} of ${trial_stims.stims.length}`
        }
      }),
      _.extend({}, gs.study_metadata, gs.session_info, {
        type: jsPsychForageEvaluate,
        data: jsPsych.timelineVariable('data'),
        sequence_uuid: function() { return getFromLastTrial('forage-observe', 'sequence_uuid') },
        gridworld: function() { return getFromLastTrial('forage-observe', 'gridworld') },
        post_trial_gap: 500,
        questions: function() {
          let agent_succeeded = getFromLastTrial('forage-observe', 'berries_collected') >= getFromLastTrial('forage-observe', 'berries_needed')
          return gs.sliders[gs.session_info.condition].prompts.map((prompt) => prompt(agent_succeeded, jsPsych.timelineVariable('data').agent_type))
        },
        slider_min: gs.sliders[gs.session_info.condition].slider_min,
        slider_max: function() { 
          return gs.sliders[trial_stims.condition].slider_max(jsPsych.timelineVariable('data').agent_type)
        },
        // slider_max: gs.sliders[gs.session_info.condition].slider_max,
        cue_duration: gs.game_info.cue_duration * 2,
        berries_collected: function() { return getFromLastTrial('forage-observe', 'berries_collected') },
      })
    ],
    on_timeline_start: function() {
      gs.session_data.startExperimentTS = Date.now();
    },
    timeline_variables: trial_stims.stims.map((stim, idx) => ({ data: stim, index: idx })),
  }
