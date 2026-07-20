"""
Oxlo.ai LLM Service (OpenAI SDK Adapter).

Provides a singleton wrapper over OpenAI's AsyncOpenAI client pointed at Oxlo.ai base URL.
Supports multi-key fallback rotation (automatic failover if an API key hits rate limits/quota)
and token-by-token streaming completions for RAG engine.
"""

from typing import AsyncGenerator, List, Optional
from openai import AsyncOpenAI

from app.config import get_settings
from app.logging_config import logger

settings = get_settings()


class LLMService:
    """Singleton LLM client wrapper for Oxlo.ai with multi-key failover rotation."""

    _instance: Optional["LLMService"] = None

    def __init__(self) -> None:
        self.api_keys: List[str] = settings.api_keys_list
        self.base_url: str = settings.LLM_BASE_URL
        self.model: str = settings.LLM_MODEL
        self.temperature: float = settings.LLM_TEMPERATURE
        self.max_tokens: int = settings.LLM_MAX_TOKENS

    @classmethod
    def get_instance(cls) -> "LLMService":
        """Get or create singleton LLMService instance."""
        if cls._instance is None:
            cls._instance = LLMService()
        return cls._instance

    def _get_client_for_key(self, api_key: str) -> AsyncOpenAI:
        """Create AsyncOpenAI client instance for a specific API key."""
        return AsyncOpenAI(
            api_key=api_key,
            base_url=self.base_url,
        )

    async def stream_completion(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> AsyncGenerator[str, None]:
        """
        Stream LLM completion tokens with automatic multi-key failover rotation.

        If the primary API key encounters a quota/rate-limit error, automatically
        rotates to the next available API key in OXLO_API_KEY.

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

        keys_to_try = self.api_keys if self.api_keys else [settings.OXLO_API_KEY]
        last_exception = None

        for idx, key in enumerate(keys_to_try):
            try:
                masked_key = f"{key[:8]}...{key[-4:]}" if len(key) > 12 else "KEY"
                logger.info(
                    f"Calling Oxlo.ai API [Key {idx+1}/{len(keys_to_try)}: {masked_key} | Model: {self.model}]",
                    extra={"request_id": "llm_call"},
                )

                client = self._get_client_for_key(key)
                response = await client.chat.completions.create(
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

                # Success - return after completing stream
                return

            except Exception as exc:
                last_exception = exc
                logger.warning(
                    f"LLM API Key {idx+1} failed/exhausted ({exc}). Rotating to next key if available...",
                    extra={"request_id": "llm_retry"},
                )

        # If all keys failed, re-raise last exception for RAG fallback handler
        if last_exception:
            raise last_exception
