import time
import subprocess
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

options = webdriver.ChromeOptions()
options.add_argument('--headless')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

port = 8009
server_process = subprocess.Popen(
    ["python3", "-m", "http.server", str(port)],
    cwd="/Users/simbo-eun/Desktop/toss-challenge-2026",
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE
)
time.sleep(1.5)

try:
    print(f"Starting server on port {port}...")
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    driver.get(f'http://localhost:{port}/')
    time.sleep(2)
    
    # Login
    print("Logging in...")
    username_input = driver.find_element(By.ID, "login-username")
    username_input.send_keys("toss")
    form = driver.find_element(By.ID, "login-form")
    form.submit()
    time.sleep(2)
    
    # 1. Verify personal schedule view on Landing Page
    print("\n--- Verifying personal schedule cells on Landing Page (Wednesday 13-16) ---")
    cells = driver.find_elements(By.CSS_SELECTOR, "#my-workspace-calendar-grid .calendar-cell[data-day='2']")
    found_samsung = False
    for cell in cells:
        slot_idx = int(cell.get_attribute("data-slot"))
        classes = cell.get_attribute("class")
        text = cell.get_attribute("textContent").strip()
        if slot_idx in [4, 5, 6]:
            print(f"Slot {slot_idx} classes: {classes}, text: {repr(text)}")
            if "삼성역 미팅 (외근)" in text:
                found_samsung = True
                
    assert found_samsung, "Expected '삼성역 미팅 (외근)' to be present in Wednesday 13-16 slots of my-workspace-calendar-grid!"
    print("🟢 Successfully verified '삼성역 미팅 (외근)' is on Wednesday 13-16 in my-workspace-calendar-grid.")

    # 2. Click "회의 시간 찾기" to transition to Coordination Dashboard
    print("Clicking '회의 시간 찾기'...")
    submit_btn = driver.find_element(By.ID, "btn-wiz-submit")
    driver.execute_script("arguments[0].click();", submit_btn)
    time.sleep(1.5)

    # 3. Verify details panel for Wednesday slot 4
    print("\n--- Verifying details panel for Wednesday slot 4 ---")
    wed_cell_4 = driver.find_element(By.CSS_SELECTOR, "#calendar-grid .calendar-cell[data-day='2'][data-slot='4']")
    driver.execute_script("arguments[0].click();", wed_cell_4)
    time.sleep(1)
    
    # Check detail panel content
    detail_content = driver.find_element(By.ID, "detail-panel-content")
    print("Detail panel display:", detail_content.value_of_css_property("display"))
    
    # Find member row for 김토스
    member_rows = detail_content.find_elements(By.CLASS_NAME, "detail-member-item")
    found_host_busy_desc = False
    for row in member_rows:
        text_content = row.get_attribute("textContent").strip()
        print(f"Row content: {repr(text_content)}")
        if "김토스" in text_content:
            status_span = row.find_element(By.CLASS_NAME, "detail-member-status")
            status_text = status_span.get_attribute("textContent").strip()
            print(f"Found 김토스 status badge text: {repr(status_text)}")
            if "불가" in status_text:
                found_host_busy_desc = True
                
    assert found_host_busy_desc, "Expected 김토스 to have status '불가'!"
    print("🟢 Successfully verified '불가' status is shown in the details panel for 김토스.")

    # 4. Toggle to My Schedule view inside coordination dashboard and verify
    print("\nToggling to My Schedule inside dashboard...")
    toggle_btn = driver.find_element(By.ID, "btn-toggle-my-schedule")
    driver.execute_script("arguments[0].click();", toggle_btn)
    time.sleep(1.5)
    
    print("\n--- Verifying personal schedule cells inside Coordination Dashboard (Wednesday 13-16) ---")
    cells = driver.find_elements(By.CSS_SELECTOR, "#calendar-grid .calendar-cell[data-day='2']")
    found_samsung_in_dashboard = False
    for cell in cells:
        slot_idx = int(cell.get_attribute("data-slot"))
        classes = cell.get_attribute("class")
        text = cell.get_attribute("textContent").strip()
        if slot_idx in [4, 5, 6]:
            print(f"Slot {slot_idx} classes: {classes}, text: {repr(text)}")
            if "삼성역 미팅 (외근)" in text:
                found_samsung_in_dashboard = True
                
    assert found_samsung_in_dashboard, "Expected '삼성역 미팅 (외근)' to be present in Wednesday 13-16 slots of calendar-grid!"
    print("🟢 Successfully verified '삼성역 미팅 (외근)' is on Wednesday 13-16 in calendar-grid.")
    
    driver.quit()
except Exception as e:
    print("Error:", e)
    if 'driver' in locals():
        driver.quit()
finally:
    server_process.terminate()
    server_process.wait()
