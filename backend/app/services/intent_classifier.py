"""
Query Intent Classifier.

Classifies incoming user questions into actionable intent categories
to determine whether to fetch DB data (leave balance, profile) or retrieve policy knowledge.
"""

from enum import Enum
import re
from typing import Tuple


class IntentCategory(str, Enum):
    """Supported intent categories."""

    LEAVE_BALANCE = "leave_balance"
    LEAVE_HISTORY = "leave_history"
    LEAVE_APPLY = "leave_apply"
    EMPLOYEE_INFO = "employee_info"
    ATTENDANCE = "attendance"
    PAYROLL = "payroll"
    ADMIN_QUERY = "admin_query"
    HR_POLICY = "hr_policy"
    GREETING = "greeting"
    GENERAL = "general"
    UNKNOWN = "unknown"


class IntentClassifier:
    """Classifies user queries using pattern matching and keyword heuristics."""

    @staticmethod
    def classify(query: str, user_role: str = "employee") -> Tuple[IntentCategory, float]:
        """
        Classify user message into an IntentCategory.

        Args:
            query: User's chat message text
            user_role: Role of user ('employee' or 'admin')

        Returns:
            Tuple of (IntentCategory, confidence_score)
        """
        if not query or not query.strip():
            return IntentCategory.UNKNOWN, 0.0

        q = query.lower().strip()

        # 1. Greetings & Pleasantries
        greetings = [r"\bhi\b", r"\bhello\b", r"\bhey\b", r"\bgood morning\b", r"\bgood afternoon\b", r"\bthanks\b", r"\bthank you\b"]
        if any(re.search(pat, q) for pat in greetings):
            return IntentCategory.GREETING, 0.95

        # 2. Leave Balance Queries ("how many leaves do I have left", "my leave balance", "casual leaves remaining")
        balance_patterns = [
            r"how many (leave|leaves|days)",
            r"leave balance",
            r"(casual|sick|earned) (leave|leaves) (left|remaining)",
            r"remaining leave",
            r"how many (cl|sl|el) ",
            r"my leaves",
        ]
        if any(re.search(pat, q) for pat in balance_patterns):
            return IntentCategory.LEAVE_BALANCE, 0.90

        # 3. Leave History Queries ("show my leave history", "past leaves", "status of my leave")
        history_patterns = [
            r"leave history",
            r"past leave",
            r"leave status",
            r"my leave request",
            r"show my (leave|leaves)",
        ]
        if any(re.search(pat, q) for pat in history_patterns):
            return IntentCategory.LEAVE_HISTORY, 0.90

        # 4. Leave Application Action ("apply for leave", "i want leave", "take casual leave")
        apply_patterns = [
            r"apply (for|a) leave",
            r"i want (to take|a) leave",
            r"request leave",
            r"need leave",
        ]
        if any(re.search(pat, q) for pat in apply_patterns):
            return IntentCategory.LEAVE_APPLY, 0.85

        # 5. Employee Info / Profile ("who is my manager", "my department", "my salary", "my designation")
        profile_patterns = [
            r"who is my manager",
            r"my manager",
            r"my salary",
            r"my department",
            r"my profile",
            r"my designation",
            r"when did i join",
        ]
        if any(re.search(pat, q) for pat in profile_patterns):
            return IntentCategory.EMPLOYEE_INFO, 0.90

        # 6. Attendance & Hours ("my attendance", "working hours", "check in time", "office timing")
        attendance_patterns = [
            r"my attendance",
            r"attendance percentage",
            r"working hours",
            r"office timing",
            r"grace period",
            r"check in",
        ]
        if any(re.search(pat, q) for pat in attendance_patterns):
            return IntentCategory.ATTENDANCE, 0.85

        # 7. Payroll & Salary ("when is salary credited", "payslip", "tax deduction", "tds")
        payroll_patterns = [
            r"salary credit",
            r"when is salary",
            r"payslip",
            r"payday",
            r"tax deduction",
            r"tds",
        ]
        if any(re.search(pat, q) for pat in payroll_patterns):
            return IntentCategory.PAYROLL, 0.85

        # 8. Admin Specific Queries (if user is admin)
        if user_role == "admin":
            admin_patterns = [
                r"pending (leave|requests)",
                r"employees on leave",
                r"low attendance",
                r"approved leaves",
                r"department (report|counts)",
                r"how many employees",
            ]
            if any(re.search(pat, q) for pat in admin_patterns):
                return IntentCategory.ADMIN_QUERY, 0.90

        # 9. General Policy Queries (fallback to knowledge base)
        policy_keywords = ["policy", "rule", "allow", "entitle", "notice period", "wfh", "holiday", "probation", "overtime", "maternity", "paternity", "travel", "posh", "resignation"]
        if any(kw in q for kw in policy_keywords):
            return IntentCategory.HR_POLICY, 0.80

        # Default to HR Policy / General search
        return IntentCategory.HR_POLICY, 0.60
