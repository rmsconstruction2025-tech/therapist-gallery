@echo off
echo === Pushing changes to GitHub ===
cd /d C:\therapist
del .git\HEAD.lock 2>nul
del .git\index.lock 2>nul
git add gallery.html therapist.html index.html
git commit -m "feat: landing page v2 - doorstep copy, 4 services, AI avatars, therapist picker, address field"
git push
echo.
echo === Done! Press any key to close ===
pause
