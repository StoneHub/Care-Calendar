"""
Root entry point for the Care Calendar Flask app.

This bootstraps the existing application located under
'workforce-management-system' so you can run it from
the project root without moving files.
"""
from __future__ import annotations

import os
import sys


def _ensure_legacy_on_path() -> None:
    root = os.path.dirname(os.path.abspath(__file__))
    legacy_dir = os.path.join(root, "workforce-management-system")
    if legacy_dir not in sys.path:
        sys.path.insert(0, legacy_dir)


def main() -> None:
    _ensure_legacy_on_path()
    # Import the existing Flask app module once the path is set.
    import app as legacy_app  # type: ignore

    # Initialize DB and start the server
    if hasattr(legacy_app, "init_db"):
        legacy_app.init_db()  # type: ignore[attr-defined]
    legacy_app.app.run(debug=True)


if __name__ == "__main__":
    main()
