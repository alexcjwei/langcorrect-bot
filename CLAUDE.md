# **1. Workflow Rules**

## **Planning (Required before coding)**

* **BP-1**: Read all relevant code, tests, and docs before planning
* **BP-2**: Present a step-by-step plan; await explicit approval
* **BP-3**: Plan must list tests that will be written *before* implementation

No code before approval.

---

# **2. Test-Driven Development**

* **TDD-1**: Write tests based on real input/output
* **TDD-2**: Red → Green → Refactor
* **TDD-3**: Confirm test fails before implementing
* **TDD-4**: Never skip/modify/delete tests to force passing
* **TDD-5**: Prefer running single tests during iteration

## **Effective Testing Guidelines (No Mock-Testing Anti-Pattern)**
* **TDD-6 (MUST NOT)**: Never write tests that only assert mocked return values or that a mock was called. If the test would pass with an empty implementation, delete it.

**Quick check:** If the test is “just testing the mock,” replace it with a real behavior test or an integration test.

---

# **3. Code Quality**

* **CQ-1**: DRY; centralize constants (especially design tokens) and utility functions
* **CQ-2**: Refactor continuously with tests green
* **CQ-3**: Run tests frequently
* **CQ-4**: Remove dead/backwards-compatibility code
* **CQ-5**: type-check is not used in this project (JavaScript)

---

# **Agent Summary (TL;DR)**

* Plan first → get approval → write tests → write code → refactor code
* Use strict TDD
