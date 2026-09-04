export interface SavedWordDraft {
    word: string;

    definition: string;

    partOfSpeech?: string;

    phonetic?: string;

    sentence: string;

    contextualMeaning?: string;
}


export interface SavedWord
    extends SavedWordDraft {

    id: string;

    savedAt: string;
}


export type SavedWordState =
    | {
        status: "idle";
    }
    | {
        status: "checking";
    }
    | {
        status: "unsaved";
    }
    | {
        status: "saved";
        id: string;
    }
    | {
        status: "error";
        message: string;
    };