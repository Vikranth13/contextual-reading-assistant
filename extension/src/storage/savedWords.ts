import type {
    SavedWord,
    SavedWordDraft,
} from "../types/savedWord";


const STORAGE_KEY =
    "cra_saved_words_v1";


function normalizeText(
    value: string
): string {

    return value
        .trim()
        .replace(
            /\s+/g,
            " "
        )
        .toLowerCase();
}


function matchesEntry(
    savedWord: SavedWord,
    word: string,
    sentence: string
): boolean {

    return (
        normalizeText(
            savedWord.word
        ) ===
            normalizeText(word)
        &&
        normalizeText(
            savedWord.sentence
        ) ===
            normalizeText(sentence)
    );
}


export async function listSavedWords():
Promise<SavedWord[]> {

    const data =
        await chrome.storage.local
            .get(
                STORAGE_KEY
            );

    const value =
        data[STORAGE_KEY];

    if (!Array.isArray(value)) {
        return [];
    }

    return value as
        SavedWord[];
}


async function writeSavedWords(
    words: SavedWord[]
): Promise<void> {

    await chrome.storage.local
        .set({
            [STORAGE_KEY]:
                words,
        });
}


export async function findSavedWord(
    word: string,
    sentence: string
): Promise<SavedWord | undefined> {

    const words =
        await listSavedWords();

    return words.find(
        (savedWord) =>
            matchesEntry(
                savedWord,
                word,
                sentence
            )
    );
}


export async function toggleSavedWord(
    draft: SavedWordDraft
): Promise<{
    saved: boolean;
    item?: SavedWord;
}> {

    const words =
        await listSavedWords();

    const existing =
        words.find(
            (savedWord) =>
                matchesEntry(
                    savedWord,
                    draft.word,
                    draft.sentence
                )
        );

    if (existing) {

        await writeSavedWords(
            words.filter(
                (savedWord) =>
                    savedWord.id !==
                        existing.id
            )
        );

        return {
            saved: false,
        };
    }

    const item:
        SavedWord = {

        ...draft,

        id:
            crypto.randomUUID(),

        savedAt:
            new Date()
                .toISOString(),
    };

    await writeSavedWords(
        [
            item,
            ...words,
        ]
    );

    return {
        saved: true,
        item,
    };
}


export async function deleteSavedWord(
    id: string
): Promise<void> {

    const words =
        await listSavedWords();

    await writeSavedWords(
        words.filter(
            (savedWord) =>
                savedWord.id !== id
        )
    );
}