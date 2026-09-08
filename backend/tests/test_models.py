import pytest

from pydantic import (
    ValidationError,
)

from app.models import (
    ExplainRequest,
)


def test_valid_word():
    request = ExplainRequest(
        word="dashing",
        sentence=(
            "The dashing officer "
            "entered the ballroom."
        ),
    )

    assert (
        request.word
        == "dashing"
    )


def test_hyphenated_word():
    request = ExplainRequest(
        word="well-known",
        sentence=(
            "She is a well-known "
            "researcher."
        ),
    )

    assert (
        request.word
        == "well-known"
    )


def test_rejects_empty_word():
    with pytest.raises(
        ValidationError
    ):
        ExplainRequest(
            word="",
            sentence=(
                "Some sentence."
            ),
        )


def test_rejects_multiple_words():
    with pytest.raises(
        ValidationError
    ):
        ExplainRequest(
            word="two words",
            sentence=(
                "These are two words."
            ),
        )