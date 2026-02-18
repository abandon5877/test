// 游戏状态类型
export interface GameState {
  scene: 'camp' | 'battle';
  player: Player;
  enemy: Enemy | null;
  enemies: Record<string, Enemy>;
  battle: BattleState;
  debug: DebugState;
  currentEditingSlot: number | null;
}

// 玩家类型
export interface Player {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  speed: number;
  spells: string[][];
  gold: number;
  experience: number;
  level: number;
  materials: Record<string, number>;
  unlockedRunes: string[];
}

// 敌人类型
export interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  dmg: number;
  speed: number;
  gold: number;
  experience: number;
  icon: string;
  drops: string[];
  skills?: EnemySkill[];
  aiStrategy?: EnemyAIStrategy;
  mp?: number;
  maxMp?: number;
}

// 战斗状态类型
export interface BattleState {
  active: boolean;
  lastTime: number;
  phase: 'preparation' | 'action' | 'resolution';
  currentActor: 'player' | 'enemy' | null;
  playerAtb: number;
  enemyAtb: number;
  playerStatus: 'preparing' | 'channeling' | 'stunned';
  enemyStatus: 'preparing' | 'channeling' | 'stunned';
  castProgress: number;
  currentSpellIndex: number;
  currentSpellData: Spell | null;
  currentSpellTime: number;
  stunTimer: number;
  focusValue: number;
  skipAction: boolean;
}

// 调试状态类型
export interface DebugState {
  logLevel: number;
}

// 法术类型
export interface Spell {
  name: string;
  dmg: number;
  heal: number;
  cost: number;
  time: number;
  description: string;
}

// 敌人技能类型
export interface EnemySkill {
  id: string;
  name: string;
  damage: number;
  cost: number;
  channelTime: number;
  probability: number;
  conditions: {
    minHpPercent?: number;
    maxHpPercent?: number;
    cooldown?: number;
  };
}

// 敌人AI策略类型
export interface EnemyAIStrategy {
  type: 'conservative' | 'aggressive' | 'balanced';
  skillWeights: Record<string, number>;
}

// 日志条目类型
export type LogEntryType = 'player' | 'enemy' | 'system';

// 日志条目接口
export interface LogEntry {
  type: LogEntryType;
  message: string;
  timestamp: number;
}

// 游戏事件类型
export type GameEvent = 
  | 'battleStart'
  | 'battleEnd'
  | 'playerStatusChange'
  | 'enemyStatusChange'
  | 'spellCast'
  | 'spellComplete'
  | 'spellInterrupt'
  | 'enemyAttack'
  | 'enemyAttackStart'
  | 'playerDamage'
  | 'enemyDamage'
  | 'playerHeal'
  | 'levelUp'
  | 'runeChoice'
  | 'resourceChange'
  | 'sceneChange'
  | 'materialDrop'
  | 'gameRestart'
  | 'shopUpdate'
  | 'spellSlotUpdated'
  | 'phaseChange'
  | 'actorChange';

// 事件数据类型
export interface EventData {
  [key: string]: any;
}

// 存储数据类型
export interface StorageData {
  player: {
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    speed: number;
    spells: string[][];
    gold: number;
    experience: number;
    level: number;
    materials: Record<string, number>;
    unlockedRunes: string[];
  };
  lastScene: 'camp' | 'battle';
  timestamp: number;
  enemy?: any;
  battle?: any;
}

// 符文类型
export interface Rune {
  id: string;
  name: string;
  type: 'CORE' | 'MOD';
  icon: string;
  baseDmg?: number;
  baseHeal?: number;
  cost: number;
  time: number;
  desc: string;
  dmgMult?: number;
  costMult?: number;
  timeAdd?: number;
  timeMult?: number;
  count?: number;
}

// 素材类型
export interface Material {
  id: string;
  name: string;
  icon: string;
  value: number;
  dropRate: number;
  description?: string;
}
