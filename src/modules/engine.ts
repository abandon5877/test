import { GameState, Spell, LogEntry, LogEntryType } from '../types';
import { ENEMIES, MATERIALS } from '../data';
import { atbSystem } from './atb';
import { calculator } from './calculator';
import { events } from './events';
import { battleSystem } from './battle/battleSystem';

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
    ],
    gold: 0,
    experience: 0,
    level: 1,
    materials: {},
    unlockedRunes: ['firebolt', 'heal', 'amp'] // 初始解锁的符文
  },
  enemy: null,
  enemies: ENEMIES,
  battle: {
    active: false,
    lastTime: 0,
    phase: 'preparation',
    currentActor: null,
    playerAtb: 0,
    enemyAtb: 0,
    playerStatus: 'preparing',
    enemyStatus: 'preparing',
    castProgress: 0,
    currentSpellIndex: -1,
    currentSpellData: null,
    currentSpellTime: 0,
    stunTimer: 0,
    focusValue: 25,
    skipAction: false
  },
  debug: {
    logLevel: 1 // 0: 关键信息, 1: 战斗细节, 2: 所有调试信息
  },
  currentEditingSlot: null
};

// 核心逻辑引擎
export const engine = {
  /**
   * 计算一个法术链的属性（代理到calculator模块）
   * @param {Array<string>} chain - 符文ID数组
   * @returns {Spell} 法术属性对象
   */
  calculateSpell: (chain: string[]): Spell => {
    return calculator.calculateSpell(chain);
  },

  /**
   * 开始战斗
   * @param {string} enemyId - 可选，指定敌人ID（dev模式）
   */
  startBattle: (enemyId?: string): void => {
    battleSystem.startBattle(state, enemyId);
  },

  /**
   * 结束战斗
   * @param {boolean} victory - 是否胜利
   */
  endBattle: (victory: boolean): void => {
    battleSystem.endBattle(state, victory);
  },

  /**
   * 检查是否升级
   */
  checkLevelUp: (): boolean => {
    return battleSystem.checkLevelUp(state);
  },

  /**
   * 提供符文选择
   */
  offerRuneChoice: (): void => {
    battleSystem.offerRuneChoice(state);
  },

  /**
   * 选择并解锁符文
   * @param {string} runeId - 选择的符文ID
   * @returns {boolean} 是否解锁成功
   */
  chooseRune: (runeId: string): boolean => {
    return battleSystem.chooseRune(state, runeId);
  },

  /**
   * 战斗更新
   * @param {number} deltaTime - 时间增量（秒）
   */
  updateBattle: (deltaTime: number): void => {
    battleSystem.updateBattle(state, deltaTime);
  },

  /**
   * 开始施法
   * @param {number} spellIndex - 法术索引
   */
  startCast: (spellIndex: number): boolean => {
    return battleSystem.startCast(state, spellIndex);
  },

  /**
   * 打断施法
   */
  interruptCast: (): void => {
    battleSystem.interruptCast(state);
  },

  /**
   * 添加战斗日志条目
   * @param {LogEntryType} type - 日志类型
   * @param {string} message - 日志消息
   */
  addLogEntry: (type: LogEntryType, message: string): void => {
    battleSystem.addLogEntry(type, message);
  },

  /**
   * 获取战斗日志
   * @returns {LogEntry[]} 战斗日志条目数组
   */
  getBattleLog: (): LogEntry[] => {
    return battleSystem.getBattleLog();
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
    console.log(`[SPELL] 更新法术槽 - 槽位: ${slotIndex}, 新符文组合: ${runes.join(', ')}`);
    
    if (slotIndex >= 0 && slotIndex < state.player.spells.length) {
      const oldRunes = state.player.spells[slotIndex].join(', ');
      state.player.spells[slotIndex] = runes;
      console.log(`[SPELL] 法术槽 ${slotIndex} 已更新 - 旧: ${oldRunes}, 新: ${runes.join(', ')}`);
    } else {
      console.log(`[SPELL] 无效的法术槽索引: ${slotIndex}`);
    }
  },

  /**
   * 添加符文到卡槽
   * @param {number} slotIndex - 卡槽索引
   * @param {string} runeId - 符文ID
   */
  addRuneToSlot: (slotIndex: number, runeId: string): void => {
    console.log(`[SPELL] 添加符文到卡槽 - 槽位: ${slotIndex}, 符文: ${runeId}`);
    
    if (slotIndex >= 0 && slotIndex < state.player.spells.length) {
      state.player.spells[slotIndex].push(runeId);
      console.log(`[SPELL] 符文 ${runeId} 已添加到槽位 ${slotIndex}，当前组合: ${state.player.spells[slotIndex].join(', ')}`);
      events.emit('spellSlotUpdated', { slotIndex, runes: state.player.spells[slotIndex] });
    } else {
      console.log(`[SPELL] 无效的法术槽索引: ${slotIndex}`);
    }
  },

  /**
   * 从卡槽移除符文
   * @param {number} slotIndex - 卡槽索引
   * @param {number} runeIndex - 符文索引
   */
  removeRuneFromSlot: (slotIndex: number, runeIndex: number): void => {
    console.log(`[SPELL] 从卡槽移除符文 - 槽位: ${slotIndex}, 符文索引: ${runeIndex}`);
    
    if (slotIndex >= 0 && slotIndex < state.player.spells.length) {
      const slot = state.player.spells[slotIndex];
      if (runeIndex >= 0 && runeIndex < slot.length) {
        const removedRune = slot[runeIndex];
        slot.splice(runeIndex, 1);
        console.log(`[SPELL] 符文 ${removedRune} 已从槽位 ${slotIndex} 移除，剩余组合: ${slot.join(', ')}`);
        events.emit('spellSlotUpdated', { slotIndex, runes: slot });
      } else {
        console.log(`[SPELL] 无效的符文索引: ${runeIndex}`);
      }
    } else {
      console.log(`[SPELL] 无效的法术槽索引: ${slotIndex}`);
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
      ],
      gold: 0,
      experience: 0,
      level: 1,
      materials: {},
      unlockedRunes: ['firebolt', 'heal', 'amp']
    };
    state.enemy = null;
    state.battle = {
      active: false,
      lastTime: 0,
      phase: 'preparation',
      currentActor: null,
      playerAtb: 0,
      enemyAtb: 0,
      playerStatus: 'preparing',
      enemyStatus: 'preparing',
      castProgress: 0,
      currentSpellIndex: -1,
      currentSpellData: null,
      currentSpellTime: 0,
      stunTimer: 0,
      focusValue: 25,
      skipAction: false
    };
    state.scene = 'camp';
    state.currentEditingSlot = null;
  },

  /**
   * 重开游戏
   */
  restartGame: (): void => {
    engine.resetState();
    engine.addLogEntry('system', '游戏已重开！');
    events.emit('gameRestart', {});
  },

  /**
   * 获取ATB进度百分比
   * @param {number} progress - 当前进度值
   * @returns {number} 进度百分比
   */
  getATBProgressPercentage: (progress: number): number => {
    return atbSystem.getProgressPercentage(progress);
  },

  /**
   * 获取施法进度百分比
   * @returns {number} 进度百分比
   */
  getCastProgressPercentage: (): number => {
    return atbSystem.getCastProgressPercentage();
  },

  /**
   * 预测施法是否会被打断
   * @param {number} spellIndex - 法术索引
   * @returns {boolean} 是否会被打断
   */
  willCastBeInterrupted: (spellIndex: number): boolean => {
    return battleSystem.willCastBeInterrupted(state, spellIndex);
  },

  /**
   * 预测敌方ATB增长
   * @param {number} time - 预测时间
   * @returns {number} 预测后的ATB值
   */
  predictEnemyATB: (time: number): number => {
    return battleSystem.predictEnemyATB(state, time);
  },

  /**
   * 预测玩家ATB增长
   * @param {number} time - 预测时间
   * @returns {number} 预测后的ATB值
   */
  predictPlayerATB: (time: number): number => {
    return battleSystem.predictPlayerATB(state, time);
  },

  /**
   * 撤退
   * @returns {boolean} 是否撤退成功
   */
  retreat: (): boolean => {
    const success = battleSystem.retreat(state);
    if (success) {
      engine.switchScene('camp');
    }
    return success;
  },

  /**
   * 营地休息
   * @returns {boolean} 是否休息成功
   */
  rest: (): boolean => {
    console.log('[EVENT] 营地休息');
    
    // 回满HP和MP
    const oldHp = state.player.hp;
    const oldMp = state.player.mp;
    state.player.hp = state.player.maxHp;
    state.player.mp = state.player.maxMp;
    
    console.log(`[REST] HP恢复: ${oldHp} → ${state.player.hp}, MP恢复: ${oldMp} → ${state.player.mp}`);
    
    engine.addLogEntry('system', '休息了一下，恢复了全部HP和MP！');
    return true;
  },

  /**
   * 商店系统 - 购买素材
   * @param {string} materialId - 素材ID
   * @param {number} quantity - 购买数量
   * @returns {boolean} 是否购买成功
   */
  buyMaterial: (materialId: string, quantity: number = 1): boolean => {
    console.log(`[SHOP] 购买素材 - ID: ${materialId}, 数量: ${quantity}`);
    
    const material = MATERIALS[materialId];
    if (!material) {
      console.log(`[SHOP] 素材 ${materialId} 不存在`);
      return false;
    }

    const totalCost = material.value * quantity * 1.5; // 购买价格是素材价值的1.5倍
    
    console.log(`[SHOP] 购买 ${quantity} 个 ${material.name}，单价: ${material.value}, 总价: ${totalCost}, 当前金币: ${state.player.gold}`);
    
    if (state.player.gold < totalCost) {
      console.log('[SHOP] 金币不足，无法购买');
      engine.addLogEntry('system', '金币不足，无法购买！');
      return false;
    }

    // 消耗金币
    state.player.gold -= totalCost;
    
    // 增加素材
    state.player.materials[materialId] = (state.player.materials[materialId] || 0) + quantity;
    
    console.log(`[SHOP] 购买成功！剩余金币: ${state.player.gold}, ${material.name}数量: ${state.player.materials[materialId]}`);
    
    engine.addLogEntry('system', `花费 ${totalCost} 金币购买了 ${quantity} 个 ${material.name}！`);
    events.emit('resourceChange', { gold: state.player.gold });
    events.emit('shopUpdate', { action: 'buy', material, quantity, cost: totalCost });
    return true;
  },

  /**
   * 商店系统 - 出售素材
   * @param {string} materialId - 素材ID
   * @param {number} quantity - 出售数量
   * @returns {boolean} 是否出售成功
   */
  sellMaterial: (materialId: string, quantity: number = 1): boolean => {
    console.log(`[SHOP] 出售素材 - ID: ${materialId}, 数量: ${quantity}`);
    
    const material = MATERIALS[materialId];
    if (!material) {
      console.log(`[SHOP] 素材 ${materialId} 不存在`);
      return false;
    }

    const currentQuantity = state.player.materials[materialId] || 0;
    console.log(`[SHOP] 出售 ${quantity} 个 ${material.name}，当前拥有: ${currentQuantity}`);
    
    if (currentQuantity < quantity) {
      console.log('[SHOP] 素材数量不足，无法出售');
      engine.addLogEntry('system', '素材数量不足，无法出售！');
      return false;
    }

    const totalValue = material.value * quantity * 0.8; // 出售价格是素材价值的0.8倍
    
    console.log(`[SHOP] 出售 ${quantity} 个 ${material.name}，单价: ${material.value}, 总价: ${totalValue}`);
    
    // 增加金币
    state.player.gold += totalValue;
    
    // 减少素材
    state.player.materials[materialId] -= quantity;
    if (state.player.materials[materialId] <= 0) {
      delete state.player.materials[materialId];
      console.log(`[SHOP] ${material.name} 数量为0，从背包中移除`);
    } else {
      console.log(`[SHOP] ${material.name} 剩余数量: ${state.player.materials[materialId]}`);
    }
    
    console.log(`[SHOP] 出售成功！获得金币: ${totalValue}, 当前金币: ${state.player.gold}`);
    
    engine.addLogEntry('system', `出售了 ${quantity} 个 ${material.name}，获得 ${totalValue} 金币！`);
    events.emit('resourceChange', { gold: state.player.gold });
    events.emit('shopUpdate', { action: 'sell', material, quantity, value: totalValue });
    return true;
  },

  /**
   * 解锁符文
   * @param {string} runeId - 符文ID
   */
  unlockRune: (runeId: string): void => {
    if (!state.player.unlockedRunes.includes(runeId)) {
      state.player.unlockedRunes.push(runeId);
      engine.addLogEntry('system', `解锁了新符文！`);
    }
  }
};
