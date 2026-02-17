import { GameState, Spell, LogEntry, LogEntryType, GameEvent, EventData } from '../types';
import { RUNES, getRandomEnemy } from '../data';

// 游戏状态
export const state: GameState = {
  scene: 'camp', // 'camp', 'battle'
  player: {
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    speed: 12,
    spells: [ // 预设三个卡槽
      ['firebolt'], 
      ['amp', 'firebolt'], 
      ['heal']
    ]
  },
  enemy: null,
  battle: {
    active: false,
    lastTime: 0,
    playerAtb: 0,
    enemyAtb: 0,
    playerStatus: 'charging', // charging, ready, casting, stunned
    enemyStatus: 'charging',
    castProgress: 0,
    currentSpellIndex: -1,
    currentSpellData: null,
    currentSpellTime: 0,
    stunTimer: 0,
    interruptThreshold: 10 // 受到多少伤害会打断施法
  },
  debug: {
    logLevel: 1 // 0: 关键信息, 1: 战斗细节, 2: 所有调试信息
  }
};

// 战斗日志
const battleLog: LogEntry[] = [];

// 事件系统
class EventEmitter {
  private events: Record<string, Array<(data: EventData) => void>> = {};

  on(event: GameEvent, listener: (data: EventData) => void): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  emit(event: GameEvent, data: EventData): void {
    if (this.events[event]) {
      this.events[event].forEach(listener => listener(data));
    }
  }

  off(event: GameEvent, listener: (data: EventData) => void): void {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(l => l !== listener);
    }
  }
}

export const events = new EventEmitter();

