import {
    DictionaryLookupError,
    type DictionaryResult,
} from "../types/dictionary";

interface DictionaryServiceResponse {
    ok: boolean;

    result?:
        DictionaryResult;

    errorKind?:
        | "not_found"
        | "network"
        | "server"
        | "invalid_response";

    message?: string;

    provider?:
        | "free_dictionary"
        | "datamuse";
}

async function requestDictionaryEntry(
    word: string
): Promise<DictionaryServiceResponse> {

    try {

        const response =
            await chrome.runtime
                .sendMessage({
                    type:
                        "CRA_DICTIONARY_LOOKUP",

                    word,
                });

        return response as
            DictionaryServiceResponse;

    } catch {

        throw new DictionaryLookupError(
            "network",

            "Unable to communicate with the extension service worker."
        );
    }
}

function isValidDictionaryResult(
    result: unknown
): result is DictionaryResult {

    if (
        typeof result !==
            "object" ||
        result === null
    ) {
        return false;
    }

    const candidate =
        result as Partial<
            DictionaryResult
        >;

    return (
        typeof candidate.word ===
            "string" &&
        candidate.word.trim().length >
            0 &&
        typeof candidate.definition ===
            "string" &&
        candidate.definition.trim()
            .length >
            0
    );
}

export async function lookupWord(
    word: string
): Promise<DictionaryResult> {

    const response =
        await requestDictionaryEntry(
            word
        );

    if (
        !response ||
        typeof response.ok !==
            "boolean"
    ) {
        throw new DictionaryLookupError(
            "invalid_response",

            "The dictionary service returned an unexpected response."
        );
    }

    if (!response.ok) {

        if (
            response.errorKind ===
            "not_found"
        ) {
            throw new DictionaryLookupError(
                "not_found",

                response.message
                ||
                `No dictionary definition was found for "${word}".`
            );
        }

        if (
            response.errorKind ===
            "server"
        ) {
            throw new DictionaryLookupError(
                "server",

                response.message
                ||
                "The dictionary service is temporarily unavailable."
            );
        }

        if (
            response.errorKind ===
            "invalid_response"
        ) {
            throw new DictionaryLookupError(
                "invalid_response",

                response.message
                ||
                "The dictionary service returned invalid data."
            );
        }

        throw new DictionaryLookupError(
            "network",

            response.message
            ||
            "Unable to reach the dictionary service."
        );
    }

    if (
        !isValidDictionaryResult(
            response.result
        )
    ) {
        throw new DictionaryLookupError(
            "invalid_response",

            "The dictionary service returned no usable definition."
        );
    }

    console.log(
        "[CRA] Dictionary provider:",
        response.provider
    );

    return response.result;
}