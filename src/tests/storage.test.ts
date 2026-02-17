import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { storage } from '../modules/storage';
import { engine, state } from '../modules/engine';

describe('Storage Tests', () => {
  beforeEach(() => {
    // 重置游戏状态
    engine.resetState();
    // 清除本地存储
    localStorage.clear();
  });

  afterEach(() => {
    // 清除本地存储
    localStorage.clear();
  });

  describe('saveGame', () => {
    it('should save game progress', () => {
      storage.saveGame();
      
      const savedData = localStorage.getItem('magic-coding-adventure-save');
      expect(savedData).not.toBeNull();
      
      const parsedData = JSON.parse(savedData!);
      expect(parsedData).toHaveProperty('player');
      expect(parsedData).toHaveProperty('lastScene');
      expect(parsedData).toHaveProperty('timestamp');
    });

    it('should save player state', () => {
      // 修改玩家状态
      state.player.hp = 50;
      state.player.mp = 25;
      state.player.spells = [['firebolt'], ['heal']];
      
      storage.saveGame();
      
      const savedData = localStorage.getItem('magic-coding-adventure-save');
      const parsedData = JSON.parse(savedData!);
      
      expect(parsedData.player.hp).toBe(50);
      expect(parsedData.player.mp).toBe(25);
      expect(parsedData.player.spells).toEqual([['firebolt'], ['heal']]);
    });

    it('should save current scene', () => {
      // 切换到战斗场景
      engine.switchScene('battle');
      
      storage.saveGame();
      
      const savedData = localStorage.getItem('magic-coding-adventure-save');
      const parsedData = JSON.parse(savedData!);
      
      expect(parsedData.lastScene).toBe('battle');
    });
  });

  describe('loadGame', () => {
    it('should load game progress', () => {
      // 保存游戏
      state.player.hp = 75;
      state.player.mp = 30;
      state.scene = 'battle';
      storage.saveGame();
      
      // 重置状态
      engine.resetState();
      expect(state.player.hp).toBe(100);
      expect(state.player.mp).toBe(50);
      expect(state.scene).toBe('camp');
      
      // 加载游戏
      const result = storage.loadGame();
      expect(result).toBe(true);
      
      expect(state.player.hp).toBe(75);
      expect(state.player.mp).toBe(30);
      expect(state.scene).toBe('battle');
    });

    it('should return false if no save exists', () => {
      // 确保没有保存
      localStorage.clear();
      
      const result = storage.loadGame();
      expect(result).toBe(false);
    });
  });

  describe('deleteSave', () => {
    it('should delete game progress', () => {
      // 保存游戏
      storage.saveGame();
      expect(localStorage.getItem('magic-coding-adventure-save')).not.toBeNull();
      
      // 删除保存
      storage.deleteSave();
      expect(localStorage.getItem('magic-coding-adventure-save')).toBeNull();
    });
  });

  describe('hasSave', () => {
    it('should return true if save exists', () => {
      // 保存游戏
      storage.saveGame();
      expect(storage.hasSave()).toBe(true);
    });

    it('should return false if no save exists', () => {
      // 确保没有保存
      localStorage.clear();
      expect(storage.hasSave()).toBe(false);
    });
  });

  describe('getSaveInfo', () => {
    it('should return save info', () => {
      // 保存游戏
      storage.saveGame();
      
      const saveInfo = storage.getSaveInfo();
      expect(saveInfo).not.toBeNull();
      expect(saveInfo).toHaveProperty('player');
      expect(saveInfo).toHaveProperty('lastScene');
      expect(saveInfo).toHaveProperty('timestamp');
    });

    it('should return null if no save exists', () => {
      // 确保没有保存
      localStorage.clear();
      
      const saveInfo = storage.getSaveInfo();
      expect(saveInfo).toBeNull();
    });
  });
});