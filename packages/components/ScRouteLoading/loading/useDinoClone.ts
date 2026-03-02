import { onBeforeUnmount, onMounted, Ref } from "vue";

const WORLD_WIDTH = 100;
const WORLD_HEIGHT = 30;

const SPEED_SCALE_INCREASE = 0.00001;
const GROUND_SPEED = 0.05;
const CACTUS_SPEED = 0.05;
const MIN_CACTUS_INTERVAL = 500;
const MAX_CACTUS_INTERVAL = 2000;
const JUMP_SPEED = 0.45;
const GRAVITY = 0.0015;

interface DinoState {
  isJumping: boolean;
  yVelocity: number;
  y: number;
}

interface GameCallbacks {
  onScoreChange?: (score: number) => void;
  onGameOver?: (score: number) => void;
}

export function useDinoClone(
  worldRef: Ref<HTMLDivElement | null>,
  callbacks: GameCallbacks = {}
): void {
  let lastTime: number | null = null;
  let speedScale = 1;
  let score = 0;
  let gameOver = false;
  let nextCactusTime = MIN_CACTUS_INTERVAL;

  const dinoState: DinoState = {
    isJumping: false,
    yVelocity: 0,
    y: 0
  };

  let frameId = 0;

  const getWorld = (): HTMLDivElement | null => worldRef.value;

  const getDino = (): HTMLElement | null => {
    const world = getWorld();
    if (!world) {
      return null;
    }
    return world.querySelector<HTMLElement>("[data-dino]");
  };

  const getGrounds = (): NodeListOf<HTMLElement> | null => {
    const world = getWorld();
    if (!world) {
      return null;
    }
    return world.querySelectorAll<HTMLElement>("[data-ground]");
  };

  const getCactuses = (): NodeListOf<HTMLElement> | null => {
    const world = getWorld();
    if (!world) {
      return null;
    }
    return world.querySelectorAll<HTMLElement>("[data-cactus]");
  };

  const setCustomProperty = (
    el: HTMLElement,
    prop: string,
    value: number
  ): void => {
    el.style.setProperty(prop, `${value}`);
  };

  const getCustomProperty = (el: HTMLElement, prop: string): number => {
    const value = window.getComputedStyle(el).getPropertyValue(prop);
    const parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed)) {
      return 0;
    }
    return parsed;
  };

  const incrementCustomProperty = (
    el: HTMLElement,
    prop: string,
    delta: number
  ): void => {
    const current = getCustomProperty(el, prop);
    setCustomProperty(el, prop, current + delta);
  };

  const setWorldToGameScale = (): void => {
    const world = getWorld();
    if (!world) {
      return;
    }
    const container = world.parentElement;
    if (!container) {
      return;
    }
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    if (containerWidth === 0 || containerHeight === 0) {
      return;
    }
    const worldRatio = WORLD_WIDTH / WORLD_HEIGHT;
    let scale = containerWidth / WORLD_WIDTH;
    if (containerWidth / containerHeight > worldRatio) {
      scale = containerHeight / WORLD_HEIGHT;
    }
    world.style.width = `${WORLD_WIDTH * scale}px`;
    world.style.height = `${WORLD_HEIGHT * scale}px`;
  };

  const updateGround = (delta: number): void => {
    const grounds = getGrounds();
    if (!grounds) {
      return;
    }
    grounds.forEach((ground) => {
      incrementCustomProperty(
        ground,
        "--left",
        delta * GROUND_SPEED * speedScale * -1
      );
      const left = getCustomProperty(ground, "--left");
      if (left <= -100) {
        incrementCustomProperty(ground, "--left", 200);
      }
    });
  };

  const updateDino = (delta: number): void => {
    const dino = getDino();
    if (!dino) {
      return;
    }
    if (dinoState.isJumping) {
      dinoState.yVelocity -= GRAVITY * delta;
      dinoState.y += dinoState.yVelocity * delta;
      if (dinoState.y <= 0) {
        dinoState.y = 0;
        dinoState.isJumping = false;
      }
      setCustomProperty(dino, "--bottom", dinoState.y);
    }
  };

  const updateCactus = (delta: number): void => {
    const world = getWorld();
    if (!world) {
      return;
    }
    const cactuses = getCactuses();
    if (cactuses) {
      cactuses.forEach((cactus) => {
        incrementCustomProperty(
          cactus,
          "--left",
          delta * CACTUS_SPEED * speedScale * -1
        );
        const left = getCustomProperty(cactus, "--left");
        if (left <= -10) {
          cactus.remove();
        }
      });
    }

    if (nextCactusTime <= 0) {
      const cactus = document.createElement("img");
      cactus.dataset.cactus = "true";
      cactus.src = "/imgs/cactus.png";
      cactus.className = "cactus";
      setCustomProperty(cactus, "--left", 100);
      world.appendChild(cactus);
      const intervalRange = MAX_CACTUS_INTERVAL - MIN_CACTUS_INTERVAL;
      const interval =
        MIN_CACTUS_INTERVAL + Math.random() * intervalRange;
      nextCactusTime =
        interval / (speedScale <= 0 ? 1 : speedScale);
    }
    nextCactusTime -= delta;
  };

  const updateSpeedScale = (delta: number): void => {
    speedScale += delta * SPEED_SCALE_INCREASE;
  };

  const updateScore = (delta: number): void => {
    score += delta * 0.01;
    if (callbacks.onScoreChange) {
      callbacks.onScoreChange(Math.floor(score));
    }
  };

  const getDinoRect = (): DOMRect | null => {
    const dino = getDino();
    if (!dino) {
      return null;
    }
    return dino.getBoundingClientRect();
  };

  const getCactusRects = (): DOMRect[] => {
    const cactuses = getCactuses();
    if (!cactuses) {
      return [];
    }
    const rects: DOMRect[] = [];
    cactuses.forEach((cactus) => {
      rects.push(cactus.getBoundingClientRect());
    });
    return rects;
  };

  const isCollision = (): boolean => {
    const dinoRect = getDinoRect();
    if (!dinoRect) {
      return false;
    }
    const cactusRects = getCactusRects();
    return cactusRects.some((rect) => {
      return (
        rect.left < dinoRect.right &&
        rect.top < dinoRect.bottom &&
        rect.right > dinoRect.left &&
        rect.bottom > dinoRect.top
      );
    });
  };

  const handleJump = (): void => {
    if (gameOver) {
      return;
    }
    if (dinoState.isJumping) {
      return;
    }
    dinoState.yVelocity = JUMP_SPEED;
    dinoState.isJumping = true;
  };

  const handleKeydown = (event: KeyboardEvent): void => {
    if (event.code === "Space" || event.key === " ") {
      event.preventDefault();
      handleJump();
    }
  };

  const handleClick = (): void => {
    handleJump();
  };

  const resetWorld = (): void => {
    const world = getWorld();
    if (!world) {
      return;
    }
    world.innerHTML = "";
    const dino = document.createElement("img");
    dino.dataset.dino = "true";
    dino.src = "/imgs/dino-stationary.png";
    dino.className = "dino";
    setCustomProperty(dino, "--bottom", 0);
    world.appendChild(dino);

    const ground1 = document.createElement("img");
    ground1.dataset.ground = "true";
    ground1.src = "/imgs/ground.png";
    ground1.className = "ground";
    setCustomProperty(ground1, "--left", 0);
    world.appendChild(ground1);

    const ground2 = document.createElement("img");
    ground2.dataset.ground = "true";
    ground2.src = "/imgs/ground.png";
    ground2.className = "ground";
    setCustomProperty(ground2, "--left", 100);
    world.appendChild(ground2);

    dinoState.isJumping = false;
    dinoState.yVelocity = 0;
    dinoState.y = 0;
    speedScale = 1;
    score = 0;
    nextCactusTime = MIN_CACTUS_INTERVAL;
    lastTime = null;
    gameOver = false;
  };

  const update = (time: number): void => {
    if (lastTime === null) {
      lastTime = time;
      frameId = window.requestAnimationFrame(update);
      return;
    }
    const delta = time - lastTime;
    lastTime = time;

    if (!gameOver) {
      updateGround(delta);
      updateDino(delta);
      updateCactus(delta);
      updateSpeedScale(delta);
      updateScore(delta);
      if (isCollision()) {
        gameOver = true;
        if (callbacks.onGameOver) {
          callbacks.onGameOver(Math.floor(score));
        }
      }
    }
    frameId = window.requestAnimationFrame(update);
  };

  onMounted(() => {
    const world = getWorld();
    if (!world) {
      return;
    }
    resetWorld();
    setWorldToGameScale();
    window.addEventListener("resize", setWorldToGameScale);
    window.addEventListener("keydown", handleKeydown);
    world.addEventListener("click", handleClick);
    frameId = window.requestAnimationFrame(update);
  });

  onBeforeUnmount(() => {
    const world = getWorld();
    window.removeEventListener("resize", setWorldToGameScale);
    window.removeEventListener("keydown", handleKeydown);
    if (world) {
      world.removeEventListener("click", handleClick);
    }
    if (frameId) {
      window.cancelAnimationFrame(frameId);
    }
  });
}


