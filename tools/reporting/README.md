# Report generation tooling

Python scripts that produce the MyCircle project reports (DOCX) and supporting exports.

## Requirements

- Python 3.10+
- [`python-docx`](https://pypi.org/project/python-docx/) (`pip install -r requirements.txt`)
- Node.js 20+ (only for `myreport.py` PDF/markdown helpers)

## Usage

```bash
cd tools/reporting
pip install -r requirements.txt
python run_report.py
```

`run_report.py` runs the generator parts sequentially and writes `MyCircle_Report_TEMP.docx` in this directory. Generated artifacts are ignored by git; copy the final export to [`docs/reports`](../../docs/reports).
