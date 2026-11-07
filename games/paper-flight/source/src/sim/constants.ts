/** Shared physical and game limits. Distances are meters, angles radians. */

export const SHEET = {
  /** US Letter, meters. */
  width: 0.2159,
  height: 0.2794,
  /** Copy paper, kilograms per square meter. */
  arealDensity: 0.08,
} as const

export const AIR = {
  /** Sea-level-ish still air, kg/m³. */
  density: 1.204,
  gravity: 9.80665,
} as const

/** Floor to ceiling. The deck is the start of the upper third. */
const ROOM_HEIGHT = 9

export const HALL = {
  length: 42,
  halfWidth: 6.2,
  height: ROOM_HEIGHT,
  /**
   * Platform deck, meters above the hall floor.
   * Two thirds of the wall height, which is where the upper third begins.
   */
  ledgeHeight: (ROOM_HEIGHT * 2) / 3,
  ledgeBack: -1.85,
  /** Launch line. x < 0 is the deck; x >= 0 is the hall floor, 6 m below. */
  ledgeFront: 0,
} as const

/** World height of a release: deck elevation plus the hand's height above the deck. */
export function releaseHeight(handAboveDeck: number): number {
  return HALL.ledgeHeight + handAboveDeck
}

export const LANES = [-0.5, -0.17, 0.17, 0.5] as const

export const LIMITS = {
  maxFolds: 24,
  minSpeed: 3,
  maxSpeed: 11.5,
  minPitch: (-35 * Math.PI) / 180,
  maxPitch: (40 * Math.PI) / 180,
  maxYaw: (18 * Math.PI) / 180,
  /** Hand height above the platform deck, meters. Not height above the hall floor. */
  minHeight: 0.18,
  maxHeight: 1.05,
  /** Relative area difference treated as a tie, so the player may pick a side. */
  tieFraction: 0.018,
} as const

export const SEAT_COLORS = ['#1f6a45', '#a3452a', '#2a4578', '#8a6a22'] as const

export const DT = 1 / 240
export const SAMPLE_HZ = 30
