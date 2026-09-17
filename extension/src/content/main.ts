import {
    createRoot,
    type Root,
} from "react-dom/client";

import {
    lookupWord,
} from "../api/dictionary";

import {
    DefinitionPopup,
    type DefinitionPopupState,
} from "../components/DefinitionPopup";

import {
    SelectionTrigger,
} from "../components/SelectionTrigger";

import {
    DictionaryLookupError,
} from "../types/dictionary";

import {
    calculatePopupPosition,
    calculateTriggerPosition,
} from "./popupPosition";

import {
    extractSentence,
} from "./sentenceExtractor";

import {
    getSelectionData,
    type SelectionData,
} from "./selection";

import {
    explainWordInContext,
} from "../api/contextualExplanation";

import type {
    ContextualExplanationState,
} from "../types/explanation";

import {
    checkSavedWord,
    openSavedWordsPage,
    toggleSavedWord,
} from "../api/savedWords";

import type {
    SavedWordState,
} from "../types/savedWord";

import {
    getSettings,
} from "../storage/settings";

import {
    DEFAULT_SETTINGS,
    type UserSettings,
} from "../types/settings";

console.log(
    "[CRA] Content script loaded."
);

const OVERLAY_HOST_ID =
    "cra-reading-assistant-overlay";

let selectionTimer:
    number | undefined;

let previousSelection = "";

let currentSelection:
    SelectionData | null = null;

let currentSentence = "";

let currentPopupState:
    DefinitionPopupState = {
        status: "loading",
    };

let currentExplanationState:
    ContextualExplanationState = {
        status: "idle",
    };

let overlayHost:
    HTMLElement | null = null;

let overlayRoot:
    Root | null = null;

let activeLookupRequest = 0;

let currentSavedState:
    SavedWordState = {
        status: "idle",
    };

let currentSettings:
    UserSettings = {
        ...DEFAULT_SETTINGS,
    };

function getOrCreateOverlayRoot():
    Root {

    if (overlayRoot) {
        return overlayRoot;
    }

    overlayHost =
        document.createElement(
            "cra-reading-assistant-root"
        );

    overlayHost.id =
        OVERLAY_HOST_ID;

    overlayHost.style.setProperty(
        "position",
        "fixed",
        "important"
    );

    overlayHost.style.setProperty(
        "top",
        "0",
        "important"
    );

    overlayHost.style.setProperty(
        "left",
        "0",
        "important"
    );

    overlayHost.style.setProperty(
        "z-index",
        "2147483647",
        "important"
    );

    const shadowRoot =
        overlayHost.attachShadow({
            mode: "open",
        });

    const mountPoint =
        document.createElement(
            "div"
        );

    shadowRoot.appendChild(
        mountPoint
    );

    document.documentElement
        .appendChild(
            overlayHost
        );

    overlayRoot =
        createRoot(
            mountPoint
        );

    return overlayRoot;
}

function hideOverlay(): void {

    if (overlayRoot) {
        overlayRoot.render(
            null
        );
    }

    /*
     * Invalidate any dictionary request
     * that may still be running.
     */
    activeLookupRequest++;

    currentSelection = null;
    currentSentence = "";

    currentPopupState = {
        status: "loading",
    };

    currentExplanationState = {
    status: "idle",
    };

    currentSavedState = {
        status: "idle",
    };
}


function renderDefinitionPopup():
    void {

    if (!currentSelection) {
        return;
    }

    const position =
        calculatePopupPosition(
            currentSelection.rect
        );

    const root =
        getOrCreateOverlayRoot();

    root.render(
        DefinitionPopup({
            word:
                currentSelection.word,


            left:
                position.left,

            top:
                position.top,

            state:
                currentPopupState,

            explanationState:
                currentExplanationState,

            savedState:
                currentSavedState,

            showPhonetic:
                currentSettings
                    .showPhonetic,

            onToggleSave:
                handleToggleSave,

            onOpenSavedWords:
                handleOpenSavedWords,

            onClose:
                hideOverlay,

            onRetry:
                startDictionaryLookup,

        })
    );
}

