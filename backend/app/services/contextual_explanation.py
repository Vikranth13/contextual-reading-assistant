from functools import lru_cache

from langchain_core.prompts import (
    ChatPromptTemplate,
)
from langchain_google_genai import (
    ChatGoogleGenerativeAI,
)

from app.config import get_settings
from app.models import (
    ContextualMeaningOutput,
)


PROMPT = (
    ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """
You are a contextual reading assistant.

Explain what the selected English word
means specifically in the sentence where
the reader encountered it.

Rules:
- Explain the contextual meaning rather
  than giving a long dictionary definition.
- Use clear, simple English.
- Keep the answer concise.
- Use no more than two short sentences.
- Do not repeat the entire sentence.
- Do not invent information that is not
  supported by the sentence.
- If the sentence does not provide enough
  context, say so clearly.
""".strip(),
            ),
            (
                "human",
                """
Selected word:
{word}

Sentence:
{sentence}

Explain what "{word}" means in this
specific sentence.
""".strip(),
            ),
        ]
    )
)


@lru_cache
def get_explanation_chain():
    settings = get_settings()

    if settings.gemini_api_key is None:
        raise RuntimeError(
            "GEMINI_API_KEY is not configured."
        )

    model = ChatGoogleGenerativeAI(
        model=settings.gemini_model,
        api_key=(
            settings
            .gemini_api_key
            .get_secret_value()
        ),
        vertexai=False,
        timeout=12,
        max_retries=1,
    )

    structured_model = (
        model.with_structured_output(
            schema=(
                ContextualMeaningOutput
                .model_json_schema()
            ),
            method="json_schema",
        )
    )

    return (
        PROMPT
        | structured_model
    )


async def explain_word_in_context(
    word: str,
    sentence: str,
) -> str:

    chain = get_explanation_chain()

    result = await chain.ainvoke(
        {
            "word": word,
            "sentence": sentence,
        }
    )

    contextual_meaning = (
        result
        .get(
            "contextual_meaning",
            "",
        )
        .strip()
    )

    if not contextual_meaning:
        raise ValueError(
            "Gemini returned an empty "
            "contextual explanation."
        )

    return contextual_meaning