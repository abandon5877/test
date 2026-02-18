import { describe, it, expect, beforeEach, vi } from 'vitest';
import { events } from '../modules/events';

describe('Events System', () => {
  beforeEach(() => {
    // 清除所有事件监听器
    events.clearAll();
  });

  describe('on', () => {
    it('should register event listener', () => {
      const callback = vi.fn();
      
      events.on('battleStart', callback);
      
      // 触发事件
      events.emit('battleStart', { enemy: { name: '恶狼' } });
      
      expect(callback).toHaveBeenCalledWith({ enemy: { name: '恶狼' } });
    });

    it('should register multiple listeners for same event', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      events.on('battleStart', callback1);
      events.on('battleStart', callback2);
      
      // 触发事件
      events.emit('battleStart', { enemy: { name: '恶狼' } });
      
      expect(callback1).toHaveBeenCalledWith({ enemy: { name: '恶狼' } });
      expect(callback2).toHaveBeenCalledWith({ enemy: { name: '恶狼' } });
    });

    it('should register listeners for different events', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      events.on('battleStart', callback1);
      events.on('battleEnd', callback2);
      
      // 触发事件1
      events.emit('battleStart', { enemy: { name: '恶狼' } });
      expect(callback1).toHaveBeenCalledWith({ enemy: { name: '恶狼' } });
      expect(callback2).not.toHaveBeenCalled();
      
      // 触发事件2
      events.emit('battleEnd', { victory: true, gold: 10, experience: 20 });
      expect(callback2).toHaveBeenCalledWith({ victory: true, gold: 10, experience: 20 });
    });
  });

  describe('emit', () => {
    it('should emit event with data', () => {
      const callback = vi.fn();
      
      events.on('spellCast', callback);
      
      const eventData = { spell: { name: '火球', dmg: 20 } };
      events.emit('spellCast', eventData);
      
      expect(callback).toHaveBeenCalledWith(eventData);
    });

    it('should not throw error when emitting event with no listeners', () => {
      expect(() => events.emit('battleStart', { enemy: { name: '恶狼' } })).not.toThrow();
    });

    it('should handle multiple emit calls', () => {
      const callback = vi.fn();
      
      events.on('playerDamage', callback);
      
      events.emit('playerDamage', { damage: 10, currentHp: 90 });
      events.emit('playerDamage', { damage: 15, currentHp: 75 });
      events.emit('playerDamage', { damage: 20, currentHp: 55 });
      
      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenNthCalledWith(1, { damage: 10, currentHp: 90 });
      expect(callback).toHaveBeenNthCalledWith(2, { damage: 15, currentHp: 75 });
      expect(callback).toHaveBeenNthCalledWith(3, { damage: 20, currentHp: 55 });
    });
  });

  describe('off', () => {
    it('should remove specific event listener', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      events.on('battleStart', callback1);
      events.on('battleStart', callback2);
      
      // 移除第一个监听器
      events.off('battleStart', callback1);
      
      // 触发事件
      events.emit('battleStart', { enemy: { name: '恶狼' } });
      
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledWith({ enemy: { name: '恶狼' } });
    });

    it('should not affect other events when removing listener', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      events.on('battleStart', callback1);
      events.on('battleEnd', callback2);
      
      // 移除battleStart的监听器
      events.off('battleStart', callback1);
      
      // 触发两个事件
      events.emit('battleStart', { enemy: { name: '恶狼' } });
      events.emit('battleEnd', { victory: true, gold: 10, experience: 20 });
      
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledWith({ victory: true, gold: 10, experience: 20 });
    });

    it('should handle removing non-existent listener', () => {
      const callback = vi.fn();
      
      // 尝试移除不存在的监听器
      expect(() => events.off('battleStart', callback)).not.toThrow();
    });
  });

  describe('clearAll', () => {
    it('should remove all listeners for all events', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      events.on('battleStart', callback1);
      events.on('battleEnd', callback2);
      
      // 清除所有监听器
      events.clearAll();
      
      // 触发事件
      events.emit('battleStart', { enemy: { name: '恶狼' } });
      events.emit('battleEnd', { victory: true, gold: 10, experience: 20 });
      
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });

    it('should handle clearing when no listeners exist', () => {
      expect(() => events.clearAll()).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should remove all listeners for specific event', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();
      
      events.on('battleStart', callback1);
      events.on('battleStart', callback2);
      events.on('battleEnd', callback3);
      
      // 清除battleStart的所有监听器
      events.clear('battleStart');
      
      // 触发事件
      events.emit('battleStart', { enemy: { name: '恶狼' } });
      events.emit('battleEnd', { victory: true, gold: 10, experience: 20 });
      
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
      expect(callback3).toHaveBeenCalledWith({ victory: true, gold: 10, experience: 20 });
    });

    it('should handle clearing event', () => {
      expect(() => events.clear('battleStart')).not.toThrow();
    });
  });

  describe('getListenerCount', () => {
    it('should return number of listeners for event', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      events.on('battleStart', callback1);
      events.on('battleStart', callback2);
      
      const count = events.getListenerCount('battleStart');
      
      expect(count).toBe(2);
    });

    it('should return 0 for event with no listeners', () => {
      const count = events.getListenerCount('battleStart');
      
      expect(count).toBe(0);
    });
  });

  describe('Core Game Events', () => {
    it('should handle battleStart event', () => {
      const callback = vi.fn();
      
      events.on('battleStart', callback);
      
      events.emit('battleStart', { enemy: { name: '恶狼' } });
      
      expect(callback).toHaveBeenCalledWith({ enemy: { name: '恶狼' } });
    });

    it('should handle battleEnd event', () => {
      const callback = vi.fn();
      
      events.on('battleEnd', callback);
      
      events.emit('battleEnd', { victory: true, gold: 10, experience: 20 });
      
      expect(callback).toHaveBeenCalledWith({ victory: true, gold: 10, experience: 20 });
    });

    it('should handle spellCast event', () => {
      const callback = vi.fn();
      
      events.on('spellCast', callback);
      
      events.emit('spellCast', { spell: { name: '火球', dmg: 20 } });
      
      expect(callback).toHaveBeenCalledWith({ spell: { name: '火球', dmg: 20 } });
    });

    it('should handle playerDamage event', () => {
      const callback = vi.fn();
      
      events.on('playerDamage', callback);
      
      events.emit('playerDamage', { damage: 10, currentHp: 90 });
      
      expect(callback).toHaveBeenCalledWith({ damage: 10, currentHp: 90 });
    });

    it('should handle enemyDamage event', () => {
      const callback = vi.fn();
      
      events.on('enemyDamage', callback);
      
      events.emit('enemyDamage', { damage: 15, currentHp: 35 });
      
      expect(callback).toHaveBeenCalledWith({ damage: 15, currentHp: 35 });
    });

    it('should handle levelUp event', () => {
      const callback = vi.fn();
      
      events.on('levelUp', callback);
      
      events.emit('levelUp', { newLevel: 2, oldLevel: 1 });
      
      expect(callback).toHaveBeenCalledWith({ newLevel: 2, oldLevel: 1 });
    });

    it('should handle sceneChange event', () => {
      const callback = vi.fn();
      
      events.on('sceneChange', callback);
      
      events.emit('sceneChange', { newScene: 'battle', oldScene: 'camp' });
      
      expect(callback).toHaveBeenCalledWith({ newScene: 'battle', oldScene: 'camp' });
    });

    it('should handle spellComplete event', () => {
      const callback = vi.fn();
      
      events.on('spellComplete', callback);
      
      events.emit('spellComplete', { spell: { name: '火球', dmg: 20 } });
      
      expect(callback).toHaveBeenCalledWith({ spell: { name: '火球', dmg: 20 } });
    });

    it('should handle enemyAttack event', () => {
      const callback = vi.fn();
      
      events.on('enemyAttack', callback);
      
      events.emit('enemyAttack', { damage: 15 });
      
      expect(callback).toHaveBeenCalledWith({ damage: 15 });
    });
  });
});
