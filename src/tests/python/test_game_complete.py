import asyncio
from playwright.async_api import async_playwright

async def test_game_complete_flow():
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
        
        print("=== 游戏完整流程测试 ===")
        print("游戏页面已加载")
        
        # 监听控制台日志
        console_messages = []
        page.on('console', lambda msg: console_messages.append(msg.text))
        
        # 测试1: 营地场景功能
        print("\n=== 测试1: 营地场景功能 ===")
        
        # 检查资源显示
        await asyncio.sleep(1)
        
        # 测试休息功能
        rest_btn = await page.query_selector('#rest-btn')
        if rest_btn:
            print("点击休息按钮")
            await rest_btn.click()
            await asyncio.sleep(1)
            
            # 检查休息日志
            rest_logs = [msg for msg in console_messages if "休息" in msg or "HP" in msg or "MP" in msg]
            print("休息相关日志:")
            for log in rest_logs:
                print(f"[Console] {log}")
            
            console_messages.clear()
        
        # 测试商店功能
        shop_btn = await page.query_selector('#open-shop-btn')
        if shop_btn:
            print("点击商店按钮")
            await shop_btn.click()
            await asyncio.sleep(1)
            
            # 等待商店界面加载
            await page.wait_for_selector('#shop-interface.active')
            print("商店界面已打开")
            
            # 关闭商店
            close_shop_btn = await page.query_selector('#close-shop-btn')
            if close_shop_btn:
                await close_shop_btn.click()
                await asyncio.sleep(1)
        
        # 测试2: 战斗完整流程
        print("\n=== 测试2: 战斗完整流程 ===")
        
        # 点击开始战斗按钮
        start_battle_btn = await page.query_selector('#start-battle-btn')
        await start_battle_btn.click()
        
        print("开始战斗")
        
        # 等待战斗场景加载
        await page.wait_for_selector('#battle-scene.active')
        print("进入战斗场景")
        
        # 等待玩家ATB条充满
        print("等待玩家ATB条充满...")
        await asyncio.sleep(5)  # 等待5秒，让ATB条充满
        
        # 测试点击施法按钮的方法
        async def test_spell_button(index):
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
                    await asyncio.sleep(3)
                    
                    # 检查控制台日志
                    casting_logs = [msg for msg in console_messages if "开始吟唱" in msg or "造成" in msg or "恢复" in msg]
                    print("施法相关日志:")
                    for log in casting_logs:
                        print(f"[Console] {log}")
                    
                    # 检查是否有施法成功的日志
                    casting_success = any("开始吟唱" in msg for msg in console_messages)
                    print(f"是否开始吟唱: {casting_success}")
                    
                    return casting_success
                else:
                    print(f"按钮 {index} 不可见")
                    return False
            except Exception as e:
                print(f"测试按钮 {index} 时出错: {e}")
                return False
        
        # 测试每个按钮
        for i in range(3):
            success = await test_spell_button(i)
            if success:
                print(f"测试按钮 {i} 成功")
            else:
                print(f"测试按钮 {i} 失败")
            await asyncio.sleep(2)
        
        # 等待战斗结束（如果敌人被击败）
        print("等待战斗结束...")
        await asyncio.sleep(10)
        
        # 检查是否回到营地
        camp_scene = await page.query_selector('#camp-scene.active')
        if camp_scene:
            print("战斗结束，已回到营地")
            
            # 检查战斗奖励日志
            reward_logs = [msg for msg in console_messages if "获得" in msg or "金币" in msg or "经验" in msg or "素材" in msg]
            print("战斗奖励相关日志:")
            for log in reward_logs:
                print(f"[Console] {log}")
            
            # 检查升级日志
            level_logs = [msg for msg in console_messages if "升级" in msg or "解锁" in msg]
            print("升级相关日志:")
            for log in level_logs:
                print(f"[Console] {log}")
        
        # 测试3: 商店系统
        print("\n=== 测试3: 商店系统 ===")
        
        # 打开商店
        shop_btn = await page.query_selector('#open-shop-btn')
        if shop_btn:
            await shop_btn.click()
            await asyncio.sleep(1)
            
            # 等待商店界面加载
            await page.wait_for_selector('#shop-interface.active')
            print("商店界面已打开")
            
            # 检查商店物品
            shop_items = await page.query_selector_all('.shop-item')
            print(f"商店物品数量: {len(shop_items)}")
            
            # 测试购买物品（如果有物品）
            if shop_items:
                first_item = shop_items[0]
                buy_btn = await first_item.query_selector('.buy-btn')
                if buy_btn:
                    print("点击购买按钮")
                    await buy_btn.click()
                    await asyncio.sleep(1)
                    
                    # 检查购买日志
                    buy_logs = [msg for msg in console_messages if "购买" in msg or "花费" in msg]
                    print("购买相关日志:")
                    for log in buy_logs:
                        print(f"[Console] {log}")
            
            # 关闭商店
            close_shop_btn = await page.query_selector('#close-shop-btn')
            if close_shop_btn:
                await close_shop_btn.click()
                await asyncio.sleep(1)
        
        # 测试4: 法术系统
        print("\n=== 测试4: 法术系统 ===")
        
        # 检查法术槽
        spell_slots = await page.query_selector_all('.spell-slot')
        print(f"法术槽数量: {len(spell_slots)}")
        
        # 测试5: 游戏状态
        print("\n=== 测试5: 游戏状态检查 ===")
        
        # 检查资源显示
        resource_info = await page.query_selector('#resource-info')
        if resource_info:
            resource_text = await resource_info.inner_text()
            print("当前资源状态:")
            print(resource_text)
        
        # 等待一段时间，观察游戏状态
        print("\n测试完成，等待3秒后关闭浏览器...")
        await asyncio.sleep(3)
        
        # 关闭浏览器
        await browser.close()
        print("\n=== 测试完成 ===")

