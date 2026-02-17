// 符文类型
export type RuneType = 'CORE' | 'MOD' | 'CONTROL';

export interface Rune {
  id: string;
  name: string;
  type: RuneType;
  icon: string;
  baseDmg?: number;
  baseHeal?: number;
  cost: number;
  time: number;
  desc?: string;
  dmgMult?: number;
  costMult?: number;
  timeMult?: number;
  timeAdd?: number;
  count?: number;
  [key: string]: any; // 支持扩展属性
}

// 敌人类型
export interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  dmg: number;
  speed: number;
  icon: string;
  [key: string]: any; // 支持扩展属性
}

// 玩家类型
export interface Player {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  speed: number;
  spells: string[][]; // 法术卡槽，每个卡槽是符文ID数组
}

// 战斗状态类型
export type BattleStatus = 'charging' | 'ready' | 'casting' | 'stunned';

// 战斗状态
export interface BattleState {
  active: boolean;
  lastTime: number;
  playerAtb: number;
  enemyAtb: number;
  playerStatus: BattleStatus;
  enemyStatus: BattleStatus;
  castProgress: number;
  currentSpellIndex: number;
  currentSpellData: Spell | null;
  currentSpellTime: number;
  stunTimer: number;
  interruptThreshold: number;
}

// 法术类型
export interface Spell {
  name: string;
  cost: number;
  time: number;
  dmg: number;
  heal: number;
  runes: string[];
}

// 游戏场景类型
export type GameScene = 'camp' | 'battle';

// 游戏状态
export interface GameState {
  scene: GameScene;
  player: Player;
  enemy: Enemy | null;
  battle: BattleState;
  debug: {
    logLevel: number;
  };
}

// 战斗日志条目类型
export type LogEntryType = 'player' | 'enemy' | 'system';

export interface LogEntry {
  type: LogEntryType;
  message: string;
  timestamp: number;
}

// 图片配置类型
export interface ImageConfig {
  id: string;
  path: string;
  width: number;
  height: number;
  alt: string;
}

// 插件类型
export interface GamePlugin {
  id: string;
  name: string;
  version: string;
  init: (game: any) => void;
  update?: (deltaTime: number) => void;
  render?: (ctx: CanvasRenderingContext2D) => void;
  destroy?: () => void;
}

// 事件类型
export type GameEvent = 
  | 'sceneChange'
  | 'battleStart'
  | 'battleEnd'
  | 'spellCast'
  | 'spellInterrupt'
  | 'enemyAttack'
  | 'playerDamage'
  | 'enemyDamage'
  | 'playerHeal'
  | 'gameSave'
  | 'gameLoad';

// 事件数据类型
export interface EventData {
  [key: string]: any;
}

// 存储数据类型
export interface StorageData {
  player: Player;
  lastScene: GameScene;
  timestamp: number;
  [key: string]: any;
}

// UI元素类型
export interface UIElement {
  element: HTMLElement;
  update: () => void;
  destroy?: () => void;
}

// 动画类型
export interface Animation {
  start: () => void;
  update: (deltaTime: number) => void;
  isComplete: () => boolean;
  stop: () => void;
}