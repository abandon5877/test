import asyncio
from playwright.async_api import async_playwright

async def test_all_enemies():
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
        
        print("=== 所有敌人类型测试 ===")
        print("游戏页面已加载")
        
        # 监听控制台日志
        console_messages = []
        page.on('console', lambda msg: console_messages.append(msg.text))
        
        # 已测试的敌人类型
        tested_enemies = set()
        test_results = []
        max_attempts = 15  # 最大尝试次数
        attempt = 0
        
        # 持续测试直到遇到所有敌人类型或达到最大尝试次数
        while len(tested_enemies) < 3 and attempt < max_attempts:
            attempt += 1
            print(f"\n=== 测试尝试 {attempt}/{max_attempts} ===")
            
            # 点击开始战斗按钮
            start_battle_btn = await page.query_selector('#start-battle-btn')
            await start_battle_btn.click()
            
            # 等待战斗场景加载
            await page.wait_for_selector('#battle-scene.active')
            
            # 检查遇到的敌人
            battle_log = await page.query_selector('#battle-log')
            current_enemy = "未知"
            
            if battle_log:
                battle_log_text = await battle_log.inner_text()
                # 识别敌人类型
                if "恶狼" in battle_log_text:
                    current_enemy = "恶狼"
                elif "哥布林" in battle_log_text:
                    current_enemy = "哥布林"
                elif "食人魔" in battle_log_text:
                    current_enemy = "食人魔"
            
            print(f"遇到敌人: {current_enemy}")
            
            # 如果这个敌人还没有测试过
            if current_enemy != "未知" and current_enemy not in tested_enemies:
                tested_enemies.add(current_enemy)
                print(f"开始测试 {current_enemy}")
                
                # 等待玩家ATB条充满
                await asyncio.sleep(5)
                
                # 测试使用法术
                spell_buttons = await page.query_selector_all('.spell-button')
                if spell_buttons:
                    # 点击第一个法术按钮（火球术）
                    button = spell_buttons[0]
                    button_text = await button.inner_text()
                    print(f"使用法术: {button_text}")
                    await button.click()
                    
                    # 等待战斗进程
                    await asyncio.sleep(8)
                    
                    # 检查战斗日志
                    battle_log = await page.query_selector('#battle-log')
                    if battle_log:
                        battle_log_text = await battle_log.inner_text()
                        print("战斗日志片段:")
                        lines = battle_log_text.split('\n')
                        for line in lines[-5:]:  # 显示最后5行
                            if line.strip():
                                print(f"[Log] {line}")
                
                # 等待战斗结束
                await page.wait_for_selector('#camp-scene.active')
                print(f"与 {current_enemy} 的战斗结束")
                
                # 收集测试结果
                enemy_result = {
                    "enemy": current_enemy,
                    "logs": console_messages.copy(),
                    "attempt": attempt
                }
                test_results.append(enemy_result)
                
                # 清空日志
                console_messages.clear()
                
                # 休息恢复
                rest_btn = await page.query_selector('#rest-btn')
                if rest_btn:
                    await rest_btn.click()
                    await asyncio.sleep(1)
            else:
                # 这个敌人已经测试过，或者是未知敌人
                print(f"{current_enemy} 已经测试过或未知，跳过详细测试")
                # 等待回到营地
                await page.wait_for_selector('#camp-scene.active')
                
                # 休息恢复
                rest_btn = await page.query_selector('#rest-btn')
                if rest_btn:
                    await rest_btn.click()
                    await asyncio.sleep(1)
        
        # 分析测试结果
        print("\n=== 测试结果分析 ===")
        
        for result in test_results:
            enemy_name = result["enemy"]
            logs = result["logs"]
            
            print(f"\n敌人: {enemy_name}")
            
            # 分析战斗相关日志
            battle_logs = [msg for msg in logs if "战斗" in msg or "攻击" in msg or "伤害" in msg]
            print("战斗相关日志:")
            for log in battle_logs[:3]:  # 显示前3条
                print(f"[Console] {log}")
            
            # 分析奖励相关日志
            reward_logs = [msg for msg in logs if "获得" in msg or "金币" in msg or "经验" in msg or "素材" in msg]
            print("奖励相关日志:")
            for log in reward_logs:
                print(f"[Console] {log}")
            
            # 分析升级相关日志
            level_logs = [msg for msg in logs if "升级" in msg or "解锁" in msg]
            if level_logs:
                print("升级相关日志:")
                for log in level_logs:
                    print(f"[Console] {log}")
        
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
        print("\n=== 所有敌人测试完成 ===")

async def test_enemy_consistency():
    """测试敌人类型的一致性，确保每次战斗都能遇到不同敌人"""
    async with async_playwright() as p:
        # 启动浏览器
        browser = await p.chromium.launch(
            headless=True,  # 无头模式，加快测试速度
            executable_path=r"d:\test\playwright-browsers\chromium-1208\chrome-win64\chrome.exe"
        )
        
        # 创建新页面
        page = await browser.new_page()
        
        # 导航到游戏页面
        await page.goto('http://localhost:3001/test/')
        
        # 等待页面加载
        await page.wait_for_load_state('networkidle')
        
        print("\n=== 敌人类型一致性测试 ===")
        
        encountered_enemies = []
        
        # 连续测试10次战斗
        for i in range(10):
            print(f"\n测试战斗 {i+1}/10")
            
            # 点击开始战斗按钮
            start_battle_btn = await page.query_selector('#start-battle-btn')
            await start_battle_btn.click()
            
            # 等待战斗场景加载
            await page.wait_for_selector('#battle-scene.active')
            
            # 检查遇到的敌人
            battle_log = await page.query_selector('#battle-log')
            if battle_log:
                battle_log_text = await battle_log.inner_text()
                
                # 识别敌人类型
                enemy_type = "未知"
                if "恶狼" in battle_log_text:
                    enemy_type = "恶狼"
                elif "哥布林" in battle_log_text:
                    enemy_type = "哥布林"
                elif "食人魔" in battle_log_text:
                    enemy_type = "食人魔"
                
                encountered_enemies.append(enemy_type)
                print(f"遇到敌人: {enemy_type}")
            
            # 等待战斗结束（快速结束）
            await asyncio.sleep(3)
            
            # 强制回到营地（如果还在战斗中）
            try:
                await page.wait_for_selector('#camp-scene.active', timeout=5000)
            except:
                # 如果超时，刷新页面
                await page.reload()
                await page.wait_for_load_state('networkidle')
        
        # 分析敌人分布
        print("\n=== 敌人分布分析 ===")
        enemy_counts = {}
        for enemy in encountered_enemies:
            enemy_counts[enemy] = enemy_counts.get(enemy, 0) + 1
        
        for enemy, count in enemy_counts.items():
            percentage = (count / len(encountered_enemies)) * 100
            print(f"{enemy}: {count}次 ({percentage:.1f}%)")
        
        # 检查是否遇到了所有敌人类型
        all_enemies_encountered = all(enemy in encountered_enemies for enemy in ["恶狼", "哥布林", "食人魔"])
        print(f"\n是否遇到了所有敌人类型: {'是' if all_enemies_encountered else '否'}")
        
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
        print("\n=== 敌人一致性测试完成 ===")

if __name__ == "__main__":
    asyncio.run(test_all_enemies())
    # 可选：运行敌人一致性测试
    # asyncio.run(test_enemy_consistency())
