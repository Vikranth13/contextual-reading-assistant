import {
    deleteSavedWord,
    findSavedWord,
    listSavedWords,
    toggleSavedWord,
} from "../storage/savedWords";

import type {
    SavedWordsMessage,
    SavedWordsResponse,
} from "../types/savedWordMessages";


function isSavedWordsMessage(
    message: unknown
): message is SavedWordsMessage {

    if (
        typeof message !== "object" ||
        message === null
    ) {
        return false;
    }

    const candidate =
        message as {
            type?: unknown;
        };

    return (
        typeof candidate.type ===
            "string" &&
        candidate.type.startsWith(
            "CRA_"
        )
    );
}


chrome.runtime.onMessage.addListener(
    (
        message: unknown,
        _sender,
        sendResponse
    ) => {

        if (
            !isSavedWordsMessage(
                message
            )
        ) {
            return;
        }


        if (
            message.type ===
            "CRA_CHECK_SAVED_WORD"
        ) {

            void findSavedWord(
                message.word,
                message.sentence
            )
                .then(
                    (item) => {

                        sendResponse({
                            ok: true,
                            saved:
                                Boolean(item),
                            item,
                        } satisfies SavedWordsResponse);
                    }
                );

            return true;
        }


        if (
            message.type ===
            "CRA_TOGGLE_SAVED_WORD"
        ) {

            void toggleSavedWord(
                message.entry
            )
                .then(
                    (result) => {

                        sendResponse({
                            ok: true,
                            ...result,
                        } satisfies SavedWordsResponse);
                    }
                );

            return true;
        }


        if (
            message.type ===
            "CRA_LIST_SAVED_WORDS"
        ) {

            void listSavedWords()
                .then(
                    (items) => {

                        sendResponse({
                            ok: true,
                            items,
                        } satisfies SavedWordsResponse);
                    }
                );

            return true;
        }


        if (
            message.type ===
            "CRA_DELETE_SAVED_WORD"
        ) {

            void deleteSavedWord(
                message.id
            )
                .then(
                    () => {

                        sendResponse({
                            ok: true,
                        } satisfies SavedWordsResponse);
                    }
                );

            return true;
        }


        if (
            message.type ===
            "CRA_OPEN_SAVED_WORDS"
        ) {

            void chrome.tabs.create({
                url:
                    chrome.runtime
                        .getURL(
                            "saved.html"
                        ),
            })
                .then(
                    () => {

                        sendResponse({
                            ok: true,
                        } satisfies SavedWordsResponse);
                    }
                );

            return true;
        }

        return;
    }
);