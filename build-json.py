import json
import os
import sqlite3


db = sqlite3.connect(os.environ.get("DB", "epkg.sqlite3"))
db.row_factory = sqlite3.Row


def main():
    os.makedirs("public", exist_ok=True)
    package_names = build_package_names()
    build_packages()
    with open("public/.package-names.json", "w") as f:
        json.dump(package_names, f)


def build_package_names():
    return [unquote_simple(row["name"]) for row in all_rows("select name from packages")]


def build_packages():
    rows = all_rows("SELECT * FROM packages")
    for row in rows:
        pkg = dict(row)
        for col, val in list(pkg.items()):
            if val == "eieio-unbound":
                if col.endswith("_recipes"):
                    del pkg[col]
                else:
                    pkg[col] = all_rows(f"SELECT * FROM {col} WHERE package = ?", [pkg["name"]], "package")

        pkg["required_by"] = all_rows(
            "select * from required where feature = ?",
            [unquote_simple(pkg["name"])],
            "feature",
        )

        unquote_obj(pkg)
        with open(f"public/{pkg['name']}.json", "w") as f:
            json.dump(pkg, f, indent=2)
            f.write("\n")

    print(f"Total {len(rows)} packages")


def all_rows(query, params=(), delete=None):
    rows = [dict(row) for row in db.execute(query, params)]
    if delete:
        for row in rows:
            del row[delete]
    return rows


def unquote_simple(s):
    return s[1:-1]


def unquote_emacs_lisp_string(s):
    chars = []
    i = 1
    end = len(s) - 1

    while i < end:
        ch = s[i]
        if ch != "\\":
            chars.append(ch)
            i += 1
            continue

        i += 1
        if i >= end:
            chars.append("\\")
            break

        escaped = s[i]
        if escaped == "n":
            chars.append("\n")
        elif escaped == "t":
            chars.append("\t")
        elif escaped == "r":
            chars.append("\r")
        elif escaped == "b":
            chars.append("\b")
        elif escaped == "f":
            chars.append("\f")
        elif escaped in ('"', "\\"):
            chars.append(escaped)
        elif escaped in "01234567":
            octal = escaped
            while i + 1 < end and len(octal) < 3 and s[i + 1] in "01234567":
                i += 1
                octal += s[i]
            chars.append(chr(int(octal, 8)))
        else:
            chars.append(escaped)
        i += 1

    return "".join(chars)


def unquote_obj(obj):
    for key, val in list(obj.items()):
        if isinstance(val, str):
            if val.startswith('"') and val.endswith('"'):
                obj[key] = unquote_emacs_lisp_string(val)
        elif isinstance(val, list):
            for item in val:
                unquote_obj(item)


try:
    main()
finally:
    db.close()
