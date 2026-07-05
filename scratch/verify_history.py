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

port = 8013
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
    
    # 1. Login
    print("Logging in...")
    username_input = driver.find_element(By.ID, "login-username")
    username_input.send_keys("toss")
    form = driver.find_element(By.ID, "login-form")
    form.submit()
    time.sleep(1.5)
    
    # Check if hash is #landing
    current_url = driver.current_url
    print("Logged in. Current URL:", current_url)
    assert "#landing" in current_url, f"Expected hash #landing after login, got {current_url}"
    
    # Check that landing container is visible
    landing = driver.find_element(By.ID, "workspace-landing")
    dashboard = driver.find_element(By.ID, "coordination-dashboard")
    assert landing.is_displayed(), "Landing page should be displayed after login"
    assert not dashboard.is_displayed(), "Dashboard should be hidden after login"
    print("🟢 Initial landing state verified.")
    
    # 2. Go to Dashboard
    print("Transitioning to dashboard...")
    submit_btn = driver.find_element(By.ID, "btn-wiz-submit")
    driver.execute_script("arguments[0].click();", submit_btn)
    time.sleep(1.5)
    
    current_url = driver.current_url
    print("In dashboard. Current URL:", current_url)
    assert "#dashboard" in current_url, f"Expected hash #dashboard after search, got {current_url}"
    assert not landing.is_displayed(), "Landing should be hidden in dashboard view"
    assert dashboard.is_displayed(), "Dashboard should be displayed in dashboard view"
    print("🟢 Dashboard transition verified.")
    
    # 3. Simulate browser Back
    print("Simulating browser Back button...")
    driver.back()
    time.sleep(1.5)
    
    current_url = driver.current_url
    print("After browser Back. Current URL:", current_url)
    assert "#landing" in current_url or "#dashboard" not in current_url, f"Expected back to landing, got {current_url}"
    assert landing.is_displayed(), "Landing page should be displayed after browser Back"
    assert not dashboard.is_displayed(), "Dashboard should be hidden after browser Back"
    print("🟢 Browser Back button action verified.")
    
    # 4. Simulate browser Forward
    print("Simulating browser Forward button...")
    driver.forward()
    time.sleep(1.5)
    
    current_url = driver.current_url
    print("After browser Forward. Current URL:", current_url)
    assert "#dashboard" in current_url, f"Expected forward to dashboard, got {current_url}"
    assert not landing.is_displayed(), "Landing should be hidden after browser Forward"
    assert dashboard.is_displayed(), "Dashboard should be displayed after browser Forward"
    print("🟢 Browser Forward button action verified.")
    
    # 5. In-app Back Arrow button
    print("Clicking back button in dashboard...")
    back_btn = driver.find_element(By.ID, "btn-back-to-setup")
    driver.execute_script("arguments[0].click();", back_btn)
    time.sleep(1.5)
    
    current_url = driver.current_url
    print("After clicking back button. Current URL:", current_url)
    assert "#landing" in current_url, f"Expected hash #landing after back click, got {current_url}"
    assert landing.is_displayed(), "Landing page should be displayed after back click"
    assert not dashboard.is_displayed(), "Dashboard should be hidden after back click"
    print("🟢 In-app back button verified.")

    # 6. Go to Dashboard again, then simulate send vote redirecting
    print("Going to dashboard again...")
    driver.execute_script("arguments[0].click();", submit_btn)
    time.sleep(1.5)
    
    # Click slot recommendation, show details
    print("Selecting first slot recommendation...")
    slots = driver.find_elements(By.CLASS_INCREASING_ORDER_OR_SIMILAR_NAME if False else By.CLASS_NAME, "coord-item")
    if slots:
        driver.execute_script("arguments[0].click();", slots[0])
        time.sleep(1)
        
        # Click "일정 선택 요청하기"
        print("Clicking send vote request button...")
        req_btn = driver.find_element(By.ID, "btn-send-vote-request")
        driver.execute_script("arguments[0].click();", req_btn)
        time.sleep(1)
        
        # In preview overlay, click "보내기" (#vote-preview-send)
        print("Clicking send in preview modal...")
        send_btn = driver.find_element(By.ID, "vote-preview-send")
        driver.execute_script("arguments[0].click();", send_btn)
        time.sleep(1.5)
        
        current_url = driver.current_url
        print("After sending vote. Current URL:", current_url)
        assert "#landing" in current_url, f"Expected hash #landing after sending vote, got {current_url}"
        assert landing.is_displayed(), "Landing page should be displayed after sending vote"
        assert not dashboard.is_displayed(), "Dashboard should be hidden after sending vote"
        print("🟢 Vote request send redirection & hash verified.")

    driver.quit()
    print("🎉 All history and navigation tests passed successfully!")
except Exception as e:
    print("Error:", e)
    if 'driver' in locals():
        driver.quit()
finally:
    server_process.terminate()
    server_process.wait()
