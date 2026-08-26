console.log(
    "[CRA] Service worker loaded."
);

const DICTIONARY_BASE_URL =
    "https://api.dictionaryapi.dev/api/v2/entries/en";

const DICTIONARY_TIMEOUT_MS =
    2500;

interface DictionaryLookupMessage {
    type:
        "CRA_DICTIONARY_LOOKUP";

    word: string;
}

interface DictionaryServiceResponse {
    ok: boolean;
    status?: number;
    data?: unknown;

    errorKind?:
        | "not_found"
        | "network"
        | "server"
        | "invalid_response";

    message?: string;
}

interface DictionaryErrorPayload {
    title?: string;
    message?: string;
    resolution?: string;
}

function isDictionaryLookupMessage(
    message: unknown
): message is DictionaryLookupMessage {

    if (
        typeof message !== "object" ||
        message === null
    ) {
        return false;
    }

    const candidate =
        message as Partial<
            DictionaryLookupMessage
        >;

    return (
        candidate.type ===
            "CRA_DICTIONARY_LOOKUP" &&
        typeof candidate.word ===
            "string"
    );
}

function parseJson(
    text: string
): unknown {

    if (!text.trim()) {
        return undefined;
    }

    try {
        return JSON.parse(text);
    } catch {
        return undefined;
    }
}

function looksLikeNotFound(
    data: unknown
): boolean {

    if (
        typeof data !== "object" ||
        data === null ||
        Array.isArray(data)
    ) {
        return false;
    }

    const error =
        data as DictionaryErrorPayload;

    const combinedText =
        [
            error.title,
            error.message,
            error.resolution,
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

    return (
        combinedText.includes(
            "no definitions found"
        ) ||
        combinedText.includes(
            "no definition found"
        ) ||
        combinedText.includes(
            "word can't be found"
        ) ||
        combinedText.includes(
            "word cannot be found"
        )
    );
}

async function fetchDictionaryEntry(
    word: string
): Promise<DictionaryServiceResponse> {

    const normalizedWord =
        word.trim().toLowerCase();

    const url =
        `${DICTIONARY_BASE_URL}/${encodeURIComponent(
            normalizedWord
        )}`;

    const controller =
        new AbortController();

    const timeoutId =
        setTimeout(
            () => {
                controller.abort();
            },
            DICTIONARY_TIMEOUT_MS
        );

    try {
        const response =
            await fetch(
                url,
                {
                    signal:
                        controller.signal,
                }
            );

        const rawBody =
            await response.text();

        const data =
            parseJson(
                rawBody
            );

        console.log(
            "[CRA] Dictionary response:",
            {
                word,
                status:
                    response.status,
                ok:
                    response.ok,
            }
        );

        /*
         * Normal 404 behavior.
         */
        if (
            response.status ===
            404
        ) {
            return {
                ok: false,

                status: 404,

                errorKind:
                    "not_found",

                message:
                    `No dictionary definition was found for "${word}".`,
            };
        }

        /*
         * Some API responses may describe
         * "No Definitions Found" even when
         * the HTTP status is unexpected.
         */
        if (
            looksLikeNotFound(
                data
            )
        ) {
            return {
                ok: false,

                status:
                    response.status,

                errorKind:
                    "not_found",

                message:
                    `No dictionary definition was found for "${word}".`,
            };
        }

        /*
         * Other HTTP errors represent an
         * actual service problem.
         */
        if (!response.ok) {
            return {
                ok: false,

                status:
                    response.status,

                errorKind:
                    "server",

                message:
                    "The dictionary service is temporarily unavailable.",
            };
        }

        /*
         * Successful HTTP response but
         * unusable JSON.
         */
        if (
            data === undefined
        ) {
            return {
                ok: false,

                status:
                    response.status,

                errorKind:
                    "invalid_response",

                message:
                    "The dictionary service returned invalid data.",
            };
        }

        return {
            ok: true,

            status:
                response.status,

            data,
        };

    } catch (error) {

        if (
            error instanceof
                DOMException &&
            error.name ===
                "AbortError"
        ) {
            console.warn(
                "[CRA] Dictionary lookup timed out:",
                word
            );

            return {
                ok: false,

                errorKind:
                    "network",

                message:
                    "No dictionary definition was found or dictionary lookup took too long. Please try again.",
            };
        }

        console.error(
            "[CRA] Dictionary request failed:",
            error
        );

        return {
            ok: false,

            errorKind:
                "network",

            message:
                "Unable to reach the dictionary service.",
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
            !isDictionaryLookupMessage(
                message
            )
        ) {
            return;
        }

        void fetchDictionaryEntry(
            message.word
        )
            .then(
                sendResponse
            )
            .catch(
                (
                    error:
                        unknown
                ) => {

                    console.error(
                        "[CRA] Unexpected dictionary lookup error:",
                        error
                    );

                    sendResponse({
                        ok: false,

                        errorKind:
                            "network",

                        message:
                            "Unable to reach the dictionary service.",
                    } satisfies DictionaryServiceResponse);
                }
            );

        return true;
    }
);

chrome.runtime.onInstalled
    .addListener(
        () => {
            console.log(
                "[CRA] Contextual Reading Assistant installed or updated."
            );
        }
    );