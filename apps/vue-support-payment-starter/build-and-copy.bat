@echo off
REM 支付管理系统前端构建和复制脚本

echo 开始构建支付管理系统前端...

REM 构建前端
call pnpm build

if %errorlevel% neq 0 (
    echo 前端构建失败！
    exit /b 1
)

echo 前端构建成功！

REM 目标目录
set TARGET_DIR=..\..\..\..\utils-support-parent-starter\utils-support-cloud-parent\utils-support-cloud-starter\src\main\resources\payment-web

REM 创建目标目录
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

REM 复制文件
echo 正在复制文件到Spring Boot资源目录...
xcopy /E /I /Y dist\* "%TARGET_DIR%\"

if %errorlevel% neq 0 (
    echo 文件复制失败！
    exit /b 1
)

echo 文件复制成功！
echo 前端页面已打包到: %TARGET_DIR%
echo.
echo 现在可以启动Spring Boot应用，访问: http://localhost:8080/payment-admin

pause
