import logging

from fastapi import (
    FastAPI,
    HTTPException,
)

from app.models import (
    ExplainRequest,
    ExplainResponse,
)

from app.services.contextual_explanation import (
    explain_word_in_context,
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
    request: ExplainRequest,
):
    try:
        contextual_meaning = (
            await explain_word_in_context(
                word=request.word,
                sentence=request.sentence,
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
        word=request.word,
        contextual_meaning=(
            contextual_meaning
        ),
    )