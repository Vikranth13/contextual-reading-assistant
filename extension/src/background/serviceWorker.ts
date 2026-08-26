import type {
    DictionaryResult,
} from "../types/dictionary";

console.log(
    "[CRA] Service worker loaded."
);

const FREE_DICTIONARY_BASE_URL =
    "https://api.dictionaryapi.dev/api/v2/entries/en";

const DATAMUSE_BASE_URL =
    "https://api.datamuse.com/words";

const PRIMARY_TIMEOUT_MS =
    1500;

const FALLBACK_TIMEOUT_MS =
    2000;

type DictionaryErrorKind =
    | "not_found"
    | "network"
    | "server"
    | "invalid_response";

interface DictionaryLookupMessage {
    type:
        "CRA_DICTIONARY_LOOKUP";

    word: string;
}

interface DictionaryServiceResponse {
    ok: boolean;

    result?:
        DictionaryResult;

    errorKind?:
        DictionaryErrorKind;

    message?: string;

    provider?:
        "free_dictionary"
        | "datamuse";
}

interface DictionaryErrorPayload {
    title?: string;
    message?: string;
    resolution?: string;
}

interface FreeDictionaryPhonetic {
    text?: string;
}

interface FreeDictionaryDefinition {
    definition?: string;
}

interface FreeDictionaryMeaning {
    partOfSpeech?: string;

    definitions?:
        FreeDictionaryDefinition[];
}

interface FreeDictionaryEntry {
    word?: string;
    phonetic?: string;

    phonetics?:
        FreeDictionaryPhonetic[];

    meanings?:
        FreeDictionaryMeaning[];
}

interface DatamuseEntry {
    word?: string;

    defs?:
        string[];

    tags?:
        string[];

    defHeadword?: string;
}

type ProviderAttempt =
    | {
        kind: "success";
        result: DictionaryResult;
    }
    | {
        kind:
            | "not_found"
            | "network"
            | "server"
            | "invalid_response"
            | "timeout";
    };

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
        return JSON.parse(
            text
        );
    } catch {
        return undefined;
    }
}

