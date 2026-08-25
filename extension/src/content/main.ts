import {
    getSelectionData,
} from "./selection";

console.log(
    "[CRA] Content script loaded."
);

let selectionTimer:
    number | undefined;

let previousSelection = "";

function handleSelection(): void {

    const data =
        getSelectionData();

    if (!data) {
        previousSelection = "";
        return;
    }

    const selectionKey =
        `${data.word}-${data.rect.x}-${data.rect.y}`;

    if (
        selectionKey ===
        previousSelection
    ) {
        return;
    }

    previousSelection =
        selectionKey;

    console.log(
        "[CRA] Selected word:",
        data.word
    );

    console.log(
        "[CRA] Selection position:",
        {
            x: data.rect.x,
            y: data.rect.y,
            width: data.rect.width,
            height: data.rect.height,
        }
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