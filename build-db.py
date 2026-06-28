import os
import sqlite3
import urllib.request


db_file = os.environ.get("DB", "epkg.sqlite3")
sql_url = "https://raw.githubusercontent.com/emacsmirror/epkgs/master/epkg.sql"

try:
    os.remove(db_file)
except FileNotFoundError:
    pass

with urllib.request.urlopen(sql_url) as response:
    sql = response.read().decode()

db = sqlite3.connect(db_file)
try:
    db.executescript(sql)
    db.commit()
finally:
    db.close()
