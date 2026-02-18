import asyncio
from playwright.async_api import async_playwright

async def test_dev_mode_enemies():
    async with async_playwright() as p:
        # 启动浏览器
        browser = await p.chromium.launch(
            headless=False,
            executable_path=r"d:\test\playwright-browsers\chromium-1208\chrome-win64\chrome.exe"
        )
        
        try:
            # 创建新页面
            page = await browser.new_page()
            
            # 导航到游戏页面
            await page.goto('http://localhost:3001/test/')
            
            # 等待页面加载
            await page.wait_for_load_state('networkidle', timeout=10000)
            
            print("=== 开发模式敌人测试 ===")
            print("游戏页面已加载")
            
            # 监听控制台日志
            console_messages = []
            page.on('console', lambda msg: console_messages.append(msg.text))
            
            # 敌人类型映射（UI选项文本 -> 敌人ID）
            enemy_types = [
                {"name": "恶狼", "id": "wolf"},
                {"name": "哥布林", "id": "goblin"},
                {"name": "食人魔", "id": "ogre"}
            ]
            
            for enemy in enemy_types:
                print(f"\n=== 测试敌人: {enemy['name']} ===")
                
                # 等待开发模式界面加载
                await asyncio.sleep(1)
                
                # 在开发模式中选择敌人
                try:
                    # 找到开发模式的敌人选择下拉框
                    dev_select = await page.query_selector('#dev-enemy-select')
                    if dev_select:
                        print(f"选择敌人: {enemy['name']}")
                        await dev_select.select_option(enemy['id'])
                        await asyncio.sleep(0.5)
                    else:
                        print("开发模式界面未找到，使用随机敌人")
                except Exception as e:
                    print(f"选择敌人时出错: {e}")
                
                # 点击开始战斗按钮
                try:
                    # 使用 wait_for_selector 代替 query_selector 来处理超时
                    await page.wait_for_selector('#start-battle-btn', timeout=5000)
                    start_battle_btn = await page.query_selector('#start-battle-btn')
                    if start_battle_btn:
                        await start_battle_btn.click()
                    else:
                        print("开始战斗按钮未找到，跳过测试")
                        continue
                except Exception as e:
                    print(f"点击开始战斗按钮时出错: {e}")
                    continue
                
                # 等待战斗场景加载
                try:
                    await page.wait_for_selector('#battle-scene.active', timeout=10000)
                    print("进入战斗场景")
                except Exception as e:
                    print(f"进入战斗场景时出错: {e}")
                    # 刷新页面
                    await page.reload()
                    await page.wait_for_load_state('networkidle')
                    continue
                
                # 等待玩家ATB条充满
                print("等待玩家ATB条充满...")
                await asyncio.sleep(5)
                
                # 测试使用多个法术
                spell_buttons = await page.query_selector_all('.spell-button')
                spells_used = 0
                
                while spells_used < 3 and len(spell_buttons) > 0:
                    # 点击第一个可用的法术按钮
                    spell_cast = False
                    for i, button in enumerate(spell_buttons):
                        try:
                            # 检查按钮是否可见
                            is_visible = await button.is_visible()
                            if is_visible:
                                button_text = await button.inner_text()
                                print(f"使用法术: {button_text}")
                                await button.click()
                                spells_used += 1
                                spell_cast = True
                                
                                # 等待法术释放
                                await asyncio.sleep(3)
                                
                                break
                        except Exception as e:
                            print(f"点击法术按钮 {i} 时出错: {e}")
                            continue
                    
                    if not spell_cast:
                        break
                    
                    # 等待ATB条重新充满
                    await asyncio.sleep(4)
                    
                    # 重新获取法术按钮
                    spell_buttons = await page.query_selector_all('.spell-button')
                
                # 等待战斗结束
                print("等待战斗结束...")
                try:
                    await page.wait_for_selector('#camp-scene.active', timeout=15000)
                    print(f"与 {enemy['name']} 的战斗结束")
                except:
                    print(f"战斗超时，强制结束")
                    # 刷新页面回到营地
                    await page.reload()
                    await page.wait_for_load_state('networkidle')
                
                # 确保回到营地
                await asyncio.sleep(2)
                
                # 分析战斗结果
                battle_logs = [msg for msg in console_messages if "战斗" in msg or "伤害" in msg or "获得" in msg]
                print("战斗相关日志:")
                for log in battle_logs[-10:]:  # 显示最后10条
                    print(f"[Console] {log}")
                
                # 清空日志
                console_messages.clear()
                
                # 休息恢复
                try:
                    # 使用 wait_for_selector 代替 query_selector 来处理超时
                    await page.wait_for_selector('#rest-btn', timeout=5000)
                    rest_btn = await page.query_selector('#rest-btn')
                    if rest_btn:
                        print("点击休息按钮恢复HP/MP")
                        await rest_btn.click()
                        await asyncio.sleep(1)
                except Exception as e:
                    print(f"点击休息按钮时出错: {e}")
        finally:
            # 测试完成
            print("\n=== 所有敌人测试完成 ===")
            
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

if __name__ == "__main__":
    asyncio.run(test_dev_mode_enemies())
