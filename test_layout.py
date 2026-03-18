#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""vue-layout-enhancement 浏览器自动化测试"""

import time
import sys

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.chrome.options import Options
except ImportError:
    print("❌ 未安装 selenium，正在安装...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "selenium"])
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.chrome.options import Options

def test_layout_enhancement():
    print("🚀 启动浏览器测试...\n")
    
    # 配置 Chrome
    chrome_options = Options()
    chrome_options.add_argument('--start-maximized')
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    
    driver = None
    try:
        driver = webdriver.Chrome(options=chrome_options)
        driver.set_window_size(1920, 1080)
        
        # 访问页面
        url = "http://localhost:8848/"
        print(f"📍 访问 {url}")
        driver.get(url)
        
        # 等待页面加载
        time.sleep(3)
        print("✅ 页面加载成功\n")
        
        # 测试1: 检查页面标题
        print("🔍 测试1: 检查页面标题")
        title = driver.title
        print(f"   页面标题: {title}")
        
        # 测试2: 检查是否有 JavaScript 错误
        print("\n🔍 测试2: 检查控制台错误")
        logs = driver.get_log('browser')
        errors = [log for log in logs if log['level'] == 'SEVERE']
        if errors:
            print(f"❌ 发现 {len(errors)} 个严重错误:")
            for err in errors[:5]:  # 只显示前5个
                print(f"   - {err['message']}")
        else:
            print("✅ 无严重错误")
        
        # 测试3: 检查关键元素
        print("\n🔍 测试3: 检查关键 DOM 元素")
        
        # 检查 body
        body = driver.find_element(By.TAG_NAME, 'body')
        print(f"✅ body 元素存在")
        
        # 检查是否有 Vue 应用挂载
        try:
            app = driver.find_element(By.ID, 'app')
            print(f"✅ #app 元素存在")
        except:
            print(f"⚠️  #app 元素未找到")
        
        # 测试4: 截图
        print("\n📸 保存截图...")
        driver.save_screenshot('test-screenshot.png')
        print("✅ 截图已保存到 test-screenshot.png")
        
        # 测试5: 检查页面内容
        print("\n🔍 测试5: 检查页面内容")
        page_source = driver.page_source
        
        keywords = ['navbar', 'footer', 'sidebar', 'theme']
        found_keywords = []
        for keyword in keywords:
            if keyword.lower() in page_source.lower():
                found_keywords.append(keyword)
                print(f"✅ 找到关键词: {keyword}")
        
        if not found_keywords:
            print("⚠️  未找到预期的关键词")
        
        # 测试6: 等待用户手动检查
        print("\n✨ 自动化测试完成！")
        print("📋 测试摘要:")
        print(f"   - 页面标题: {title}")
        print(f"   - 控制台错误: {len(errors)} 个")
        print(f"   - 找到关键词: {', '.join(found_keywords) if found_keywords else '无'}")
        print("\n浏览器将保持打开30秒供手动检查...")
        print("可以手动切换主题、检查节日特效等功能")
        
        time.sleep(30)
        
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if driver:
            print("\n🔚 关闭浏览器")
            driver.quit()

if __name__ == '__main__':
    test_layout_enhancement()
