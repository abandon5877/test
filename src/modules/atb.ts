import { Player, Enemy } from '../types';

interface CastState {
  isCasting: boolean;
  spellIndex: number;
  startTime: number;
  duration: number;
  progress: number;
}

export class ATBSystem {
  private castState: CastState = {
    isCasting: false,
    spellIndex: -1,
    startTime: 0,
    duration: 0,
    progress: 0
  };

  /**
   * 更新玩家ATB
   * @param player 玩家数据
   * @param deltaTime 时间增量
   * @param currentAtb 当前ATB值
   * @returns 更新后的ATB值
   */
  updatePlayerATB(player: Player, deltaTime: number, currentAtb: number): number {
    // 基础ATB增长速率（增加到200，加快ATB增长）
    const baseRate = 200;
    // 基于速度的修正
    const speedFactor = player.speed / 10;
    // 计算ATB增长
    const atbGain = (baseRate * speedFactor * deltaTime * 10) / 60;
    
    return Math.min(currentAtb + atbGain, 100);
  }

  /**
   * 更新敌人ATB
   * @param enemy 敌人数据
   * @param deltaTime 时间增量
   * @param currentAtb 当前ATB值
   * @returns 更新后的ATB值
   */
  updateEnemyATB(enemy: Enemy, deltaTime: number, currentAtb: number): number {
    // 基础ATB增长速率（增加到200，加快ATB增长）
    const baseRate = 200;
    // 基于速度的修正
    const speedFactor = enemy.speed / 10;
    // 计算ATB增长
    const atbGain = (baseRate * speedFactor * deltaTime * 10) / 60;
    
    return Math.min(currentAtb + atbGain, 100);
  }

  /**
   * 检查ATB是否满
   * @param atb 当前ATB值
   * @returns 是否满
   */
  isReady(atb: number): boolean {
    return atb >= 100;
  }

  /**
   * 开始施法
   * @param spellIndex 法术索引
   * @param castTime 施法时间
   */
  startCast(spellIndex: number, castTime: number): void {
    this.castState = {
      isCasting: true,
      spellIndex,
      startTime: performance.now(),
      duration: castTime * 1000, // 转换为毫秒
      progress: 0
    };
  }

  /**
   * 更新施法进度
   */
  updateCast(): void {
    if (!this.castState.isCasting) return;

    const elapsed = performance.now() - this.castState.startTime;
    this.castState.progress = Math.min(elapsed / this.castState.duration, 1);
  }

  /**
   * 检查施法是否完成
   * @returns 是否完成
   */
  isComplete(): boolean {
    return this.castState.isCasting && this.castState.progress >= 1;
  }

  /**
   * 获取施法状态
   * @returns 施法状态
   */
  getState(): CastState {
    return this.castState;
  }

  /**
   * 重置施法状态
   */
  resetCast(): void {
    this.castState = {
      isCasting: false,
      spellIndex: -1,
      startTime: 0,
      duration: 0,
      progress: 0
    };
  }

  /**
   * 获取ATB进度百分比
   * @param progress 当前进度值
   * @returns 进度百分比
   */
  getProgressPercentage(progress: number): number {
    return Math.min((progress / 100) * 100, 100);
  }

  /**
   * 获取施法进度百分比
   * @returns 进度百分比
   */
  getCastProgressPercentage(): number {
    return this.castState.progress * 100;
  }

  /**
   * 预测ATB值
   * @param currentAtb 当前ATB值
   * @param speed 速度值
   * @param time 预测时间
   * @returns 预测的ATB值
   */
  predictATB(currentAtb: number, speed: number, time: number): number {
    const baseRate = 200;
    const speedFactor = speed / 10;
    const atbGain = (baseRate * speedFactor * time * 10) / 60;
    return Math.min(currentAtb + atbGain, 100);
  }
}

export const atbSystem = new ATBSystem();
export const castSystem = atbSystem;
