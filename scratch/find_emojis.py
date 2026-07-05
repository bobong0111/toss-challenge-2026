# Simple script to find emojis by checking character code points
import re

def is_emoji(char):
    cp = ord(char)
    # Check common emoji ranges
    # Miscellaneous Symbols, Dingbats, Emoticons, Transport/Map, etc.
    if 0x1F000 <= cp <= 0x1FADF:
        return True
    if 0x2600 <= cp <= 0x27BF:
        return True
    if 0x2B50 <= cp <= 0x2B55:
        return True
    return False

def find_context(content):
    lines = content.split("\n")
    results = []
    for idx, line in enumerate(lines):
        emojis = [c for c in line if is_emoji(c)]
        if emojis:
            results.append((idx + 1, list(set(emojis)), line.strip()))
    return results

with open("/Users/simbo-eun/Desktop/toss-challenge-2026/index.html", "r", encoding="utf-8") as f:
    html_content = f.read()

with open("/Users/simbo-eun/Desktop/toss-challenge-2026/app.js", "r", encoding="utf-8") as f:
    js_content = f.read()

print("=== Emojis in index.html ===")
for line_num, emojis, line in find_context(html_content):
    print(f"L{line_num}: {emojis} -> {line}")

print("\n=== Emojis in app.js ===")
for line_num, emojis, line in find_context(js_content):
    print(f"L{line_num}: {emojis} -> {line}")
