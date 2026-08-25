const READABLE_BLOCK_SELECTOR = [
    "p",
    "li",
    "blockquote",
    "td",
    "th",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "figcaption",
    "dd",
    "dt",
].join(",");

const COMMON_ABBREVIATIONS = [
    "mr.",
    "mrs.",
    "ms.",
    "dr.",
    "prof.",
    "sr.",
    "jr.",
    "st.",
    "vs.",
    "etc.",
    "e.g.",
    "i.e.",
    "u.s.",
    "u.k.",
];

function getElementFromNode(
    node: Node
): Element | null {
    if (node.nodeType === Node.ELEMENT_NODE) {
        return node as Element;
    }

    return node.parentElement;
}

function findReadableContainer(
    range: Range
): Element | null {
    const startElement =
        getElementFromNode(range.startContainer);

    if (!startElement) {
        return null;
    }

    const readableBlock =
        startElement.closest(
            READABLE_BLOCK_SELECTOR
        );

    if (readableBlock) {
        return readableBlock;
    }

    return startElement.parentElement
        ?? startElement;
}

function getSelectionStartOffset(
    container: Element,
    range: Range
): number | null {
    try {
        const beforeSelection =
            document.createRange();

        beforeSelection.selectNodeContents(
            container
        );

        beforeSelection.setEnd(
            range.startContainer,
            range.startOffset
        );

        return beforeSelection.toString().length;
    } catch {
        return null;
    }
}

function isSentenceBoundary(
    text: string,
    index: number
): boolean {
    const character = text[index];

    if (
        character !== "." &&
        character !== "!" &&
        character !== "?"
    ) {
        return false;
    }

    if (
        character === "." &&
        index > 0 &&
        index < text.length - 1 &&
        /\d/.test(text[index - 1]) &&
        /\d/.test(text[index + 1])
    ) {
        return false;
    }

    if (character === ".") {
        const textBeforeBoundary =
            text
                .slice(
                    Math.max(0, index - 10),
                    index + 1
                )
                .toLowerCase();

        const isAbbreviation =
            COMMON_ABBREVIATIONS.some(
                (abbreviation) =>
                    textBeforeBoundary.endsWith(
                        abbreviation
                    )
            );

        if (isAbbreviation) {
            return false;
        }
    }

    return true;
}

function normalizeWhitespace(
    text: string
): string {
    return text
        .replace(/\s+/g, " ")
        .trim();
}

function createContextFallback(
    text: string,
    selectionStart: number,
    selectionEnd: number
): string {
    const radius = 140;

    const start =
        Math.max(
            0,
            selectionStart - radius
        );

    const end =
        Math.min(
            text.length,
            selectionEnd + radius
        );

    return normalizeWhitespace(
        text.slice(start, end)
    );
}

export function extractSentence(
    range: Range
): string {
    const container =
        findReadableContainer(range);

    if (!container) {
        return normalizeWhitespace(
            range.toString()
        );
    }

    const text =
        container.textContent ?? "";

    if (!text.trim()) {
        return normalizeWhitespace(
            range.toString()
        );
    }

    const selectionStart =
        getSelectionStartOffset(
            container,
            range
        );

    if (selectionStart === null) {
        return normalizeWhitespace(
            range.toString()
        );
    }

    const selectionEnd =
        selectionStart +
        range.toString().length;

    let sentenceStart = 0;

    for (
        let index = selectionStart - 1;
        index >= 0;
        index--
    ) {
        if (
            isSentenceBoundary(
                text,
                index
            )
        ) {
            sentenceStart =
                index + 1;
            break;
        }
    }

    let sentenceEnd =
        text.length;

    for (
        let index = selectionEnd;
        index < text.length;
        index++
    ) {
        if (
            isSentenceBoundary(
                text,
                index
            )
        ) {
            sentenceEnd =
                index + 1;
            break;
        }
    }

    while (
        sentenceEnd < text.length &&
        /["'”’)\]]/.test(
            text[sentenceEnd]
        )
    ) {
        sentenceEnd++;
    }

    const sentence =
        normalizeWhitespace(
            text.slice(
                sentenceStart,
                sentenceEnd
            )
        );

    if (
        !sentence ||
        sentence.length > 500
    ) {
        return createContextFallback(
            text,
            selectionStart,
            selectionEnd
        );
    }

    return sentence;
}