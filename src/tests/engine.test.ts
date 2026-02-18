import { describe, it, expect, beforeEach, vi } from 'vitest';
import { engine, state } from '../modules/engine';
import { events } from '../modules/events';
import { aiSystem } from '../modules/ai';

// 模拟performance
if (!global.performance) {
  global.performance = {
    now: () => Date.now()
  } as any;
}

describe('Engine - Battle System', () => {
  beforeEach(() => {
    // 重置游戏状态
    engine.resetState();
    // 清除所有事件监听器
    vi.clearAllMocks();
  });

  describe('Battle Flow', () => {
    it('should start battle and initialize state correctly', () => {
      engine.startBattle('wolf');
      
      expect(state.scene).toBe('battle');
      expect(state.battle.active).toBe(true);
      expect(state.battle.phase).toBe('preparation');
      expect(state.battle.currentActor).toBe(null);
      expect(state.enemy).toBeTruthy();
      expect(state.enemy?.name).toBe('恶狼');
    });

    it('should end battle with victory', () => {
      engine.startBattle('wolf');
      state.enemy!.hp = 0;
      
      const victoryCallback = vi.fn();
      events.on('battleEnd', victoryCallback);
      
      engine.endBattle(true);
      
      expect(victoryCallback).toHaveBeenCalledWith({ victory: true });
      expect(state.battle.active).toBe(false);
    });

    it('should end battle with defeat', () => {
      engine.startBattle('wolf');
      state.player.hp = 0;
      
      const defeatCallback = vi.fn();
      events.on('battleEnd', defeatCallback);
      
      engine.endBattle(false);
      
      expect(defeatCallback).toHaveBeenCalledWith({ victory: false });
      expect(state.battle.active).toBe(false);
    });
  });

  describe('Preparation Phase', () => {
    beforeEach(() => {
      engine.startBattle('wolf');
    });

    it('should update player ATB in preparation phase', () => {
      const initialAtb = state.battle.playerAtb;
      engine.updateBattle(1);
      
      expect(state.battle.playerAtb).toBeGreaterThan(initialAtb);
      expect(state.battle.phase).toBe('preparation');
    });

    it('should update enemy ATB in preparation phase', () => {
      const initialAtb = state.battle.enemyAtb;
      engine.updateBattle(1);
      
      expect(state.battle.enemyAtb).toBeGreaterThan(initialAtb);
      expect(state.battle.phase).toBe('preparation');
    });

    it('should switch to action phase when player ATB is ready', () => {
      state.battle.playerAtb = 100;
      
      const phaseChangeCallback = vi.fn();
      events.on('phaseChange', phaseChangeCallback);
      
      engine.updateBattle(0.1);
      
      expect(state.battle.phase).toBe('action');
      expect(state.battle.currentActor).toBe('player');
      expect(phaseChangeCallback).toHaveBeenCalledWith({ oldPhase: 'preparation', newPhase: 'action' });
    });

    it('should switch to action phase when enemy ATB is ready', () => {
      state.battle.enemyAtb = 100;
      
      const phaseChangeCallback = vi.fn();
      events.on('phaseChange', phaseChangeCallback);
      
      engine.updateBattle(0.1);
      
      expect(state.battle.phase).toBe('action');
      expect(state.battle.currentActor).toBe('enemy');
      expect(phaseChangeCallback).toHaveBeenCalledWith({ oldPhase: 'preparation', newPhase: 'action' });
    });
  });

  describe('Action Phase', () => {
    beforeEach(() => {
      engine.startBattle('wolf');
      state.battle.phase = 'action';
    });

    it('should handle player spell casting', () => {
      state.battle.currentActor = 'player';
      state.player.mp = 100;
      
      const spellCastCallback = vi.fn();
      events.on('spellCast', spellCastCallback);
      
      const result = engine.startCast(0);
      
      expect(result).toBe(true);
      expect(state.battle.playerStatus).toBe('channeling');
      expect(state.battle.phase).toBe('preparation');
      expect(spellCastCallback).toHaveBeenCalled();
    });

    it('should not cast spell with insufficient MP', () => {
      state.battle.currentActor = 'player';
      state.player.mp = 0;
      
      const result = engine.startCast(0);
      
      expect(result).toBe(false);
      expect(state.battle.playerStatus).toBe('preparing');
    });

    it('should handle enemy action through battle update', () => {
      state.battle.currentActor = 'enemy';
      
      const enemyAttackCallback = vi.fn();
      events.on('enemyAttack', enemyAttackCallback);
      
      engine.updateBattle(0.1);
      
      expect(state.battle.phase).toBe('preparation');
      expect(enemyAttackCallback).toHaveBeenCalled();
    });
  });

  describe('Resolution Phase', () => {
    beforeEach(() => {
      engine.startBattle('wolf');
      state.battle.phase = 'resolution';
    });

    it('should handle spell completion', () => {
      state.battle.playerStatus = 'channeling';
      state.battle.currentSpellData = {
        name: '火球术',
        dmg: 20,
        heal: 0,
        cost: 10,
        time: 1,
        description: '发射一个火球'
      };
      state.enemy!.hp = 50;
      
      const spellCompleteCallback = vi.fn();
      events.on('spellComplete', spellCompleteCallback);
      
      engine.updateBattle(0.1);
      
      expect(state.battle.playerStatus).toBe('preparing');
      expect(state.enemy!.hp).toBe(30);
      expect(spellCompleteCallback).toHaveBeenCalled();
      expect(state.battle.phase).toBe('preparation');
    });

    it('should handle enemy cast completion', () => {
      state.battle.enemyStatus = 'channeling';
      state.player.hp = 50;
      
      const enemyAttackCallback = vi.fn();
      events.on('enemyAttack', enemyAttackCallback);
      
      engine.updateBattle(0.1);
      
      expect(state.battle.enemyStatus).toBe('preparing');
      expect(state.player.hp).toBeLessThan(50);
      expect(enemyAttackCallback).toHaveBeenCalled();
      expect(state.battle.phase).toBe('preparation');
    });
  });

  describe('Status Management', () => {
    beforeEach(() => {
      engine.startBattle('wolf');
    });

    it('should handle stun state', () => {
      state.battle.playerStatus = 'stunned';
      state.battle.stunTimer = 1;
      
      const statusChangeCallback = vi.fn();
      events.on('playerStatusChange', statusChangeCallback);
      
      engine.updateBattle(1.1);
      
      expect(state.battle.playerStatus).toBe('preparing');
      expect(statusChangeCallback).toHaveBeenCalledWith({ oldStatus: 'stunned', newStatus: 'preparing' });
    });

    it('should interrupt cast when taking damage', () => {
      state.battle.playerStatus = 'channeling';
      
      const interruptCallback = vi.fn();
      events.on('spellInterrupt', interruptCallback);
      
      engine.interruptCast();
      
      expect(state.battle.playerStatus).toBe('stunned');
      expect(interruptCallback).toHaveBeenCalled();
    });
  });

  describe('AI System Integration', () => {
    it('should initialize AI for enemy', () => {
      engine.startBattle('wolf');
      
      expect(state.enemy).toBeTruthy();
      // AI系统应该已经初始化
      expect(() => aiSystem.updateAI(0.1)).not.toThrow();
    });

    it('should select skill for enemy', () => {
      engine.startBattle('wolf');
      
      const skill = aiSystem.selectSkill(state.enemy!);
      expect(skill).toBeTruthy();
      expect(skill.name).toBeDefined();
      expect(skill.damage).toBeDefined();
    });
  });

  describe('Level Up System', () => {
    it('should level up when experience is sufficient', () => {
      state.player.level = 1;
      state.player.experience = 100; // 足够升级
      
      const levelUpCallback = vi.fn();
      events.on('levelUp', levelUpCallback);
      
      const result = engine.checkLevelUp();
      
      expect(result).toBe(true);
      expect(state.player.level).toBe(2);
      expect(levelUpCallback).toHaveBeenCalled();
    });

    it('should not level up when experience is insufficient', () => {
      state.player.level = 1;
      state.player.experience = 50; // 不足升级
      
      const result = engine.checkLevelUp();
      
      expect(result).toBe(false);
      expect(state.player.level).toBe(1);
    });
  });

  describe('Spell System', () => {
    it('should calculate spell correctly', () => {
      const spellChain = ['firebolt'];
      const spell = engine.calculateSpell(spellChain);
      
      expect(spell).toBeTruthy();
      expect(spell.name).toBeDefined();
      expect(spell.dmg).toBeGreaterThan(0);
      expect(spell.cost).toBeGreaterThan(0);
    });

    it('should update player spell', () => {
      const initialSpells = [...state.player.spells[0]];
      engine.updatePlayerSpell(0, ['firebolt', 'amp']);
      
      expect(state.player.spells[0]).toEqual(['firebolt', 'amp']);
      expect(state.player.spells[0]).not.toEqual(initialSpells);
    });

    it('should add rune to slot', () => {
      const initialLength = state.player.spells[0].length;
      engine.addRuneToSlot(0, 'amp');
      
      expect(state.player.spells[0].length).toBe(initialLength + 1);
      expect(state.player.spells[0][initialLength]).toBe('amp');
    });

    it('should remove rune from slot', () => {
      engine.addRuneToSlot(0, 'amp');
      const initialLength = state.player.spells[0].length;
      engine.removeRuneFromSlot(0, 1);
      
      expect(state.player.spells[0].length).toBe(initialLength - 1);
      expect(state.player.spells[0]).not.toContain('amp');
    });
  });

  describe('Shop System', () => {
    beforeEach(() => {
      state.player.gold = 100;
    });

    it('should buy material successfully', () => {
      const initialGold = state.player.gold;
      const result = engine.buyMaterial('fireEssence', 1);
      
      expect(result).toBe(true);
      expect(state.player.gold).toBeLessThan(initialGold);
      expect(state.player.materials['fireEssence']).toBe(1);
    });

    it('should not buy material with insufficient gold', () => {
      state.player.gold = 0;
      const result = engine.buyMaterial('fireEssence', 1);
      
      expect(result).toBe(false);
      expect(state.player.materials['fireEssence']).toBeUndefined();
    });

    it('should sell material successfully', () => {
      state.player.materials['fireEssence'] = 2;
      const initialGold = state.player.gold;
      const result = engine.sellMaterial('fireEssence', 1);
      
      expect(result).toBe(true);
      expect(state.player.gold).toBeGreaterThan(initialGold);
      expect(state.player.materials['fireEssence']).toBe(1);
    });

    it('should not sell material with insufficient quantity', () => {
      state.player.materials['fireEssence'] = 0;
      const initialGold = state.player.gold;
      const result = engine.sellMaterial('fireEssence', 1);
      
      expect(result).toBe(false);
      expect(state.player.gold).toBe(initialGold);
    });
  });

  describe('Utility Functions', () => {
    it('should reset game state', () => {
      engine.startBattle('wolf');
      engine.resetState();
      
      expect(state.scene).toBe('camp');
      expect(state.battle.active).toBe(false);
      expect(state.enemy).toBe(null);
      expect(state.player.hp).toBe(100);
      expect(state.player.mp).toBe(50);
    });

    it('should restart game', () => {
      engine.startBattle('wolf');
      
      const restartCallback = vi.fn();
      events.on('gameRestart', restartCallback);
      
      engine.restartGame();
      
      expect(state.scene).toBe('camp');
      expect(restartCallback).toHaveBeenCalled();
    });

    it('should rest and restore HP/MP', () => {
      state.player.hp = 50;
      state.player.mp = 20;
      
      engine.rest();
      
      expect(state.player.hp).toBe(state.player.maxHp);
      expect(state.player.mp).toBe(state.player.maxMp);
    });

    it('should unlock rune', () => {
      const initialCount = state.player.unlockedRunes.length;
      engine.unlockRune('iceShard');
      
      expect(state.player.unlockedRunes.length).toBe(initialCount + 1);
      expect(state.player.unlockedRunes).toContain('iceShard');
    });
  });
});