async function startDictionaryLookup():
    Promise<void> {

    if (!currentSelection) {
        return;
    }

    /*
     * Every lookup receives its own
     * request number.
     *
     * If another word is selected before
     * this request finishes, its number
     * will no longer match and the old
     * response will be ignored.
     */
    const requestNumber =
        ++activeLookupRequest;

    const word =
        currentSelection.word;

    currentPopupState = {
        status: "loading",
    };

    renderDefinitionPopup();

    try {

        const result =
            await lookupWord(
                word
            );

        /*
         * Ignore stale results.
         */
        if (
            requestNumber !==
            activeLookupRequest
        ) {
            return;
        }

        currentPopupState = {
            status: "success",
            result,
        };

        renderDefinitionPopup();

        void refreshSavedState(
            requestNumber
        );

        if (
            currentSettings
                .enableContextualExplanations
        ) {
            void startContextualExplanation(
                requestNumber
            );

        } else {

            currentExplanationState = {
                status: "idle",
            };

            renderDefinitionPopup();
        }

    } catch (error) {

        /*
         * Ignore errors belonging
         * to an old request.
         */
        if (
            requestNumber !==
            activeLookupRequest
        ) {
            return;
        }

        let message =
            "Definition temporarily unavailable. Please try again.";

        if (
            error instanceof
            DictionaryLookupError
        ) {

            if (
                error.kind ===
                "not_found"
            ) {
                message =
                    `No dictionary definition was found for "${word}".`;
            } else {
                message =
                    error.message;
            }
        }

        currentPopupState = {
            status: "error",
            message,
        };

        renderDefinitionPopup();
    }
}

function handleTriggerClick():
    void {

    if (!currentSelection) {
        return;
    }

    console.log(
        "[CRA] Looking up:",
        {
            word:
                currentSelection.word,

            sentence:
                currentSentence,
        }
    );

    void startDictionaryLookup();
}

function showTrigger(
    data: SelectionData
): void {

    /*
     * If a lookup from an older selection
     * is still running, invalidate it.
     */
    activeLookupRequest++;

    currentSelection =
        data;

    currentSentence =
        extractSentence(
            data.range
        );

    currentPopupState = {
        status: "loading",
    };

    currentExplanationState = {
    status: "idle",
    };

    currentSavedState = {
        status: "idle",
    };

    const position =
        calculateTriggerPosition(
            data.rect
        );

    console.log(
        "[CRA] Selected word:",
        data.word
    );

    console.log(
        "[CRA] Sentence:",
        currentSentence
    );

    console.log(
        "[CRA] Trigger position:",
        position
    );

    const root =
        getOrCreateOverlayRoot();

    root.render(
        SelectionTrigger({
            left:
                position.left,

            top:
                position.top,

            onClick:
                handleTriggerClick,
        })
    );
}

function handleSelection():
    void {

    const data =
        getSelectionData();

    if (!data) {
        previousSelection = "";

        hideOverlay();

        return;
    }

    const selectionKey =
        [
            data.word,
            data.rect.x,
            data.rect.y,
            data.rect.width,
            data.rect.height,
        ].join("-");

    if (
        selectionKey ===
        previousSelection
    ) {
        return;
    }

    previousSelection =
        selectionKey;

    showTrigger(
        data
    );
}

document.addEventListener(
    "selectionchange",
    () => {

        window.clearTimeout(
            selectionTimer
        );

        selectionTimer =
            window.setTimeout(
                handleSelection,
                150
            );
    }
);

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key ===
            "Escape"
        ) {
            previousSelection = "";

            hideOverlay();
        }
    }
);

document.addEventListener(
    "mousedown",
    (event) => {

        const target =
            event.target;

        /*
         * Clicking inside our Shadow DOM
         * is retargeted to the overlay
         * host. Treat that as an internal
         * click and keep the UI open.
         */
        if (
            target instanceof Node &&
            overlayHost?.contains(
                target
            )
        ) {
            return;
        }

        hideOverlay();
    }
);

