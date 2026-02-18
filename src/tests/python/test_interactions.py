import asyncio
from playwright.async_api import async_playwright

async def test_browser_interactions():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()
        
        print("Navigating to example.com...")
        await page.goto('https://example.com')
        
        print(f"Page title: {await page.title()}")
        
        print("Getting page content...")
        content = await page.content()
        print(f"Page content length: {len(content)} characters")
        
        print("Getting all links...")
        links = await page.query_selector_all('a')
        print(f"Found {len(links)} links on the page")
        
        for i, link in enumerate(links[:5], 1):
            text = await link.text_content()
            href = await link.get_attribute('href')
            print(f"  Link {i}: {text} -> {href}")
        
        print("Taking screenshot...")
        await page.screenshot(path='example_screenshot.png')
        print("Screenshot saved to example_screenshot.png")
        
        await browser.close()
        print("Test completed successfully!")

if __name__ == "__main__":
    asyncio.run(test_browser_interactions())