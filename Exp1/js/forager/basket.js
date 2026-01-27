/**
 * Class representing a Basket in the Gridworld.
 * @param {string} canvasId - The ID of the canvas element where the basket is rendered.
 *
 * @property {Matter.Engine} engine - The Matter.js engine.
 * @property {Matter.World} world - The Matter.js world.
 * @property {Matter.Render} render - The Matter.js renderer.
 * @property {Matter.Body} basket - The compound body representing the basket.
 * @property {number} berriesCollected - The number of berries collected in the basket.
 */
class Basket {
  constructor(canvasId, agentType) {
    this.engine = Matter.Engine.create();
    this.world = this.engine.world;
    this.render = Matter.Render.create({
      canvas: document.getElementById(canvasId),
      engine: this.engine,
      options: {
        width: gs.basket.canvas_width,
        height: gs.basket.canvas_height,
        wireframes: false,
        background: 'transparent'
      }
    });

    // add berry color
    this.agentType = agentType;

    // Get the agent color from gs.agent.colors
    if (agentType) {
      const agentColor = gs.agent.colors[agentType];
      this.berryColor = {
        h: agentColor.h || 0,
        s: agentColor.s || 100,
        l: agentColor.l || 50
      };
    } else {
      this.berryColor = { h: 0, s: 100, l: 38 }; // Default red color
    }

    // Define the parts of the basket
    const bottom = Matter.Bodies.rectangle(
      gs.basket.position.x,
      gs.basket.position.y,
      gs.basket.size.bottom_width,
      gs.basket.size.thickness, { isStatic: true }
    );
    const leftWall = Matter.Bodies.rectangle(
      gs.basket.position.x - gs.basket.position.wall_offset_x,
      gs.basket.canvas_width / 2,
      gs.basket.size.thickness,
      gs.basket.size.wall_height, {
        isStatic: true,
        angle: -Math.PI / 12
      }
    );
    const rightWall = Matter.Bodies.rectangle(
      gs.basket.position.x + gs.basket.position.wall_offset_x,
      gs.basket.canvas_width / 2,
      gs.basket.size.thickness,
      gs.basket.size.wall_height, {
        isStatic: true,
        angle: Math.PI / 12
      }
    );

    Matter.Body.setPosition(leftWall, {
      x: leftWall.position.x,
      y: leftWall.position.y + gs.basket.position.wall_offset_y
    });
    Matter.Body.setPosition(rightWall, {
      x: rightWall.position.x,
      y: rightWall.position.y + gs.basket.position.wall_offset_y
    });

    this.basket = Matter.Body.create({
      parts: [bottom, leftWall, rightWall],
      isStatic: true
    });

    Matter.World.add(this.world, this.basket);
    Matter.Runner.run(this.engine);
    Matter.Render.run(this.render);

    this.berriesCollected = 0;

    // Only update counter if the element exists
    this.canvasId = canvasId;

    // set counter and container to handle observe plugin basket updates
    this.counterId = canvasId === 'agent0BasketCanvas' ? 'agent0BerriesCounter' : 'agent1BerriesCounter';
    this.containerID = canvasId === 'agent0BasketCanvas' ? 'yellowBasketContainer' : 'purpleBasketContainer';

    if (document.getElementById(this.counterId)) {
      this.updateCounter();
    }
  }

  // update counter
  updateCounter() {
    const counterElement = document.getElementById(this.counterId);
    if (counterElement) {
      counterElement.innerHTML = `Berries: ${this.berriesCollected}`;
      counterElement.style.display = 'block';
    }
  }

  showBerryAddedAnimation(n) {
    const animationElement = document.createElement('div');
    animationElement.innerText = `+${n}`;
    animationElement.style.position = 'absolute';
    animationElement.style.top = '200px';
    animationElement.style.left = '50%';
    animationElement.style.transform = 'translateX(-50%)';
    animationElement.style.fontSize = '26px';
    // old code
    //animationElement.style.color = '#C00000';
    //new code
    const colorStr = `hsl(${this.berryColor.h}, ${this.berryColor.s}%, ${this.berryColor.l}%)`;
    animationElement.style.color = colorStr;

    animationElement.style.opacity = '1';
    animationElement.style.transition = 'opacity 2s, top 2s';

    const container = document.getElementById(this.containerID);
    container.appendChild(animationElement);

    setTimeout(() => {
      animationElement.style.top = '170px';
      animationElement.style.opacity = '0';
    }, 100);

    setTimeout(() => {
      animationElement.remove();
    }, 2100);
  }

  addBerries(n) {
    for (let i = 0; i < n; i++) {
      const xPosition = gs.basket.berry.x + (Math.random() - 0.5) * gs.basket.berry.x_spread;
      const yPosition = gs.basket.berry.y + (Math.random() - 0.5) * gs.basket.berry.y_spread;
      const berrySize = gs.basket.berry.size_min + Math.random() * (gs.basket.berry.size_max - gs.basket.berry.size_min);

      ((x, y, size) => {
        setTimeout(() => {

          // new code:
          // Convert HSL object to CSS color string
          const colorStr = `hsl(${this.berryColor.h}, ${this.berryColor.s}%, ${this.berryColor.l}%)`;

          const berry = Matter.Bodies.circle(x, y, size, {
            restitution: gs.basket.berry.restitution,
            density: gs.basket.berry.density,
            render: { fillStyle: colorStr }
          });
          Matter.World.add(this.world, berry);
        }, i * 25);
      })(xPosition, yPosition, berrySize);
    }

    this.berriesCollected += n;
    this.updateCounter();
    this.showBerryAddedAnimation(n);
  }

getBerryInfo() {
    return {
        count: this.berriesCollected,
        color: this.berryColor,
        agentType: this.agentType
    };
  }

  destroy() {
    Matter.World.clear(this.world);
    Matter.Engine.clear(this.engine);
    Matter.Render.stop(this.render);

    const canvas = document.getElementById(this.render.canvas.id);
    if (canvas) {
      canvas.remove();
    }

    this.engine = null;
    this.world = null;
    this.render = null;
    this.basket = null;
  }
}