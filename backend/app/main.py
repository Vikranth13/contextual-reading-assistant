import logging

from fastapi import (
    FastAPI,
    HTTPException,
    Request,
)

from app.models import (
    ExplainRequest,
    ExplainResponse,
)

from app.services.contextual_explanation import (
    explain_word_in_context,
)

from app.services.rate_limit import (
    is_rate_limited,
)


logger = logging.getLogger(
    __name__
)


app = FastAPI(
    title=(
        "Contextual Reading "
        "Assistant API"
    ),
    version="0.1.0",
)


@app.get("/health")
def health():
    return {
        "status": "ok",
    }


@app.post(
    "/api/explain",
    response_model=ExplainResponse,
)
async def explain(
    request: Request,
    payload: ExplainRequest
):

    client_identifier = (
        request.client.host
        if request.client
        else "unknown"
    )

    if await is_rate_limited(
        client_identifier
    ):
        raise HTTPException(
            status_code=429,

            detail=(
                "Too many explanation "
                "requests. Please try "
                "again shortly."
            ),

            headers={
                "Retry-After": "60",
            },
        )

    try:
        contextual_meaning = (
            await explain_word_in_context(
                word=payload.word,
                sentence=payload.sentence,
            )
        )

    except RuntimeError as error:
        logger.exception(
            "LLM configuration error."
        )

        raise HTTPException(
            status_code=503,
            detail=str(error),
        ) from error

    except Exception as error:
        logger.exception(
            "Contextual explanation "
            "failed."
        )

        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to generate "
                "contextual meaning."
            ),
        ) from error

    return ExplainResponse(
        word=payload.word,
        contextual_meaning=(
            contextual_meaning
        ),
    )