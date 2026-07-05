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
    
    print("Clearing localStorage and refreshing...")
    driver.execute_script("localStorage.clear();")
    print(f"localStorage after clear: {driver.execute_script('return JSON.stringify(localStorage);')}")
    driver.refresh()
    time.sleep(3)
    
    print(f"localStorage after refresh: {driver.execute_script('return JSON.stringify(localStorage);')}")
    
    login_page = driver.find_element(By.ID, "login-page")
    workspace_landing = driver.find_element(By.ID, "workspace-landing")
    username_input = driver.find_element(By.ID, "login-username")
    
    print(f"login-page visible: {login_page.is_displayed()}")
    print(f"login-page style display: {login_page.value_of_css_property('display')}")
    print(f"workspace-landing visible: {workspace_landing.is_displayed()}")
    print(f"username_input visible: {username_input.is_displayed()}")
    print(f"username_input style display: {username_input.value_of_css_property('display')}")
    
    driver.save_screenshot("/Users/simbo-eun/Desktop/toss-challenge-2026/scratch/refresh_debug.png")
    print("Screenshot saved.")
    
    driver.quit()
except Exception as e:
    print("Error:", e)
    if 'driver' in locals():
        driver.quit()
