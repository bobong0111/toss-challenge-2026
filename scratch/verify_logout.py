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

port = 8014
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
    
    # 2. Open My Page drawer
    print("Opening My Page...")
    btn_open_mypage = driver.find_element(By.ID, "btn-open-mypage-link")
    driver.execute_script("arguments[0].click();", btn_open_mypage)
    time.sleep(1)
    
    mypage_drawer = driver.find_element(By.ID, "mypage-drawer")
    mypage_overlay = driver.find_element(By.ID, "mypage-overlay")
    
    # Check that mypage drawer is open and overlay is displayed
    drawer_right = mypage_drawer.value_of_css_property("right")
    overlay_display = mypage_overlay.value_of_css_property("display")
    print(f"Before logout - Drawer 'right': {drawer_right}, Overlay 'display': {overlay_display}")
    assert drawer_right == "0px", f"Expected drawer 'right' to be '0px', got {drawer_right}"
    assert overlay_display == "block", f"Expected overlay 'display' to be 'block', got {overlay_display}"
    print("🟢 My Page drawer is opened and overlay is displayed successfully.")
    
    # 3. Click Logout inside My Page
    print("Clicking Logout in My Page drawer...")
    # Find the Logout button inside the account management menu list
    # The button has text content containing "로그아웃"
    logout_buttons = driver.find_elements(By.TAG_NAME, "button")
    logout_btn_mypage = None
    for btn in logout_buttons:
        if "로그아웃" in btn.text:
            logout_btn_mypage = btn
            break
            
    assert logout_btn_mypage is not None, "Could not find logout button in My Page drawer"
    driver.execute_script("arguments[0].click();", logout_btn_mypage)
    time.sleep(1)
    
    # Check states after logout
    login_page = driver.find_element(By.ID, "login-page")
    workspace_landing = driver.find_element(By.ID, "workspace-landing")
    
    print(f"After logout - Login page visible: {login_page.is_displayed()}")
    print(f"After logout - Workspace landing visible: {workspace_landing.is_displayed()}")
    
    drawer_right_after = mypage_drawer.value_of_css_property("right")
    overlay_display_after = mypage_overlay.value_of_css_property("display")
    print(f"After logout - Drawer 'right': {drawer_right_after}, Overlay 'display': {overlay_display_after}")
    
    assert login_page.is_displayed(), "Login page should be displayed after logout"
    assert not workspace_landing.is_displayed(), "Workspace landing should be hidden after logout"
    assert drawer_right_after == "-400px", f"Expected drawer 'right' to be '-400px', got {drawer_right_after}"
    assert overlay_display_after == "none", f"Expected overlay 'display' to be 'none', got {overlay_display_after}"
    
    print("🟢 My Page drawer closed and overlay hidden immediately on logout.")
    driver.quit()
    print("🎉 Logout verification passed successfully!")
except Exception as e:
    print("Error:", e)
    if 'driver' in locals():
        driver.quit()
finally:
    server_process.terminate()
    server_process.wait()
