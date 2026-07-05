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

port = 8012
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
    
    # 1. Login Toast Verification
    print("Logging in...")
    username_input = driver.find_element(By.ID, "login-username")
    username_input.send_keys("toss")
    form = driver.find_element(By.ID, "login-form")
    form.submit()
    time.sleep(1)
    
    toast = driver.find_element(By.ID, "toast")
    toast_text = toast.get_attribute("textContent").strip()
    print("Login Toast text:", repr(toast_text))
    assert "김토스님, 환영합니다." in toast_text, f"Expected '김토스님, 환영합니다.', got {repr(toast_text)}"
    print("🟢 Login toast successfully verified.")
    time.sleep(3)

    # 2. Template addition error toast (no meeting name)
    print("Clicking '+ 추가' button without name...")
    add_template_btn = driver.find_element(By.ID, "btn-add-template")
    driver.execute_script("arguments[0].click();", add_template_btn)
    time.sleep(1)
    
    toast_text = toast.get_attribute("textContent").strip()
    print("Empty Template Toast text:", repr(toast_text))
    assert "회의 이름을 입력해 주세요." in toast_text, f"Expected '회의 이름을 입력해 주세요.', got {repr(toast_text)}"
    print("🟢 Empty template name warning toast successfully verified.")
    time.sleep(3)

    # 3. Transition to Coordination Dashboard
    print("Clicking '회의 시간 찾기'...")
    submit_btn = driver.find_element(By.ID, "btn-wiz-submit")
    driver.execute_script("arguments[0].click();", submit_btn)
    time.sleep(1)
    
    toast_text = toast.get_attribute("textContent").strip()
    print("Dashboard transition toast text:", repr(toast_text))
    assert "추천 시간을 찾았습니다." in toast_text, f"Expected '추천 시간을 찾았습니다.', got {repr(toast_text)}"
    print("🟢 Dashboard transition toast successfully verified.")
    time.sleep(3)

    # 4. Back to setup page
    print("Clicking '수정' to go back to wizard...")
    back_btn = driver.find_element(By.ID, "btn-back-to-setup")
    driver.execute_script("arguments[0].click();", back_btn)
    time.sleep(1)
    
    toast_text = toast.get_attribute("textContent").strip()
    print("Back to wizard toast text:", repr(toast_text))
    assert "일정 수정 화면으로 돌아왔습니다." in toast_text, f"Expected '일정 수정 화면으로 돌아왔습니다.', got {repr(toast_text)}"
    print("🟢 Back to wizard page transition toast successfully verified.")
    time.sleep(1)

    driver.quit()
except Exception as e:
    print("Error:", e)
    if 'driver' in locals():
        driver.quit()
finally:
    server_process.terminate()
    server_process.wait()
