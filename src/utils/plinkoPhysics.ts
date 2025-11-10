// Physics constants
export const GRAVITY = 0.3;
export const BOUNCE_FACTOR = 0.6;
export const FRICTION = 0.99;
export const MIN_VELOCITY = 0.1;
export const MAX_BOUNCE_SPEED = 3.0;

// Ball state interface
export interface BallState {
  id?: number; // Unique identifier for each ball
  x: number;
  y: number;
  vx: number; // velocity x
  vy: number; // velocity y
  isActive: boolean;
}

// Pin interface
export interface Pin {
  x: number;
  y: number;
  row: number;
  col: number;
}

// Slot interface
export interface Slot {
  id: number;
  points: number;
  x: number;
  width: number;
}

// Initialize ball at the top center
export function initializeBall(containerWidth: number): BallState {
  return {
    x: containerWidth / 2,
    y: 0,
    vx: 0,
    vy: 0,
    isActive: false,
  };
}

// Update ball physics
export function updateBallPhysics(
  ball: BallState,
  pins: Pin[],
  slots: Slot[],
  containerWidth: number,
  containerHeight: number,
  ballSize: number,
  pinSize: number
): { ball: BallState; landedSlot?: Slot } {
  if (!ball.isActive) return { ball };

  let newBall = { ...ball };
  let landedSlot: Slot | undefined;

  // Apply gravity
  newBall.vy += GRAVITY;

  // Apply friction
  newBall.vx *= FRICTION;
  newBall.vy *= FRICTION;

  // Ensure minimum velocity to prevent getting stuck
  const currentSpeed = Math.sqrt(newBall.vx * newBall.vx + newBall.vy * newBall.vy);
  if (currentSpeed < MIN_VELOCITY && newBall.vy > 0) {
    newBall.vy = MIN_VELOCITY;
  }

  // Update position
  newBall.x += newBall.vx;
  newBall.y += newBall.vy;

  // Check pin collisions
  pins.forEach((pin) => {
    const distance = Math.sqrt(
      Math.pow(newBall.x - pin.x, 2) + Math.pow(newBall.y - pin.y, 2)
    );
    
    const collisionDistance = (ballSize + pinSize) / 2;
    
    if (distance < collisionDistance) {
      // Calculate collision response
      const angle = Math.atan2(newBall.y - pin.y, newBall.x - pin.x);
      const speed = Math.sqrt(newBall.vx * newBall.vx + newBall.vy * newBall.vy);
      
      // Add some randomness to make it more realistic
      const randomAngle = angle + (Math.random() - 0.5) * 0.2;
      
      // Bounce off pin with controlled speed
      const newSpeed = Math.min(
        Math.max(speed * BOUNCE_FACTOR, MIN_VELOCITY),
        MAX_BOUNCE_SPEED
      );
      newBall.vx = Math.cos(randomAngle) * newSpeed;
      newBall.vy = Math.sin(randomAngle) * newSpeed;
      
      // Move ball away from pin to prevent sticking (smaller push)
      const overlap = collisionDistance - distance + 1;
      newBall.x += Math.cos(angle) * overlap;
      newBall.y += Math.sin(angle) * overlap;
    }
  });

  // Check wall collisions
  if (newBall.x < ballSize / 2) {
    newBall.x = ballSize / 2;
    newBall.vx = Math.abs(newBall.vx) * BOUNCE_FACTOR;
  } else if (newBall.x > containerWidth - ballSize / 2) {
    newBall.x = containerWidth - ballSize / 2;
    newBall.vx = -Math.abs(newBall.vx) * BOUNCE_FACTOR;
  }

  // Check if ball landed in a slot
  if (newBall.y > containerHeight - 60) { // 60 is slot height . What it does: Checks if the ball's Y position is below the game area (in the slot zone)
    slots.forEach((slot) => {
      if (
        newBall.x >= slot.x &&
        newBall.x <= slot.x + slot.width
      ) {
        landedSlot = slot;
        newBall.isActive = false;
      }
    });
  }

  // Check if ball is out of bounds
  if (newBall.y > containerHeight + 50) {
    newBall.isActive = false;
  }

  return { ball: newBall, landedSlot };
}

// Generate pin positions (same logic as PinLayout component)
export function generatePinPositions(
  rows: number,
  containerWidth: number,
  containerHeight: number
): Pin[] {
  const pins: Pin[] = [];
  const horizontalSpacing = containerWidth / (rows + 1);
  const verticalSpacing = (containerHeight * 0.8) / rows;

  for (let row = 0; row < rows; row++) {
    const pinsInRow = row + 1;
    const startX = (containerWidth - (pinsInRow - 1) * horizontalSpacing) / 2;
    
    for (let col = 0; col < pinsInRow; col++) {
      const x = startX + col * horizontalSpacing;
      const y = 50 + row * verticalSpacing;
      
      pins.push({ x, y, row, col });
    }
  }
  
  return pins;
}

// Generate slot positions
export function generateSlotPositions(
  containerWidth: number,
  slotWidths: number[]
): Slot[] {
  const slots: Slot[] = [];
  let currentX = 0;
  
  // 

  const slotData = [
    { id: 1, points: 10, color: '#4CAF50' },
    { id: 2, points: 25, color: '#2196F3' },
    { id: 3, points: 50, color: '#FF9800' },
    { id: 4, points: 100, color: '#F44336' },
    { id: 5, points: 200, color: '#9C27B0' },
    { id: 6, points: 50, color: '#FF9800' },
    { id: 7, points: 10, color: '#4CAF50' },
  ];

  // For each slot, checks if the ball's X position is within that slot's boundaries
  // How it works:
//  slot.x = left edge of the slot
// slot.x + slot.width = right edge of the slot
// If ball's X is between these two values → BALL LANDS IN THIS SLOT!

  slotData.forEach((slot, index) => {
    slots.push({
      id: slot.id,
      points: slot.points,
      x: currentX,
      width: containerWidth * slotWidths[index],
    });
    currentX += containerWidth * slotWidths[index];
  });
  
  return slots;
} 