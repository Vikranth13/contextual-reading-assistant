import hashlib
import logging

from redis.exceptions import (
    RedisError,
)

from app.config import (
    get_settings,
)

from app.services.explanation_cache import (
    get_redis_client,
)


logger = logging.getLogger(
    "uvicorn.error"
)


RATE_LIMIT_NAMESPACE = (
    "cra:rate-limit:v1"
)


def build_rate_limit_key(
    identifier: str,
) -> str:
    digest = hashlib.sha256(
        identifier.encode(
            "utf-8"
        )
    ).hexdigest()

    return (
        f"{RATE_LIMIT_NAMESPACE}:"
        f"{digest}"
    )


async def is_rate_limited(
    identifier: str,
) -> bool:
    settings = get_settings()

    key = build_rate_limit_key(
        identifier
    )

    try:
        redis = get_redis_client()

        count = await redis.incr(
            key
        )

        if count == 1:
            await redis.expire(
                key,
                settings
                .rate_limit_window_seconds,
            )

        return (
            count
            >
            settings
            .rate_limit_requests
        )

    except RedisError as error:
        logger.warning(
            "[CRA] Rate limiter Redis "
            "failure. Allowing request: %s",
            error,
        )

        return False