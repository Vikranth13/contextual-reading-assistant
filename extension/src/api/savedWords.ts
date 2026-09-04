import type {
    SavedWord,
    SavedWordDraft,
} from "../types/savedWord";

import type {
    SavedWordsMessage,
    SavedWordsResponse,
} from "../types/savedWordMessages";


async function sendMessage(
    message:
        SavedWordsMessage
): Promise<SavedWordsResponse> {

    const response =
        await chrome.runtime
            .sendMessage(
                message
            ) as
                SavedWordsResponse;

    if (
        !response ||
        !response.ok
    ) {
        throw new Error(
            response?.message
            ||
            "Saved words operation failed."
        );
    }

    return response;
}


export async function checkSavedWord(
    word: string,
    sentence: string
) {

    const response =
        await sendMessage({
            type:
                "CRA_CHECK_SAVED_WORD",
            word,
            sentence,
        });

    return {
        saved:
            Boolean(
                response.saved
            ),

        item:
            response.item,
    };
}


export async function toggleSavedWord(
    entry: SavedWordDraft
) {

    const response =
        await sendMessage({
            type:
                "CRA_TOGGLE_SAVED_WORD",

            entry,
        });

    return {
        saved:
            Boolean(
                response.saved
            ),

        item:
            response.item,
    };
}


export async function getSavedWords():
Promise<SavedWord[]> {

    const response =
        await sendMessage({
            type:
                "CRA_LIST_SAVED_WORDS",
        });

    return (
        response.items
        ?? []
    );
}


export async function removeSavedWord(
    id: string
): Promise<void> {

    await sendMessage({
        type:
            "CRA_DELETE_SAVED_WORD",

        id,
    });
}


export async function openSavedWordsPage():
Promise<void> {

    await sendMessage({
        type:
            "CRA_OPEN_SAVED_WORDS",
    });
}