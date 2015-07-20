@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\mok.js" %*
) ELSE (
  node "%~dp0\mok.js" %*
)
pause
