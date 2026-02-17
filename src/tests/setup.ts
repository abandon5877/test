// 测试设置文件
import { vi } from 'vitest';

// 模拟localStorage
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0
} as any;

// 模拟performance
global.performance = {
  now: vi.fn(() => Date.now())
} as any;

// 模拟requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 0);
  return 1;
});

// 模拟DOM元素
class MockElement {
  className: string = '';
  innerHTML: string = '';
  style: Record<string, string> = {};
  dataset: Record<string, string> = {};
  scrollTop: number = 0;
  scrollHeight: number = 0;
  disabled: boolean = false;
  textContent: string | null = null;
  value: string = '';

  constructor(public tagName: string = 'div', public id: string = '') {
  }

  querySelector(_selector: string): MockElement | null {
    return null;
  }

  querySelectorAll(_selector: string): MockElement[] {
    return [];
  }

  addEventListener(_event: string, _listener: Function): void {
  }

  removeEventListener(_event: string, _listener: Function): void {
  }

  appendChild(_child: MockElement): void {
  }

  removeChild(_child: MockElement): void {
  }

  getBoundingClientRect(): any {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
}

// 模拟document
global.document = {
  readyState: 'complete',
  addEventListener: vi.fn(),
  createElement: vi.fn((tagName: string) => new MockElement(tagName)),
  getElementById: vi.fn((id: string) => new MockElement('div', id)),
  querySelector: vi.fn(() => new MockElement()),
  querySelectorAll: vi.fn(() => []),
  body: new MockElement('body')
} as any;

// 模拟window
global.window = {
  location: { href: '' },
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  requestAnimationFrame: global.requestAnimationFrame
} as any;