import { GameState, Enemy, LogEntry, LogEntryType } from '../../types';
import { events } from '../events';
import { atbSystem } from '../atb';
import { calculator } from '../calculator';
import { aiSystem } from '../ai';
import { MATERIALS } from '../../data';

/**
 * 战斗系统
 * 负责管理战斗相关的所有逻辑
 */
export class BattleSystem {
  private battleLog: LogEntry[] = [];

  /**
   * 开始战斗
   * @param state 游戏状态
   * @param enemyId 可选，指定敌人ID（dev模式）
   */
  startBattle(state: GameState, enemyId?: string): void {
    console.log('[EVENT] 开始战斗');
    state.scene = 'battle';
    
    // dev模式：指定敌人
    if (enemyId) {
      const enemyData = state.enemies[enemyId];
      if (enemyData) {
        state.enemy = JSON.parse(JSON.stringify(enemyData));
        console.log(`[DEV] 使用指定敌人: ${enemyData.name}`);
      } else {
        state.enemy = this.getRandomEnemy(state);
        console.log(`[DEV] 指定敌人 ${enemyId} 不存在，使用随机敌人`);
      }
    } else {
      // 正常模式：随机敌人
      state.enemy = this.getRandomEnemy(state);
    }
    
    state.battle = {
      active: true,
      lastTime: performance.now(),
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

    // 初始化AI系统
    if (state.enemy) {
      aiSystem.initializeAI(state.enemy.id || 'unknown', state.enemy.aiStrategy || { type: 'balanced', skillWeights: {} });
    }

    // 清空战斗日志
    this.battleLog.length = 0;
    if (state.enemy) {
      console.log(`[BATTLE] 遇到了 ${state.enemy.name} (HP: ${state.enemy.hp}, MaxHP: ${state.enemy.maxHp}, DMG: ${state.enemy.dmg}, Speed: ${state.enemy.speed})`);
      this.addLogEntry('system', `战斗开始！遇到了 ${state.enemy.name} ${state.enemy.icon}`);
    }

    events.emit('battleStart', { enemy: state.enemy });
    events.emit('sceneChange', { scene: 'battle' });
    events.emit('phaseChange', { oldPhase: null, newPhase: 'preparation' });
    console.log('[SCENE] 切换到战斗场景');
  }

  /**
   * 结束战斗
   * @param state 游戏状态
   * @param victory 是否胜利
   */
  endBattle(state: GameState, victory: boolean): void {
    console.log(`[EVENT] 结束战斗，结果: ${victory ? '胜利' : '失败'}`);
    state.battle.active = false;
    
    if (victory) {
      // 获取战斗奖励
      const goldReward = state.enemy?.gold || 10;
      const expReward = state.enemy?.experience || 15;
      
      // 增加金币
      state.player.gold += goldReward;
      console.log(`[REWARD] 获得 ${goldReward} 金币，当前金币: ${state.player.gold}`);
      this.addLogEntry('system', `获得 ${goldReward} 金币！`);
      
      // 增加经验
      state.player.experience += expReward;
      console.log(`[REWARD] 获得 ${expReward} 经验值，当前经验: ${state.player.experience}`);
      this.addLogEntry('system', `获得 ${expReward} 经验值！`);
      
      // 掉落素材
      if (state.enemy?.drops) {
        state.enemy.drops.forEach((materialId: string) => {
          const material = MATERIALS[materialId];
          if (material && Math.random() < material.dropRate) {
            // 增加素材
            state.player.materials[materialId] = (state.player.materials[materialId] || 0) + 1;
            console.log(`[REWARD] 获得 ${material.name}，当前数量: ${state.player.materials[materialId]}`);
            this.addLogEntry('system', `获得 ${material.icon} ${material.name}！`);
            events.emit('materialDrop', { material, quantity: 1 });
          }
        });
      }
      
      // 检查是否升级
      const leveledUp = this.checkLevelUp(state);
      console.log(`[LEVEL] 升级检查: ${leveledUp ? '升级了' : '未升级'}`);
      
      console.log(`[BATTLE] 战斗胜利！击败了 ${state.enemy?.name}`);
      this.addLogEntry('system', `战斗胜利！${state.enemy ? `击败了 ${state.enemy.name}` : ''}`);
    } else {
      console.log(`[BATTLE] 战斗失败！被 ${state.enemy?.name} 击败了`);
      this.addLogEntry('system', `战斗失败！被 ${state.enemy?.name} 击败了`);
    }

    events.emit('battleEnd', { victory });
    events.emit('resourceChange', { 
      gold: state.player.gold, 
      experience: state.player.experience, 
      level: state.player.level 
    });
    
    // 回到营地
    setTimeout(() => {
      state.scene = 'camp';
      state.enemy = null;
      console.log('[SCENE] 切换到营地场景');
      events.emit('sceneChange', { scene: 'camp' });
    }, 2000);
  }

  /**
   * 检查是否升级
   * @param state 游戏状态
   * @returns 是否升级
   */
  checkLevelUp(state: GameState): boolean {
    const currentLevel = state.player.level;
    const currentExp = state.player.experience;
    
    // 升级所需经验公式：100 * (level ^ 1.2)
    const expNeeded = Math.floor(100 * Math.pow(currentLevel, 1.2));
    
    console.log(`[LEVEL] 检查升级 - 当前等级: ${currentLevel}, 当前经验: ${currentExp}, 升级所需: ${expNeeded}`);
    
    if (currentExp >= expNeeded) {
      // 升级
      state.player.level += 1;
      state.player.experience -= expNeeded;
      
      // 提升属性
      state.player.maxHp += 20;
      state.player.maxMp += 10;
      state.player.speed += 1;
      
      // 回满HP和MP
      state.player.hp = state.player.maxHp;
      state.player.mp = state.player.maxMp;
      
      console.log(`[LEVEL] 升级成功！从 ${currentLevel} 级升至 ${state.player.level} 级`);
      console.log(`[LEVEL] 属性提升 - HP: ${state.player.maxHp - 20} → ${state.player.maxHp}, MP: ${state.player.maxMp - 10} → ${state.player.maxMp}, Speed: ${state.player.speed - 1} → ${state.player.speed}`);
      console.log(`[LEVEL] 剩余经验: ${state.player.experience}`);
      
      // 解锁新的法术槽位（每3级解锁一个）
      if (state.player.level % 3 === 0) {
        state.player.spells.push([]);
        console.log(`[LEVEL] 解锁新的法术槽位，当前槽位数: ${state.player.spells.length}`);
        this.addLogEntry('system', `解锁了新的法术槽位！`);
      }
      
      this.addLogEntry('system', `升级了！现在是 ${state.player.level} 级！`);
      events.emit('levelUp', { 
        oldLevel: currentLevel, 
        newLevel: state.player.level,
        hpIncrease: 20,
        mpIncrease: 10,
        speedIncrease: 1
      });
      
      // 提供符文选择
      console.log('[EVENT] 提供符文选择');
      this.offerRuneChoice(state);
      
      return true;
    }
    
    return false;
  }

  /**
   * 提供符文选择
   * @param state 游戏状态
   */
  offerRuneChoice(state: GameState): void {
    // 根据等级提供不同稀有度的符文选择
    const level = state.player.level;
    let availableRunes: string[] = [];
    
    console.log(`[RUNE] 提供符文选择 - 当前等级: ${level}`);
    
    // 基础符文（1级可用）
    const basicRunes = ['iceShard', 'quick', 'double'];
    
    // 中级符文（5级可用）
    const intermediateRunes = ['power', 'haste', 'regen'];
    
    // 高级符文（10级可用）
    const advancedRunes = ['mastery', 'arcane', 'lifeSteal'];
    
    // 根据等级解锁不同符文
    if (level >= 1) {
      availableRunes = [...availableRunes, ...basicRunes];
      console.log(`[RUNE] 解锁基础符文: ${basicRunes.join(', ')}`);
    }
    if (level >= 5) {
      availableRunes = [...availableRunes, ...intermediateRunes];
      console.log(`[RUNE] 解锁中级符文: ${intermediateRunes.join(', ')}`);
    }
    if (level >= 10) {
      availableRunes = [...availableRunes, ...advancedRunes];
      console.log(`[RUNE] 解锁高级符文: ${advancedRunes.join(', ')}`);
    }
    
    // 过滤掉已解锁的符文
    const newRunes = availableRunes.filter(runeId => !state.player.unlockedRunes.includes(runeId));
    
    console.log(`[RUNE] 可用新符文: ${newRunes.length} 个`);
    
    if (newRunes.length === 0) {
      console.log('[RUNE] 已经解锁了所有可用符文');
      this.addLogEntry('system', '已经解锁了所有可用符文！');
      return;
    }
    
    // 随机选择3个符文作为选项
    const shuffled = newRunes.sort(() => 0.5 - Math.random());
    const choices = shuffled.slice(0, 3);
    
    console.log(`[RUNE] 符文选择选项: ${choices.join(', ')}`);
    
    this.addLogEntry('system', `升级了！可以选择一个新的符文：`);
    choices.forEach((runeId, index) => {
      this.addLogEntry('system', `${index + 1}. ${runeId}`);
    });
    
    // 触发符文选择事件
    events.emit('runeChoice', { choices });
  }

  /**
   * 选择并解锁符文
   * @param state 游戏状态
   * @param runeId 选择的符文ID
   * @returns 是否解锁成功
   */
  chooseRune(state: GameState, runeId: string): boolean {
    console.log(`[RUNE] 选择符文: ${runeId}`);
    
    if (state.player.unlockedRunes.includes(runeId)) {
      console.log(`[RUNE] 符文 ${runeId} 已经解锁过了`);
      return false;
    }
    
    // 解锁符文
    state.player.unlockedRunes.push(runeId);
    console.log(`[RUNE] 成功解锁新符文: ${runeId}`);
    this.addLogEntry('system', `成功解锁了新符文：${runeId}！`);
    return true;
  }

  /**
   * 更新战斗
   * @param state 游戏状态
   * @param deltaTime 时间增量（秒）
   */
  updateBattle(state: GameState, deltaTime: number): void {
    if (!state.battle.active || !state.enemy) return;

    // 更新AI状态
    aiSystem.updateAI(deltaTime);

    // 处理眩晕
    if (state.battle.stunTimer > 0) {
      state.battle.stunTimer -= deltaTime;
      if (state.battle.stunTimer <= 0) {
        const oldStatus = state.battle.playerStatus;
        state.battle.playerStatus = 'preparing';
        events.emit('playerStatusChange', { oldStatus, newStatus: 'preparing' });
      }
    }

    // 根据当前阶段执行不同逻辑
    switch (state.battle.phase) {
      case 'preparation':
        this.updatePreparationPhase(state, deltaTime);
        break;
      case 'action':
        this.updateActionPhase(state);
        break;
      case 'resolution':
        this.updateResolutionPhase(state);
        break;
    }
  }

  /**
   * 更新准备阶段
   * @param state 游戏状态
   * @param deltaTime 时间增量
   */
  private updatePreparationPhase(state: GameState, deltaTime: number): void {
    if (!state.enemy) return;

    // 更新玩家ATB
    if (state.battle.playerStatus === 'preparing' || state.battle.playerStatus === 'stunned') {
      state.battle.playerAtb = atbSystem.updatePlayerATB(state.player, deltaTime, state.battle.playerAtb);
    } else if (state.battle.playerStatus === 'channeling') {
      // 吟唱状态，ATB保持为0
      state.battle.playerAtb = 0;
      // 更新施法进度
      atbSystem.updateCast();
      state.battle.castProgress = atbSystem.getState().progress;
      
      if (atbSystem.isComplete()) {
        // 吟唱完成，进入结算阶段
        state.battle.phase = 'resolution';
        events.emit('phaseChange', { oldPhase: 'preparation', newPhase: 'resolution' });
      }
    }

    // 更新敌人ATB
    if (state.battle.enemyStatus === 'preparing') {
      state.battle.enemyAtb = atbSystem.updateEnemyATB(state.enemy, deltaTime, state.battle.enemyAtb);
    } else if (state.battle.enemyStatus === 'channeling') {
      // 敌人吟唱状态，ATB保持为0
      state.battle.enemyAtb = 0;
    }

    // 检查ATB是否满
    if (atbSystem.isReady(state.battle.playerAtb) && (state.battle.playerStatus === 'preparing' || state.battle.playerStatus === 'stunned')) {
      // 玩家ATB满，进入行动阶段
      state.battle.phase = 'action';
      state.battle.currentActor = 'player';
      events.emit('phaseChange', { oldPhase: 'preparation', newPhase: 'action' });
      events.emit('actorChange', { actor: 'player' });
    } else if (atbSystem.isReady(state.battle.enemyAtb) && state.battle.enemyStatus === 'preparing') {
      // 敌人ATB满，进入行动阶段
      state.battle.phase = 'action';
      state.battle.currentActor = 'enemy';
      events.emit('phaseChange', { oldPhase: 'preparation', newPhase: 'action' });
      events.emit('actorChange', { actor: 'enemy' });
    }
  }

  /**
   * 更新行动阶段
   * @param state 游戏状态
   */
  private updateActionPhase(state: GameState): void {
    if (!state.battle.currentActor) return;

    if (state.battle.currentActor === 'player') {
      // 玩家行动阶段 - 由UI触发startCast
      // 这里不做自动处理，等待玩家输入
    } else if (state.battle.currentActor === 'enemy') {
      // 敌人行动阶段
      this.enemyAction(state);
    }
  }

  /**
   * 更新结算阶段
   * @param state 游戏状态
   */
  private updateResolutionPhase(state: GameState): void {
    if (!state.enemy) return;

    // 处理施法完成
    if (state.battle.playerStatus === 'channeling') {
      this.finishCast(state);
    }

    // 处理敌人技能完成
    if (state.battle.enemyStatus === 'channeling') {
      this.finishEnemyCast(state);
    }

    // 重置状态，回到准备阶段
    state.battle.phase = 'preparation';
    state.battle.currentActor = null;
    events.emit('phaseChange', { oldPhase: 'resolution', newPhase: 'preparation' });
  }

  /**
   * 开始施法
   * @param state 游戏状态
   * @param spellIndex 法术索引
   * @returns 是否施法成功
   */
  startCast(state: GameState, spellIndex: number): boolean {
    console.log(`BattleSystem startCast called for index ${spellIndex}`);
    
    // 检查战斗是否活跃
    if (!state.battle.active) {
      console.log(`Cannot cast spell: battle is not active`);
      return false;
    }
    
    // 检查是否在行动阶段
    if (state.battle.phase !== 'action' || state.battle.currentActor !== 'player') {
      console.log(`Cannot cast spell: not in player action phase`);
      return false;
    }
    
    const spellChain = state.player.spells[spellIndex];
    if (!spellChain || spellChain.length === 0) {
      console.log(`Invalid spell chain for index ${spellIndex}`);
      return false;
    }

    const spell = calculator.calculateSpell(spellChain);
    console.log(`Calculated spell: ${spell.name}, Cost: ${spell.cost}, Time: ${spell.time}`);
    
    // 检查MP是否足够
    if (state.player.mp < spell.cost) {
      console.log(`Insufficient MP: ${state.player.mp} < ${spell.cost}`);
      this.addLogEntry('system', 'MP不足！');
      return false;
    }

    // 扣除MP
    state.player.mp -= spell.cost;
    console.log(`MP after deduction: ${state.player.mp}`);

    // 设置施法状态
    state.battle.playerStatus = 'channeling';
    console.log(`Player status set to channeling`);
    
    atbSystem.startCast(spellIndex, spell.time);
    state.battle.castProgress = atbSystem.getState().progress;
    state.battle.currentSpellIndex = spellIndex;
    state.battle.currentSpellData = spell;
    state.battle.currentSpellTime = spell.time;

    console.log(`Adding log entry: 开始吟唱 ${spell.name}...`);
    this.addLogEntry('player', `开始吟唱 ${spell.name}...`);
    console.log(`Emitting spellCast event`);
    events.emit('spellCast', { spell, spellIndex });
    events.emit('playerStatusChange', { oldStatus: 'preparing', newStatus: 'channeling' });

    // 回到准备阶段
    state.battle.phase = 'preparation';
    state.battle.currentActor = null;
    events.emit('phaseChange', { oldPhase: 'action', newPhase: 'preparation' });

    console.log(`Start cast completed successfully`);
    return true;
  }

  /**
   * 完成施法
   * @param state 游戏状态
   */
  private finishCast(state: GameState): void {
    if (!state.battle.currentSpellData || !state.enemy) return;

    const spell = state.battle.currentSpellData;

    if (spell.dmg > 0) {
      // 造成伤害
      state.enemy.hp -= spell.dmg;
      this.addLogEntry('player', `使用 ${spell.name} 造成 ${spell.dmg} 点伤害！`);
      events.emit('enemyDamage', { damage: spell.dmg, enemy: state.enemy });

      // 检查敌人是否死亡
      if (state.enemy.hp <= 0) {
        this.endBattle(state, true);
        return;
      }
    } else if (spell.heal > 0) {
      // 治疗
      state.player.hp = Math.min(state.player.hp + spell.heal, state.player.maxHp);
      this.addLogEntry('player', `使用 ${spell.name} 恢复 ${spell.heal} 点生命值！`);
      events.emit('playerHeal', { heal: spell.heal, player: state.player });
    }

    // 重置状态
    state.battle.playerStatus = 'preparing';
    state.battle.playerAtb = 0;
    state.battle.castProgress = 0;
    state.battle.currentSpellIndex = -1;
    state.battle.currentSpellData = null;
    state.battle.currentSpellTime = 0;
    atbSystem.resetCast();

    events.emit('spellComplete', { spell });
    events.emit('playerStatusChange', { oldPhase: 'channeling', newPhase: 'preparing' });
  }

  /**
   * 敌人行动
   * @param state 游戏状态
   */
  private enemyAction(state: GameState): void {
    if (!state.enemy) return;

    console.log('[EVENT] 敌人行动');

    // 选择敌人技能
    const selectedSkill = aiSystem.selectSkill(state.enemy);
    console.log(`[ENEMY] ${state.enemy.name} 选择技能: ${selectedSkill.name}`);

    if (selectedSkill.channelTime > 0) {
      // 需要吟唱的技能
      state.battle.enemyStatus = 'channeling';
      console.log(`[ENEMY] ${state.enemy.name} 开始吟唱 ${selectedSkill.name}`);
      this.addLogEntry('enemy', `${state.enemy.name} 开始吟唱 ${selectedSkill.name}...`);
      events.emit('enemyStatusChange', { oldStatus: 'preparing', newStatus: 'channeling', enemyName: state.enemy.name });
    } else {
      // 不需要吟唱的技能，直接造成伤害
      const damage = selectedSkill.damage;
      const oldHp = state.player.hp;
      state.player.hp -= damage;

      console.log(`[ENEMY] ${state.enemy.name} 使用 ${selectedSkill.name} 造成 ${damage} 点伤害！玩家HP: ${oldHp} → ${state.player.hp}`);
      
      this.addLogEntry('enemy', `${state.enemy.name} 使用 ${selectedSkill.name} 造成 ${damage} 点伤害！`);
      events.emit('enemyAttack', { damage, enemy: state.enemy, skill: selectedSkill });
      events.emit('playerDamage', { damage, player: state.player });

      // 检查是否打断施法
      if (state.battle.playerStatus === 'channeling' && damage >= state.battle.focusValue) {
        console.log('[ENEMY] 攻击打断了玩家施法！');
        this.interruptCast(state);
      }

      // 检查玩家是否死亡
      if (state.player.hp <= 0) {
        console.log('[ENEMY] 玩家被击败了！');
        this.endBattle(state, false);
        return;
      }

      // 重置敌人状态
      state.battle.enemyStatus = 'preparing';
      state.battle.enemyAtb = 0;
      console.log('[ENEMY] 敌人行动结束，状态重置为准备');
      events.emit('enemyStatusChange', { oldStatus: 'preparing', newStatus: 'preparing', enemyName: state.enemy?.name });
    }

    // 回到准备阶段
    state.battle.phase = 'preparation';
    state.battle.currentActor = null;
    events.emit('phaseChange', { oldPhase: 'action', newPhase: 'preparation' });
  }

  /**
   * 完成敌人施法
   * @param state 游戏状态
   */
  private finishEnemyCast(state: GameState): void {
    if (!state.enemy) return;

    // 这里可以实现敌人吟唱技能的效果
    // 暂时简单处理，造成普通伤害
    const damage = state.enemy.dmg * 1.5; // 吟唱技能伤害更高
    const oldHp = state.player.hp;
    state.player.hp -= damage;

    console.log(`[ENEMY] ${state.enemy.name} 吟唱技能造成 ${damage} 点伤害！玩家HP: ${oldHp} → ${state.player.hp}`);
    
    this.addLogEntry('enemy', `${state.enemy.name} 吟唱技能造成 ${damage} 点伤害！`);
    events.emit('enemyAttack', { damage, enemy: state.enemy });
    events.emit('playerDamage', { damage, player: state.player });

    // 检查玩家是否死亡
    if (state.player.hp <= 0) {
      console.log('[ENEMY] 玩家被击败了！');
      this.endBattle(state, false);
      return;
    }

    // 重置敌人状态
    state.battle.enemyStatus = 'preparing';
    state.battle.enemyAtb = 0;
    console.log('[ENEMY] 敌人吟唱结束，状态重置为准备');
    events.emit('enemyStatusChange', { oldStatus: 'channeling', newStatus: 'preparing', enemyName: state.enemy?.name });
  }

  /**
   * 打断施法
   * @param state 游戏状态
   */
  interruptCast(state: GameState): void {
    if (state.battle.playerStatus !== 'channeling') return;

    this.addLogEntry('enemy', '施法被打断了！');
    events.emit('spellInterrupt', {});

    // 重置状态
    state.battle.playerStatus = 'stunned';
    state.battle.stunTimer = 1; // 1秒眩晕
    state.battle.castProgress = 0;
    state.battle.currentSpellIndex = -1;
    state.battle.currentSpellData = null;
    state.battle.currentSpellTime = 0;
    atbSystem.resetCast();

    events.emit('playerStatusChange', { oldStatus: 'channeling', newStatus: 'stunned' });
  }

  /**
   * 添加战斗日志条目
   * @param type 日志类型
   * @param message 日志消息
   */
  addLogEntry(type: LogEntryType, message: string): void {
    const entry: LogEntry = {
      type,
      message,
      timestamp: Date.now()
    };

    this.battleLog.push(entry);
    
    // 限制日志数量
    if (this.battleLog.length > 50) {
      this.battleLog.shift();
    }
  }

  /**
   * 获取战斗日志
   * @returns 战斗日志条目数组
   */
  getBattleLog(): LogEntry[] {
    return this.battleLog;
  }

  /**
   * 预测施法是否会被打断
   * @param state 游戏状态
   * @param spellIndex 法术索引
   * @returns 是否会被打断
   */
  willCastBeInterrupted(state: GameState, spellIndex: number): boolean {
    if (!state.enemy || state.battle.enemyStatus === 'channeling') {
      return false;
    }

    const spellChain = state.player.spells[spellIndex];
    if (!spellChain || spellChain.length === 0) return false;

    const spell = calculator.calculateSpell(spellChain);
    
    // 计算敌人ATB充满需要的时间
    const enemyAtbProgress = state.battle.enemyAtb;
    const enemyAtbRemaining = 100 - enemyAtbProgress;
    const enemySpeed = state.enemy.speed;
    const enemyAtbIncrementPerSecond = (200 * (enemySpeed / 10) * 10) / 60;
    const enemyTimeToReady = enemyAtbRemaining / enemyAtbIncrementPerSecond;
    
    // 如果敌人会在施法时间内准备好攻击
    if (enemyTimeToReady <= spell.time) {
      // 检查敌人伤害是否会打断施法
      const selectedSkill = aiSystem.selectSkill(state.enemy);
      return selectedSkill.damage >= state.battle.focusValue;
    }
    
    return false;
  }

  /**
   * 预测敌方ATB增长
   * @param state 游戏状态
   * @param time 预测时间
   * @returns 预测后的ATB值
   */
  predictEnemyATB(state: GameState, time: number): number {
    if (!state.enemy) return state.battle.enemyAtb;
    
    const enemySpeed = state.enemy.speed;
    const enemyAtbIncrementPerSecond = (200 * (enemySpeed / 10) * 10) / 60;
    const predictedAtb = state.battle.enemyAtb + (enemyAtbIncrementPerSecond * time);
    
    return Math.min(predictedAtb, 100);
  }

  /**
   * 预测玩家ATB增长
   * @param state 游戏状态
   * @param time 预测时间
   * @returns 预测后的ATB值
   */
  predictPlayerATB(state: GameState, time: number): number {
    const playerSpeed = state.player.speed;
    const playerAtbIncrementPerSecond = (200 * (playerSpeed / 10) * 10) / 60;
    const predictedAtb = state.battle.playerAtb + (playerAtbIncrementPerSecond * time);
    
    return Math.min(predictedAtb, 100);
  }

  /**
   * 撤退
   * @param state 游戏状态
   * @returns 是否撤退成功
   */
  retreat(state: GameState): boolean {
    console.log('[EVENT] 尝试撤退');
    
    if (!state.battle.active) {
      console.log('[ERROR] 不在战斗中，无法撤退');
      return false;
    }
    
    // 撤退成功，返回营地
    console.log('[EVENT] 撤退成功，返回营地');
    
    // 重置战斗状态
    state.battle.active = false;
    state.battle.phase = 'preparation';
    state.battle.currentActor = null;
    state.battle.playerAtb = 0;
    state.battle.enemyAtb = 0;
    state.battle.playerStatus = 'preparing';
    state.battle.enemyStatus = 'preparing';
    state.battle.castProgress = 0;
    state.battle.currentSpellIndex = -1;
    state.battle.currentSpellData = null;
    state.battle.currentSpellTime = 0;
    state.battle.stunTimer = 0;
    state.battle.focusValue = 20;
    state.battle.skipAction = false;
    
    return true;
  }

  /**
   * 获取随机敌人
   * @param state 游戏状态
   * @returns 随机敌人
   */
  private getRandomEnemy(state: GameState): Enemy {
    // 从敌人列表中随机选择一个
    const enemyIds = Object.keys(state.enemies);
    const randomEnemyId = enemyIds[Math.floor(Math.random() * enemyIds.length)];
    return JSON.parse(JSON.stringify(state.enemies[randomEnemyId]));
  }
}

// 导出战斗系统实例
export const battleSystem = new BattleSystem();
