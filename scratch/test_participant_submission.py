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
    
    print("Waiting 2.5 seconds for notification popover to appear...")
    time.sleep(2.5)
    
    # Click the message popover on the bottom right to enter participant view
    print("Entering participant coordination room...")
    msg_popover = driver.find_element(By.ID, "message-popover")
    driver.execute_script("arguments[0].click();", msg_popover)
    time.sleep(2)
    
    # Select Friday 10:00 - 11:00 (dayIdx: 4, slotIdx: 1)
    print("Selecting slot Friday 10:00...")
    cell = driver.find_element(By.CSS_SELECTOR, '#calendar-grid div.calendar-cell[data-day="4"][data-slot="1"]')
    driver.execute_script("arguments[0].click();", cell)
    time.sleep(1)
    
    # Click '이 시간으로 응답하기' button (which triggers submission modal directly)
    print("Clicking '이 시간으로 응답하기' button...")
    avail_btn = driver.find_element(By.ID, "btn-toggle-available")
    driver.execute_script("arguments[0].click();", avail_btn)
    time.sleep(1)
    
    # Confirm submit modal
    print("Confirming submission in modal...")
    confirm_send_btn = driver.find_element(By.ID, "btn-confirm-submit-send")
    driver.execute_script("arguments[0].click();", confirm_send_btn)
    time.sleep(1)
    
    # Close complete modal and trigger host confirmation simulation
    print("Closing complete modal...")
    close_modal_btn = driver.find_element(By.ID, "btn-complete-modal-close")
    driver.execute_script("arguments[0].click();", close_modal_btn)
    time.sleep(1)
    
    # Verify we returned to personal calendar landing page
    print("Checking if returned to workspace-landing...")
    landing = driver.find_element(By.ID, "workspace-landing")
    assert landing.is_displayed(), "Should be returned to the personal calendar landing page!"
    
    # Wait 6 seconds (to give simulated host confirmation popover plenty of time to trigger)
    print("Waiting 6 seconds for confirmed notification popover...")
    time.sleep(6)
    
    # Verify Confirmed Notification Popover is displayed
    print("Checking confirmed notification popover...")
    popover = driver.find_element(By.ID, "message-popover")
    assert popover.is_displayed(), "Confirmed notification popover should be displayed!"
    popover_text = popover.text.strip().replace('\n', ' ')
    print(f"Popover text: {repr(popover_text)}")
    assert "회의 확정" in popover_text, "Notification should have '회의 확정' tag!"
    assert "이토스" in popover_text, "Notification should show '이토스'!"
    assert "회의가 금요일 10:00로 최종 확정되었습니다." in popover_text, "Notification should contain details!"
    
    # Click the notification to add to calendar
    print("Clicking notification to add confirmed meeting to personal calendar...")
    driver.execute_script("arguments[0].click();", popover)
    time.sleep(2)
    
    # Verify landing calendar cell at Friday 10:00 (dayIdx: 4, slotIdx: 1 in my-workspace-calendar-grid) is now busy
    landing_cell = driver.find_element(By.CSS_SELECTOR, '#my-workspace-calendar-grid div.calendar-cell[data-day="4"][data-slot="1"]')
    landing_class = landing_cell.get_attribute('class')
    print(f"Landing cell class: {repr(landing_class)}")
    assert "status-busy" in landing_class, "Landing calendar cell should be blocked (busy) after confirmation sync!"
    assert "status-meeting" in landing_class, "Landing calendar cell should have 'status-meeting' class!"
    
    driver.quit()
    print("\nSUCCESS: Participant confirmed notification flow test completed successfully!")
except Exception as e:
    print("\nFAILURE:", e)
    if 'driver' in locals():
        logs = driver.get_log('browser')
        print("\n--- BROWSER CONSOLE LOGS ON FAILURE ---")
        for log in logs:
            print(log)
        driver.quit()
