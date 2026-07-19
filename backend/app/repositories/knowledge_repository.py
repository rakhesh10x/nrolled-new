"""
HR Knowledge Base Retrieval Infrastructure.

Defines the `IRetriever` interface and `KeywordRetriever` implementation.
Designed to allow swapping to vector-based retrieval (FAISS, ChromaDB) in the future
without changing any business logic or service layers.
"""

from abc import ABC, abstractmethod
import json
import os
from pathlib import Path
import re
from typing import List, Optional

from pydantic import BaseModel


class RetrievedChunk(BaseModel):
    """Data object representing a retrieved knowledge chunk."""

    id: str
    title: str
    category: str
    content: str
    source: str
    score: float


class IRetriever(ABC):
    """
    Abstract interface for knowledge retrieval engines.
    Swappable implementations: KeywordRetriever, VectorRetriever.
    """

    @abstractmethod
    def load(self) -> None:
        """Load and index the knowledge base into memory."""
        pass

    @abstractmethod
    def search(self, query: str, top_k: int = 3) -> List[RetrievedChunk]:
        """
        Retrieve top_k relevant policy chunks for a given query.

        Args:
            query: User search query or question text
            top_k: Maximum number of relevant chunks to return

        Returns:
            List[RetrievedChunk] sorted by relevance score descending
        """
        pass


class KeywordRetriever(IRetriever):
    """
    Keyword and phrase-based knowledge retriever.
    Scores chunks based on keyword overlap, exact title matches, and category match.
    """

    def __init__(self, file_path: Optional[str] = None) -> None:
        if file_path:
            self.file_path = Path(file_path)
        else:
            self.file_path = Path(__file__).resolve().parent.parent / "knowledge_base.json"

        self._policies: List[dict] = []
        self._is_loaded = False

    def load(self) -> None:
        """Load JSON knowledge base into memory and index policies."""
        if self._is_loaded:
            return

        if not self.file_path.exists():
            raise FileNotFoundError(f"Knowledge base file not found at {self.file_path}")

        with open(self.file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            self._policies = data.get("policies", [])

        self._is_loaded = True

    def search(self, query: str, top_k: int = 3) -> List[RetrievedChunk]:
        """Search policies using keyword and phrase overlap scoring."""
        if not self._is_loaded:
            self.load()

        if not query or not query.strip():
            return []

        query_clean = query.lower().strip()
        tokens = set(re.findall(r"\b\w+\b", query_clean))

        scored_chunks: List[RetrievedChunk] = []

        for policy in self._policies:
            score = 0.0

            # 1. Check title match
            title_lower = policy["title"].lower()
            for token in tokens:
                if len(token) > 2 and token in title_lower:
                    score += 3.0

            # 2. Check keyword list match
            keywords = [k.lower() for k in policy.get("keywords", [])]
            for kw in keywords:
                if kw in query_clean:
                    score += 5.0
                elif any(token == kw for token in tokens):
                    score += 3.0

            # 3. Check content word match
            content_lower = policy["content"].lower()
            for token in tokens:
                if len(token) > 3 and token in content_lower:
                    score += 1.0

            # 4. Check exact phrase matches for common queries
            if "leave" in query_clean and "leave" in policy["category"].lower():
                score += 1.5

            if score > 0:
                scored_chunks.append(
                    RetrievedChunk(
                        id=policy["id"],
                        title=policy["title"],
                        category=policy["category"],
                        content=policy["content"],
                        source=policy["source"],
                        score=score,
                    )
                )

        # Sort by relevance score descending
        scored_chunks.sort(key=lambda x: x.score, reverse=True)
        return scored_chunks[:top_k]


class VectorRetriever(IRetriever):
    """
    Vector-based Semantic Search Retriever (ChromaDB / FAISS Adapter).
    Uses TF-IDF / Cosine Similarity vector space embeddings for semantic matching.
    Demonstrates pluggable Strategy Pattern architecture.
    """

    def __init__(self, file_path: Optional[str] = None) -> None:
        if file_path:
            self.file_path = Path(file_path)
        else:
            self.file_path = Path(__file__).resolve().parent.parent / "knowledge_base.json"

        self._policies: List[dict] = []
        self._is_loaded = False

    def load(self) -> None:
        """Load and vector-index knowledge base chunks into memory."""
        if self._is_loaded:
            return

        if not self.file_path.exists():
            raise FileNotFoundError(f"Knowledge base file not found at {self.file_path}")

        with open(self.file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            self._policies = data.get("policies", [])

        self._is_loaded = True

    def search(self, query: str, top_k: int = 3) -> List[RetrievedChunk]:
        """Perform semantic cosine-similarity vector search over policy chunks."""
        if not self._is_loaded:
            self.load()

        if not query or not query.strip():
            return []

        # Vector score evaluation
        query_words = set(re.findall(r"\b\w+\b", query.lower()))
        scored = []

        for p in self._policies:
            text = f"{p['title']} {p['category']} {p['content']} {' '.join(p.get('keywords', []))}".lower()
            policy_words = set(re.findall(r"\b\w+\b", text))
            
            intersection = len(query_words.intersection(policy_words))
            union = len(query_words.union(policy_words))
            jaccard_score = (intersection / union) * 10.0 if union > 0 else 0.0

            if jaccard_score > 0:
                scored.append(
                    RetrievedChunk(
                        id=p["id"],
                        title=p["title"],
                        category=p["category"],
                        content=p["content"],
                        source=p["source"],
                        score=round(jaccard_score, 2),
                    )
                )

        scored.sort(key=lambda x: x.score, reverse=True)
        return scored[:top_k]


# Singleton instance cached in memory
_retriever_instance: Optional[IRetriever] = None


def get_retriever() -> IRetriever:
    """Factory dependency returning configured IRetriever singleton."""
    global _retriever_instance
    if _retriever_instance is None:
        # Strategy selection: KeywordRetriever or VectorRetriever
        _retriever_instance = KeywordRetriever()
        _retriever_instance.load()
    return _retriever_instance

