from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
module=(ROOT/"src/modules/o73.js").read_text()
generated=(ROOT/"game.js").read_text()

checks=[]
def check(name, ok, detail=""):
    checks.append((name, bool(ok), detail))
    print(("PASS" if ok else "FAIL")+": "+name+(f" — {detail}" if detail and not ok else ""))

check("H3.0: romance opt-out copy points to People",
      "You can turn this back on any time in People." in module)
check("H3.0: stale removed destination is absent from current feature module",
      "Family & Relationships" not in module)
check("H3.0: stale removed destination is absent from generated runtime",
      "Family & Relationships" not in generated)

failed=[x for x in checks if not x[1]]
print(f"H3.0 focused: {len(checks)-len(failed)}/{len(checks)} passed")
raise SystemExit(1 if failed else 0)
