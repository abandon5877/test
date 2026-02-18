import { state, engine } from './engine';
import { events } from './events';
import { RUNES, MATERIALS } from '../data';
import { LogEntry } from '../types';
import { calculator } from './calculator';

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
    ui.setupTabNavigation();
    ui.setupRuneTabs();
    ui.setupBackButton();
  },

  /**
   * 设置标签页导航
   */
  setupTabNavigation: (): void => {
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabButton = button as HTMLElement;
        const tabId = tabButton.dataset.tab;
        if (tabId) {
          // 移除所有标签按钮的激活状态
          tabButtons.forEach(btn => btn.classList.remove('active'));
          // 添加当前按钮的激活状态
          button.classList.add('active');
          // 隐藏所有标签内容
          const tabContents = document.querySelectorAll('.tab-content');
          tabContents.forEach(content => content.classList.remove('active'));
          // 显示当前标签内容
          const targetContent = document.querySelector(`.tab-content[data-tab="${tabId}"]`);
          if (targetContent) {
            targetContent.classList.add('active');
          }
        }
      });
    });
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
    // 渲染资源信息
    ui.renderResourceInfo();
    // 渲染商店
    ui.renderShop();
    // 设置开始战斗按钮
    const startBattleBtn = document.getElementById('start-battle-btn');
    if (startBattleBtn) {
      startBattleBtn.addEventListener('click', () => {
        // 检查是否有dev模式敌人选择
        const devEnemySelect = document.getElementById('dev-enemy-select') as HTMLSelectElement;
        if (devEnemySelect) {
          const selectedEnemyId = devEnemySelect.value;
          if (selectedEnemyId && selectedEnemyId !== 'random') {
            // 使用指定敌人开始战斗
            state.scene = 'battle';
            state.enemy = null;
            state.battle.active = false;
            engine.startBattle(selectedEnemyId);
            return;
          }
        }
        // 默认随机敌人
        engine.switchScene('battle');
      });
    }
    
    // 添加Dev模式敌人选择界面
    ui.setupDevMode();
    // 设置营地重开按钮
    const campRestartBtn = document.getElementById('camp-restart-btn');
    if (campRestartBtn) {
      campRestartBtn.addEventListener('click', () => {
        engine.restartGame();
      });
    }
    // 设置休息按钮
    const restBtn = document.getElementById('rest-btn');
    if (restBtn) {
      restBtn.addEventListener('click', () => {
        engine.rest();
        ui.updateStatusBar();
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

    // 设置重开按钮
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        engine.restartGame();
      });
    }

    // 设置撤退按钮
    const retreatBtn = document.getElementById('retreat-button');
    if (retreatBtn) {
      retreatBtn.addEventListener('click', () => {
        engine.retreat();
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
      ui.renderPlayerSpells(); // 渲染法术按钮
    });

    // 玩家状态变化事件
    events.on('playerStatusChange', () => {
      ui.renderPlayerSpells(); // 渲染法术按钮
    });

    // 敌人状态变化事件
    events.on('enemyStatusChange', () => {
      ui.renderPlayerSpells(); // 渲染法术按钮
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

    // 敌人攻击开始事件
    events.on('enemyAttackStart', () => {
      const enemyInfo = document.getElementById('enemy-info');
      if (enemyInfo) {
        // 添加攻击动画
        enemyInfo.style.animation = 'enemy-attack 0.5s ease-in-out';
        // 动画结束后移除
        setTimeout(() => {
          enemyInfo.style.animation = '';
        }, 500);
      }
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

    // 符文槽更新事件
    events.on('spellSlotUpdated', (data) => {
      ui.renderSlotContent(data.slotIndex);
      ui.renderSpellPreview(data.slotIndex);
    });

    // 游戏重开事件
    events.on('gameRestart', () => {
      ui.switchScene('camp');
      ui.renderRuneLibrary();
      ui.renderSpellSlots();
      ui.renderSpellPreview(0);
      ui.updateStatusBar();
      ui.renderResourceInfo();
      ui.renderShop();
    });

    // 资源变化事件
    events.on('resourceChange', () => {
      ui.renderResourceInfo();
      ui.renderShop();
    });

    // 等级提升事件
    events.on('levelUp', () => {
      ui.renderResourceInfo();
      ui.updateStatusBar();
    });

    // 素材掉落事件
    events.on('materialDrop', () => {
      ui.renderResourceInfo();
      ui.renderShop();
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

    // 隐藏重开按钮
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
      restartBtn.style.display = 'none';
    }

    // 如果切换到战斗场景，渲染战斗UI
    if (scene === 'battle') {
      ui.updateEnemyInfo(state.enemy);
      ui.renderPlayerSpells();
      ui.updateBattleStatus();
      ui.renderBattleLog();
    }
  },

  /**
   * 渲染符文库
   */
  renderRuneLibrary: (runeType: string = 'all'): void => {
    const runeGrid = document.getElementById('rune-library-grid');
    if (!runeGrid) return;

    runeGrid.innerHTML = '';

    Object.values(RUNES).forEach(rune => {
      // 根据分类过滤符文
      if (runeType !== 'all' && rune.type !== runeType) {
        return;
      }

      const runeItem = document.createElement('div');
      runeItem.className = 'rune-item';
      runeItem.draggable = true;
      runeItem.dataset.runeId = rune.id;
      runeItem.dataset.runeType = rune.type;
      
      runeItem.innerHTML = `
        <div class="icon">${rune.icon}</div>
        <div class="name">${rune.name}</div>
        <div class="type">${rune.type}</div>
      `;

      // 添加点击事件
      runeItem.addEventListener('click', () => {
        if (state.currentEditingSlot !== null) {
          ui.addRuneToSlot(rune.id, state.currentEditingSlot);
          // 更新当前槽位预览
          ui.updateCurrentSlotPreview(state.currentEditingSlot);
          // 更新法术预览
          ui.renderSpellPreview(state.currentEditingSlot);
        } else {
          ui.addRuneToSlot(rune.id);
        }
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
   * 设置符文标签页事件
   */
  setupRuneTabs: (): void => {
    const runeTabs = document.querySelectorAll('.rune-tab');
    runeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // 移除所有标签页的激活状态
        runeTabs.forEach(t => t.classList.remove('active'));
        // 添加当前标签页的激活状态
        tab.classList.add('active');
        // 获取符文类型
        const runeType = (tab as HTMLElement).dataset.runeType || 'all';
        // 渲染符文库
        ui.renderRuneLibrary(runeType);
      });
    });
  },

  /**
   * 设置返回按钮事件
   */
  setupBackButton: (): void => {
    const backButton = document.querySelector('.back-to-level-1');
    if (backButton) {
      backButton.addEventListener('click', () => {
        ui.backToLevel1();
      });
    }
  },

  /**
   * 渲染法术卡槽
   */
  renderSpellSlots: (): void => {
    const slotGrid = document.getElementById('spell-slots-grid');
    if (!slotGrid) return;

    slotGrid.innerHTML = '';

    state.player.spells.forEach((runes, index) => {
      const slot = document.createElement('div');
      slot.className = 'spell-slot';
      slot.dataset.slotIndex = index.toString();

      // 计算法术信息
      const spell = calculator.calculateSpell(runes);

      // 添加点击事件 - 进入编辑模式
      slot.addEventListener('click', () => {
        // 进入第二级编辑模式
        ui.enterSpellEditMode(index);
      });

      slot.innerHTML = `
        <div class="slot-content" id="slot-content-${index}"></div>
        <div class="divider"></div>
        <div class="spell-effect">
          <div>伤害: <span class="effect-value">${spell.dmg}</span></div>
          <div>治疗: <span class="effect-value">${spell.heal}</span></div>
          <div>耗蓝: <span class="effect-value">${spell.cost}</span></div>
          <div>吟唱: <span class="effect-value">${spell.time.toFixed(1)}秒</span></div>
        </div>
      `;

      slotGrid.appendChild(slot);

      // 渲染卡槽内容
      ui.renderSlotContent(index);
    });
  },

  /**
   * 进入法术编辑模式
   */
  enterSpellEditMode: (slotIndex: number): void => {
    // 隐藏第一级，显示第二级
    document.querySelector('.magic-level-1')?.classList.remove('active');
    document.querySelector('.magic-level-2')?.classList.add('active');

    // 更新当前编辑槽位预览
    ui.updateCurrentSlotPreview(slotIndex);

    // 保存当前编辑的槽位索引
    state.currentEditingSlot = slotIndex;

    // 渲染符文库
    ui.renderRuneLibrary();

    // 渲染法术预览
    ui.renderSpellPreview(slotIndex);
  },

  /**
   * 返回第一级
   */
  backToLevel1: (): void => {
    // 隐藏第二级，显示第一级
    document.querySelector('.magic-level-2')?.classList.remove('active');
    document.querySelector('.magic-level-1')?.classList.add('active');

    // 清除当前编辑槽位
    state.currentEditingSlot = null;
  },

  /**
   * 更新当前编辑槽位预览
   */
  updateCurrentSlotPreview: (slotIndex: number): void => {
    const slotPreview = document.getElementById('current-slot-preview');
    if (!slotPreview) return;

    const slot = document.createElement('div');
    slot.className = 'spell-slot active';
    slot.dataset.slotIndex = slotIndex.toString();

    slot.innerHTML = `
      <div class="slot-number">${slotIndex + 1}</div>
      <div class="slot-content" id="edit-slot-content-${slotIndex}"></div>
    `;

    slotPreview.innerHTML = '';
    slotPreview.appendChild(slot);

    // 渲染槽位内容
    const slotContent = document.getElementById(`edit-slot-content-${slotIndex}`);
    if (slotContent) {
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
          // 更新预览
          ui.updateCurrentSlotPreview(slotIndex);
          ui.renderSpellPreview(slotIndex);
        });
      });
    }
  },

  /**
   * 渲染卡槽内容
   * @param {number} slotIndex - 卡槽索引
   */
  renderSlotContent: (slotIndex: number): void => {
    const slotContent = document.getElementById(`slot-content-${slotIndex}`);
    if (!slotContent) return;

    const runes = state.player.spells[slotIndex];
    
    if (runes.length > 0) {
      // 计算法术信息
      const spell = calculator.calculateSpell(runes);
      slotContent.innerHTML = `<div class="spell-name">${spell.name}</div>`;
    } else {
      slotContent.innerHTML = '<div class="empty-slot">空槽位</div>';
    }
  },

  /**
   * 渲染法术预览
   * @param {number} slotIndex - 卡槽索引
   */
  renderSpellPreview: (slotIndex: number): void => {
    const previewEl = document.getElementById('spell-preview');
    if (!previewEl) return;

    const spellChain = state.player.spells[slotIndex];
    const spell = calculator.calculateSpell(spellChain);

    // 检查是否会被打断
    let interruptWarning = '';
    if (state.scene === 'battle' && state.battle.active) {
      const willBeInterrupted = engine.willCastBeInterrupted(slotIndex);
      if (willBeInterrupted) {
        interruptWarning = '<div class="preview-item warning"><span class="preview-label">⚠️ 警告:</span><span class="preview-value">施法可能被打断！</span></div>';
      }
    }

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
      ${interruptWarning}
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

    // 清空容器，重新创建所有按钮，确保状态正确
    spellsEl.innerHTML = '';

    // 为每个法术创建按钮
    state.player.spells.forEach((spellChain, index) => {
      const spell = calculator.calculateSpell(spellChain);
      
      // 创建新按钮
      const button = document.createElement('button');
      button.className = 'spell-button';
      button.dataset.spellIndex = index.toString();
      button.style.zIndex = '100';
      
      // 添加点击事件，直接施法
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // 实时检查施法条件
        const currentMp = state.player.mp;
        const currentStatus = state.battle.playerStatus;
        const spellCost = spell.cost;
        
        console.log(`Attempting to cast spell ${index}: MP=${currentMp}, Required=${spellCost}, Status=${currentStatus}`);
        
        if (currentMp >= spellCost && currentStatus === 'preparing') {
          console.log(`Casting spell ${index}: ${spell.name}`);
          const result = engine.startCast(index);
          console.log(`Start cast result: ${result}`);
          // 施法后重新渲染按钮，更新状态
          setTimeout(() => {
            ui.renderPlayerSpells();
          }, 100);
        } else {
          console.log(`Cannot cast spell ${index}: MP=${currentMp}, Status=${currentStatus}`);
        }
      });
      
      // 检查是否会被打断
      const willBeInterrupted = engine.willCastBeInterrupted(index);
      const buttonText = willBeInterrupted 
        ? `⚠️ ${spell.name} (MP: ${spell.cost})` 
        : `${spell.name} (MP: ${spell.cost})`;
      button.textContent = buttonText;
      
      // 检查是否可以施法
      const canCast = state.battle.active && state.player.mp >= spell.cost && 
                      state.battle.playerStatus === 'preparing';
      button.disabled = !canCast;

      // 添加悬停效果，显示法术详情
      button.title = `
        法术名称: ${spell.name}
        耗蓝: ${spell.cost} MP
        吟唱时间: ${spell.time.toFixed(1)} 秒
        伤害: ${spell.dmg}
        治疗: ${spell.heal}
        ${willBeInterrupted ? '⚠️ 施法可能被打断！' : ''}
      `;
      
      // 添加悬停事件，显示ATB预测
      button.addEventListener('mouseenter', () => {
        console.log(`[DEBUG] Hovering over spell button ${index}`);
        if (state.scene === 'battle' && state.battle.active) {
          console.log(`[DEBUG] Updating ATB preview for spell ${index}`);
          ui.updateATBPreview(index);
        }
      });
      
      // 添加鼠标离开事件，隐藏ATB预测
      button.addEventListener('mouseleave', () => {
        console.log(`[DEBUG] Mouse leaving spell button ${index}`);
        // 重置预览
        const enemyAtbPreview = document.getElementById('enemy-atb-preview');
        if (enemyAtbPreview) {
          enemyAtbPreview.style.setProperty('--progress', '0%');
          console.log(`[DEBUG] Reset enemy ATB preview`);
        }
        
        const playerAtbPreview = document.getElementById('player-atb-preview');
        if (playerAtbPreview) {
          playerAtbPreview.style.setProperty('--progress', '0%');
          console.log(`[DEBUG] Reset player ATB preview`);
        }
      });
      
      // 添加按钮到容器
      spellsEl.appendChild(button);
    });
  },

  /**
   * 更新状态栏
   */
  updateStatusBar: (): void => {
    // 更新战斗场景中角色面板的HP和MP
    const battleHpGauge = document.querySelector('.character-panel .combat-stats .gauge-fill.hp') as HTMLElement;
    const battleHpValue = document.querySelector('.character-panel .combat-stats .stat:nth-child(1) .value') as HTMLElement;
    if (battleHpGauge && battleHpValue) {
      const hpPercent = (state.player.hp / state.player.maxHp) * 100;
      battleHpGauge.style.width = `${Math.max(0, hpPercent)}%`;
      battleHpValue.textContent = `${state.player.hp}/${state.player.maxHp}`;
    }

    const battleMpGauge = document.querySelector('.character-panel .combat-stats .gauge-fill.mp') as HTMLElement;
    const battleMpValue = document.querySelector('.character-panel .combat-stats .stat:nth-child(2) .value') as HTMLElement;
    if (battleMpGauge && battleMpValue) {
      const mpPercent = (state.player.mp / state.player.maxMp) * 100;
      battleMpGauge.style.width = `${Math.max(0, mpPercent)}%`;
      battleMpValue.textContent = `${state.player.mp}/${state.player.maxMp}`;
    }

    // 更新专注值
    const focusGauge = document.querySelector('.character-panel .combat-stats .gauge-fill.focus') as HTMLElement;
    if (focusGauge) {
      // 专注值显示为HP条的一部分，高度固定为30%
      focusGauge.style.height = '30%';
      focusGauge.style.width = '100%';
    }

    // 更新速度、施法速度、专注值显示
    const speedValue = document.querySelector('.character-panel .combat-stats .stat.secondary:nth-child(3) .value') as HTMLElement;
    const castSpeedValue = document.querySelector('.character-panel .combat-stats .stat.secondary:nth-child(4) .value') as HTMLElement;
    const focusValue = document.querySelector('.character-panel .combat-stats .stat.secondary:nth-child(5) .value') as HTMLElement;

    if (speedValue) {
      speedValue.textContent = state.player.speed.toString();
    }

    if (castSpeedValue) {
      // 施法速度暂时使用玩家速度的80%
      const castSpeed = Math.round(state.player.speed * 0.8);
      castSpeedValue.textContent = castSpeed.toString();
    }

    if (focusValue) {
      focusValue.textContent = state.battle.focusValue.toString();
    }

    // 更新属性标签页中的属性值
    ui.updateStatsTab();
  },

  /**
   * 更新属性标签页
   */
  updateStatsTab: (): void => {
    // 更新生命值
    const hpValue = document.querySelector('[data-tab="stats"] .stat-item:nth-child(1) .stat-value') as HTMLElement;
    if (hpValue) {
      hpValue.textContent = `${state.player.hp}/${state.player.maxHp}`;
    }

    // 更新魔法值
    const mpValue = document.querySelector('[data-tab="stats"] .stat-item:nth-child(2) .stat-value') as HTMLElement;
    if (mpValue) {
      mpValue.textContent = `${state.player.mp}/${state.player.maxMp}`;
    }

    // 更新攻击力
    const attackValue = document.querySelector('[data-tab="stats"] .stat-item:nth-child(3) .stat-value') as HTMLElement;
    if (attackValue) {
      // 暂时使用默认值10，因为状态对象中没有attack属性
      attackValue.textContent = '10';
    }

    // 更新速度
    const speedValue = document.querySelector('[data-tab="stats"] .stat-item:nth-child(4) .stat-value') as HTMLElement;
    if (speedValue) {
      speedValue.textContent = state.player.speed.toString();
    }

    // 更新施法速度
    const castSpeedValue = document.querySelector('[data-tab="stats"] .stat-item:nth-child(5) .stat-value') as HTMLElement;
    if (castSpeedValue) {
      const castSpeed = Math.round(state.player.speed * 0.8);
      castSpeedValue.textContent = castSpeed.toString();
    }

    // 更新专注值
    const focusValue = document.querySelector('[data-tab="stats"] .stat-item:nth-child(6) .stat-value') as HTMLElement;
    if (focusValue) {
      focusValue.textContent = state.battle.focusValue.toString();
    }

    // 经验值和等级已经在renderResourceInfo中更新
  },

  /**
   * 更新敌人信息
   * @param {any} enemy - 敌人对象
   */
  updateEnemyInfo: (enemy: any): void => {
    const enemyInfoEl = document.getElementById('enemy-info');
    if (!enemyInfoEl || !enemy) return;

    // 添加调试信息
    console.log(`[DEBUG] Enemy HP: ${enemy.hp}, MaxHP: ${enemy.maxHp}`);
    
    const hpPercent = (enemy.hp / enemy.maxHp) * 100;
    console.log(`[DEBUG] HP Percent: ${hpPercent}`);

    enemyInfoEl.innerHTML = `
      <div class="name">${enemy.name}</div>
      <div class="icon">${enemy.icon}</div>
      <div class="hp">
        <div class="gauge">
          <div class="gauge-fill hp" style="width: ${Math.max(0, hpPercent)}%; position: relative; z-index: 2;"></div>
        </div>
        <span>${enemy.hp}/${enemy.maxHp}</span>
      </div>
    `;
  },

  /**
   * 更新战斗状态
   */
  updateBattleStatus: (): void => {
    // 更新垂直ATB条
    const playerAtb = document.getElementById('player-atb');
    if (playerAtb) {
      const playerProgress = engine.getATBProgressPercentage(state.battle.playerAtb);
      playerAtb.style.setProperty('--progress', `${playerProgress}%`);
    }

    const enemyAtb = document.getElementById('enemy-atb');
    if (enemyAtb) {
      const enemyProgress = engine.getATBProgressPercentage(state.battle.enemyAtb);
      enemyAtb.style.setProperty('--progress', `${enemyProgress}%`);
    }

    // 更新技能栏状态：只有在行动阶段且是玩家行动时才可用
    ui.updateSpellButtonsState();

    // 更新预览（显示打断警告和ATB增长预览）
    const activeSlot = document.querySelector('.spell-slot.active') as HTMLElement;
    if (activeSlot && state.scene === 'battle' && state.battle.active) {
      const slotIndex = parseInt(activeSlot.dataset.slotIndex || '0');
      ui.renderSpellPreview(slotIndex);
      ui.updateATBPreview(slotIndex);
    }
  },

  /**
   * 更新ATB预览（施法前敌方ATB增长）
   */
  updateATBPreview: (spellIndex: number): void => {
    const spellChain = state.player.spells[spellIndex];
    const spell = calculator.calculateSpell(spellChain);
    const castTime = spell.time;

    // 预测敌方ATB增长
    const predictedEnemyAtb = engine.predictEnemyATB(castTime);
    const predictedEnemyProgress = engine.getATBProgressPercentage(predictedEnemyAtb);

    // 更新敌方ATB预览
    const enemyAtbPreview = document.getElementById('enemy-atb-preview');
    if (enemyAtbPreview) {
      enemyAtbPreview.style.setProperty('--progress', `${predictedEnemyProgress}%`);
    }

    // 预测玩家ATB增长（如果在准备状态）
    if (state.battle.playerStatus === 'preparing') {
      const predictedPlayerAtb = engine.predictPlayerATB(castTime);
      const predictedPlayerProgress = engine.getATBProgressPercentage(predictedPlayerAtb);

      const playerAtbPreview = document.getElementById('player-atb-preview');
      if (playerAtbPreview) {
        playerAtbPreview.style.setProperty('--progress', `${predictedPlayerProgress}%`);
      }
    }
  },

  /**
   * 更新技能按钮状态
   */
  updateSpellButtonsState: (): void => {
    const spellButtons = document.querySelectorAll('.spell-button');
    const canCast = state.battle.active && 
                    state.battle.phase === 'action' && 
                    state.battle.currentActor === 'player' && 
                    state.battle.playerStatus === 'preparing';

    spellButtons.forEach(button => {
      const spellIndex = parseInt((button as HTMLElement).dataset.spellIndex || '0');
      const spellChain = state.player.spells[spellIndex];
      const spell = calculator.calculateSpell(spellChain);
      const hasEnoughMp = state.player.mp >= spell.cost;

      if (canCast && hasEnoughMp) {
        (button as HTMLButtonElement).disabled = false;
        button.classList.remove('disabled');
      } else {
        (button as HTMLButtonElement).disabled = true;
        button.classList.add('disabled');
      }
    });
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

    // 调用engine添加符文
    engine.addRuneToSlot(slotIndex, runeId);
  },

  /**
   * 从卡槽移除符文
   * @param {number} slotIndex - 卡槽索引
   * @param {number} runeIndex - 符文索引
   */
  removeRuneFromSlot: (slotIndex: number, runeIndex: number): void => {
    // 调用engine移除符文
    engine.removeRuneFromSlot(slotIndex, runeIndex);
  },

  /**
   * 更新战斗UI
   */
  updateBattleUI: (): void => {
    // 只更新速攻条和施法条，这些需要实时显示
    ui.updateBattleStatus();
    
    // 其他UI元素通过事件触发更新，不需要实时刷新
    // ui.updateStatusBar(); // 通过playerDamage和playerHeal事件触发
    // ui.updateEnemyInfo(state.enemy); // 通过enemyDamage事件触发
    // ui.renderPlayerSpells(); // 通过spellCast和其他状态变化事件触发
  },

  /**
   * 渲染资源信息
   */
  renderResourceInfo: (): void => {
    // 更新属性标签页中的经验和等级
    const playerExperienceEl = document.getElementById('player-experience');
    if (playerExperienceEl) {
      playerExperienceEl.textContent = state.player.experience.toString();
    }

    const playerLevelDisplayEl = document.getElementById('player-level-display');
    if (playerLevelDisplayEl) {
      playerLevelDisplayEl.textContent = state.player.level.toString();
    }

    // 更新背包标签页中的资源信息
    const playerGoldEl = document.getElementById('player-gold');
    if (playerGoldEl) {
      playerGoldEl.textContent = state.player.gold.toString();
    }

    const playerMaterialsEl = document.getElementById('player-materials');
    if (playerMaterialsEl) {
      playerMaterialsEl.textContent = Object.keys(state.player.materials).length.toString();
    }

    // 更新背包标签页中的素材库存
    const backpackMaterialInventoryEl = document.getElementById('backpack-material-inventory');
    if (backpackMaterialInventoryEl) {
      backpackMaterialInventoryEl.innerHTML = '';

      Object.entries(state.player.materials).forEach(([materialId, quantity]) => {
        const material = MATERIALS[materialId];
        if (material) {
          const itemEl = document.createElement('div');
          itemEl.className = 'material-item';
          itemEl.innerHTML = `
            <div class="icon">${material.icon}</div>
            <div class="info">
              <div class="name">${material.name}</div>
              <div class="quantity">数量: ${quantity}</div>
              <div class="value">价值: ${material.value} 金币</div>
            </div>
            <button class="sell-btn" data-material-id="${materialId}">出售</button>
          `;

          // 添加出售按钮事件
          const sellBtn = itemEl.querySelector('.sell-btn') as HTMLElement;
          if (sellBtn) {
            sellBtn.addEventListener('click', () => {
              engine.sellMaterial(materialId);
              ui.renderResourceInfo();
              ui.renderShop();
            });
          }

          backpackMaterialInventoryEl.appendChild(itemEl);
        }
      });

      if (Object.keys(state.player.materials).length === 0) {
        backpackMaterialInventoryEl.innerHTML = '<div class="empty-inventory">素材库存为空</div>';
      }
    }

    // 更新角色面板的等级显示
    const playerLevelEl = document.getElementById('player-level');
    if (playerLevelEl) {
      playerLevelEl.textContent = state.player.level.toString();
    }
  },

  /**
   * 渲染商店
   */
  renderShop: (): void => {
    const shopEl = document.getElementById('shop');
    if (!shopEl) return;

    // 渲染素材库存
    const inventoryEl = document.getElementById('material-inventory');
    if (inventoryEl) {
      inventoryEl.innerHTML = '';

      Object.entries(state.player.materials).forEach(([materialId, quantity]) => {
        const material = MATERIALS[materialId];
        if (material) {
          const itemEl = document.createElement('div');
          itemEl.className = 'material-item';
          itemEl.innerHTML = `
            <div class="icon">${material.icon}</div>
            <div class="info">
              <div class="name">${material.name}</div>
              <div class="quantity">数量: ${quantity}</div>
              <div class="value">价值: ${material.value} 金币</div>
            </div>
            <button class="sell-btn" data-material-id="${materialId}">出售</button>
          `;

          // 添加出售按钮事件
          const sellBtn = itemEl.querySelector('.sell-btn') as HTMLElement;
          if (sellBtn) {
            sellBtn.addEventListener('click', () => {
              engine.sellMaterial(materialId);
              ui.renderResourceInfo();
              ui.renderShop();
            });
          }

          inventoryEl.appendChild(itemEl);
        }
      });

      if (Object.keys(state.player.materials).length === 0) {
        inventoryEl.innerHTML = '<div class="empty-inventory">素材库存为空</div>';
      }
    }

    // 渲染可购买的素材
    const shopItemsEl = document.getElementById('shop-items');
    if (shopItemsEl) {
      shopItemsEl.innerHTML = '';

      Object.values(MATERIALS).forEach(material => {
        const itemEl = document.createElement('div');
        itemEl.className = 'shop-item';
        const buyPrice = Math.floor(material.value * 1.5);
        itemEl.innerHTML = `
          <div class="icon">${material.icon}</div>
          <div class="info">
            <div class="name">${material.name}</div>
            <div class="price">价格: ${buyPrice} 金币</div>
          </div>
          <button class="buy-btn" data-material-id="${material.id}">购买</button>
        `;

        // 添加购买按钮事件
        const buyBtn = itemEl.querySelector('.buy-btn') as HTMLElement;
        if (buyBtn) {
          buyBtn.addEventListener('click', () => {
            engine.buyMaterial(material.id);
            ui.renderResourceInfo();
            ui.renderShop();
          });
        }

        shopItemsEl.appendChild(itemEl);
      });
    }
  },

  /**
   * 设置Dev模式界面
   */
  setupDevMode: (): void => {
    const devModeContainer = document.getElementById('dev-mode-container');
    if (!devModeContainer) return;
    
    // 创建Dev模式内容
    devModeContainer.innerHTML = `
      <div class="dev-mode">
        <h3 class="dev-title">开发模式</h3>
        <div class="dev-option">
          <label for="dev-enemy-select">选择敌人:</label>
          <select id="dev-enemy-select">
            <option value="random">随机敌人</option>
            <option value="wolf">恶狼</option>
            <option value="goblin">哥布林</option>
            <option value="ogre">食人魔</option>
          </select>
        </div>
      </div>
    `;
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
      .dev-mode {
        background: rgba(0, 0, 0, 0.8);
        padding: 15px;
        border-radius: 8px;
        border: 1px solid #444;
        color: #fff;
        font-size: 12px;
        z-index: 1000;
      }
      
      .dev-title {
        margin: 0 0 10px 0;
        font-size: 14px;
        color: #ffcc00;
      }
      
      .dev-option {
        margin-bottom: 10px;
      }
      
      .dev-option label {
        display: block;
        margin-bottom: 5px;
        color: #ccc;
      }
      
      .dev-option select {
        width: 120px;
        padding: 5px;
        background: #333;
        color: #fff;
        border: 1px solid #555;
        border-radius: 4px;
      }
    `;
    
    document.head.appendChild(style);
  }
}