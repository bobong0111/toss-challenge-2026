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

port = 8001
server_process = subprocess.Popen(
    ["python3", "-m", "http.server", str(port)],
    cwd="/Users/simbo-eun/Desktop/toss-challenge-2026",
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE
)
time.sleep(1.5)

try:
    print(f"Initializing Chrome driver on port {port}...")
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    print(f"Navigating to http://localhost:{port}/ ...")
    driver.get(f'http://localhost:{port}/')
    time.sleep(2)
    
    # Login
    print("Logging in...")
    username_input = driver.find_element(By.ID, "login-username")
    username_input.send_keys("toss")
    form = driver.find_element(By.ID, "login-form")
    form.submit()
    time.sleep(2.5)
    
    # Inspect my-workspace-calendar-grid cells
    grid = driver.find_element(By.ID, "my-workspace-calendar-grid")
    cells = grid.find_elements(By.CLASS_NAME, "calendar-cell")
    print(f"Total calendar-cells: {len(cells)}")
    
    for idx, cell in enumerate(cells):
        day = cell.get_attribute("data-day")
        slot = cell.get_attribute("data-slot")
        grid_col = cell.value_of_css_property("grid-column")
        grid_row = cell.value_of_css_property("grid-row")
        class_name = cell.get_attribute("class")
        text = cell.text.replace("\n", " ").strip()
        print(f"Cell {idx}: day={day}, slot={slot}, gridColumn='{grid_col}', gridRow='{grid_row}', class='{class_name}', text='{text}'")
        
    driver.quit()
except Exception as e:
    print("Error:", e)
    if 'driver' in locals():
        driver.quit()
finally:
    print("Stopping web server...")
    server_process.terminate()
    server_process.wait()
