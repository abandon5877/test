import asyncio
from playwright.async_api import async_playwright

async def test_game_spell_buttons():
    async with async_playwright() as p:
        # 启动浏览器
        browser = await p.chromium.launch(
            headless=False,
            executable_path=r"d:\test\playwright-browsers\chromium-1208\chrome-win64\chrome.exe"
        )
        
        # 创建新页面
        page = await browser.new_page()
        
        # 导航到游戏页面
        await page.goto('http://localhost:3001/test/')
        
        # 等待页面加载
        await page.wait_for_load_state('networkidle')
        
        print("游戏页面已加载")
        
        # 点击开始战斗按钮
        start_battle_btn = await page.query_selector('#start-battle-btn')
        await start_battle_btn.click()
        
        print("开始战斗")
        
        # 等待战斗场景加载
        await page.wait_for_selector('#battle-scene.active')
        
        # 监听控制台日志
        console_messages = []
        page.on('console', lambda msg: console_messages.append(msg.text))
        
        print("进入战斗场景")
        
        # 等待玩家ATB条充满
        print("等待玩家ATB条充满...")
        await asyncio.sleep(5)  # 等待5秒，让ATB条充满
        
        # 测试点击施法按钮的方法
        async def test_button_click(index):
            try:
                # 重新获取所有按钮
                spell_buttons = await page.query_selector_all('.spell-button')
                if index >= len(spell_buttons):
                    print(f"按钮 {index} 不存在")
                    return False
                
                button = spell_buttons[index]
                
                # 获取按钮文本
                button_text = await button.inner_text()
                print(f"测试按钮 {index}: {button_text}")
                
                # 检查按钮是否可见
                is_visible = await button.is_visible()
                print(f"按钮 {index} 是否可见: {is_visible}")
                
                if is_visible:
                    # 清空控制台消息
                    console_messages.clear()
                    
                    # 点击按钮
                    print(f"点击按钮 {index}")
                    await button.click()
                    
                    # 等待施法动画
                    await asyncio.sleep(2)
                    
                    # 检查控制台日志
                    print("控制台日志:")
                    for msg in console_messages:
                        print(f"[Console] {msg}")
                    
                    # 检查是否有施法成功的日志
                    casting_success = any("开始吟唱" in msg for msg in console_messages)
                    print(f"是否开始吟唱: {casting_success}")
                    
                    if casting_success:
                        print(f"按钮 {index} 点击成功，开始吟唱")
                        return True
                    else:
                        print(f"按钮 {index} 点击失败，未开始吟唱")
                        return False
                else:
                    print(f"按钮 {index} 不可见")
                    return False
            except Exception as e:
                print(f"测试按钮 {index} 时出错: {e}")
                return False
        
        # 测试每个按钮
        for i in range(3):
            success = await test_button_click(i)
            if success:
                print(f"测试按钮 {i} 成功")
            else:
                print(f"测试按钮 {i} 失败")
            await asyncio.sleep(1)
        
        # 等待一段时间，观察游戏状态
        print("测试完成，等待5秒后关闭浏览器...")
        await asyncio.sleep(5)
        
        # 关闭浏览器
        try:
            print("正在关闭浏览器...")
            await browser.close()
            print("浏览器已关闭")
        except Exception as e:
            print(f"关闭浏览器时出错: {e}")
            # 尝试强制关闭
            try:
                print("尝试强制关闭浏览器")
                browser.process.kill()
                print("浏览器进程已强制终止")
            except:
                print("无法关闭浏览器进程")
        print("测试完成")

if __name__ == "__main__":
    asyncio.run(test_game_spell_buttons())
