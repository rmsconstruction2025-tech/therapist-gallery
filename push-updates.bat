@echo off
echo === Pushing changes to GitHub ===
cd /d C:\therapist
del .git\HEAD.lock 2>nul
del .git\index.lock 2>nul
git add -A
git commit -m "feat: GPS location gate - verify Chennai 50km before WA, skeleton CLS fix, security headers"
git push
echo.
echo === Done! Press any key to close ===
pause
