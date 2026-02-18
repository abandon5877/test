// src/utils/orientation.ts

/**
 * 屏幕方向工具类
 * 提供屏幕方向检测和处理功能
 */
export class Orientation {
  /**
   * 检查是否为竖屏模式
   */
  static isPortrait(): boolean {
    // 检查屏幕宽度是否小于高度
    return window.innerWidth < window.innerHeight;
  }

  /**
   * 检查是否为横屏模式
   */
  static isLandscape(): boolean {
    // 检查屏幕宽度是否大于或等于高度
    return window.innerWidth >= window.innerHeight;
  }

  /**
   * 获取当前屏幕方向
   */
  static getCurrentOrientation(): 'portrait' | 'landscape' {
    return this.isPortrait() ? 'portrait' : 'landscape';
  }
}

/**
 * 创建横屏提示元素
 * 在竖屏模式下显示，提示用户旋转设备到横屏
 */
export function createLandscapePrompt(): HTMLElement {
  // 检查是否已存在横屏提示
  let prompt = document.getElementById('landscape-prompt');
  
  if (!prompt) {
    // 创建提示元素
    prompt = document.createElement('div');
    prompt.id = 'landscape-prompt';
    prompt.className = 'landscape-prompt';
    
    // 添加样式
    prompt.style.position = 'fixed';
    prompt.style.top = '0';
    prompt.style.left = '0';
    prompt.style.width = '100vw';
    prompt.style.height = '100vh';
    prompt.style.backgroundColor = '#1a1a1a';
    prompt.style.color = 'white';
    prompt.style.display = 'flex';
    prompt.style.flexDirection = 'column';
    prompt.style.justifyContent = 'center';
    prompt.style.alignItems = 'center';
    prompt.style.zIndex = '99999';
    prompt.style.fontFamily = 'Arial, sans-serif';
    prompt.style.textAlign = 'center';
    prompt.style.padding = '20px';
    prompt.style.boxSizing = 'border-box';
    
    // 添加内容
    prompt.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 20px;">📱</div>
      <h2 style="font-size: 24px; margin-bottom: 16px;">请旋转设备到横屏模式</h2>
      <p style="font-size: 16px; max-width: 300px; line-height: 1.5;">
        本游戏在横屏模式下体验更佳，请将设备旋转至横屏后继续游戏。
      </p>
      <p style="font-size: 14px; color: #aaa; margin-top: 20px;">
        旋转后游戏将自动开始
      </p>
    `;
    
    // 添加到页面
    document.body.appendChild(prompt);
    console.log('横屏提示创建完成');
  }
  
  return prompt;
}

/**
 * 显示横屏提示
 * 隐藏游戏主内容，显示旋转提示
 */
export function showLandscapePrompt(): void {
  console.log('显示横屏提示');
  
  // 显示横屏提示
  const prompt = createLandscapePrompt();
  prompt.style.display = 'flex';
  
  // 隐藏游戏主内容
  const app = document.getElementById('app');
  if (app) {
    app.style.display = 'none';
  }
  
  // 隐藏全屏按钮
  const fullscreenButton = document.getElementById('fullscreen-button');
  if (fullscreenButton) {
    fullscreenButton.style.display = 'none';
  }
}

/**
 * 隐藏横屏提示
 * 显示游戏主内容，隐藏旋转提示
 */
export function hideLandscapePrompt(): void {
  console.log('隐藏横屏提示');
  
  // 隐藏横屏提示
  const prompt = document.getElementById('landscape-prompt');
  if (prompt) {
    prompt.style.display = 'none';
  }
  
  // 显示游戏主内容
  const app = document.getElementById('app');
  if (app) {
    app.style.display = 'block';
  }
  
  // 显示全屏按钮
  const fullscreenButton = document.getElementById('fullscreen-button');
  if (fullscreenButton) {
    fullscreenButton.style.display = 'block';
  }
}

/**
 * 初始化屏幕方向检测
 * 检测当前屏幕方向并根据需要显示横屏提示
 */
export function initOrientationDetection(): void {
  console.log('初始化屏幕方向检测...');
  
  // 初始检测
  checkOrientation();
  
  // 监听屏幕方向变化
  window.addEventListener('resize', checkOrientation);
  window.addEventListener('orientationchange', checkOrientation);
  
  console.log('屏幕方向检测初始化完成');
}

/**
 * 检查屏幕方向并处理
 */
function checkOrientation(): void {
  console.log('检查屏幕方向...');
  
  if (Orientation.isPortrait()) {
    // 竖屏模式，显示提示
    showLandscapePrompt();
  } else {
    // 横屏模式，隐藏提示
    hideLandscapePrompt();
  }
}

export default Orientation;