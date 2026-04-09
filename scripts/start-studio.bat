@echo off
cd /d "C:\Users\Anil darga\OneDrive\Desktop\vidplat\eduplat"
set DATABASE_URL=mongodb+srv://anildarga3777:AcCert20034567890@cluster0.j07cx.mongodb.net/eduplat?retryWrites=true&w=majority&appName=Cluster0
npx prisma studio --port 5555
pause