// 核心逻辑引擎
export const engine = {
  /**
   * 计算一个法术链的属性
   * @param {Array<string>} chain - 符文ID数组
   * @returns {Spell} 法术属性对象
   */
  calculateSpell: (chain: string[]): Spell => {
    if (!chain || chain.length === 0) {
      return {
        name: '无效法术',
        cost: 0,
        time: 0,
        dmg: 0,
        heal: 0,
        runes: []
      };
    }

    let totalCost = 0;
    let totalTime = 0;
    let totalDmg = 0;
    let totalHeal = 0;

    let pendingMods: any[] = [];

    for (let runeId of chain) {
      const rune = RUNES[runeId];
      if (!rune) continue;

      if (rune.type === 'MOD') {
        pendingMods.push(rune);
      } else if (rune.type === 'CORE') {
        // 应用所有暂存的修饰符到这个核心符
        let cDmg = rune.baseDmg || 0;
        let cHeal = rune.baseHeal || 0;
        let cCost = rune.cost;
        let cTime = rune.time;
        let count = 1;

        // 应用修饰符
        for (let mod of pendingMods) {
          if (mod.dmgMult) cDmg *= mod.dmgMult;
          if (mod.costMult) cCost *= mod.costMult;
          if (mod.timeMult) cTime *= mod.timeMult;
          if (mod.timeAdd) cTime += mod.timeAdd;
          if (mod.count) count = mod.count; // 简单起见，最后一个多重符生效
        }

        // 累加
        totalCost += cCost * count;
        totalTime += cTime * count;
        if (cDmg > 0) {
          totalDmg += cDmg * count;
        }
        if (cHeal > 0) {
          totalHeal += cHeal * count;
        }

        pendingMods = []; // 重置
      }
    }

    // 构建名称
    let fullName = chain.map(id => RUNES[id]?.name || id).join(' + ');
    if (fullName === '') fullName = '无效法术';

    return {
      name: fullName,
      cost: Math.round(totalCost),
      time: totalTime,
      dmg: Math.round(totalDmg),
      heal: Math.round(totalHeal),
      runes: chain
    };
  },

  /**
   * 开始战斗
   */
  startBattle: (): void => {
    state.scene = 'battle';
    state.enemy = getRandomEnemy();
    state.battle = {
      active: true,
      lastTime: performance.now(),
      playerAtb: 0,
      enemyAtb: 0,
      playerStatus: 'charging',
      enemyStatus: 'charging',
      castProgress: 0,
      currentSpellIndex: -1,
      currentSpellData: null,
      currentSpellTime: 0,
      stunTimer: 0,
      interruptThreshold: 10
    };

    // 清空战斗日志
    battleLog.length = 0;
    engine.addLogEntry('system', `战斗开始！遇到了 ${state.enemy.name} ${state.enemy.icon}`);

    events.emit('battleStart', { enemy: state.enemy });
    events.emit('sceneChange', { scene: 'battle' });
  },

  /**
   * 结束战斗
   * @param {boolean} victory - 是否胜利
   */
  endBattle: (victory: boolean): void => {
    state.battle.active = false;
    
    if (victory) {
      engine.addLogEntry('system', `战斗胜利！击败了 ${state.enemy?.name}`);
    } else {
      engine.addLogEntry('system', `战斗失败！被 ${state.enemy?.name} 击败了`);
    }

    events.emit('battleEnd', { victory });
    
    // 回到营地
    setTimeout(() => {
      state.scene = 'camp';
      state.enemy = null;
      events.emit('sceneChange', { scene: 'camp' });
    }, 2000);
  },

  /**
   * 战斗更新
   * @param {number} deltaTime - 时间增量（秒）
   */
  updateBattle: (deltaTime: number): void => {
    if (!state.battle.active || !state.enemy) return;

    // 处理眩晕
    if (state.battle.stunTimer > 0) {
      state.battle.stunTimer -= deltaTime;
      if (state.battle.stunTimer <= 0) {
        state.battle.playerStatus = 'charging';
      }
    }

    // 更新ATB条
    if (state.battle.playerStatus === 'charging') {
      state.battle.playerAtb += (state.player.speed * deltaTime) / 10;
      if (state.battle.playerAtb >= 100) {
        state.battle.playerAtb = 100;
        state.battle.playerStatus = 'ready';
        engine.addLogEntry('system', '玩家准备就绪！');
      }
    }

    if (state.battle.enemyStatus === 'charging') {
      state.battle.enemyAtb += (state.enemy.speed * deltaTime) / 10;
      if (state.battle.enemyAtb >= 100) {
        state.battle.enemyAtb = 100;
        state.battle.enemyStatus = 'ready';
        engine.addLogEntry('system', `${state.enemy.name} 准备就绪！`);
      }
    }

    // 处理施法
    if (state.battle.playerStatus === 'casting') {
      state.battle.castProgress += deltaTime / state.battle.currentSpellTime;
      
      if (state.battle.castProgress >= 1) {
        // 施法完成
        engine.finishCast();
      }
    }

    // 敌人行动
    if (state.battle.enemyStatus === 'ready') {
      engine.enemyAttack();
    }
  },

  /**
   * 开始施法
   * @param {number} spellIndex - 法术索引
   */
  startCast: (spellIndex: number): boolean => {
    const spellChain = state.player.spells[spellIndex];
    if (!spellChain || spellChain.length === 0) return false;

    const spell = engine.calculateSpell(spellChain);
    
    // 检查MP是否足够
    if (state.player.mp < spell.cost) {
      engine.addLogEntry('system', 'MP不足！');
      return false;
    }

    // 扣除MP
    state.player.mp -= spell.cost;

    // 设置施法状态
    state.battle.playerStatus = 'casting';
    state.battle.castProgress = 0;
    state.battle.currentSpellIndex = spellIndex;
    state.battle.currentSpellData = spell;
    state.battle.currentSpellTime = spell.time;

    engine.addLogEntry('player', `开始吟唱 ${spell.name}...`);
    events.emit('spellCast', { spell, spellIndex });

    return true;
  },

  /**
   * 完成施法
   */
  finishCast: (): void => {
    if (!state.battle.currentSpellData || !state.enemy) return;

    const spell = state.battle.currentSpellData;

    if (spell.dmg > 0) {
      // 造成伤害
      state.enemy.hp -= spell.dmg;
      engine.addLogEntry('player', `使用 ${spell.name} 造成 ${spell.dmg} 点伤害！`);
      events.emit('enemyDamage', { damage: spell.dmg, enemy: state.enemy });

      // 检查敌人是否死亡
      if (state.enemy.hp <= 0) {
        engine.endBattle(true);
        return;
      }
    } else if (spell.heal > 0) {
      // 治疗
      state.player.hp = Math.min(state.player.hp + spell.heal, state.player.maxHp);
      engine.addLogEntry('player', `使用 ${spell.name} 恢复 ${spell.heal} 点生命值！`);
      events.emit('playerHeal', { heal: spell.heal, player: state.player });
    }

    // 重置状态
    state.battle.playerStatus = 'charging';
    state.battle.playerAtb = 0;
    state.battle.castProgress = 0;
    state.battle.currentSpellIndex = -1;
    state.battle.currentSpellData = null;
    state.battle.currentSpellTime = 0;
  },

  /**
   * 打断施法
   */
  interruptCast: (): void => {
    if (state.battle.playerStatus !== 'casting') return;

    engine.addLogEntry('enemy', '施法被打断了！');
    events.emit('spellInterrupt', {});

    // 重置状态
    state.battle.playerStatus = 'stunned';
    state.battle.stunTimer = 1; // 1秒眩晕
    state.battle.castProgress = 0;
    state.battle.currentSpellIndex = -1;
    state.battle.currentSpellData = null;
    state.battle.currentSpellTime = 0;
  },

  /**
   * 敌人攻击
   */
  enemyAttack: (): void => {
    if (!state.enemy) return;

    const damage = state.enemy.dmg;
    state.player.hp -= damage;

    engine.addLogEntry('enemy', `${state.enemy.name} 攻击造成 ${damage} 点伤害！`);
    events.emit('enemyAttack', { damage, enemy: state.enemy });
    events.emit('playerDamage', { damage, player: state.player });

    // 检查是否打断施法
    if (state.battle.playerStatus === 'casting' && damage >= state.battle.interruptThreshold) {
      engine.interruptCast();
    }

    // 检查玩家是否死亡
    if (state.player.hp <= 0) {
      engine.endBattle(false);
      return;
    }

    // 重置敌人状态
    state.battle.enemyStatus = 'charging';
    state.battle.enemyAtb = 0;
  },

  /**
   * 添加战斗日志条目
   * @param {LogEntryType} type - 日志类型
   * @param {string} message - 日志消息
   */
  addLogEntry: (type: LogEntryType, message: string): void => {
    const entry: LogEntry = {
      type,
      message,
      timestamp: Date.now()
    };

    battleLog.push(entry);
    
    // 限制日志数量
    if (battleLog.length > 50) {
      battleLog.shift();
    }
  },

  /**
   * 获取战斗日志
   * @returns {LogEntry[]} 战斗日志条目数组
   */
  getBattleLog: (): LogEntry[] => {
    return battleLog;
  },

  /**
   * 切换场景
   * @param {string} scene - 目标场景
   */
  switchScene: (scene: 'camp' | 'battle'): void => {
    if (scene === 'battle') {
      engine.startBattle();
    } else {
      state.scene = 'camp';
      state.enemy = null;
      state.battle.active = false;
      events.emit('sceneChange', { scene: 'camp' });
    }
  },

  /**
   * 更新玩家法术
   * @param {number} slotIndex - 卡槽索引
   * @param {string[]} runes - 符文ID数组
   */
  updatePlayerSpell: (slotIndex: number, runes: string[]): void => {
    if (slotIndex >= 0 && slotIndex < state.player.spells.length) {
      state.player.spells[slotIndex] = runes;
    }
  },

  /**
   * 重置游戏状态
   */
  resetState: (): void => {
    state.player = {
      hp: 100,
      maxHp: 100,
      mp: 50,
      maxMp: 50,
      speed: 12,
      spells: [
        ['firebolt'], 
        ['amp', 'firebolt'], 
        ['heal']
      ]
    };
    state.enemy = null;
    state.battle = {
      active: false,
      lastTime: 0,
      playerAtb: 0,
      enemyAtb: 0,
      playerStatus: 'charging',
      enemyStatus: 'charging',
      castProgress: 0,
      currentSpellIndex: -1,
      currentSpellData: null,
      currentSpellTime: 0,
      stunTimer: 0,
      interruptThreshold: 10
    };
    state.scene = 'camp';
    battleLog.length = 0;
  }
};