#!/usr/bin/env python3
"""Update the public NOVA landing page only after a GitHub Actions run is verified.

Download links are changed only after the successful installer is available in
a dedicated GitHub prerelease. Failed builds update status, not the download.
"""
import argparse
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
README = ROOT / "README.md"

def replace_section(text: str, section: str, content: str) -> str:
    start = f"<!-- NOVA_{section}_START -->"
    end = f"<!-- NOVA_{section}_END -->"
    if text.count(start) != 1 or text.count(end) != 1:
        raise ValueError(f"Missing or duplicate landing page markers: {section}")
    pattern = re.compile(re.escape(start) + r".*?" + re.escape(end), re.DOTALL)
    return pattern.sub(lambda _: f"{start}\n{content.rstrip()}\n{end}", text, count=1)

def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--repo", required=True)
    p.add_argument("--run-id", required=True)
    p.add_argument("--run-number", required=True)
    p.add_argument("--sha", required=True)
    p.add_argument("--date", required=True)
    p.add_argument("--status", required=True, choices=["success", "failure", "cancelled", "timed_out"])
    args = p.parse_args()
    if args.repo != "Thatboer/NovaLauncher":
        raise ValueError("Refusing to update a different repository")
    if not re.fullmatch(r"[0-9]{1,16}", args.run_id):
        raise ValueError("Invalid run ID")
    if not re.fullmatch(r"[0-9]{1,10}", args.run_number):
        raise ValueError("Invalid run number")
    if not re.fullmatch(r"[0-9a-fA-F]{40}", args.sha):
        raise ValueError("Invalid commit SHA")
    if not re.fullmatch(r"[0-9]{4}-[0-9]{2}-[0-9]{2}", args.date):
        raise ValueError("Invalid build date")
    url = f"https://github.com/{args.repo}"
    run_url = f"{url}/actions/runs/{args.run_id}"
    text = README.read_text(encoding="utf-8")
    if args.status == "success":
        tag = f"nova-design5-run-{args.run_id}"
        asset = f"{url}/releases/download/{tag}/NOVA-Launcher-Windows-Setup.exe"
        download = f"""<div align="center">

<a href="{asset}"><img src="assets/landing/download-windows.svg" alt="Download latest NOVA Launcher Windows installer" width="350" /></a>

**[Direct .exe download]({asset})** · [Release notes]({url}/releases/tag/{tag}) · [All releases]({url}/releases)

**Newest successful build:** #{args.run_number} · {args.date} (UTC) · `{args.sha[:9]}`

</div>"""
        text = replace_section(text, "DOWNLOAD", download)
        status = f"✅ **Build #{args.run_number} passed** on {args.date} (UTC). [View build details]({run_url}). The download above is the newest verified uploaded installer."
    else:
        label = args.status.replace("_", " ")
        status = f"⚠️ **Build #{args.run_number} {label}** on {args.date} (UTC). [View build details]({run_url}). The button above still points to the last successfully published installer."
    text = replace_section(text, "STATUS", status)
    old = README.read_text(encoding="utf-8")
    if text != old:
        README.write_text(text, encoding="utf-8")
        print(f"Updated landing for run {args.run_id}: {args.status}")
    else:
        print(f"Landing already current for run {args.run_id}")

if __name__ == "__main__":
    main()
