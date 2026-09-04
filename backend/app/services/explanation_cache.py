import hashlib
import json
import logging
from functools import lru_cache

from redis.asyncio import Redis
from redis.exceptions import RedisError

from app.config import get_settings


logger = logging.getLogger(
    "uvicorn.error"
)

CACHE_NAMESPACE = (
    "cra:explanation:v1"
)


@lru_cache
def get_redis_client() -> Redis:
    settings = get_settings()

    return Redis.from_url(
        settings.redis_url,
        encoding="utf-8",
        decode_responses=True,
        socket_connect_timeout=1,
        socket_timeout=1,
    )


def build_cache_key(
    word: str,
    sentence: str,
    model: str,
) -> str:
    normalized_word = (
        word.strip().lower()
    )

    normalized_sentence = " ".join(
        sentence.split()
    )

    payload = json.dumps(
        {
            "word":
                normalized_word,

            "sentence":
                normalized_sentence,

            "model":
                model,

            "prompt_version":
                "v1",
        },
        sort_keys=True,
        separators=(",", ":"),
    )

    digest = hashlib.sha256(
        payload.encode("utf-8")
    ).hexdigest()

    return (
        f"{CACHE_NAMESPACE}:{digest}"
    )


async def get_cached_explanation(
    word: str,
    sentence: str,
    model: str,
) -> str | None:

    key = build_cache_key(
        word,
        sentence,
        model,
    )

    try:
        value = await (
            get_redis_client()
            .get(key)
        )

        if value:
            logger.info(
                "[CRA] Redis cache HIT"
            )
            return value

        logger.info(
            "[CRA] Redis cache MISS"
        )

        return None

    except RedisError as error:
        logger.warning(
            "[CRA] Redis read failed. "
            "Continuing without cache: %s",
            error,
        )

        return None


async def cache_explanation(
    word: str,
    sentence: str,
    model: str,
    explanation: str,
) -> None:

    settings = get_settings()

    key = build_cache_key(
        word,
        sentence,
        model,
    )

    try:
        await (
            get_redis_client()
            .set(
                key,
                explanation,
                ex=(
                    settings
                    .explanation_cache_ttl_seconds
                ),
            )
        )

        logger.info(
            "[CRA] Explanation cached "
            "in Redis"
        )

    except RedisError as error:
        logger.warning(
            "[CRA] Redis write failed. "
            "Continuing without cache: %s",
            error,
        )