export interface DictionaryResult {
    word: string;
    definition: string;
    partOfSpeech?: string;
    phonetic?: string;
    audioUrl?: string;
}

export type DictionaryErrorKind =
    | "not_found"
    | "network"
    | "server"
    | "invalid_response";

export class DictionaryLookupError
    extends Error {

    kind: DictionaryErrorKind;

    constructor(
        kind: DictionaryErrorKind,
        message: string
    ) {
        super(message);

        this.name =
            "DictionaryLookupError";

        this.kind = kind;
    }
}