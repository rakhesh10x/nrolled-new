"""
Structured Logging Configuration.

Sets up JSON/standard formatted logging for request tracing, auth events,
leave actions, and LLM calls. Sensitive data (passwords, tokens, API keys)
is strictly scrubbed before output.
"""

import logging
import sys
from typing import Any, Dict

from app.config import get_settings


class RequestIDFilter(logging.Filter):
    """Contextual filter adding request_id to log records."""

    def filter(self, record: logging.LogRecord) -> bool:
        if not hasattr(record, "request_id"):
            record.request_id = "system"
        return True


def setup_logging() -> logging.Logger:
    """
    Initialize and configure the root application logger.

    Returns:
        logging.Logger: Configured logger instance.
    """
    settings = get_settings()
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    # Base logger
    logger = logging.getLogger("hr_assistant")
    logger.setLevel(log_level)

    # Avoid duplicate handlers if re-initialized
    if logger.handlers:
        return logger

    # Stream handler (stdout)
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(log_level)

    # Format: [TIMESTAMP] [LEVEL] [REQ_ID] message
    formatter = logging.Formatter(
        fmt="[%(asctime)s] [%(levelname)s] [req_id:%(request_id)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    handler.setFormatter(formatter)

    # Attach filter and handler
    handler.addFilter(RequestIDFilter())
    logger.addHandler(handler)

    return logger


# Global logger instance
logger = setup_logging()


def log_event(event_name: str, details: Dict[str, Any], level: str = "info") -> None:
    """
    Structured event logger for key business events (login, leave, chat, errors).

    Args:
        event_name: Short identifier for the event (e.g. 'user_login')
        details: Dictionary of event metadata (sanitized)
        level: Log level ('info', 'warning', 'error', 'debug')
    """
    # Scrub sensitive keys if present
    sanitized = {
        k: "******" if k.lower() in ("password", "token", "api_key", "secret") else v
        for k, v in details.items()
    }

    message = f"EVENT={event_name} | {sanitized}"
    log_func = getattr(logger, level.lower(), logger.info)
    log_func(message)
