from pydantic import (
    BaseModel,
    Field,
    field_validator,
)


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