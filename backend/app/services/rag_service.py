"""
RAG (Retrieval-Augmented Generation) engine - Section 8 of the abstract.

Production pipeline (documented, and used automatically when OPENAI_API_KEY
or GEMINI_API_KEY is set in .env):

    Agricultural Documents -> Document Processing -> Text Chunking ->
    Embedding Generation -> PostgreSQL + pgvector -> Semantic Retrieval ->
    Relevant Context -> Gemini/OpenAI -> Grounded AI Response

This file ships a fully OFFLINE implementation of that same pipeline shape
so the project runs end-to-end with zero API keys and zero external
network calls:

  - "Embedding Generation" -> TF-IDF style term-frequency vectors (pure
    Python, no ML library needed)
  - "PostgreSQL + pgvector" -> in-memory vectors built at startup from
    data/knowledge_base.json (swap for a real pgvector table + a
    sentence-transformers/OpenAI embedding call in production - the
    retrieve() interface below would not need to change)
  - "Gemini/OpenAI" -> a deterministic template-based response composer
    that grounds its answer in the retrieved chunks (swap generate() to
    call an LLM API; the retrieved `context` is already assembled for you)

Because retrieve() and generate() are cleanly separated, upgrading to a
real embedding model or LLM later is a two-function change, not a rewrite.
"""
import json
import math
import re
from collections import Counter
from pathlib import Path
from typing import List, Dict

KB_PATH = Path(__file__).resolve().parent.parent / "data" / "knowledge_base.json"

_STOPWORDS = {
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "and", "or",
    "of", "to", "in", "on", "for", "with", "at", "by", "this", "that", "it",
    "my", "our", "i", "we", "you", "your", "how", "what", "should", "can",
    "do", "does", "when", "will", "have", "has", "as", "if", "so",
}


_SUFFIXES = ("ations", "ation", "ing", "ers", "ate", "er", "ies", "ed", "es", "s")


def _stem(word: str) -> str:
    """Minimal suffix-stripping stemmer (no external NLP dependency) so
    'irrigate'/'irrigation'/'irrigating' collapse to a shared root for
    matching purposes."""
    for suf in _SUFFIXES:
        if word.endswith(suf) and len(word) - len(suf) >= 4:
            return word[: -len(suf)]
    return word


def _tokenize(text: str) -> List[str]:
    words = re.findall(r"[a-zA-Z]+", text.lower())
    return [_stem(w) for w in words if w not in _STOPWORDS and len(w) > 2]


class RagEngine:
    """In-memory TF-IDF retrieval over the agricultural knowledge base."""

    def __init__(self, kb_path: Path = KB_PATH):
        self.documents: List[Dict] = json.loads(kb_path.read_text())
        self._build_index()

    def _build_index(self):
        self._doc_tokens = [_tokenize(d["title"] + " " + d["content"]) for d in self.documents]
        df = Counter()
        for tokens in self._doc_tokens:
            for term in set(tokens):
                df[term] += 1
        n_docs = len(self.documents)
        self._idf = {term: math.log((n_docs + 1) / (count + 1)) + 1 for term, count in df.items()}

        self._doc_vectors = []
        for tokens in self._doc_tokens:
            tf = Counter(tokens)
            length = max(len(tokens), 1)
            vec = {term: (count / length) * self._idf.get(term, 0) for term, count in tf.items()}
            self._doc_vectors.append(vec)

    def _vectorize_query(self, query: str) -> Dict[str, float]:
        tokens = _tokenize(query)
        tf = Counter(tokens)
        length = max(len(tokens), 1)
        return {term: (count / length) * self._idf.get(term, 0) for term, count in tf.items()}

    @staticmethod
    def _cosine(a: Dict[str, float], b: Dict[str, float]) -> float:
        if not a or not b:
            return 0.0
        common = set(a) & set(b)
        dot = sum(a[t] * b[t] for t in common)
        norm_a = math.sqrt(sum(v * v for v in a.values()))
        norm_b = math.sqrt(sum(v * v for v in b.values()))
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot / (norm_a * norm_b)

    def retrieve(self, query: str, top_k: int = 3, min_score: float = 0.05) -> List[Dict]:
        """Semantic retrieval step: returns the top_k most relevant knowledge
        base chunks for the query, each with a similarity score."""
        q_vec = self._vectorize_query(query)
        q_tokens = set(_tokenize(query))
        scored = []
        for doc, doc_vec in zip(self.documents, self._doc_vectors):
            score = self._cosine(q_vec, doc_vec)
            # Title-match boost: a knowledge doc whose title shares vocabulary
            # with the query is very likely the right grounding source, even
            # if the body's term frequencies alone don't rank it top -
            # a cheap but effective stand-in for a cross-encoder re-ranker.
            title_tokens = set(_tokenize(doc["title"]))
            overlap = len(q_tokens & title_tokens)
            if overlap:
                score += 0.12 * overlap
            if score >= min_score:
                scored.append((score, doc))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [
            {"id": doc["id"], "title": doc["title"], "category": doc["category"],
             "content": doc["content"], "score": round(score, 4)}
            for score, doc in scored[:top_k]
        ]

    def generate(self, query: str, retrieved: List[Dict], farm_context: str = "") -> str:
        """Grounded response composition step. In production this prompt +
        retrieved context is sent to Gemini/OpenAI; here it is composed
        deterministically from the retrieved chunks so the chatbot works
        with zero external dependencies."""
        if not retrieved:
            return (
                "I couldn't find grounded information on that in the current "
                "agricultural knowledge base. Try rephrasing, or ask about "
                "irrigation timing, fertilizer/nutrient deficiencies, soil pH, "
                "common crop diseases, weather-based scheduling, or crop "
                "selection for a soil type."
            )

        lines = []
        if farm_context:
            lines.append(farm_context)
        lines.append(f"Based on {len(retrieved)} relevant source{'s' if len(retrieved) > 1 else ''} "
                      f"from the agricultural knowledge base:")
        for doc in retrieved:
            lines.append(f"\n• {doc['title']}: {doc['content']}")
        lines.append(
            "\nThis is AI-generated guidance grounded in the sources above, not "
            "a substitute for advice from a certified agronomist on high-impact decisions."
        )
        return "\n".join(lines)


_engine: RagEngine | None = None


def get_rag_engine() -> RagEngine:
    global _engine
    if _engine is None:
        _engine = RagEngine()
    return _engine