async def test_game_multiple_battles():
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
        
        print("\n=== 多场战斗测试 ===")
        print("游戏页面已加载")
        
        # 监听控制台日志
        console_messages = []
        page.on('console', lambda msg: console_messages.append(msg.text))
        
        # 测试多场战斗
        for battle_num in range(3):
            print(f"\n=== 第 {battle_num + 1} 场战斗 ===")
            
            # 点击开始战斗按钮
            start_battle_btn = await page.query_selector('#start-battle-btn')
            await start_battle_btn.click()
            
            print("开始战斗")
            
            # 等待战斗场景加载
            await page.wait_for_selector('#battle-scene.active')
            print("进入战斗场景")
            
            # 等待玩家ATB条充满
            await asyncio.sleep(5)
            
            # 测试使用法术
            spell_buttons = await page.query_selector_all('.spell-button')
            if spell_buttons:
                # 点击第一个法术按钮
                button = spell_buttons[0]
                await button.click()
                print("使用法术攻击")
                
                # 等待战斗结束
                await asyncio.sleep(10)
            
            # 等待回到营地
            await page.wait_for_selector('#camp-scene.active')
            print("战斗结束，已回到营地")
            
            # 休息恢复
            rest_btn = await page.query_selector('#rest-btn')
            if rest_btn:
                await rest_btn.click()
                print("休息恢复HP/MP")
                await asyncio.sleep(1)
        
        # 检查最终状态
        resource_info = await page.query_selector('#resource-info')
        if resource_info:
            resource_text = await resource_info.inner_text()
            print("\n最终资源状态:")
            print(resource_text)
        
        # 关闭浏览器
        await browser.close()
        print("\n=== 多场战斗测试完成 ===")

if __name__ == "__main__":
    asyncio.run(test_game_complete_flow())
    # 可选：运行多场战斗测试
    # asyncio.run(test_game_multiple_battles())
