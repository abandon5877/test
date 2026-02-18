import { describe, it, expect } from 'vitest';
import { atbSystem } from '../modules/atb';
import { Player, Enemy } from '../types';

describe('ATB System', () => {
  describe('updatePlayerATB', () => {
    it('should calculate ATB progress correctly', () => {
      const player: Player = {
        hp: 100,
        maxHp: 100,
        mp: 50,
        maxMp: 50,
        speed: 10,
        spells: [[]],
        gold: 0,
        experience: 0,
        level: 1,
        materials: {},
        unlockedRunes: []
      };
      
      const deltaTime = 0.1;
      const currentATB = 0;
      
      const result = atbSystem.updatePlayerATB(player, deltaTime, currentATB);
      
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should not exceed 100 ATB', () => {
      const player: Player = {
        hp: 100,
        maxHp: 100,
        mp: 50,
        maxMp: 50,
        speed: 100,
        spells: [[]],
        gold: 0,
        experience: 0,
        level: 1,
        materials: {},
        unlockedRunes: []
      };
      
      const deltaTime = 1;
      const currentATB = 90;
      
      const result = atbSystem.updatePlayerATB(player, deltaTime, currentATB);
      
      expect(result).toBe(100);
    });

    it('should handle zero speed', () => {
      const player: Player = {
        hp: 100,
        maxHp: 100,
        mp: 50,
        maxMp: 50,
        speed: 0,
        spells: [[]],
        gold: 0,
        experience: 0,
        level: 1,
        materials: {},
        unlockedRunes: []
      };
      
      const deltaTime = 1;
      const currentATB = 0;
      
      const result = atbSystem.updatePlayerATB(player, deltaTime, currentATB);
      
      expect(result).toBe(0);
    });

    it('should handle zero deltaTime', () => {
      const player: Player = {
        hp: 100,
        maxHp: 100,
        mp: 50,
        maxMp: 50,
        speed: 10,
        spells: [[]],
        gold: 0,
        experience: 0,
        level: 1,
        materials: {},
        unlockedRunes: []
      };
      
      const deltaTime = 0;
      const currentATB = 50;
      
      const result = atbSystem.updatePlayerATB(player, deltaTime, currentATB);
      
      expect(result).toBe(50);
    });
  });

  describe('updateEnemyATB', () => {
    it('should calculate enemy ATB progress correctly', () => {
      const enemy: Enemy = {
        id: 'wolf',
        name: '恶狼',
        hp: 30,
        maxHp: 30,
        dmg: 15,
        speed: 12,
        gold: 3,
        experience: 8,
        icon: 'wolf.png',
        drops: []
      };
      
      const deltaTime = 0.1;
      const currentATB = 0;
      
      const result = atbSystem.updateEnemyATB(enemy, deltaTime, currentATB);
      
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(100);
    });
  });

  describe('isReady', () => {
    it('should return true when ATB is 100', () => {
      const atb = 100;
      const result = atbSystem.isReady(atb);
      expect(result).toBe(true);
    });

    it('should return true when ATB exceeds 100', () => {
      const atb = 110;
      const result = atbSystem.isReady(atb);
      expect(result).toBe(true);
    });

    it('should return false when ATB is less than 100', () => {
      const atb = 99;
      const result = atbSystem.isReady(atb);
      expect(result).toBe(false);
    });

    it('should return false when ATB is zero', () => {
      const atb = 0;
      const result = atbSystem.isReady(atb);
      expect(result).toBe(false);
    });
  });

  describe('Cast System', () => {
    it('should start cast correctly', () => {
      atbSystem.startCast(0, 2);
      const state = atbSystem.getState();
      
      expect(state.isCasting).toBe(true);
      expect(state.spellIndex).toBe(0);
      expect(state.duration).toBe(2000); // 转换为毫秒
    });

    it('should reset cast state', () => {
      atbSystem.startCast(0, 2);
      atbSystem.resetCast();
      const state = atbSystem.getState();
      
      expect(state.isCasting).toBe(false);
      expect(state.spellIndex).toBe(-1);
      expect(state.progress).toBe(0);
    });

    it('should get progress percentage', () => {
      const progress = 50;
      const result = atbSystem.getProgressPercentage(progress);
      
      expect(result).toBe(50);
    });

    it('should predict ATB correctly', () => {
      const currentAtb = 50;
      const speed = 10;
      const time = 1;
      
      const result = atbSystem.predictATB(currentAtb, speed, time);
      
      expect(result).toBeGreaterThan(50);
      expect(result).toBeLessThanOrEqual(100);
    });
  });
});
