import { Rune, Enemy } from '../types';

// 符文数据
export const RUNES: Record<string, Rune> = {
  // 核心符
  firebolt: {
    id: 'firebolt',
    name: '火球术',
    type: 'CORE',
    icon: '🔥',
    baseDmg: 25,
    cost: 10,
    time: 1.5,
    desc: '基础火焰伤害'
  },
  iceShard: {
    id: 'iceShard',
    name: '冰锥术',
    type: 'CORE',
    icon: '❄️',
    baseDmg: 20,
    cost: 12,
    time: 1.2,
    desc: '较低伤害，较快'
  },
  heal: {
    id: 'heal',
    name: '治疗术',
    type: 'CORE',
    icon: '💚',
    baseHeal: 30,
    cost: 15,
    time: 2.0,
    desc: '恢复生命值'
  },
  
  // 修饰符
  amp: {
    id: 'amp',
    name: '强化',
    type: 'MOD',
    icon: '⚡',
    dmgMult: 1.5,
    costMult: 1.3,
    timeAdd: 0.5,
    cost: 0,
    time: 0,
    desc: '伤害+50%, 耗蓝+30%'
  },
  quick: {
    id: 'quick',
    name: '迅捷',
    type: 'MOD',
    icon: '💨',
    dmgMult: 0.8,
    costMult: 0.8,
    timeMult: 0.6,
    cost: 0,
    time: 0,
    desc: '伤害-20%, 时间-40%'
  },
  double: {
    id: 'double',
    name: '双重',
    type: 'MOD',
    icon: '🔁',
    count: 2,
    costMult: 1.8,
    timeMult: 1.6,
    cost: 0,
    time: 0,
    desc: '释放两次'
  }
};

// 敌人数据
export const ENEMIES: Record<string, Enemy> = {
  wolf: {
    id: 'wolf',
    name: '恶狼',
    hp: 60,
    maxHp: 60,
    dmg: 8,
    speed: 15,
    icon: '🐺'
  },
  goblin: {
    id: 'goblin',
    name: '哥布林',
    hp: 40,
    maxHp: 40,
    dmg: 6,
    speed: 20,
    icon: '👺'
  },
  ogre: {
    id: 'ogre',
    name: '食人魔',
    hp: 120,
    maxHp: 120,
    dmg: 15,
    speed: 8,
    icon: '👹'
  }
};

// 随机敌人
export const getRandomEnemy = (): Enemy => {
  const enemyIds = Object.keys(ENEMIES);
  const randomId = enemyIds[Math.floor(Math.random() * enemyIds.length)];
  // 返回敌人的深拷贝，避免修改原始数据
  return JSON.parse(JSON.stringify(ENEMIES[randomId]));
};