import {
    DictionaryLookupError,
    type DictionaryResult,
} from "../types/dictionary";

interface RawPhonetic {
    text?: string;
    audio?: string;
}

interface RawDefinition {
    definition?: string;
}

interface RawMeaning {
    partOfSpeech?: string;

    definitions?:
        RawDefinition[];
}

interface RawDictionaryEntry {
    word?: string;
    phonetic?: string;

    phonetics?:
        RawPhonetic[];

    meanings?:
        RawMeaning[];
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

function normalizeAudioUrl(
    audioUrl:
        string | undefined
): string | undefined {

    if (!audioUrl) {
        return undefined;
    }

    if (
        audioUrl.startsWith(
            "//"
        )
    ) {
        return `https:${audioUrl}`;
    }

    return audioUrl;
}

function findPhonetic(
    entry: RawDictionaryEntry
): string | undefined {

    const phoneticWithText =
        entry.phonetics?.find(
            (phonetic) =>
                Boolean(
                    phonetic
                        .text
                        ?.trim()
                )
        );

    return (
        phoneticWithText
            ?.text
            ?.trim()

        || entry
            .phonetic
            ?.trim()

        || undefined
    );
}

function findAudioUrl(
    entry: RawDictionaryEntry
): string | undefined {

    const phoneticWithAudio =
        entry.phonetics?.find(
            (phonetic) =>
                Boolean(
                    phonetic
                        .audio
                        ?.trim()
                )
        );

    return normalizeAudioUrl(
        phoneticWithAudio
            ?.audio
            ?.trim()
    );
}

function normalizeEntry(
    entry: RawDictionaryEntry,
    requestedWord: string
): DictionaryResult {

    const primaryMeaning =
        entry.meanings?.find(
            (meaning) =>
                Boolean(
                    meaning
                        .definitions?.[0]
                        ?.definition
                )
        );

    const primaryDefinition =
        primaryMeaning
            ?.definitions?.[0]
            ?.definition
            ?.trim();

    if (!primaryDefinition) {
        throw new DictionaryLookupError(
            "invalid_response",

            "The dictionary response did not contain a usable definition."
        );
    }

    return {
        word:
            entry.word?.trim()
            || requestedWord,

        definition:
            primaryDefinition,

        partOfSpeech:
            primaryMeaning
                ?.partOfSpeech
                ?.trim()
                || undefined,

        phonetic:
            findPhonetic(
                entry
            ),

        audioUrl:
            findAudioUrl(
                entry
            ),
    };
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
                || `No dictionary definition was found for "${word}".`
            );
        }

        if (
            response.errorKind ===
            "server"
        ) {
            throw new DictionaryLookupError(
                "server",

                response.message
                || "The dictionary service is temporarily unavailable."
            );
        }

        if (
            response.errorKind ===
            "invalid_response"
        ) {
            throw new DictionaryLookupError(
                "invalid_response",

                response.message
                || "The dictionary service returned invalid data."
            );
        }

        throw new DictionaryLookupError(
            "network",

            response.message
            || "Unable to reach the dictionary service."
        );
    }

        

    if (
        response.status ===
            undefined ||
        response.status < 200 ||
        response.status >= 300
    ) {
        throw new DictionaryLookupError(
            "server",

            "The dictionary service is temporarily unavailable."
        );
    }

    const data =
        response.data;

    if (
        !Array.isArray(data) ||
        data.length === 0
    ) {
        throw new DictionaryLookupError(
            "invalid_response",

            "The dictionary service returned no entries."
        );
    }

    return normalizeEntry(
        data[0] as
            RawDictionaryEntry,

        word
    );
}