export interface SelectionData {
    word: string;
    range: Range;
    rect: DOMRect;
}

const WORD_PATTERN =
    /^[\p{L}\p{M}]+(?:['’\-][\p{L}\p{M}]+)*$/u;

function normalizeSelectedText(
    text: string
): string {
    return text
        .trim()
        .replace(
            /^[^\p{L}\p{M}]+|[^\p{L}\p{M}]+$/gu,
            ""
        );
}

function isValidSelectedWord(
    text: string
): boolean {
    if (!text) {
        return false;
    }

    if (text.length > 60) {
        return false;
    }

    if (/\s/.test(text)) {
        return false;
    }

    return WORD_PATTERN.test(text);
}

export function getSelectionData():
    SelectionData | null {

    const selection =
        window.getSelection();

    if (
        !selection ||
        selection.rangeCount === 0 ||
        selection.isCollapsed
    ) {
        return null;
    }

    const word =
        normalizeSelectedText(
            selection.toString()
        );

    if (!isValidSelectedWord(word)) {
        return null;
    }

    const range =
        selection
            .getRangeAt(0)
            .cloneRange();

    const rect =
        range.getBoundingClientRect();

    if (
        rect.width === 0 ||
        rect.height === 0
    ) {
        return null;
    }

    return {
        word,
        range,
        rect,
    };
}