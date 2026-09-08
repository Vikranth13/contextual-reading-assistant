from pydantic import (
    BaseModel,
    Field,
    field_validator,
)
import unicodedata

def is_letter_or_mark(
    character: str,
) -> bool:
    category = unicodedata.category(
        character
    )

    return (
        category.startswith("L")
        or
        category.startswith("M")
    )


def is_valid_word(
    value: str,
) -> bool:
    if not value:
        return False

    separators = {
        "'",
        "’",
        "-",
    }

    for index, character in enumerate(
        value
    ):
        if is_letter_or_mark(
            character
        ):
            continue

        if (
            character in separators
            and index > 0
            and index < len(value) - 1
        ):
            continue

        return False

    return True

class ExplainRequest(BaseModel):
    word: str = Field(
        min_length=1,
        max_length=60,
    )

    sentence: str = Field(
        min_length=1,
        max_length=500,
    )

    @field_validator(
        "word",
        "sentence",
    )
    @classmethod
    def strip_text(
        cls,
        value: str,
    ) -> str:
        cleaned = value.strip()

        if not cleaned:
            raise ValueError(
                "Value cannot be empty."
            )

        return cleaned

    @field_validator(
        "word",
    )
    @classmethod
    def validate_word(
        cls,
        value: str,
    ) -> str:
        if not is_valid_word(
            value
        ):
            raise ValueError(
                "Word contains unsupported "
                "characters."
            )

        return value


class ExplainResponse(BaseModel):
    word: str

    contextual_meaning: str


class ContextualMeaningOutput(
    BaseModel
):
    contextual_meaning: str = Field(
        description=(
            "A concise explanation of "
            "what the selected word means "
            "in the supplied sentence."
        )
    )