import {
    createRoot,
    type Root,
} from "react-dom/client";

import {
    SelectionTrigger,
} from "../components/SelectionTrigger";

import {
    calculateTriggerPosition,
} from "./popupPosition";

import {
    extractSentence,
} from "./sentenceExtractor";

import {
    getSelectionData,
    type SelectionData,
} from "./selection";

console.log(
    "[CRA] Content script loaded."
);

const TRIGGER_HOST_ID =
    "cra-selection-trigger-host";

let selectionTimer:
    number | undefined;

let previousSelection = "";

let currentSelection:
    SelectionData | null = null;

let currentSentence = "";

let triggerHost:
    HTMLElement | null = null;

let triggerRoot:
    Root | null = null;

function getOrCreateTriggerRoot(): Root {
    if (triggerRoot) {
        return triggerRoot;
    }

    triggerHost =
        document.createElement(
            "cra-reading-assistant-root"
        );

    triggerHost.id =
        TRIGGER_HOST_ID;

    triggerHost.style.setProperty(
        "position",
        "fixed",
        "important"
    );

    triggerHost.style.setProperty(
        "top",
        "0",
        "important"
    );

    triggerHost.style.setProperty(
        "left",
        "0",
        "important"
    );

    triggerHost.style.setProperty(
        "z-index",
        "2147483647",
        "important"
    );

    const shadowRoot =
        triggerHost.attachShadow({
            mode: "open",
        });

    const mountPoint =
        document.createElement("div");

    shadowRoot.appendChild(
        mountPoint
    );

    document.documentElement.appendChild(
        triggerHost
    );

    triggerRoot =
        createRoot(mountPoint);

    return triggerRoot;
}

function hideTrigger(): void {
    if (triggerRoot) {
        triggerRoot.render(null);
    }

    currentSelection = null;
    currentSentence = "";
}

function handleTriggerClick(): void {
    if (!currentSelection) {
        return;
    }

    console.log(
        "[CRA] Trigger clicked:",
        {
            word:
                currentSelection.word,
            sentence:
                currentSentence,
        }
    );
}

function showTrigger(
    data: SelectionData
): void {
    currentSelection = data;

    currentSentence =
        extractSentence(
            data.range
        );

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
        getOrCreateTriggerRoot();

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

function handleSelection(): void {
    const data =
        getSelectionData();

    if (!data) {
        previousSelection = "";
        hideTrigger();
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

    showTrigger(data);
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
            event.key === "Escape"
        ) {
            previousSelection = "";
            hideTrigger();
        }
    }
);

document.addEventListener(
    "mousedown",
    (event) => {
        const target =
            event.target;

        if (
            target instanceof Node &&
            triggerHost?.contains(
                target
            )
        ) {
            return;
        }

        hideTrigger();
    }
);

window.addEventListener(
    "scroll",
    () => {
        previousSelection = "";
        hideTrigger();
    },
    true
);

window.addEventListener(
    "resize",
    () => {
        previousSelection = "";
        hideTrigger();
    }
);