window.addEventListener(
    "scroll",
    () => {

        previousSelection = "";

        hideOverlay();
    },
    true
);

window.addEventListener(
    "resize",
    () => {

        previousSelection = "";

        hideOverlay();
    }
);

async function loadUserSettings():
Promise<void> {

    try {
        currentSettings =
            await getSettings();

    } catch (error) {

        console.error(
            "[CRA] Unable to load settings:",
            error
        );

        currentSettings = {
            ...DEFAULT_SETTINGS,
        };
    }
}

async function startContextualExplanation(
    requestNumber: number
): Promise<void> {

    if (
        !currentSelection ||
        !currentSentence
    ) {
        return;
    }

    const word =
        currentSelection.word;

    const sentence =
        currentSentence;

    currentExplanationState = {
        status: "loading",
    };

    renderDefinitionPopup();

    try {
        const result =
            await explainWordInContext(
                word,
                sentence
            );

        if (
            requestNumber !==
            activeLookupRequest
        ) {
            return;
        }

        currentExplanationState = {
            status: "success",

            text:
                result.contextualMeaning,
        };

        renderDefinitionPopup();

    } catch (error) {

        if (
            requestNumber !==
            activeLookupRequest
        ) {
            return;
        }

        console.error(
            "[CRA] Context explanation failed:",
            error
        );

        currentExplanationState = {
            status: "error",

            message:
                "Context explanation unavailable.",
        };

        renderDefinitionPopup();
    }
}

async function refreshSavedState(
    requestNumber: number
): Promise<void> {

    if (
        !currentSelection ||
        !currentSentence
    ) {
        return;
    }

    currentSavedState = {
        status: "checking",
    };

    renderDefinitionPopup();

    try {

        const result =
            await checkSavedWord(
                currentSelection.word,
                currentSentence
            );

        if (
            requestNumber !==
            activeLookupRequest
        ) {
            return;
        }

        currentSavedState =
            result.saved &&
            result.item
                ? {
                    status:
                        "saved",

                    id:
                        result.item.id,
                }
                : {
                    status:
                        "unsaved",
                };

    } catch {

        currentSavedState = {
            status: "error",

            message:
                "Unable to check saved state.",
        };
    }

    renderDefinitionPopup();
}

async function handleToggleSave():
Promise<void> {

    if (
        !currentSelection ||
        currentPopupState.status !==
            "success"
    ) {
        return;
    }

    if (
        currentExplanationState.status ===
            "loading" ||
        currentExplanationState.status ===
            "idle"
    ) {
        return;
    }

    const requestNumber =
        activeLookupRequest;

    const dictionaryResult =
        currentPopupState.result;

    currentSavedState = {
        status: "checking",
    };

    renderDefinitionPopup();

    try {

        const result =
            await toggleSavedWord({
                word:
                    currentSelection.word,

                definition:
                    dictionaryResult.definition,

                partOfSpeech:
                    dictionaryResult.partOfSpeech,

                phonetic:
                    dictionaryResult.phonetic,

                sentence:
                    currentSentence,

                contextualMeaning:
                    currentExplanationState
                        .status ===
                        "success"
                        ? currentExplanationState
                            .text
                        : undefined,
            });

        if (
            requestNumber !==
            activeLookupRequest
        ) {
            return;
        }

        currentSavedState =
            result.saved &&
            result.item
                ? {
                    status:
                        "saved",

                    id:
                        result.item.id,
                }
                : {
                    status:
                        "unsaved",
                };

    } catch {

        currentSavedState = {
            status: "error",

            message:
                "Unable to save word.",
        };
    }

    renderDefinitionPopup();
}

function handleOpenSavedWords():
void {

    void openSavedWordsPage();
}

void loadUserSettings();

chrome.storage.onChanged.addListener(
    (
        changes,
        areaName
    ) => {

        if (
            areaName === "local" &&
            changes[
                "cra_settings_v1"
            ]
        ) {
            void loadUserSettings();
        }
    }
);