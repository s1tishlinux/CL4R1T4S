#!/usr/bin/env python3
"""
🧪 Unified Test Runner for Omni Agent Studio & CL4R1T4S Project
Executes all unit, integration, RAG, memory, web search, API, and continuation test suites.
"""

import os
import sys
import time
import unittest
from pathlib import Path

# Add project root and server directory to path
TESTS_DIR = Path(__file__).parent.resolve()
PROJECT_ROOT = TESTS_DIR.parent
SERVER_DIR = PROJECT_ROOT / "agent-studio" / "server"

sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(SERVER_DIR))
sys.path.insert(0, str(TESTS_DIR))


def run_test_suite():
    print("=" * 80)
    print("🧪 OMNI AGENT STUDIO — AUTOMATED TEST SUITE")
    print("=" * 80)
    print(f"📁 Project Root : {PROJECT_ROOT}")
    print(f"📁 Server Dir   : {SERVER_DIR}")
    print(f"📁 Tests Dir    : {TESTS_DIR}")
    print("-" * 80)

    loader = unittest.TestLoader()
    suite = loader.discover(start_dir=str(TESTS_DIR), pattern="test_*.py")

    start_time = time.time()
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    elapsed = time.time() - start_time

    print("\n" + "=" * 80)
    print("📊 TEST EXECUTION SUMMARY")
    print("=" * 80)
    print(f"Total Tests Run   : {result.testsRun}")
    print(f"Passed            : {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Failures          : {len(result.failures)}")
    print(f"Errors            : {len(result.errors)}")
    print(f"Execution Time    : {elapsed:.2f} seconds")
    print("=" * 80)

    if result.wasSuccessful():
        print("🎉 ALL TESTS PASSED SUCCESSFULLY!")
        return 0
    else:
        print("❌ SOME TESTS FAILED.")
        return 1


if __name__ == "__main__":
    sys.exit(run_test_suite())
