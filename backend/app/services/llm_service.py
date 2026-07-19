"""
Oxlo.ai LLM Service (OpenAI SDK Adapter).

Provides a singleton wrapper over OpenAI's AsyncOpenAI client pointed at Oxlo.ai base URL.
Supports token-by-token streaming completions for RAG engine.
"""

from typing import AsyncGenerator, List, Optional
from openai import AsyncOpenAI

from app.config import get_settings
from app.logging_config import logger

settings = get_settings()


class LLMService:
    """Singleton LLM client wrapper for Oxlo.ai (OpenAI-compatible)."""

    _instance: Optional["LLMService"] = None

    def __init__(self) -> None:
        self.api_key = settings.OXLO_API_KEY
        self.base_url = settings.LLM_BASE_URL
        self.model = settings.LLM_MODEL
        self.temperature = settings.LLM_TEMPERATURE
        self.max_tokens = settings.LLM_MAX_TOKENS

        # Initialize AsyncOpenAI client pointed at Oxlo.ai
        self.client = AsyncOpenAI(
            api_key=self.api_key,
            base_url=self.base_url,
        )

    @classmethod
    def get_instance(cls) -> "LLMService":
        """Get or create singleton LLMService instance."""
        if cls._instance is None:
            cls._instance = LLMService()
        return cls._instance

    async def stream_completion(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> AsyncGenerator[str, None]:
        """
        Stream LLM completion tokens using AsyncOpenAI client.

        Args:
            system_prompt: System instructions
            user_prompt: Context-augmented user prompt

        Yields:
            Individual text tokens as string chunks
        """
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        logger.info(
            f"Calling Oxlo.ai API [Model: {self.model} | Temp: {self.temperature}]",
            extra={"request_id": "llm_call"},
        )

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
            stream=True,
        )

        async for chunk in response:
            if chunk.choices and len(chunk.choices) > 0:
                delta = chunk.choices[0].delta
                if delta and delta.content:
                    yield delta.content
