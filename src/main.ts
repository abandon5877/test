import './styles/main.css';
import { state, engine } from './modules/engine';
import { ui } from './modules/ui';
import { storage } from './modules/storage';
import { initFullscreenHandler } from './utils/fullscreen';
import { initOrientationDetection } from './utils/orientation';

// 游戏循环
class GameLoop {
  private lastTime: number = 0;
  private lastUIUpdateTime: number = 0;
  private running: boolean = false;
  private uiUpdateInterval: number = 1000 / 30; // UI更新频率：30fps

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    this.lastUIUpdateTime = performance.now();
    this.loop(this.lastTime);
  }

  stop(): void {
    this.running = false;
  }

  private loop(timestamp: number): void {
    if (!this.running) return;

    const deltaTime = (timestamp - this.lastTime) / 1000; // 转换为秒
    this.lastTime = timestamp;

    // 更新战斗（每一帧都更新计算逻辑）
    if (state.battle.active) {
      engine.updateBattle(deltaTime);
    }

    // 以固定频率更新UI（避免动画闪动）
    if (timestamp - this.lastUIUpdateTime >= this.uiUpdateInterval) {
      if (state.battle.active) {
        ui.updateBattleUI();
      }
      this.lastUIUpdateTime = timestamp;
    }

    requestAnimationFrame((time) => this.loop(time));
  }
}

// 初始化游戏
function initGame(): void {
  console.log('初始化魔法编程冒险...');

  // 初始化UI
  ui.init();

  // 初始化全屏处理器
  initFullscreenHandler();

  // 初始化屏幕方向检测
  initOrientationDetection();

  // 加载游戏进度
  storage.loadGame();

  // 启动游戏循环
  const gameLoop = new GameLoop();
  gameLoop.start();

  // 保存游戏进度（每30秒自动保存）
  setInterval(() => {
    storage.saveGame();
  }, 30000);

  // 页面卸载时保存游戏进度
  window.addEventListener('beforeunload', () => {
    storage.saveGame();
  });

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

// 注册Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker 注册成功:', registration.scope);
      })
      .catch((error) => {
        console.log('Service Worker 注册失败:', error);
      });
  });
}