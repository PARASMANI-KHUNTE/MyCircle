# -*- coding: utf-8 -*-
"""Master runner — fixes encoding and calls all report-part generators sequentially."""
import subprocess, sys

scripts = [
    "generate_report.py",
    "generate_report_p2.py",
    "generate_report_p3.py",
    "generate_report_p4.py",
    "generate_report_p5.py",
    "generate_report_p6.py",
    "generate_report_p7.py",
    "generate_report_p8.py",
]

for s in scripts:
    result = subprocess.run([sys.executable, s], capture_output=True, text=True, encoding="utf-8")
    print(f"--- {s} ---")
    if result.stdout:
        print(result.stdout)
    if result.returncode != 0:
        print("STDERR:", result.stderr)
        print(f"FAILED at {s}. Stopping.")
        sys.exit(1)

print("All done.")
