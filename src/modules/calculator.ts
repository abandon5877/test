import { Spell } from '../types';
import { RUNES } from '../data';

// 计算模块 - 处理所有与游戏计算相关的逻辑
export const calculator = {
  /**
   * 计算一个法术链的属性
   * @param {Array<string>} chain - 符文ID数组
   * @returns {Spell} 法术属性对象
   */
  calculateSpell: (chain: string[]): Spell => {
    if (!chain || chain.length === 0) {
      return {
        name: '无效法术',
        cost: 0,
        time: 0,
        dmg: 0,
        heal: 0,
        description: '无效法术'
      };
    }

    let totalCost = 0;
    let totalTime = 0;
    let totalDmg = 0;
    let totalHeal = 0;

    let pendingMods: any[] = [];

    for (let runeId of chain) {
      const rune = RUNES[runeId];
      if (!rune) continue;

      if (rune.type === 'MOD') {
        pendingMods.push(rune);
      } else if (rune.type === 'CORE') {
        // 应用所有暂存的修饰符到这个核心符
        let cDmg = rune.baseDmg || 0;
        let cHeal = rune.baseHeal || 0;
        let cCost = rune.cost;
        let cTime = rune.time;
        let count = 1;

        // 应用修饰符
        for (let mod of pendingMods) {
          if (mod.dmgMult) cDmg *= mod.dmgMult;
          if (mod.costMult) cCost *= mod.costMult;
          if (mod.timeMult) cTime *= mod.timeMult;
          if (mod.timeAdd) cTime += mod.timeAdd;
          if (mod.count) count = mod.count; // 简单起见，最后一个多重符生效
        }

        // 累加
        totalCost += cCost * count;
        totalTime += cTime * count;
        if (cDmg > 0) {
          totalDmg += cDmg * count;
        }
        if (cHeal > 0) {
          totalHeal += cHeal * count;
        }

        pendingMods = []; // 重置
      }
    }

    // 构建名称
    let fullName = chain.map(id => {
      const runeName = RUNES[id]?.name || id;
      // 去掉符文名称中的"术"字
      return runeName.replace('术', '');
    }).join(''); // 直接连接，不使用"+"符号
    if (fullName === '') fullName = '无效法术';

    return {
      name: fullName,
      cost: Math.round(totalCost),
      time: totalTime,
      dmg: Math.round(totalDmg),
      heal: Math.round(totalHeal),
      description: fullName
    };
  }
};
