/**
 * Class representing a Tree in the Gridworld.
 * @param {number} x - The x-coordinate of the tree on the grid.
 * @param {number} y - The y-coordinate of the tree on the grid.
 * @param {number} reward - The number of berries on the tree.
 * @param {boolean} isVisible - Determines if the berries on the tree are visible.
 * @param {number} cellSize - The size of a grid cell in pixels.
 * @param {Array} leaves - Array of leaf objects for the tree, if any.
 * @param {Array} berries - Array of berry objects for the tree, if any.
 */
class Tree {
  constructor(x, y, reward, isVisible, cellSize, agentType, leaves = [], berries = []) {
    this.canvas = document.getElementById('gridworldCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.x = x;
    this.y = y;
    this.reward = reward;
    this.isVisible = isVisible;
    this.cellSize = cellSize;

    // Tree and berry colors
    this.treeColor = this.isVisible ? gs.tree.colors.visible : gs.tree.colors.invisible;
    // new code: Use agent color if provided, otherwise default
    // if (agentType) {
    //   const agentColor = gs.agent.colors[agentType];
    //   this.berryColor = {
    //     h: agentColor.h || 0,
    //     s: agentColor.s || 100,
    //     l: agentColor.l || 50
    //   };
    // } else {
    //   this.berryColor = gs.tree.colors.berry;
    // }
    // console.log('agentType:', agentType, 'berryColor:', this.berryColor);

    // Store both berry colors
this.berryColors = {
  optimist: {
    h: gs.agent.colors.optimist.h || 0,
    s: gs.agent.colors.optimist.s || 100,
    l: gs.agent.colors.optimist.l || 50
  },
  pessimist: {
    h: gs.agent.colors.pessimist.h || 0,
    s: gs.agent.colors.pessimist.s || 100,
    l: gs.agent.colors.pessimist.l || 50
  }
};
    this.berryColor = agentType ? this.berryColors[agentType] : gs.tree.colors.berry;


    // old code
    //this.berryColor =  gs.tree.colors.berry;

    // Border properties for animation and path tracking
    this.borderColor = null;
    this.actualBorderColor = null;

    // Path and reachability properties
    this.isOnPath = false;
    this.isOnActualPath = false;
    this.isReachable = false;

    // Leaf and berry initialization
    this.leaves = leaves.length > 0 ? leaves : this.generateLeaves();

    // new code: Separate berries for optimist and pessimist
    // Store the original reward value
    //const originalReward = this.reward;
    // Double the reward temporarily to generate all berries at once
    //this.reward = this.reward * 2;
    // Generate all berries
    const allBerries = this.generateBerries();
    // Restore original reward value
    //this.reward = originalReward;
    this.berries = allBerries;

    // Split berries between agents
    this.optimistBerries = allBerries.slice(0, this.reward[0]);
    this.pessimistBerries = allBerries.slice(this.reward[0]);

    // Hover and animation properties
    this.hoverScale = gs.tree.animations.hover.default_scale;
    this.hoverScaleMax = gs.tree.animations.hover.magnify_scale;
    this.hoverScaleMin = gs.tree.animations.hover.minimize_scale;
    this.hoverSaturation = this.treeColor.s;
    this.hoverBrightness = this.treeColor.l;
    this.hoverBerrySaturation = this.berryColor.s;
    this.isHovered = false;
    this.inAnimation = false;

    // Timeout properties for hover effects
    this.hoverTimeout = null;
    this.unhoverTimeout = null;

    // Position offsets for shaking animation
    this.offsetX = 0;
    this.offsetY = 0;
  }

  generateLeaves() {
    const maxRadius = this.cellSize * gs.tree.size.max_leaf_radius;
    const leafCount = gs.tree.min_leaves + Math.floor(Math.random() * (gs.tree.max_leaves - gs.tree.min_leaves + 1));

    let leaves = [];
    for (let i = 0; i < leafCount; i++) {
      const angle = Math.random() * Math.PI;
      const radiusX = maxRadius * (gs.tree.size.min_leaf_radius + Math.random() * (1 - gs.tree.size.min_leaf_radius));
      const radiusY = maxRadius * (gs.tree.size.min_leaf_radius + Math.random() * (1 - gs.tree.size.min_leaf_radius));
      const offsetX = (Math.random() - 0.5) * maxRadius;
      const offsetY = (Math.random() - 0.5) * maxRadius;
      leaves.push({ offsetX, offsetY, radiusX, radiusY, angle });
    }

    return leaves;
  }

  generateBerries() {
    const foliageRadius = this.cellSize * gs.tree.size.max_leaf_radius;
    const berryRadius = foliageRadius * gs.tree.size.berry_radius;
    const numCandidates = 30;

    let berries = [];
    for (let i = 0; i < this.reward[0]+this.reward[1]; i++) {
      let bestCandidate, bestDistance = 0;
      for (let j = 0; j < numCandidates; ++j) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * foliageRadius;
        const candidate = {
          offsetX: distance * Math.cos(angle),
          offsetY: distance * Math.sin(angle),
          radius: berryRadius
        };

        let d = findClosestDistance(berries, candidate);
        if (d > bestDistance) {
          bestDistance = d;
          bestCandidate = candidate;
        }
      }
      berries.push(bestCandidate);
    }

    return berries;
  }

