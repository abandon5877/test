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
 * 创建全屏按钮
 * 添加一个可见的全屏按钮到游戏界面
 */
export function createFullscreenButton(): void {
  console.log('创建全屏按钮...');
  
  // 检查是否已存在全屏按钮
  if (document.getElementById('fullscreen-button')) {
    console.log('全屏按钮已存在');
    return;
  }
  
  // 创建全屏按钮
  const button = document.createElement('button');
  button.id = 'fullscreen-button';
  button.className = 'fullscreen-button';
  button.innerHTML = '🔲 全屏';
  
  // 添加样式
  button.style.position = 'fixed';
  button.style.top = '10px';
  button.style.right = '10px';
  button.style.zIndex = '9999';
  button.style.padding = '8px 16px';
  button.style.backgroundColor = '#6b46c1';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '4px';
  button.style.fontSize = '14px';
  button.style.cursor = 'pointer';
  button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
  button.style.transition = 'background-color 0.3s';
  
  // 添加悬停效果
  button.addEventListener('mouseenter', () => {
    button.style.backgroundColor = '#553c9a';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.backgroundColor = '#6b46c1';
  });
  
  // 添加点击事件
  button.addEventListener('click', async () => {
    console.log('用户点击全屏按钮');
    
    try {
      await Fullscreen.toggle();
      
      // 进入全屏后隐藏按钮
      if (Fullscreen.isFullscreen()) {
        console.log('成功进入全屏模式，隐藏按钮');
        button.style.display = 'none';
      } else {
        console.log('成功退出全屏模式，显示按钮');
        button.innerHTML = '🔲 全屏';
        button.style.display = 'block';
      }
    } catch (error) {
      console.error('全屏操作失败:', error);
      // 显示错误提示
      alert('全屏操作失败: ' + (error as Error).message);
    }
  });
  
  // 添加到页面
  document.body.appendChild(button);
  console.log('全屏按钮创建完成');
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

  // 创建全屏按钮
  createFullscreenButton();

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
          // 更新全屏按钮状态
          const button = document.getElementById('fullscreen-button');
          if (button) {
            button.innerHTML = '🔲 退出全屏';
          }
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

  // 添加全屏状态变化监听器
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('mozfullscreenchange', handleFullscreenChange);
  document.addEventListener('MSFullscreenChange', handleFullscreenChange);

  console.log('全屏处理器初始化完成，等待用户交互...');
}

/**
 * 处理全屏状态变化
 */
function handleFullscreenChange() {
  console.log('全屏状态变化:', Fullscreen.isFullscreen() ? '进入全屏' : '退出全屏');
  
  // 更新全屏按钮状态
  const button = document.getElementById('fullscreen-button');
  if (button) {
    if (Fullscreen.isFullscreen()) {
      // 进入全屏后隐藏按钮
      button.style.display = 'none';
    } else {
      // 退出全屏后显示按钮
      button.innerHTML = '🔲 全屏';
      button.style.display = 'block';
    }
  }
}

export default Fullscreen;