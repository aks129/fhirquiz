#!/usr/bin/env python3
"""
Test runner script for the FHIR Healthcare Bootcamp test suite
"""

import subprocess
import sys
import os
from pathlib import Path

def run_backend_tests():
    """Run backend pytest tests"""
    print("🧪 Running Backend Tests...")
    print("=" * 50)
    
    pytest_cmd = [
        'python', '-m', 'pytest',
        'tests/backend/',
        '-v',
        '--tb=short',
        '--color=yes',
        '--strict-markers'
    ]
    
    try:
        result = subprocess.run(pytest_cmd, check=True)
        print("✅ Backend tests passed!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Backend tests failed with exit code {e.returncode}")
        return False

def run_frontend_tests():
    """Run frontend Playwright tests"""
    print("\n🎭 Running Frontend Tests...")
    print("=" * 50)
    
    playwright_cmd = [
        'npx', 'playwright', 'test',
        'tests/e2e/',
        '--reporter=html'
    ]
    
    try:
        result = subprocess.run(playwright_cmd, check=True)
        print("✅ Frontend tests passed!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Frontend tests failed with exit code {e.returncode}")
        return False

def run_specific_test_suite(suite_name):
    """Run a specific test suite"""
    if suite_name == 'auth':
        cmd = ['python', '-m', 'pytest', 'tests/backend/auth_guards.py', '-v']
    elif suite_name == 'payments':
        cmd = ['python', '-m', 'pytest', 'tests/backend/purchases_state_machine.py', '-v']
    elif suite_name == 'certificates':
        cmd = ['python', '-m', 'pytest', 'tests/backend/certificates.py', '-v']
    elif suite_name == 'points':
        cmd = ['python', '-m', 'pytest', 'tests/backend/points_system.py', '-v']
    elif suite_name == 'rls':
        cmd = ['python', '-m', 'pytest', 'tests/backend/rls_smoke_tests.py', '-v']
    elif suite_name == 'frontend-auth':
        cmd = ['npx', 'playwright', 'test', 'tests/e2e/auth-flows.spec.ts']
    elif suite_name == 'course-gating':
        cmd = ['npx', 'playwright', 'test', 'tests/e2e/course-gating.spec.ts']
    elif suite_name == 'admin':
        cmd = ['npx', 'playwright', 'test', 'tests/e2e/admin-console.spec.ts']
    elif suite_name == 'certificates-ui':
        cmd = ['npx', 'playwright', 'test', 'tests/e2e/certificates-badges.spec.ts']
    else:
        print(f"❌ Unknown test suite: {suite_name}")
        return False
    
    try:
        result = subprocess.run(cmd, check=True)
        print(f"✅ {suite_name} tests passed!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {suite_name} tests failed with exit code {e.returncode}")
        return False

def main():
    """Main test runner"""
    print("🚀 FHIR Healthcare Bootcamp Test Suite")
    print("=" * 50)
    
    if len(sys.argv) > 1:
        # Run specific test suite
        suite_name = sys.argv[1]
        success = run_specific_test_suite(suite_name)
        sys.exit(0 if success else 1)
    
    # Run all tests
    backend_success = run_backend_tests()
    frontend_success = run_frontend_tests()
    
    print("\n📊 Test Summary")
    print("=" * 50)
    print(f"Backend Tests: {'✅ PASSED' if backend_success else '❌ FAILED'}")
    print(f"Frontend Tests: {'✅ PASSED' if frontend_success else '❌ FAILED'}")
    
    overall_success = backend_success and frontend_success
    print(f"\nOverall Result: {'✅ ALL TESTS PASSED' if overall_success else '❌ SOME TESTS FAILED'}")
    
    sys.exit(0 if overall_success else 1)

if __name__ == '__main__':
    main()