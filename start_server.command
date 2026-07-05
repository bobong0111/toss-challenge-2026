#!/bin/bash
cd "$(dirname "$0")"
echo "==============================================="
echo "  Toss Calendar Challenge 2026 로컬 서버 실행"
echo "  포트: 8000 (http://localhost:8000/)"
echo "==============================================="
echo "서버를 작동하는 중입니다. 종료하려면 이 창을 닫거나 Ctrl + C를 누르세요."
echo ""
python3 -m http.server 8000