  draw(ctx) {
    const centerX = this.x * this.cellSize + this.cellSize / 2 + this.offsetX;
    const centerY = this.y * this.cellSize + this.cellSize / 2 + this.offsetY;

    const treeColor = this.inAnimation ? { h: this.treeColor.h, s: this.hoverSaturation, l: this.hoverBrightness } : this.treeColor;
    const berryColor = this.inAnimation ? { h: this.berryColor.h, s: this.hoverBerrySaturation, l: this.berryColor.l } : this.berryColor;
    const borderScale = this.inAnimation ? this.hoverScale : this.hoverScaleMax;

    const borderFill = this.inAnimation ? this.borderColor :
                       this.isOnActualPath ? this.actualBorderColor :
                       this.isOnPath ? this.borderColor : null;

    if (borderFill) this.drawLeaves(ctx, centerX, centerY, convertToHSL(borderFill), borderScale);

    this.drawLeaves(ctx, centerX, centerY, convertToHSL(treeColor));
    this.drawBerries(ctx, centerX, centerY, convertToHSL(berryColor));
  }

  drawLeaves(ctx, centerX, centerY, leafColor, scale = 1.0) {
    ctx.fillStyle = leafColor;
    this.leaves.forEach(leaf => {
      ctx.beginPath();
      ctx.ellipse(centerX + leaf.offsetX * scale, centerY + leaf.offsetY * scale, leaf.radiusX * scale, leaf.radiusY * scale, leaf.angle, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  // new code
  drawBerries(ctx, centerX, centerY) {
  // Draw optimist berries
  this.optimistBerries.forEach(berry => {
    // Draw berry border
    ctx.fillStyle = convertToHSL(gs.tree.colors.berry_border);
    ctx.beginPath();
    ctx.arc(centerX + berry.offsetX, centerY + berry.offsetY, berry.radius + gs.tree.size.berry_border, 0, Math.PI * 2);
    ctx.fill();

    // Draw berry in optimist color
    ctx.fillStyle = convertToHSL(this.berryColors.optimist);
    ctx.beginPath();
    ctx.arc(centerX + berry.offsetX, centerY + berry.offsetY, berry.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw pessimist berries
  this.pessimistBerries.forEach(berry => {
    // Draw berry border
    ctx.fillStyle = convertToHSL(gs.tree.colors.berry_border);
    ctx.beginPath();
    ctx.arc(centerX + berry.offsetX, centerY + berry.offsetY, berry.radius + gs.tree.size.berry_border, 0, Math.PI * 2);
    ctx.fill();

    // Draw berry in pessimist color
    ctx.fillStyle = convertToHSL(this.berryColors.pessimist);
    ctx.beginPath();
    ctx.arc(centerX + berry.offsetX, centerY + berry.offsetY, berry.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

  // drawBerries(ctx, centerX, centerY, berryColor) {
  //   this.berries.forEach(berry => {
  //     ctx.fillStyle = convertToHSL(gs.tree.colors.berry_border);
  //     ctx.beginPath();
  //     ctx.arc(centerX + berry.offsetX, centerY + berry.offsetY, berry.radius + gs.tree.size.berry_border, 0, Math.PI * 2);
  //     ctx.fill();

  //     ctx.fillStyle = berryColor;
  //     ctx.beginPath();
  //     ctx.arc(centerX + berry.offsetX, centerY + berry.offsetY, berry.radius, 0, Math.PI * 2);
  //     ctx.fill();
  //   });
  // }

  shakeTree(agentType, callback) {
    this.isVisible = true;

    const startTime = Date.now();
    const duration = gs.tree.animations.shake.duration;
    const shakeAmplitude = gs.tree.animations.shake.amplitude;

    const shake = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress < 1) {
        this.offsetX = Math.sin(progress * Math.PI * gs.tree.animations.shake.speed) * shakeAmplitude;
        requestAnimationFrame(shake);
      } else {
        this.offsetX = 0;
        // new code
        // Change color of berries based on agent type
        // if (agentType === 'optimist') {
        // if (agentType === 'optimist') {
        //   this.optimistBerries = []; // Remove optimist berries
        //   // console.log("remaining berries for optimist:", this.optimistBerries.length);
        // } else if (agentType === 'pessimist') {
        //   this.pessimistBerries = []; // Remove pessimist berries
        //   // console.log("remaining berries for pessimist:", this.pessimistBerries.length);
        // }
        // Update combined berries array
        // this.berries = [...this.optimistBerries, ...this.pessimistBerries];
        // this.berryColor = gs.tree.colors.berry_picked;
        if (callback) callback();
      }
    };
    shake();
    //return this.berries.length;
    return agentType === 'optimist' ? this.optimistBerries.length : this.pessimistBerries.length;

  }

  updatePathStatus(treeTrajectory) {
    this.isOnPath = treeTrajectory.some(coord => coord[0] === this.x && coord[1] === this.y);
  }

  updateActualPathStatus(treeTrajectory) {
    this.isOnActualPath = treeTrajectory.some(coord => coord[0] === this.x && coord[1] === this.y);
  }

  updateReachableStatus(lastTreePosition, remainingSteps) {
    const distance = Math.abs(lastTreePosition[0] - this.x) + Math.abs(lastTreePosition[1] - this.y);
    this.isReachable = distance <= remainingSteps;
  }

  controlTreeProperty(property, start, stop, duration, frameRate = 5) {
    makeRangeArr(start, stop, duration / frameRate).forEach((value, index) => {
      setTimeout(() => {
        this[property] = value;
      }, index * frameRate);
    });
  }

  animateHoverEffect(isPredictTrial) {
    clearTimeout(this.hoverTimeout);
    clearTimeout(this.unhoverTimeout);
    const animationDuration = gs.tree.animations.hover.duration;

    if (isPredictTrial) {
      this.inAnimation = true;

      const targetScale = this.isOnPath ? gs.tree.animations.hover.default_scale : this.hoverScaleMax;
      this.hoverScale = this.isOnPath ? this.hoverScaleMax : this.hoverScale;
      const targetSaturation = this.treeColor.s;
      const targetBrightness = this.treeColor.l;
      const targetBerrySaturation = this.berryColor.s;

      this.controlTreeProperty('hoverScale', this.hoverScale, targetScale, animationDuration);
      this.controlTreeProperty('hoverSaturation', this.hoverSaturation, targetSaturation, animationDuration);
      this.controlTreeProperty('hoverBrightness', this.hoverBrightness, targetBrightness, animationDuration);
      this.controlTreeProperty('hoverBerrySaturation', this.hoverBerrySaturation, targetBerrySaturation, animationDuration);
    }

    this.hoverTimeout = setTimeout(() => {
      const startUnhover = setInterval(() => {
        if (!this.isHovered) {
          this.animateUnhoverEffect(isPredictTrial);
          clearInterval(startUnhover);
        }
      }, 25);
    }, animationDuration);
  }

  animateUnhoverEffect(isPredictTrial) {
    const animationDuration = gs.tree.animations.hover.duration;

    if (isPredictTrial) {
      this.controlTreeProperty('hoverScale', this.hoverScale, this.isOnPath ? this.hoverScaleMax : gs.tree.animations.hover.default_scale, animationDuration);
      this.controlTreeProperty('hoverSaturation', this.hoverSaturation, this.treeColor.s, animationDuration);
      this.controlTreeProperty('hoverBrightness', this.hoverBrightness, this.treeColor.l, animationDuration);
      this.controlTreeProperty('hoverBerrySaturation', this.hoverBerrySaturation, this.berryColor.s, animationDuration);
    }

    this.unhoverTimeout = setTimeout(() => {
      this.inAnimation = false;
    }, animationDuration);
  }

  destroy() {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
    if (this.unhoverTimeout) {
      clearTimeout(this.unhoverTimeout);
      this.unhoverTimeout = null;
    }

    this.canvas = null;
    this.ctx = null;
    this.leaves = null;
    this.berries = null;
  }
}