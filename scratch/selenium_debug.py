import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

options = webdriver.ChromeOptions()
options.add_argument('--headless')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

try:
    print("Initializing Chrome driver...")
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    print("Navigating to http://localhost:8000/ ...")
    driver.get('http://localhost:8000/')
    time.sleep(2)
    
    # Login
    print("Logging in...")
    username_input = driver.find_element(By.ID, "login-username")
    username_input.send_keys("toss")
    form = driver.find_element(By.ID, "login-form")
    form.submit()
    time.sleep(2.5)
    
    # Select template "디자인1팀 회의"
    print("Selecting template '디자인1팀 회의'...")
    template_btn = driver.find_element(By.XPATH, "//button[.//span[contains(text(), '디자인1팀 회의')]]")
    driver.execute_script("arguments[0].click();", template_btn)
    time.sleep(1)
    
    # Click "회의 시간 찾기" button
    print("Clicking '회의 시간 찾기' button...")
    find_time_btn = driver.find_element(By.ID, "btn-wiz-submit")
    driver.execute_script("arguments[0].click();", find_time_btn)
    time.sleep(2)
    
    # Click "모두에게 물어보기" card
    print("Clicking '모두에게 물어보기'...")
    start_poll_btn = driver.find_element(By.ID, "btn-start-poll")
    driver.execute_script("arguments[0].click();", start_poll_btn)
    time.sleep(1)
    
    # Click "요청 보내기" button
    print("Clicking '요청 보내기' button...")
    send_btn = driver.find_element(By.ID, "vote-preview-send")
    driver.execute_script("arguments[0].click();", send_btn)
    time.sleep(1.5)
    
    # Wait 4.5 seconds for completed notification popover
    print("Waiting 4.5 seconds for '디자인1팀 회의' completed popover...")
    time.sleep(4.5)
    
    # Click host popover to enter completed dashboard
    print("Clicking completed popover...")
    host_popover = driver.find_element(By.ID, "host-response-popover")
    driver.execute_script("arguments[0].click();", host_popover)
    time.sleep(2)
    
    # Select slot Friday 10:00 (dayIdx: 4, slotIdx: 1)
    print("Selecting slot Friday 10:00...")
    cell = driver.find_element(By.CSS_SELECTOR, '#calendar-grid div.calendar-cell[data-day="4"][data-slot="1"]')
    driver.execute_script("arguments[0].click();", cell)
    time.sleep(1)
    
    # Click "회의 확정하기" button
    print("Clicking '회의 확정하기' button...")
    confirm_time_btn = driver.find_element(By.ID, "btn-book-from-detail")
    
    print(f"Before click - btn-book-from-detail classes: {confirm_time_btn.get_attribute('class')}")
    print(f"Before click - btn-book-from-detail text: {confirm_time_btn.text}")
    print(f"Before click - btn-book-from-detail disabled: {confirm_time_btn.get_attribute('disabled')}")
    
    # Print detail panel HTML
    detail_content = driver.find_element(By.ID, "detail-panel-content")
    print(f"Detail Panel HTML: {detail_content.get_attribute('outerHTML')}")
    
    # Click it!
    driver.execute_script("arguments[0].click();", confirm_time_btn)
    time.sleep(2)
    
    landing = driver.find_element(By.ID, "workspace-landing")
    dashboard = driver.find_element(By.ID, "coordination-dashboard")
    print(f"After click - workspace-landing visible: {landing.is_displayed()}")
    print(f"After click - coordination-dashboard visible: {dashboard.is_displayed()}")
    
    # Capture screenshot for visual confirmation
    driver.save_screenshot("/Users/simbo-eun/Desktop/toss-challenge-2026/scratch/selenium_debug_screenshot.png")
    print("Screenshot saved to /Users/simbo-eun/Desktop/toss-challenge-2026/scratch/selenium_debug_screenshot.png")
    
    driver.quit()
except Exception as e:
    print("Error:", e)
    if 'driver' in locals():
        driver.quit()
