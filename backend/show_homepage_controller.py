from pathlib import Path
path = Path('controllers/homepageController.js')
lines = path.read_text(encoding='utf-8').splitlines()
for line in lines:
    print(line)

