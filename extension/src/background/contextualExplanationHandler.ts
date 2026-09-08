interface ExplanationMessage {
    type:
        "CRA_CONTEXTUAL_EXPLANATION";

    word: string;

    sentence: string;
}


interface BackendExplainResponse {
    word: string;

    contextual_meaning: string;
}

interface BackendErrorResponse {
    detail?: string;
}


class ExplanationRequestError
    extends Error {

    constructor(
        message: string
    ) {
        super(
            message
        );

        this.name =
            "ExplanationRequestError";
    }
}

const EXPLANATION_URL =
    "http://127.0.0.1:8000/api/explain";

const EXPLANATION_TIMEOUT_MS =
    15000;


function isExplanationMessage(
    message: unknown
): message is ExplanationMessage {

    if (
        typeof message !== "object" ||
        message === null
    ) {
        return false;
    }

    const candidate =
        message as Partial<
            ExplanationMessage
        >;

    return (
        candidate.type ===
            "CRA_CONTEXTUAL_EXPLANATION" &&
        typeof candidate.word ===
            "string" &&
        typeof candidate.sentence ===
            "string"
    );
}


async function requestExplanation(
    word: string,
    sentence: string
) {
    const controller =
        new AbortController();

    const timeoutId =
        setTimeout(
            () => {
                controller.abort();
            },
            EXPLANATION_TIMEOUT_MS
        );

    try {
        const response =
            await fetch(
                EXPLANATION_URL,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body:
                        JSON.stringify({
                            word,
                            sentence,
                        }),

                    signal:
                        controller.signal,
                }
            );

        if (!response.ok) {
            let errorBody:
                BackendErrorResponse = {};

            try {
                errorBody =
                    await response.json() as
                        BackendErrorResponse;
            } catch {
                // Response body is optional.
            }

            if (
                response.status ===
                429
            ) {
                throw new ExplanationRequestError(
                    "Too many explanation requests. "
                    + "Please try again shortly."
                );
            }

            if (
                response.status ===
                422
            ) {
                throw new ExplanationRequestError(
                    "The selected text could not "
                    + "be processed."
                );
            }

            if (
                response.status ===
                502 ||
                response.status ===
                503
            ) {
                throw new ExplanationRequestError(
                    "AI explanation is temporarily "
                    + "unavailable."
                );
            }

            throw new ExplanationRequestError(
                errorBody.detail
                ||
                "Context explanation is unavailable."
            );
        }

        const data =
            await response.json() as
                BackendExplainResponse;

        if (
            !data.contextual_meaning
                ?.trim()
        ) {
            throw new Error(
                "Backend returned no contextual meaning."
            );
        }

        return {
            word:
                data.word,

            contextualMeaning:
                data.contextual_meaning,
        };

    } finally {
        clearTimeout(
            timeoutId
        );
    }
}


chrome.runtime.onMessage.addListener(
    (
        message: unknown,
        _sender,
        sendResponse
    ) => {

        if (
            !isExplanationMessage(
                message
            )
        ) {
            return;
        }

        void requestExplanation(
            message.word,
            message.sentence
        )
            .then(
                (result) => {
                    sendResponse({
                        ok: true,
                        result,
                    });
                }
            )
            .catch(
                (error: unknown) => {

                    console.error(
                        "[CRA] Context explanation failed:",
                        error
                    );

                    let message =
                        "Context explanation is "
                        + "temporarily unavailable.";

                    if (
                        error instanceof
                            ExplanationRequestError
                    ) {
                        message =
                            error.message;
                    }

                    if (
                        error instanceof
                            DOMException &&
                        error.name ===
                            "AbortError"
                    ) {
                        message =
                            "Context explanation took "
                            + "too long. Please try again.";
                    }

                    sendResponse({
                        ok: false,
                        message,
                    });
                }
            );

        return true;
    }
);