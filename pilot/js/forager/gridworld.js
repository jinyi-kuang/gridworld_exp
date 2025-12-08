/**
 * Class representing the Gridworld environment.
 * @param {Object} data - Data for setting up the gridworld.
 * @param {boolean} isPredictTrial - Indicates if it is a predict trial.
 * @param {Array} [treesData=null] - Optional existing tree data.
 */
class Gridworld {
  constructor(trial_config, isPredictTrial, treesData = null, currentAgentIdx = 0, render_previous_path=false, previous_path=[],previous_end_position=[],previous_berries_info=null) {
    this.trial_config = trial_config;
    this.isPredictTrial = isPredictTrial;
    this.canvas = document.getElementById('gridworldCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.cellSize = this.canvas.width / this.trial_config.rows;
    this.totalSteps = trial_config.total_steps;
    this.remainingSteps = trial_config.total_steps;

    // new code
    const agentType = this.trial_config.agent_types[currentAgentIdx];

    this.trees = treesData ? treesData.map(treeData =>
      new Tree(treeData.x, treeData.y, treeData.reward, treeData.isVisible, this.cellSize, agentType,treeData.leaves, treeData.berries)
    ) : this.trial_config.tree_positions.map((location, index) =>
      new Tree(location[0] - 1, location[1] - 1, this.trial_config.tree_rewards[index], this.trial_config.tree_visibility[index], this.cellSize, agentType)
    );

    // new code: handle multiple agents
    this.agentStartPositions = this.trial_config.agent_start_positions.map(pos => [pos[0] - 1, pos[1] - 1]);

    // new code: handle multiple agents
    this.agents = this.agentStartPositions.map((pos, i) =>
      new Agent(pos[0], pos[1], this.trial_config.agent_types[i], this.cellSize)
    );

    // new code: keep track of which agent is currently being controlled
    this.currentAgentIdx = currentAgentIdx;

    this.tileInfo = {
      baseTileSize: gs.tile.size.base,
      pathTileSize: gs.tile.size.path,
      realTileSize: gs.tile.size.real,
      baseColor: gs.tile.colors.default,
      pathColor: gs.tile.colors[`${this.trial_config.agent_types[this.currentAgentIdx]}_path`],
      cornerColorN: gs.tile.colors.Ncorner,
      cornerColorS: gs.tile.colors.Scorner
    }

    // new code
    // pass in an extra parameter using if else, if currentAgentIdx =0, store the current agent path, if
    //  currentAgentIdx=1, show the previous agent's path
    this.render_previous_path = render_previous_path;
    this.previous_path = previous_path;
    this.previous_end_position = previous_end_position;


    // new code: in observe trials, put previous agent in the endposition
    if (!this.isPredictTrial && this.render_previous_path && this.previous_end_position.length === 2) {
      this.agents[0].x = this.previous_end_position[0];
      this.agents[0].y = this.previous_end_position[1];
    }

    this.trees.forEach(tree => {
      tree.borderColor = isPredictTrial ? gs.tree.colors[`${this.trial_config.agent_types[this.currentAgentIdx]}_border`] : gs.tree.colors[`${this.trial_config.agent_types[this.currentAgentIdx]}_border_predict`];
      tree.actualBorderColor = this.agents[this.currentAgentIdx].fillStyle;
    });

    // In Gridworld constructor
    if (!isPredictTrial) {
        this.agent0Basket = new Basket('agent0BasketCanvas', this.trial_config.agent_types[0]);
        this.agent1Basket = new Basket('agent1BasketCanvas', this.trial_config.agent_types[1]);
    } else {
        this.agent0Basket = null;
        this.agent1Basket = null;
    }

    this.animationFrameId = null;

    this.treeTrajectory = [];
    this.coordinateTrajectory = [];
    this.coordinateTrajectoryQueue = [];
    this.coordinateTrajectoryUndoQueue = [];
    this.actualTreeTrajectory = [];
    this.actualTrajectory = [];
    this.actualTrajectoryQueue = [];
    this.clickEvents = [];
    this.inObservation = true;
    this.clickDebounceTimeout = null;

    this.init();
  }

  init() {
    this.animationFrameId = requestAnimationFrame(this.loop.bind(this));

    if (this.isPredictTrial) {
      this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
      this.canvas.addEventListener('mousemove', this.handleCanvasHover.bind(this));
      this.canvas.addEventListener('mouseout', this.handleCanvasHoverout.bind(this));
    } else {
      this.canvas.addEventListener('mousemove', this.handleCanvasHover.bind(this));
    }
  }

  collectBerries(n, agentType) {
    if (agentType === 'optimist') {
      this.agent0Basket.addBerries(n);
    } else if (agentType === 'pessimist') {
      this.agent1Basket.addBerries(n);
    }
  }

  handleCanvasClick(event) {
    if (this.clickDebounceTimeout) {
      clearTimeout(this.clickDebounceTimeout);
    }
    this.clickDebounceTimeout = setTimeout(() => {
      this.processCanvasClick(event);
    }, 25);
  }

  loop() {
    this.updateCanvas();
    this.updateTrees();
    this.updateSubmitButton();
    this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
  }

  updateTrees() {
    this.trees.forEach(tree => {
      const lastTreePosition = this.treeTrajectory.length > 0 ? this.treeTrajectory[this.treeTrajectory.length - 1] : this.agentStartPositions[this.currentAgentIdx];
      tree.updatePathStatus(this.treeTrajectory);
      tree.updateActualPathStatus(this.actualTreeTrajectory);
      tree.updateReachableStatus(lastTreePosition, this.remainingSteps);
    });
  }

  updateSubmitButton() {
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
      // TODO: handle submit button disabling
      // original code
      // submitBtn.disabled = this.isPredictTrial ? this.canReachMoreTrees() : this.inObservation;
      // update:
      submitBtn.disabled = false;
      //submitBtn.style.opacity = !(this.isPredictTrial ? 0 : 1) | 0;
    }
  }

  updateCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = gs.background_color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawGrid();
    this.drawTrees();
    this.drawAgent();
    this.updateRemainingStepsDisplay();
  }

  drawGrid() {
    for (let i = 0; i < this.trial_config.rows; i++) {
      for (let j = 0; j < this.trial_config.cols; j++) {
        const isCornerTile = (i === 0 && j === 0) || (i === this.trial_config.rows - 1 && j === this.trial_config.cols - 1);
        const cornerColor = (i === 0 && j === 0) ? this.tileInfo.cornerColorN : this.tileInfo.cornerColorS;
        let fillStyle = isCornerTile ? convertToHSL(cornerColor) : convertToHSL(this.tileInfo.baseColor);
        let tileSize = this.tileInfo.baseTileSize;

        // New code: Mixed color for overlap: previous agent path AND current agent planned path
        if (this.isPredictTrial &&
          this.render_previous_path &&
          this.previous_path.some(coord => coord[0] === j && coord[1] === i) &&
          (
            this.coordinateTrajectory.some(coord => coord[0] === j && coord[1] === i) ||
            this.coordinateTrajectoryQueue.some(coord => coord[0] === j && coord[1] === i)
          )
        ) {
          const prevColor = gs.tile.colors[`${this.trial_config.agent_types[0]}_path_actual`];
          const currColor = gs.tile.colors[`${this.trial_config.agent_types[this.currentAgentIdx]}_path_predict`];
          const mixedColor = {
            h: Math.round((prevColor.h + currColor.h) / 2),
            s: Math.round((prevColor.s + currColor.s) / 2),
            l: Math.round((prevColor.l + currColor.l) / 2)
          };
          // If animating, use transition size
          if (this.coordinateTrajectoryQueue.some(coord => coord[0] === j && coord[1] === i)) {
            const coordIndex = this.coordinateTrajectoryQueue.findIndex(coord => coord[0] === j && coord[1] === i);
            [fillStyle, tileSize] = [convertToHSL(mixedColor), this.transitionTile(coordIndex)[1]];
          } else {
            tileSize = this.tileInfo.pathTileSize;
            fillStyle = convertToHSL(mixedColor);
          }
        }
        // new code: Previous agent path color
        else if (this.isPredictTrial && this.render_previous_path && this.previous_path.some(coord => coord[0] === j && coord[1] === i)) {
        tileSize = this.tileInfo.pathTileSize;
        fillStyle = convertToHSL(gs.tile.colors[`${this.trial_config.agent_types[0]}_path_actual`]);
      }

        // NEW code 2 agents: predict agent path color
        else if (!this.isPredictTrial && this.render_previous_path && this.previous_path.some(coord => coord[0] === j && coord[1] === i)) {
          tileSize = this.tileInfo.pathTileSize;
          fillStyle = 'hsl(0, 0%, 80%)'; // Light gray color (80% lightness)
        }

        // Undo queue
        else if (this.coordinateTrajectoryUndoQueue.some(coord => coord[0] === j && coord[1] === i)) {
          const coordIndex = this.coordinateTrajectoryUndoQueue.findIndex(coord => coord[0] === j && coord[1] === i);
          [fillStyle, tileSize] = this.transitionTile(coordIndex, true);
          // Forward queue
        } else if (this.coordinateTrajectoryQueue.some(coord => coord[0] === j && coord[1] === i)) {
          // Only draw forward queue if we've already finished undoing the path
          if (this.coordinateTrajectoryUndoQueue.length === 0) {
            const coordIndex = this.coordinateTrajectoryQueue.findIndex(coord => coord[0] === j && coord[1] === i);
            [fillStyle, tileSize] = this.transitionTile(coordIndex);
          }
          // predicted path
        } else if (this.coordinateTrajectory.some(coord => coord[0] === j && coord[1] === i)) {
          // Only show actual path style if we've already finished undoing the path
          if (this.coordinateTrajectoryUndoQueue.length === 0) {
            const coordIndex = this.coordinateTrajectory.findIndex(coord => coord[0] === j && coord[1] === i);
            [fillStyle, tileSize] = this.isPredictTrial ?
              this.getPulsingPathProperties(coordIndex) :
              [convertToHSL(gs.tile.colors[`${this.trial_config.agent_types[this.currentAgentIdx]}_path_predict`]), this.tileInfo.pathTileSize];
          }
          // observe path
          if (!this.isPredictTrial) {
            drawRoundedRect(
              this.ctx,
              j * this.cellSize + (this.cellSize * (1 - tileSize) / 2),
              i * this.cellSize + (this.cellSize * (1 - tileSize) / 2),
              this.cellSize * tileSize,
              this.cellSize * tileSize,
              gs.tile.corner_radius,
              fillStyle = convertToHSL(gs.tile.colors[`${this.trial_config.agent_types[this.currentAgentIdx]}_path_actual`])
            );
          }
        }

        if (this.actualTrajectoryQueue.some(coord => coord[0] === j && coord[1] === i)) {
          const coordIndex = this.actualTrajectoryQueue.findIndex(coord => coord[0] === j && coord[1] === i);
          // queue format currently: [x, y, frame, agentIdx]
          const agentIdx = this.actualTrajectoryQueue[coordIndex][3];
          tileSize = this.transitionActualTile(coordIndex);
          fillStyle = convertToHSL(gs.tile.colors[`${this.trial_config.agent_types[agentIdx]}_path_actual`]);
        } else if (this.actualTrajectory.some(coord => coord[0] === j && coord[1] === i)) {
          const coordIndex = this.actualTrajectory.findIndex(coord => coord[0] === j && coord[1] === i);
          // completed entries: [x, y, agentIdx]
          const agentIdx = this.actualTrajectory[coordIndex][2];
          tileSize = this.tileInfo.realTileSize;
          fillStyle = convertToHSL(gs.tile.colors[`${this.trial_config.agent_types[agentIdx]}_path_actual`]);
        }


        drawRoundedRect(
          this.ctx,
          j * this.cellSize + (this.cellSize * (1 - tileSize) / 2),
          i * this.cellSize + (this.cellSize * (1 - tileSize) / 2),
          this.cellSize * tileSize,
          this.cellSize * tileSize,
          gs.tile.corner_radius,
          fillStyle
        );
      }
    }
  }

  destroy() {
    cancelAnimationFrame(this.animationFrameId);
    this.canvas.removeEventListener('click', this.handleCanvasClick);
    this.canvas.removeEventListener('mousemove', this.handleCanvasHover);
    this.canvas.removeEventListener('mouseout', this.handleCanvasHoverout);

    this.trees.forEach(tree => tree.destroy());
    this.trees = null;

    if (this.agent0Basket) {
      this.agent0Basket.destroy();
      this.agent0Basket = null;
    }
    if (this.agent1Basket) {
      this.agent1Basket.destroy();
      this.agent1Basket = null;
    }
  
    this.agents = null;
    this.treeTrajectory = null;
    this.coordinateTrajectory = null;
    this.coordinateTrajectoryQueue = null;
    this.coordinateTrajectoryUndoQueue = null;
    this.actualTreeTrajectory = null;
    this.actualTrajectory = null;
    this.actualTrajectoryQueue = null;
    this.clickEvents = null;

    if (this.clickDebounceTimeout) {
      clearTimeout(this.clickDebounceTimeout);
      this.clickDebounceTimeout = null;
    }
  }

  transitionTile(coordIndex, isUndo = false) {
    const totalFrames = gs.tile.animations.transition.frames;
    let queue = isUndo ? this.coordinateTrajectoryUndoQueue : this.coordinateTrajectoryQueue;
    const frame = queue[coordIndex][2];

    if (frame === totalFrames) {
      if (isUndo) {
        this.coordinateTrajectory.pop();
        this.coordinateTrajectoryUndoQueue.shift();
      } else {
        this.coordinateTrajectory.push([queue[coordIndex][0], queue[coordIndex][1]]);
        this.coordinateTrajectoryQueue.shift();
      }
      return isUndo ? [convertToHSL(this.tileInfo.baseColor), this.tileInfo.baseTileSize] :
                      this.getPulsingPathProperties(this.coordinateTrajectory.length - 1);
    } else {
      queue[coordIndex][2] += 1;
      const progress = isUndo ? (totalFrames - frame) / totalFrames : frame / totalFrames;
      const tileSize = this.tileInfo.baseTileSize + (this.tileInfo.pathTileSize - this.tileInfo.baseTileSize) * progress;

      const h = interpolateHue(this.tileInfo.baseColor.h, this.tileInfo.pathColor.h, progress);
      const s = this.tileInfo.baseColor.s + (this.tileInfo.pathColor.s - this.tileInfo.baseColor.s) * progress;
      const l = this.tileInfo.baseColor.l + (this.tileInfo.pathColor.l - this.tileInfo.baseColor.l) * progress;
      const fillStyle = convertToHSL({ h, s, l });

      return [fillStyle, tileSize];
    }
  }

  transitionActualTile(coordIndex) {
    const totalFrames = gs.tile.animations.transition.frames;
    // queue entry format: [x, y, frame, agentIdx]
    const frame = this.actualTrajectoryQueue[coordIndex][2];

    if (frame === totalFrames) {
      const x = this.actualTrajectoryQueue[coordIndex][0];
      const y = this.actualTrajectoryQueue[coordIndex][1];
      const agentIdx = this.actualTrajectoryQueue[coordIndex][3];
      // store agentIdx in completed trajectory entries: [x, y, agentIdx]
      this.actualTrajectory.push([x, y, agentIdx]);
      this.actualTrajectoryQueue.shift();
      return this.tileInfo.realTileSize;
    } else {
      this.actualTrajectoryQueue[coordIndex][2] += 1;
      const progress = frame / totalFrames;
      const tileSize = this.tileInfo.baseTileSize + (this.tileInfo.realTileSize - this.tileInfo.baseTileSize) * progress;
      return tileSize;
    }
  }

  // getPulsingPathProperties(coordIndex) {
  //   const time = Date.now();
  //   const period = gs.tile.animations.pulse.period;
  //   const separation = gs.tile.animations.pulse.separation;
  //   const saturationRange = gs.tile.animations.pulse.saturation_range;
  //   const tileRange = gs.tile.animations.pulse.tile_range;

  //   const wavePosition = 2 * Math.PI * (time / period - coordIndex / this.trial_config.total_steps);

  //   const saturation = this.tileInfo.pathColor.s + ((wavePosition % (separation * Math.PI)) < Math.PI) * Math.sin(wavePosition) * saturationRange;
  //   const tileSize = this.tileInfo.pathTileSize + ((wavePosition % (separation * Math.PI)) < Math.PI) * Math.sin(wavePosition) * tileRange;

  //   return [`hsl(${this.tileInfo.pathColor.h}, ${saturation}%, ${this.tileInfo.pathColor.l}%)`, tileSize];
  // }

  // new code-remove palse
  getPulsingPathProperties(coordIndex) {
    // Fixed color and size for the path
    const color = `hsl(${this.tileInfo.pathColor.h}, ${this.tileInfo.pathColor.s}%, ${this.tileInfo.pathColor.l}%)`;
    const size = this.tileInfo.pathTileSize;
    return [color, size];
}


  drawTrees() {
    this.trees.forEach(tree => tree.draw(this.ctx));
  }

  drawAgent() {
    this.agents.forEach(agent => agent.draw(this.ctx));
  }

  processCanvasClick(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const gridX = Math.floor(x / this.cellSize);
    const gridY = Math.floor(y / this.cellSize);

    const treeIndex = this.trees.findIndex(tree => tree.x === gridX && tree.y === gridY);
    const trajectoryIndex = this.treeTrajectory.findIndex(coords => coords[0] === gridX && coords[1] === gridY);
    const lastPlannedTree = this.treeTrajectory[this.treeTrajectory.length - 1];

    let clickEvent = {
      click_location: [gridX, gridY],
      click_time: Date.now(),
      is_tree: treeIndex !== -1,
      is_agent: gridX === this.agentStartPositions[this.currentAgentIdx][0] && gridY === this.agentStartPositions[this.currentAgentIdx][1],
      is_undo_tree: trajectoryIndex !== -1,
      is_reachable: null,
      remaining_steps_before: this.remainingSteps,
      remaining_steps_after: null,
    }

    if (lastPlannedTree && lastPlannedTree[0] === gridX && lastPlannedTree[1] === gridY) {
      // Do nothing if the clicked tree is the current planned tree
    } else if (clickEvent.is_agent) {
      const pathToUndo = this.coordinateTrajectory.slice().reverse();
      this.enqueuePathAnimation(pathToUndo, true);
      // TODO: safely remove treeTrajectory and remainingSteps if possible
      this.treeTrajectory = [];
      this.remainingSteps = this.totalSteps;
    } else if (clickEvent.is_tree) {
      // undo old path
      const pathToUndo = this.coordinateTrajectory.slice().reverse();
      this.enqueuePathAnimation(pathToUndo, true);

      // draw new path
      // if there is a path to undo, we need to wait for the undo animation to finish
      let delay = Boolean(pathToUndo.length) * gs.tile.animations.transition.frames * gs.tile.animations.transition.delay;
      this.updateGridPath(gridX, gridY, delay);
    }
    // TODO: remove this safely
    clickEvent.remaining_steps_after = this.remainingSteps;
    this.clickEvents.push(clickEvent);
  }

  handleCanvasHover(event) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const gridX = Math.floor(mouseX / this.cellSize);
    const gridY = Math.floor(mouseY / this.cellSize);

    const isOverStart = this.isMouseOverStart(mouseX, mouseY);
    if (isOverStart && !this.agents[this.currentAgentIdx].isHovered) {
      this.agents[this.currentAgentIdx].isHovered = true;
      this.agents[this.currentAgentIdx].animateHoverEffect();
    } else if (!isOverStart && this.agents[this.currentAgentIdx].isHovered) {
      this.agents[this.currentAgentIdx].isHovered = false;
    }

    this.trees.forEach(tree => {
      const isOverTree = this.isMouseOverTree(mouseX, mouseY, tree);
      if (isOverTree && !tree.isHovered) {
        tree.isHovered = true;
        tree.animateHoverEffect(this.isPredictTrial);
      } else if (!isOverTree && tree.isHovered) {
        tree.isHovered = false;
      }
    });
  }

  handleCanvasHoverout(event) {
    this.trees.forEach(tree => { tree.isHovered = false });
    this.agents[this.currentAgentIdx].isHovered = false;
  }

  isMouseOverTree(mouseX, mouseY, tree) {
    const centerX = tree.x * this.cellSize + this.cellSize / 2;
    const centerY = tree.y * this.cellSize + this.cellSize / 2;
    const treeRadius = this.cellSize / 2;
    const dx = mouseX - centerX;
    const dy = mouseY - centerY;
    return dx ** 4 + dy ** 4 < treeRadius ** 4;
  }

  isMouseOverStart(mouseX, mouseY) {
    const centerX = this.agentStartPositions[this.currentAgentIdx][0] * this.cellSize + this.cellSize / 2;
    const centerY = this.agentStartPositions[this.currentAgentIdx][1] * this.cellSize + this.cellSize / 2;
    const dx = mouseX - centerX;
    const dy = mouseY - centerY;
    return dx ** 4 + dy ** 4 < (this.cellSize / 2) ** 4;
  }

  updateGridPath(gridX, gridY, initDelay = 0) {
    // always encode the agent's start position as the last tree
    // TODO: rename this to something like startPosition
    const lastTree = this.agentStartPositions[this.currentAgentIdx];
    const path = this.generatePath(lastTree[0], lastTree[1], gridX, gridY);
    path.shift();
    path.push([gridX, gridY]);
    this.enqueuePathAnimation(path, false, initDelay);
  }

  enqueuePathAnimation(path, isUndo = false, initDelay = 0) {
    path.forEach((coords, index) => {
      setTimeout(() => {
        isUndo ? this.coordinateTrajectoryUndoQueue.push([coords[0], coords[1], 0]) :
                 this.coordinateTrajectoryQueue.push([coords[0], coords[1], 0]);
      }, initDelay + index * gs.tile.animations.transition.delay);
    });
  }

  generatePath(startX, startY, endX, endY) {
    const path = [];
    let currentX = startX;
    let currentY = startY;

    while (currentX !== endX) {
      path.push([currentX, currentY]);
      currentX += (endX > currentX) ? 1 : -1;
    }

    while (currentY !== endY) {
      path.push([currentX, currentY]);
      currentY += (endY > currentY) ? 1 : -1;
    }

    return path;
  }

  updateRemainingStepsDisplay() {
    const remainingStepsElement = document.getElementById('remainingSteps');
    if (remainingStepsElement) {
      remainingStepsElement.innerText = 'Remaining Steps: ' + this.remainingSteps;
    }
  }