async function fetchJsonWithTimeout(
    url: string,
    timeoutMs: number
): Promise<{
    response: Response;
    data: unknown;
}> {

    const controller =
        new AbortController();

    const timeoutId =
        setTimeout(
            () => {
                controller.abort();
            },
            timeoutMs
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

        return {
            response,

            data:
                parseJson(
                    rawBody
                ),
        };

    } finally {

        clearTimeout(
            timeoutId
        );
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

function normalizeFreeDictionary(
    data: unknown,
    requestedWord: string
): DictionaryResult | null {

    if (
        !Array.isArray(data) ||
        data.length === 0
    ) {
        return null;
    }

    const entry =
        data[0] as
            FreeDictionaryEntry;

    const meaning =
        entry.meanings?.find(
            (candidate) =>
                Boolean(
                    candidate
                        .definitions?.[0]
                        ?.definition
                        ?.trim()
                )
        );

    const definition =
        meaning
            ?.definitions?.[0]
            ?.definition
            ?.trim();

    if (!definition) {
        return null;
    }

    const phonetic =
        entry.phonetics?.find(
            (candidate) =>
                Boolean(
                    candidate.text
                        ?.trim()
                )
        )
            ?.text
            ?.trim()

        || entry.phonetic
            ?.trim()

        || undefined;

    return {
        word:
            entry.word?.trim()
            || requestedWord,

        definition,

        partOfSpeech:
            meaning
                ?.partOfSpeech
                ?.trim()
                || undefined,

        phonetic,

        audioUrl:
            undefined,
    };
}

function mapPartOfSpeech(
    value:
        string | undefined
): string | undefined {

    switch (value) {

        case "n":
            return "noun";

        case "v":
            return "verb";

        case "adj":
            return "adjective";

        case "adv":
            return "adverb";

        default:
            return undefined;
    }
}

function parseDatamuseDefinition(
    rawDefinition: string
): {
    definition: string;
    partOfSpeech?: string;
} {

    const separatorIndex =
        rawDefinition.indexOf(
            "\t"
        );

    if (
        separatorIndex === -1
    ) {
        return {
            definition:
                rawDefinition.trim(),
        };
    }

    const partOfSpeechCode =
        rawDefinition
            .slice(
                0,
                separatorIndex
            )
            .trim();

    const definition =
        rawDefinition
            .slice(
                separatorIndex + 1
            )
            .trim();

    return {
        definition,

        partOfSpeech:
            mapPartOfSpeech(
                partOfSpeechCode
            ),
    };
}

function normalizeDatamuse(
    data: unknown,
    requestedWord: string
): DictionaryResult | null {

    if (!Array.isArray(data)) {
        return null;
    }

    const normalizedRequestedWord =
        requestedWord
            .trim()
            .toLowerCase();

    const entry =
        data.find(
            (candidate) => {

                if (
                    typeof candidate !==
                    "object" ||
                    candidate === null
                ) {
                    return false;
                }

                const datamuseEntry =
                    candidate as
                        DatamuseEntry;

                return (
                    datamuseEntry.word
                        ?.trim()
                        .toLowerCase()
                    ===
                    normalizedRequestedWord
                );
            }
        ) as
            DatamuseEntry
            | undefined;

    if (
        !entry ||
        !entry.defs ||
        entry.defs.length === 0
    ) {
        return null;
    }

    const rawDefinition =
        entry.defs.find(
            (definition) =>
                Boolean(
                    definition.trim()
                )
        );

    if (!rawDefinition) {
        return null;
    }

    const parsedDefinition =
        parseDatamuseDefinition(
            rawDefinition
        );

    if (
        !parsedDefinition.definition
    ) {
        return null;
    }

    const tagPartOfSpeech =
        entry.tags
            ?.map(
                mapPartOfSpeech
            )
            .find(Boolean);

    const pronunciationTag =
        entry.tags?.find(
            (tag) =>
                tag.startsWith(
                    "pron:"
                )
        );

    const phonetic =
        pronunciationTag
            ?.slice(
                "pron:".length
            )
            .trim()
            || undefined;

    return {
        word:
            entry.word?.trim()
            || requestedWord,

        definition:
            parsedDefinition.definition,

        partOfSpeech:
            tagPartOfSpeech
            || parsedDefinition
                .partOfSpeech,

        phonetic,

        audioUrl:
            undefined,
    };
}

async function tryFreeDictionary(
    word: string
): Promise<ProviderAttempt> {

    const normalizedWord =
        word.trim().toLowerCase();

    const url =
        `${FREE_DICTIONARY_BASE_URL}/${encodeURIComponent(
            normalizedWord
        )}`;

    try {

        const {
            response,
            data,
        } =
            await fetchJsonWithTimeout(
                url,
                PRIMARY_TIMEOUT_MS
            );

        console.log(
            "[CRA] Free Dictionary response:",
            {
                word,
                status:
                    response.status,
            }
        );

        if (
            response.status ===
                404 ||
            looksLikeNotFound(
                data
            )
        ) {
            return {
                kind:
                    "not_found",
            };
        }

        if (!response.ok) {
            return {
                kind:
                    "server",
            };
        }

        if (
            data === undefined
        ) {
            return {
                kind:
                    "invalid_response",
            };
        }

        const result =
            normalizeFreeDictionary(
                data,
                word
            );

        if (!result) {
            return {
                kind:
                    "invalid_response",
            };
        }

        return {
            kind: "success",
            result,
        };

    } catch (error) {

        if (
            error instanceof
                DOMException &&
            error.name ===
                "AbortError"
        ) {
            console.warn(
                "[CRA] Free Dictionary timed out:",
                word
            );

            return {
                kind:
                    "timeout",
            };
        }

        console.error(
            "[CRA] Free Dictionary request failed:",
            error
        );

        return {
            kind:
                "network",
        };
    }
}

async function tryDatamuse(
    word: string
): Promise<ProviderAttempt> {

    const normalizedWord =
        word.trim().toLowerCase();

    const url =
        new URL(
            DATAMUSE_BASE_URL
        );

    url.searchParams.set(
        "sp",
        normalizedWord
    );

    url.searchParams.set(
        "qe",
        "sp"
    );

    url.searchParams.set(
        "md",
        "dpr"
    );

    url.searchParams.set(
        "ipa",
        "1"
    );

    url.searchParams.set(
        "max",
        "1"
    );

    try {

        const {
            response,
            data,
        } =
            await fetchJsonWithTimeout(
                url.toString(),
                FALLBACK_TIMEOUT_MS
            );

        console.log(
            "[CRA] Datamuse response:",
            {
                word,
                status:
                    response.status,
            }
        );

        if (!response.ok) {
            return {
                kind:
                    "server",
            };
        }

        if (
            data === undefined
        ) {
            return {
                kind:
                    "invalid_response",
            };
        }

        const result =
            normalizeDatamuse(
                data,
                word
            );

        if (!result) {
            return {
                kind:
                    "not_found",
            };
        }

        return {
            kind:
                "success",

            result,
        };

    } catch (error) {

        if (
            error instanceof
                DOMException &&
            error.name ===
                "AbortError"
        ) {
            console.warn(
                "[CRA] Datamuse fallback timed out:",
                word
            );

            return {
                kind:
                    "timeout",
            };
        }

        console.error(
            "[CRA] Datamuse request failed:",
            error
        );

        return {
            kind:
                "network",
        };
    }
}

async function fetchDictionaryEntry(
    word: string
): Promise<DictionaryServiceResponse> {

    /*
     * Provider 1:
     * richer dictionary result.
     */
    const primary =
        await tryFreeDictionary(
            word
        );

    if (
        primary.kind ===
        "success"
    ) {
        return {
            ok: true,

            result:
                primary.result,

            provider:
                "free_dictionary",
        };
    }

    console.log(
        "[CRA] Trying Datamuse fallback:",
        {
            word,
            primaryResult:
                primary.kind,
        }
    );

    /*
     * Provider 2:
     * faster fallback for words the
     * primary service cannot resolve
     * quickly or reliably.
     */
    const fallback =
        await tryDatamuse(
            word
        );

    if (
        fallback.kind ===
        "success"
    ) {
        return {
            ok: true,

            result:
                fallback.result,

            provider:
                "datamuse",
        };
    }

    /*
     * If either provider confidently
     * says the word doesn't exist and
     * neither provider found a result,
     * show a clean not-found message.
     */
    if (
        primary.kind ===
            "not_found" ||
        fallback.kind ===
            "not_found"
    ) {
        return {
            ok: false,

            errorKind:
                "not_found",

            message:
                `No dictionary definition was found for "${word}".`,
        };
    }

    if (
        primary.kind ===
            "timeout" ||
        fallback.kind ===
            "timeout"
    ) {
        return {
            ok: false,

            errorKind:
                "network",

            message:
                "Dictionary lookup took too long. Please try again.",
        };
    }

    return {
        ok: false,

        errorKind:
            "server",

        message:
            "The dictionary service is temporarily unavailable.",
    };
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