// src/utils/fullscreen.ts

/**
 * 全屏工具类
 * 提供进入全屏和退出全屏的方法
 */
export class Fullscreen {
  /**
   * 检查浏览器是否支持全屏API
   */
  static isSupported(): boolean {
    const element = document.documentElement;
    return !!(element.requestFullscreen || 
              (element as any).webkitRequestFullscreen || 
              (element as any).mozRequestFullScreen || 
              (element as any).msRequestFullscreen);
  }

  /**
   * 进入全屏
   */
  static enter(): Promise<void> {
    return new Promise((resolve, reject) => {
      const element = document.documentElement;
      
      if (!this.isSupported()) {
        reject(new Error('Fullscreen API is not supported'));
        return;
      }

      const requestFullscreen = 
        element.requestFullscreen || 
        (element as any).webkitRequestFullscreen || 
        (element as any).mozRequestFullScreen || 
        (element as any).msRequestFullscreen;

      if (requestFullscreen) {
        requestFullscreen.call(element)
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error('Fullscreen API is not supported'));
      }
    });
  }

  /**
   * 退出全屏
   */
  static exit(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!document.fullscreenElement) {
        resolve();
        return;
      }

      const exitFullscreen = 
        document.exitFullscreen || 
        (document as any).webkitExitFullscreen || 
        (document as any).mozCancelFullScreen || 
        (document as any).msExitFullscreen;

      if (exitFullscreen) {
        exitFullscreen.call(document)
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error('Fullscreen API is not supported'));
      }
    });
  }

  /**
   * 检查是否处于全屏状态
   */
  static isFullscreen(): boolean {
    return !!(document.fullscreenElement || 
              (document as any).webkitFullscreenElement || 
              (document as any).mozFullScreenElement || 
              (document as any).msFullscreenElement);
  }

  /**
   * 切换全屏状态
   */
  static toggle(): Promise<void> {
    if (this.isFullscreen()) {
      return this.exit();
    } else {
      return this.enter();
    }
  }
}

/**
 * 初始化全屏处理
 * 添加用户交互事件监听器，在用户首次交互时尝试进入全屏
 */
export function initFullscreenHandler(): void {
  console.log('初始化全屏处理器...');
  
  // 检查是否支持全屏API
  if (!Fullscreen.isSupported()) {
    console.log('当前浏览器不支持全屏API');
    return;
  }

  // 标记是否已经尝试过全屏
  let hasTriedFullscreen = false;

  // 用户交互事件类型
  const interactionEvents = ['click', 'touchstart', 'keydown'];

  // 尝试进入全屏的函数
  const tryFullscreen = () => {
    if (!hasTriedFullscreen) {
      hasTriedFullscreen = true;
      console.log('尝试进入全屏模式...');
      
      Fullscreen.enter()
        .then(() => {
          console.log('成功进入全屏模式');
        })
        .catch((error) => {
          console.log('进入全屏失败:', error.message);
          // 失败时不阻止后续操作
        });

      // 移除事件监听器，避免重复尝试
      interactionEvents.forEach(event => {
        document.removeEventListener(event, tryFullscreen);
      });
    }
  };

  // 添加事件监听器
  interactionEvents.forEach(event => {
    document.addEventListener(event, tryFullscreen, { once: true });
  });

  console.log('全屏处理器初始化完成，等待用户交互...');
}

export default Fullscreen;