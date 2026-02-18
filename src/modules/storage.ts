import { StorageData } from '../types';
import { state } from './engine';

// 存储键名
const STORAGE_KEY = 'magic-coding-adventure-save';

// 存储管理器
export const storage = {
  /**
   * 保存游戏进度
   */
  saveGame: (): void => {
    const saveData: StorageData = {
      player: { ...state.player },
      lastScene: state.scene,
      timestamp: Date.now()
    };

    // 如果在战斗中，保存战斗状态和敌人信息
    if (state.scene === 'battle' && state.enemy) {
      saveData.enemy = { ...state.enemy };
      saveData.battle = { ...state.battle };
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
      console.log('游戏进度已保存');
    } catch (error) {
      console.error('保存游戏进度失败:', error);
    }
  },

  /**
   * 加载游戏进度
   * @returns {boolean} 是否加载成功
   */
  loadGame: (): boolean => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (!savedData) return false;

      const parsedData: StorageData = JSON.parse(savedData);
      
      // 恢复玩家状态
      if (parsedData.player) {
        state.player = { ...parsedData.player };
      }

      // 恢复场景
      if (parsedData.lastScene) {
        state.scene = parsedData.lastScene;
      }

      // 恢复战斗状态（如果在战斗中）
      if (parsedData.lastScene === 'battle') {
        if (parsedData.enemy) {
          state.enemy = { ...parsedData.enemy };
        }
        if (parsedData.battle) {
          state.battle = { ...parsedData.battle };
        }
      }

      console.log('游戏进度已加载');
      return true;
    } catch (error) {
      console.error('加载游戏进度失败:', error);
      return false;
    }
  },

  /**
   * 删除游戏进度
   */
  deleteSave: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('游戏进度已删除');
    } catch (error) {
      console.error('删除游戏进度失败:', error);
    }
  },

  /**
   * 检查是否有保存的游戏进度
   * @returns {boolean} 是否有保存的进度
   */
  hasSave: (): boolean => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== null;
    } catch (error) {
      console.error('检查游戏进度失败:', error);
      return false;
    }
  },

  /**
   * 获取保存的游戏信息
   * @returns {StorageData | null} 保存的游戏数据
   */
  getSaveInfo: (): StorageData | null => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (!savedData) return null;
      return JSON.parse(savedData);
    } catch (error) {
      console.error('获取游戏进度信息失败:', error);
      return null;
    }
  }
};