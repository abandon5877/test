import { state, engine, events } from './engine';
import { RUNES } from '../data';
import { LogEntry } from '../types';

// UI管理器
export const ui = {
  /**
   * 初始化UI
   */
  init: (): void => {
    ui.setupCampScene();
    ui.setupBattleScene();
    ui.setupEventListeners();
    ui.updateStatusBar();
  },

  /**
   * 设置营地场景
   */
  setupCampScene: (): void => {
    // 渲染符文库
    ui.renderRuneLibrary();
    // 渲染法术卡槽
    ui.renderSpellSlots();
    // 渲染法术预览
    ui.renderSpellPreview(0);
    // 设置开始战斗按钮
    const startBattleBtn = document.getElementById('start-battle-btn');
    if (startBattleBtn) {
      startBattleBtn.addEventListener('click', () => {
        engine.switchScene('battle');
      });
    }
  },

  /**
   * 设置战斗场景
   */
  setupBattleScene: (): void => {
    // 设置返回营地按钮
    const backToCampBtn = document.getElementById('back-to-camp-btn');
    if (backToCampBtn) {
      backToCampBtn.addEventListener('click', () => {
        engine.switchScene('camp');
      });
    }
  },

  /**
   * 设置事件监听器
   */
  setupEventListeners: (): void => {
    // 场景切换事件
    events.on('sceneChange', (data) => {
      ui.switchScene(data.scene);
    });

    // 战斗开始事件
    events.on('battleStart', (data) => {
      ui.updateEnemyInfo(data.enemy);
      ui.renderBattleLog();
    });

    // 战斗结束事件
    events.on('battleEnd', () => {
      ui.renderBattleLog();
    });

    // 玩家伤害事件
    events.on('playerDamage', () => {
      ui.updateStatusBar();
      ui.renderBattleLog();
    });

    // 敌人伤害事件
    events.on('enemyDamage', () => {
      ui.updateEnemyInfo(state.enemy);
      ui.renderBattleLog();
    });

    // 玩家治疗事件
    events.on('playerHeal', () => {
      ui.updateStatusBar();
      ui.renderBattleLog();
    });

    // 法术施法事件
    events.on('spellCast', () => {
      ui.updateStatusBar();
      ui.renderBattleLog();
    });

    // 法术打断事件
    events.on('spellInterrupt', () => {
      ui.renderBattleLog();
    });

    // 敌人攻击事件
    events.on('enemyAttack', () => {
      ui.updateStatusBar();
      ui.renderBattleLog();
    });
  },

  /**
   * 切换场景
   * @param {string} scene - 目标场景
   */
  switchScene: (scene: 'camp' | 'battle'): void => {
    // 隐藏所有场景
    document.querySelectorAll('.scene').forEach(sceneEl => {
      sceneEl.classList.remove('active');
    });

    // 显示目标场景
    const targetScene = document.getElementById(`${scene}-scene`);
    if (targetScene) {
      targetScene.classList.add('active');
    }

    // 更新返回按钮显示
    const backToCampBtn = document.getElementById('back-to-camp-btn');
    if (backToCampBtn) {
      backToCampBtn.style.display = scene === 'battle' ? 'inline-block' : 'none';
    }

    // 如果切换到战斗场景，渲染战斗UI
    if (scene === 'battle') {
      ui.renderPlayerSpells();
      ui.updateBattleStatus();
      ui.renderBattleLog();
    }
  },

  /**
   * 渲染符文库
   */
  renderRuneLibrary: (): void => {
    const runeGrid = document.getElementById('rune-library-grid');
    if (!runeGrid) return;

    runeGrid.innerHTML = '';

    Object.values(RUNES).forEach(rune => {
      const runeItem = document.createElement('div');
      runeItem.className = 'rune-item';
      runeItem.draggable = true;
      runeItem.dataset.runeId = rune.id;
      
      runeItem.innerHTML = `
        <div class="icon">${rune.icon}</div>
        <div class="name">${rune.name}</div>
        <div class="type">${rune.type}</div>
      `;

      // 添加点击事件
      runeItem.addEventListener('click', () => {
        ui.addRuneToSlot(rune.id);
      });

      // 添加拖拽事件
      runeItem.addEventListener('dragstart', (e) => {
        if (e.dataTransfer) {
          e.dataTransfer.setData('text/plain', rune.id);
        }
      });

      runeGrid.appendChild(runeItem);
    });
  },

  /**
   * 渲染法术卡槽
   */
  renderSpellSlots: (): void => {
    const slotGrid = document.getElementById('spell-slots-grid');
    if (!slotGrid) return;

    slotGrid.innerHTML = '';

    state.player.spells.forEach((_, index) => {
      const slot = document.createElement('div');
      slot.className = 'spell-slot';
      slot.dataset.slotIndex = index.toString();

      // 添加点击事件
      slot.addEventListener('click', () => {
        // 移除其他卡槽的激活状态
        document.querySelectorAll('.spell-slot').forEach(s => {
          s.classList.remove('active');
        });
        // 激活当前卡槽
        slot.classList.add('active');
        // 更新预览
        ui.renderSpellPreview(index);
      });

      // 添加拖放事件
      slot.addEventListener('dragover', (e) => {
        e.preventDefault();
      });

      slot.addEventListener('drop', (e) => {
        e.preventDefault();
        const runeId = e.dataTransfer?.getData('text/plain');
        if (runeId) {
          ui.addRuneToSlot(runeId, index);
        }
      });

      slot.innerHTML = `
        <div class="slot-number">${index + 1}</div>
        <div class="slot-content" id="slot-content-${index}"></div>
      `;

      slotGrid.appendChild(slot);

      // 渲染卡槽内容
      ui.renderSlotContent(index);
    });

    // 默认激活第一个卡槽
    const firstSlot = slotGrid.querySelector('.spell-slot');
    if (firstSlot) {
      firstSlot.classList.add('active');
    }
  },

  /**
   * 渲染卡槽内容
   * @param {number} slotIndex - 卡槽索引
   */
  renderSlotContent: (slotIndex: number): void => {
    const slotContent = document.getElementById(`slot-content-${slotIndex}`);
    if (!slotContent) return;

    slotContent.innerHTML = '';

    const runes = state.player.spells[slotIndex];
    runes.forEach((runeId, runeIndex) => {
      const rune = RUNES[runeId];
      if (rune) {
        const runeElement = document.createElement('div');
        runeElement.className = 'slot-rune';
        runeElement.innerHTML = `
          <span class="icon">${rune.icon}</span>
          <span class="name">${rune.name}</span>
          <button class="remove-rune" data-slot-index="${slotIndex}" data-rune-index="${runeIndex}">×</button>
        `;

        slotContent.appendChild(runeElement);
      }
    });

    // 添加移除符文按钮事件
    slotContent.querySelectorAll('.remove-rune').forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const slotIndex = parseInt(target.dataset.slotIndex || '0');
        const runeIndex = parseInt(target.dataset.runeIndex || '0');
        ui.removeRuneFromSlot(slotIndex, runeIndex);
      });
    });
  },

  /**
   * 渲染法术预览
   * @param {number} slotIndex - 卡槽索引
   */
  renderSpellPreview: (slotIndex: number): void => {
    const previewEl = document.getElementById('spell-preview');
    if (!previewEl) return;

    const spellChain = state.player.spells[slotIndex];
    const spell = engine.calculateSpell(spellChain);

    previewEl.innerHTML = `
      <div class="preview-item">
        <span class="preview-label">法术名称:</span>
        <span class="preview-value">${spell.name}</span>
      </div>
      <div class="preview-item">
        <span class="preview-label">耗蓝 (MP):</span>
        <span class="preview-value">${spell.cost}</span>
      </div>
      <div class="preview-item">
        <span class="preview-label">吟唱时间 (秒):</span>
        <span class="preview-value">${spell.time.toFixed(1)}</span>
      </div>
      <div class="preview-item">
        <span class="preview-label">伤害:</span>
        <span class="preview-value">${spell.dmg}</span>
      </div>
      <div class="preview-item">
        <span class="preview-label">治疗:</span>
        <span class="preview-value">${spell.heal}</span>
      </div>
    `;
  },

  /**
   * 渲染战斗日志
   */
  renderBattleLog: (): void => {
    const battleLogEl = document.getElementById('battle-log');
    if (!battleLogEl) return;

    const logs = engine.getBattleLog();

    battleLogEl.innerHTML = '';

    logs.forEach((log: LogEntry) => {
      const logEntry = document.createElement('div');
      logEntry.className = `log-entry ${log.type}`;
      logEntry.textContent = log.message;
      battleLogEl.appendChild(logEntry);
    });

    // 滚动到底部
    battleLogEl.scrollTop = battleLogEl.scrollHeight;
  },

  /**
   * 渲染玩家法术（战斗中）
   */
  renderPlayerSpells: (): void => {
    const spellsEl = document.getElementById('player-spells');
    if (!spellsEl) return;

    spellsEl.innerHTML = '';

    state.player.spells.forEach((spellChain, index) => {
      const spell = engine.calculateSpell(spellChain);
      const button = document.createElement('button');
      button.className = 'spell-button';
      button.textContent = `${spell.name} (MP: ${spell.cost})`;
      
      // 检查是否可以施法
      const canCast = state.player.mp >= spell.cost && 
                      state.battle.playerStatus === 'ready';
      button.disabled = !canCast;

      // 添加点击事件
      button.addEventListener('click', () => {
        if (canCast) {
          engine.startCast(index);
        }
      });

      spellsEl.appendChild(button);
    });
  },

  /**
   * 更新状态栏
   */
  updateStatusBar: (): void => {
    // 更新HP
    const hpGauge = document.querySelector('.gauge-fill.hp') as HTMLElement;
    const hpValue = document.querySelector('.stat:nth-child(1) .value') as HTMLElement;
    if (hpGauge && hpValue) {
      const hpPercent = (state.player.hp / state.player.maxHp) * 100;
      hpGauge.style.width = `${Math.max(0, hpPercent)}%`;
      hpValue.textContent = `${state.player.hp}/${state.player.maxHp}`;
    }

    // 更新MP
    const mpGauge = document.querySelector('.gauge-fill.mp') as HTMLElement;
    const mpValue = document.querySelector('.stat:nth-child(2) .value') as HTMLElement;
    if (mpGauge && mpValue) {
      const mpPercent = (state.player.mp / state.player.maxMp) * 100;
      mpGauge.style.width = `${Math.max(0, mpPercent)}%`;
      mpValue.textContent = `${state.player.mp}/${state.player.maxMp}`;
    }
  },

  /**
   * 更新敌人信息
   * @param {any} enemy - 敌人对象
   */
  updateEnemyInfo: (enemy: any): void => {
    const enemyInfoEl = document.getElementById('enemy-info');
    if (!enemyInfoEl || !enemy) return;

    const hpPercent = (enemy.hp / enemy.maxHp) * 100;

    enemyInfoEl.innerHTML = `
      <div class="name">${enemy.name}</div>
      <div class="icon">${enemy.icon}</div>
      <div class="hp">
        <div class="gauge">
          <div class="gauge-fill hp" style="width: ${Math.max(0, hpPercent)}%"></div>
        </div>
        <span>${enemy.hp}/${enemy.maxHp}</span>
      </div>
    `;
  },

  /**
   * 更新战斗状态
   */
  updateBattleStatus: (): void => {
    // 更新玩家ATB
    const playerAtb = document.getElementById('player-atb');
    if (playerAtb) {
      playerAtb.style.width = `${state.battle.playerAtb}%`;
    }

    // 更新敌人ATB
    const enemyAtb = document.getElementById('enemy-atb');
    if (enemyAtb) {
      enemyAtb.style.width = `${state.battle.enemyAtb}%`;
    }

    // 更新吟唱条
    const castBar = document.getElementById('cast-bar');
    const castProgress = document.getElementById('cast-progress');
    if (castBar && castProgress) {
      if (state.battle.playerStatus === 'casting') {
        castBar.classList.add('active');
        castProgress.style.width = `${state.battle.castProgress * 100}%`;
      } else {
        castBar.classList.remove('active');
        castProgress.style.width = '0%';
      }
    }

    // 更新法术按钮状态
    ui.renderPlayerSpells();
  },

  /**
   * 添加符文到卡槽
   * @param {string} runeId - 符文ID
   * @param {number} slotIndex - 卡槽索引（可选，默认为当前激活的卡槽）
   */
  addRuneToSlot: (runeId: string, slotIndex?: number): void => {
    if (slotIndex === undefined) {
      // 找到当前激活的卡槽
      const activeSlot = document.querySelector('.spell-slot.active') as HTMLElement;
      if (activeSlot) {
        slotIndex = parseInt(activeSlot.dataset.slotIndex || '0');
      } else {
        slotIndex = 0; // 默认第一个卡槽
      }
    }

    // 添加符文到卡槽
    state.player.spells[slotIndex].push(runeId);
    // 重新渲染卡槽内容
    ui.renderSlotContent(slotIndex);
    // 更新预览
    ui.renderSpellPreview(slotIndex);
  },

  /**
   * 从卡槽移除符文
   * @param {number} slotIndex - 卡槽索引
   * @param {number} runeIndex - 符文索引
   */
  removeRuneFromSlot: (slotIndex: number, runeIndex: number): void => {
    // 从卡槽移除符文
    state.player.spells[slotIndex].splice(runeIndex, 1);
    // 重新渲染卡槽内容
    ui.renderSlotContent(slotIndex);
    // 更新预览
    ui.renderSpellPreview(slotIndex);
  },

  /**
   * 更新战斗UI
   */
  updateBattleUI: (): void => {
    ui.updateBattleStatus();
    ui.updateStatusBar();
    ui.updateEnemyInfo(state.enemy);
  }
};