// OBSERVATION TRIALS: animate agent movement along actual path
  animateAgentMovement(currentAgentIdx, start, end, offsetEndPosition, speed, isUndo = false, view_only = false, callback) {
    //console.log('animateAgentMovement with offsetEndPosition:', offsetEndPosition);
    var dx = end[0] - start[0];
    var dy = end[1] - start[1];

    var agentSpeed = speed;
    var totalHorizontalSteps = Math.abs(dx) * agentSpeed;
    var totalVerticalSteps = Math.abs(dy) * agentSpeed;

    var sx = dx !== 0 ? (dx > 0 ? 1 : -1) / agentSpeed : 0;
    var sy = dy !== 0 ? (dy > 0 ? 1 : -1) / agentSpeed : 0;

    var currentHorizontalStep = 0;
    var currentVerticalStep = 0;

    var offsetX = 0;
    var offsetY = 0;
    if (offsetEndPosition) {
      if (currentAgentIdx === 0) {
        offsetX = -.25;
        offsetY = -.25;
      } else {
        offsetX = .25;
        offsetY = .25;
      }
    }

    const updatePosition = (axis, step) => {
      this.agents[currentAgentIdx][axis] += step;
      if ((axis === 'x' ? currentHorizontalStep++ : currentVerticalStep++) % agentSpeed === Math.round(agentSpeed / 2) && !view_only) {
        this.remainingSteps += isUndo ? 1 : -1;

        const gridX = Math.round(this.agents[currentAgentIdx].x);
        const gridY = Math.round(this.agents[currentAgentIdx].y);

        this.actualTrajectoryQueue.push([gridX, gridY, 0,currentAgentIdx]);

        if (this.trial_config.tree_positions.some(treePos => treePos[0] - 1 === gridX && treePos[1] - 1 === gridY)) {
          this.actualTreeTrajectory.push([gridX, gridY, currentAgentIdx]);
        }
      }
    };

    const animateStep = () => {
      if (!isUndo ? currentHorizontalStep < totalHorizontalSteps : currentVerticalStep < totalVerticalSteps) {
        updatePosition(!isUndo ? 'x' : 'y', !isUndo ? sx : sy);
      } else if (!isUndo ? currentVerticalStep < totalVerticalSteps : currentHorizontalStep < totalHorizontalSteps) {
        if ((!isUndo ? currentVerticalStep : currentHorizontalStep) === 0) {
          this.agents[currentAgentIdx][!isUndo ? 'x' : 'y'] = end[!isUndo ? 0 : 1];
        }
        updatePosition(!isUndo ? 'y' : 'x', !isUndo ? sy : sx);
      }

      if (currentHorizontalStep < totalHorizontalSteps || currentVerticalStep < totalVerticalSteps) {
        requestAnimationFrame(animateStep);
      } else {
        // console.log('animation complete for agent:', currentAgentIdx);
        // console.log('end:', end, 'offsetX:', offsetX, 'offsetY:', offsetY);
        this.agents[currentAgentIdx].x = end[0] + offsetX;
        this.agents[currentAgentIdx].y = end[1] + offsetY;


        if (callback && typeof callback === 'function') {
          callback();
        }
      }
    };

    requestAnimationFrame(animateStep);
  }
}