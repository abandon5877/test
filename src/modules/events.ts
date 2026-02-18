import { GameEvent, EventData } from '../types';

/**
 * 事件系统
 * 负责管理游戏中的所有事件分发和监听
 */
export class EventSystem {
  private events: Record<GameEvent, Array<(data: EventData) => void>> = {
    battleStart: [],
    battleEnd: [],
    sceneChange: [],
    phaseChange: [],
    actorChange: [],
    playerStatusChange: [],
    enemyStatusChange: [],
    playerDamage: [],
    enemyDamage: [],
    playerHeal: [],
    enemyAttack: [],
    enemyAttackStart: [],
    spellCast: [],
    spellComplete: [],
    spellInterrupt: [],
    resourceChange: [],
    levelUp: [],
    materialDrop: [],
    spellSlotUpdated: [],
    gameRestart: [],
    runeChoice: [],
    shopUpdate: []
  };

  /**
   * 注册事件监听器
   * @param event 事件类型
   * @param listener 事件监听器函数
   */
  on(event: GameEvent, listener: (data: EventData) => void): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  /**
   * 移除事件监听器
   * @param event 事件类型
   * @param listener 事件监听器函数
   */
  off(event: GameEvent, listener: (data: EventData) => void): void {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(l => l !== listener);
    }
  }

  /**
   * 触发事件
   * @param event 事件类型
   * @param data 事件数据
   */
  emit(event: GameEvent, data: EventData): void {
    if (this.events[event]) {
      this.events[event].forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * 清除指定事件的所有监听器
   * @param event 事件类型
   */
  clear(event: GameEvent): void {
    if (this.events[event]) {
      this.events[event] = [];
    }
  }

  /**
   * 清除所有事件监听器
   */
  clearAll(): void {
    Object.keys(this.events).forEach(event => {
      this.events[event as GameEvent] = [];
    });
  }

  /**
   * 获取指定事件的监听器数量
   * @param event 事件类型
   * @returns 监听器数量
   */
  getListenerCount(event: GameEvent): number {
    return this.events[event]?.length || 0;
  }
}

// 导出事件系统实例
export const events = new EventSystem();
