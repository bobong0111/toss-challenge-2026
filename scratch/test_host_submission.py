import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

options = webdriver.ChromeOptions()
options.add_argument('--headless')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')
options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})

try:
    print("Initializing Chrome driver...")
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    print("Navigating to http://localhost:8000/ ...")
    driver.get('http://localhost:8000/')
    
    # Clear localStorage and refresh to start from clean login page
    driver.execute_script("localStorage.clear();")
    driver.refresh()
    time.sleep(2)
    
    # Login
    print("Logging in...")
    username_input = driver.find_element(By.ID, "login-username")
    username_input.send_keys("toss")
    form = driver.find_element(By.ID, "login-form")
    form.submit()
    
    print("Waiting 2.5 seconds for dashboard elements...")
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
    
    # Verify we entered coordination-dashboard
    print("Verifying coordination dashboard is displayed...")
    dashboard = driver.find_element(By.ID, "coordination-dashboard")
    assert dashboard.is_displayed(), "Should be transitioned to Host coordination dashboard!"
    
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
    
    # Verify redirection back to workspace landing page
    print("Verifying redirection back to workspace-landing...")
    landing = driver.find_element(By.ID, "workspace-landing")
    assert landing.is_displayed(), "Host should be returned to the landing page immediately after sending the request!"
    
    # Wait 4.5 seconds for completed notification popover
    print("Waiting 4.5 seconds for '디자인1팀 회의' completed popover...")
    time.sleep(4.5)
    
    # Verify Host response popover is displayed
    print("Checking host response popover...")
    host_popover = driver.find_element(By.ID, "host-response-popover")
    assert host_popover.is_displayed(), "Host response popover should be displayed!"
    host_popover_text = host_popover.text.strip().replace('\n', ' ')
    print(f"Host popover text: {repr(host_popover_text)}")
    assert "디자인1팀 회의" in host_popover_text, "Notification should mention '디자인1팀 회의'!"
    assert "응답이 모두 도착했습니다" in host_popover_text, "Notification should show '응답이 모두 도착했습니다'!"
    
    # Click host popover to enter completed dashboard
    print("Clicking completed popover...")
    driver.execute_script("arguments[0].click();", host_popover)
    time.sleep(2)
    
    # Programmatically retrieve the top recommendation's day and slot index!
    print("Retrieving top recommendation day and slot dynamically...")
    top_rec = driver.execute_script("return currentRecommendations && currentRecommendations.length > 0 ? currentRecommendations[0] : null;")
    print(f"Top recommendation: {top_rec}")
    assert top_rec is not None, "Recommendations should be loaded!"
    
    day_idx = top_rec['day']
    slot_idx = top_rec['startSlot']
    print(f"Selected coordinates: Day {day_idx}, Slot {slot_idx}")
    
    # Click the calendar cell corresponding to the top recommendation!
    print("Selecting the top recommendation cell...")
    cell = driver.find_element(By.CSS_SELECTOR, f'#calendar-grid div.calendar-cell[data-day="{day_idx}"][data-slot="{slot_idx}"]')
    driver.execute_script("arguments[0].click();", cell)
    time.sleep(1)
    
    # Click "회의 확정하기" button
    print("Clicking '회의 확정하기' button...")
    confirm_time_btn = driver.find_element(By.ID, "btn-book-from-detail")
    driver.execute_script("arguments[0].click();", confirm_time_btn)
    time.sleep(2)
    
    # Verify redirected back to workspace landing page
    print("Verifying redirection back to workspace-landing after confirm...")
    assert landing.is_displayed(), "Should be returned to workspace landing!"
    
    # Verify landing calendar cell is now busy
    print("Checking if landing calendar cell is now busy...")
    landing_cell = driver.find_element(By.CSS_SELECTOR, f'#my-workspace-calendar-grid div.calendar-cell[data-day="{day_idx}"][data-slot="{slot_idx}"]')
    landing_class = landing_cell.get_attribute('class')
    print(f"Landing cell class: {repr(landing_class)}")
    assert "status-busy" in landing_class, "Landing cell should be blocked (busy)!"
    assert ("status-meeting" in landing_class or "status-work" in landing_class), "Landing cell should have 'status-meeting' or 'status-work' class!"
    
    driver.quit()
    print("\nSUCCESS: Host unified simulation flow test completed successfully!")
except Exception as e:
    print("\nFAILURE:", e)
    if 'driver' in locals():
        logs = driver.get_log('browser')
        print("\n--- BROWSER CONSOLE LOGS ON FAILURE ---")
        for log in logs:
            print(log)
        driver.quit()
