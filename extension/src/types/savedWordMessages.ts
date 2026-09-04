import type {
    SavedWord,
    SavedWordDraft,
} from "./savedWord";


export type SavedWordsMessage =
    | {
        type:
            "CRA_CHECK_SAVED_WORD";

        word: string;

        sentence: string;
    }
    | {
        type:
            "CRA_TOGGLE_SAVED_WORD";

        entry:
            SavedWordDraft;
    }
    | {
        type:
            "CRA_LIST_SAVED_WORDS";
    }
    | {
        type:
            "CRA_DELETE_SAVED_WORD";

        id: string;
    }
    | {
        type:
            "CRA_OPEN_SAVED_WORDS";
    };


export interface SavedWordsResponse {
    ok: boolean;

    saved?: boolean;

    item?: SavedWord;

    items?: SavedWord[];

    message?: string;
}