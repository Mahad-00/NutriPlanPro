Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "H:\Diet\backend"
WshShell.Run """.\venv\Scripts\python.exe"" run.py", 0, False
