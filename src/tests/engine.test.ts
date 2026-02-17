import { describe, it, expect, beforeEach } from 'vitest';
import { engine, state } from '../modules/engine';

describe('Engine Tests', () => {
  beforeEach(() => {
    // 重置游戏状态
    engine.resetState();
  });

  describe('calculateSpell', () => {
    it('should calculate basic spell properties', () => {
      const spell = engine.calculateSpell(['firebolt']);
      
      expect(spell.name).toBe('火球术');
      expect(spell.cost).toBe(10);
      expect(spell.time).toBe(1.5);
      expect(spell.dmg).toBe(25);
      expect(spell.heal).toBe(0);
    });

    it('should calculate spell with modifier', () => {
      const spell = engine.calculateSpell(['amp', 'firebolt']);
      
      expect(spell.name).toBe('强化 + 火球术');
      expect(spell.cost).toBe(13); // 10 * 1.3
      expect(spell.time).toBe(2.0); // 1.5 + 0.5
      expect(spell.dmg).toBe(38); // 25 * 1.5
      expect(spell.heal).toBe(0);
    });

    it('should calculate healing spell', () => {
      const spell = engine.calculateSpell(['heal']);
      
      expect(spell.name).toBe('治疗术');
      expect(spell.cost).toBe(15);
      expect(spell.time).toBe(2.0);
      expect(spell.dmg).toBe(0);
      expect(spell.heal).toBe(30);
    });

    it('should handle empty spell chain', () => {
      const spell = engine.calculateSpell([]);
      
      expect(spell.name).toBe('无效法术');
      expect(spell.cost).toBe(0);
      expect(spell.time).toBe(0);
      expect(spell.dmg).toBe(0);
      expect(spell.heal).toBe(0);
    });

    it('should handle multiple modifiers', () => {
      const spell = engine.calculateSpell(['amp', 'quick', 'firebolt']);
      
      expect(spell.name).toBe('强化 + 迅捷 + 火球术');
      expect(spell.cost).toBe(10); // 10 * 1.3 * 0.8
      expect(spell.time).toBe(1.2); // (1.5 + 0.5) * 0.6
      expect(spell.dmg).toBe(30); // 25 * 1.5 * 0.8
      expect(spell.heal).toBe(0);
    });
  });

  describe('updatePlayerSpell', () => {
    it('should update player spell', () => {
      const newRunes = ['iceShard'];
      engine.updatePlayerSpell(0, newRunes);
      
      expect(state.player.spells[0]).toEqual(newRunes);
    });

    it('should not update spell if slot index is out of bounds', () => {
      const originalSpell = [...state.player.spells[0]];
      engine.updatePlayerSpell(10, ['iceShard']); // Invalid index
      
      expect(state.player.spells[0]).toEqual(originalSpell);
    });
  });

  describe('startCast', () => {
    it('should start casting successfully', () => {
      state.player.mp = 50; // Ensure enough MP
      const result = engine.startCast(0);
      
      expect(result).toBe(true);
      expect(state.battle.playerStatus).toBe('casting');
      expect(state.battle.currentSpellIndex).toBe(0);
      expect(state.battle.currentSpellData).not.toBeNull();
    });

    it('should fail to cast if MP is insufficient', () => {
      state.player.mp = 0; // Insufficient MP
      const result = engine.startCast(0);
      
      expect(result).toBe(false);
      expect(state.battle.playerStatus).not.toBe('casting');
    });

    it('should fail to cast if spell index is invalid', () => {
      state.player.spells[5] = []; // Empty spell
      const result = engine.startCast(5);
      
      expect(result).toBe(false);
      expect(state.battle.playerStatus).not.toBe('casting');
    });
  });

  describe('endBattle', () => {
    it('should end battle with victory', () => {
      engine.startBattle();
      engine.endBattle(true);
      
      expect(state.battle.active).toBe(false);
      // 战斗结束后会自动切换回营地
      setTimeout(() => {
        expect(state.scene).toBe('camp');
      }, 2000);
    });

    it('should end battle with defeat', () => {
      engine.startBattle();
      engine.endBattle(false);
      
      expect(state.battle.active).toBe(false);
      // 战斗结束后会自动切换回营地
      setTimeout(() => {
        expect(state.scene).toBe('camp');
      }, 2000);
    });
  });
});