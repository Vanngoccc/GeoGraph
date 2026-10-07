@echo off
chcp 65001 > nul
title GeoGraph - Nền tảng Đồ thị Tri thức Hình học Phẳng

echo ====================================================================
echo      CHƯƠNG TRÌNH KHỞI ĐỘNG ỨNG DỤNG HÌNH HỌC PHẲNG GEOGRAPH
echo ====================================================================
echo.
echo [1/2] Đang kiểm tra môi trường chạy...
cd /d "%~dp0"

echo [2/2] Đang mở trình duyệt và khởi động máy chủ...
start http://localhost:5050

echo.
echo Ứng dụng đang hoạt động tại địa chỉ: http://localhost:5050
echo Nhấn Ctrl + C để dừng máy chủ khi hoàn thành buổi học.
echo ====================================================================
echo.

node backend/server.js
pause
