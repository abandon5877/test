import './styles/main.css';
import { state, engine } from './modules/engine';
import { ui } from './modules/ui';
import { storage } from './modules/storage';

// 游戏循环
class GameLoop {
  private lastTime: number = 0;
  private running: boolean = false;

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop(): void {
    this.running = false;
  }

  private loop(timestamp: number): void {
    if (!this.running) return;

    const deltaTime = (timestamp - this.lastTime) / 1000; // 转换为秒
    this.lastTime = timestamp;

    // 更新战斗
    if (state.battle.active) {
      engine.updateBattle(deltaTime);
      ui.updateBattleUI();
    }

    requestAnimationFrame((time) => this.loop(time));
  }
}

// 初始化游戏
function initGame(): void {
  console.log('初始化魔法编程冒险...');

  // 初始化UI
  ui.init();

  // 加载游戏进度
  storage.loadGame();

  // 启动游戏循环
  const gameLoop = new GameLoop();
  gameLoop.start();

  // 保存游戏进度（每30秒自动保存）
  setInterval(() => {
    storage.saveGame();
  }, 30000);

  console.log('游戏初始化完成！');
}

// 页面加载完成后初始化游戏
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}

// 导出全局对象（用于调试）
if (process.env.NODE_ENV === 'development') {
  (window as any).game = {
    state,
    engine,
    ui,
    storage
  };
}