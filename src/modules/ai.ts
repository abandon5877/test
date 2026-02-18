import { EnemySkill } from '../types';
import { state } from './engine';

interface EnemyAIStrategy {
  type: 'conservative' | 'aggressive' | 'balanced';
  skillWeights: Record<string, number>;
}

interface EnemyAIState {
  skillCooldowns: Record<string, number>;
  lastUsedSkill: string | null;
  strategy: EnemyAIStrategy;
}

export class AISystem {
  private aiStates: Record<string, EnemyAIState> = {};

  /**
   * 初始化敌人AI状态
   * @param enemyId 敌人ID
   * @param strategy 敌人AI策略
   */
  initializeAI(enemyId: string, strategy: EnemyAIStrategy): void {
    this.aiStates[enemyId] = {
      skillCooldowns: {},
      lastUsedSkill: null,
      strategy
    };
  }

  /**
   * 选择敌人技能
   * @param enemy 敌人数据
   * @returns 选择的技能
   */
  selectSkill(enemy: any): EnemySkill {
    if (!enemy || !enemy.skills || enemy.skills.length === 0) {
      // 返回默认攻击技能
      return {
        id: 'basic_attack',
        name: '普通攻击',
        damage: enemy.dmg || 10,
        cost: 0,
        channelTime: 0,
        probability: 1,
        conditions: {}
      };
    }

    const enemyId = enemy.id || 'unknown';
    if (!this.aiStates[enemyId]) {
      this.initializeAI(enemyId, enemy.aiStrategy || this.getDefaultStrategy());
    }

    const aiState = this.aiStates[enemyId];
    const availableSkills = this.getAvailableSkills(enemy, aiState);

    if (availableSkills.length === 0) {
      // 返回默认攻击技能
      return {
        id: 'basic_attack',
        name: '普通攻击',
        damage: enemy.dmg || 10,
        cost: 0,
        channelTime: 0,
        probability: 1,
        conditions: {}
      };
    }

    // 根据概率和权重选择技能
    const selectedSkill = this.weightedRandomSelection(availableSkills, aiState.strategy.skillWeights);
    
    // 更新冷却时间
    if (selectedSkill.conditions?.cooldown) {
      aiState.skillCooldowns[selectedSkill.id] = selectedSkill.conditions.cooldown;
    }
    
    aiState.lastUsedSkill = selectedSkill.id;
    return selectedSkill;
  }

  /**
   * 获取可用技能列表
   * @param enemy 敌人数据
   * @param aiState AI状态
   * @returns 可用技能列表
   */
  private getAvailableSkills(enemy: any, aiState: EnemyAIState): EnemySkill[] {
    return enemy.skills.filter((skill: EnemySkill) => {
      // 检查MP是否足够
      if (skill.cost && (enemy.mp || 0) < skill.cost) {
        return false;
      }

      // 检查冷却时间
      if (aiState.skillCooldowns[skill.id] > 0) {
        return false;
      }

      // 检查HP条件
      const hpPercent = enemy.hp / enemy.maxHp;
      if (skill.conditions?.minHpPercent && hpPercent < skill.conditions.minHpPercent) {
        return false;
      }
      if (skill.conditions?.maxHpPercent && hpPercent > skill.conditions.maxHpPercent) {
        return false;
      }

      return true;
    });
  }

  /**
   * 基于权重的随机选择
   * @param skills 技能列表
   * @param weights 技能权重
   * @returns 选择的技能
   */
  private weightedRandomSelection(skills: EnemySkill[], weights: Record<string, number>): EnemySkill {
    const totalWeight = skills.reduce((sum, skill) => {
      return sum + (weights[skill.id] || skill.probability || 0.5);
    }, 0);

    let random = Math.random() * totalWeight;
    
    for (const skill of skills) {
      const weight = weights[skill.id] || skill.probability || 0.5;
      random -= weight;
      if (random <= 0) {
        return skill;
      }
    }

    return skills[0];
  }

  /**
   * 更新AI状态
   * @param deltaTime 时间增量
   */
  updateAI(deltaTime: number): void {
    if (!state.enemy) return;

    const enemyId = state.enemy.id || 'unknown';
    if (!this.aiStates[enemyId]) return;

    // 更新冷却时间
    const aiState = this.aiStates[enemyId];
    Object.keys(aiState.skillCooldowns).forEach(skillId => {
      aiState.skillCooldowns[skillId] = Math.max(0, aiState.skillCooldowns[skillId] - deltaTime);
    });
  }

  /**
   * 获取默认AI策略
   * @returns 默认策略
   */
  private getDefaultStrategy(): EnemyAIStrategy {
    return {
      type: 'balanced',
      skillWeights: {}
    };
  }

  /**
   * 重置AI状态
   * @param enemyId 敌人ID
   */
  resetAI(enemyId: string): void {
    delete this.aiStates[enemyId];
  }

  /**
   * 预测敌人行动
   * @param enemy 敌人数据
   * @returns 预测的技能
   */
  predictEnemyAction(enemy: any): EnemySkill {
    return this.selectSkill(enemy);
  }
}

export const aiSystem = new AISystem();
