from app.services.explanation_cache import (
    build_cache_key,
)


def test_cache_key_is_deterministic():
    first = build_cache_key(
        "Dashing",
        "The child was dashing.",
        "gemini-test",
    )

    second = build_cache_key(
        "dashing",
        "The child was   dashing.",
        "gemini-test",
    )

    assert first == second


def test_different_context_has_different_key():
    first = build_cache_key(
        "dashing",
        (
            "The dashing officer "
            "entered."
        ),
        "gemini-test",
    )

    second = build_cache_key(
        "dashing",
        (
            "The child was "
            "dashing home."
        ),
        "gemini-test",
    )

    assert first != second