import { describe, it, expect } from 'vitest';
import { aiSystem } from '../modules/ai';

describe('AI System', () => {
  describe('updateAI', () => {
    it('should update AI state correctly', () => {
      const deltaTime = 0.1;
      
      // 应该能够正常调用，不抛出异常
      expect(() => aiSystem.updateAI(deltaTime)).not.toThrow();
    });

    it('should handle zero deltaTime', () => {
      const deltaTime = 0;
      
      expect(() => aiSystem.updateAI(deltaTime)).not.toThrow();
    });

    it('should handle large deltaTime', () => {
      const deltaTime = 1;
      
      expect(() => aiSystem.updateAI(deltaTime)).not.toThrow();
    });
  });

  describe('selectSkill', () => {
    it('should select skill for enemy with skills', () => {
      const enemy = {
        id: 'goblin',
        name: '哥布林',
        hp: 50,
        maxHp: 50,
        dmg: 10,
        speed: 8,
        gold: 5,
        experience: 10,
        icon: 'goblin.png',
        drops: [],
        skills: [
          {
            id: 'attack',
            name: '攻击',
            damage: 10,
            cost: 0,
            channelTime: 0,
            probability: 1,
            conditions: {}
          }
        ]
      };
      
      const skill = aiSystem.selectSkill(enemy);
      
      expect(skill).toBeTruthy();
      expect(skill.name).toBeDefined();
      expect(skill.damage).toBeDefined();
    });

    it('should select default skill for enemy without skills', () => {
      const enemy = {
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
      
      const skill = aiSystem.selectSkill(enemy);
      
      expect(skill).toBeTruthy();
      expect(skill.name).toBe('普通攻击');
      expect(skill.damage).toBe(15);
    });

    it('should handle enemy with no valid skills', () => {
      const enemy = {
        id: 'slime',
        name: '史莱姆',
        hp: 20,
        maxHp: 20,
        dmg: 5,
        speed: 5,
        gold: 2,
        experience: 5,
        icon: 'slime.png',
        drops: [],
        skills: []
      };
      
      const skill = aiSystem.selectSkill(enemy);
      
      expect(skill).toBeTruthy();
      expect(skill.name).toBe('普通攻击');
      expect(skill.damage).toBe(5);
    });

    it('should handle enemy with skill conditions', () => {
      const enemy = {
        id: 'orc',
        name: '食人魔',
        hp: 100,
        maxHp: 100,
        dmg: 25,
        speed: 6,
        gold: 20,
        experience: 30,
        icon: 'orc.png',
        drops: [],
        mp: 50,
        skills: [
          {
            id: 'basic_attack',
            name: '普通攻击',
            damage: 25,
            cost: 0,
            channelTime: 0,
            probability: 0.7,
            conditions: {}
          },
          {
            id: 'power_attack',
            name: '强力攻击',
            damage: 40,
            cost: 10,
            channelTime: 1,
            probability: 0.3,
            conditions: {
              minHpPercent: 0.5
            }
          }
        ]
      };
      
      const skill = aiSystem.selectSkill(enemy);
      
      expect(skill).toBeTruthy();
      expect(skill.name).toBeDefined();
      expect(skill.damage).toBeDefined();
    });
  });

  describe('predictEnemyAction', () => {
    it('should predict enemy action correctly', () => {
      const enemy = {
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
      
      const predictedSkill = aiSystem.predictEnemyAction(enemy);
      
      expect(predictedSkill).toBeTruthy();
      expect(predictedSkill.name).toBeDefined();
      expect(predictedSkill.damage).toBeDefined();
    });

    it('should predict action for enemy with skills', () => {
      const enemy = {
        id: 'goblin',
        name: '哥布林',
        hp: 50,
        maxHp: 50,
        dmg: 10,
        speed: 8,
        gold: 5,
        experience: 10,
        icon: 'goblin.png',
        drops: [],
        skills: [
          {
            id: 'attack',
            name: '攻击',
            damage: 10,
            cost: 0,
            channelTime: 0,
            probability: 1,
            conditions: {}
          }
        ]
      };
      
      const predictedSkill = aiSystem.predictEnemyAction(enemy);
      
      expect(predictedSkill).toBeTruthy();
      expect(predictedSkill.name).toBeDefined();
      expect(predictedSkill.damage).toBeDefined();
    });
  });

  describe('resetAI', () => {
    it('should reset AI state for enemy', () => {
      const enemy = {
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
      
      // 先选择技能，初始化AI状态
      aiSystem.selectSkill(enemy);
      
      // 重置AI状态
      expect(() => aiSystem.resetAI('wolf')).not.toThrow();
    });

    it('should handle resetting non-existent AI state', () => {
      expect(() => aiSystem.resetAI('nonExistentEnemy')).not.toThrow();
    });
  });
});
