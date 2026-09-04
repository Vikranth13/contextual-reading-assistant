import type {
    DictionaryResult,
} from "../types/dictionary";

import type {
    ContextualExplanationState,
} from "../types/explanation";

import type {
    SavedWordState,
} from "../types/savedWord";

export type DefinitionPopupState =
    | {
        status: "loading";
    }
    | {
        status: "success";
        result: DictionaryResult;
    }
    | {
        status: "error";
        message: string;
    };

interface DefinitionPopupProps {
    word: string;
    left: number;
    top: number;

    explanationState:
        ContextualExplanationState;

    state:
        DefinitionPopupState;

    savedState:
        SavedWordState;

    onToggleSave:
        () => void;

    onOpenSavedWords:
        () => void;

    onClose:
        () => void;

    onRetry:
        () => void;
}

const popupStyle:
    React.CSSProperties = {
        position: "fixed",

        width: 260,
        maxWidth:
            "calc(100vw - 16px)",

        maxHeight: 130,
        overflowY: "auto",

        boxSizing:
            "border-box",

        background:
            "#ffffff",

        color:
            "#111827",

        border:
            "1px solid rgba(17, 24, 39, 0.10)",

        borderRadius: 10,

        boxShadow:
            "0 8px 22px rgba(0, 0, 0, 0.16)",

        padding: 10,

        fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

        fontSize: 12,
        lineHeight: 1.35,

        zIndex:
            2147483647,
    };

const headingStyle:
    React.CSSProperties = {
        margin: 0,

        fontSize: 15,
        lineHeight: 1.2,

        fontWeight: 700,
    };

const subtleTextStyle:
    React.CSSProperties = {
        color: "#6b7280",

        fontSize: 11,

        marginTop: 1,
    };

const sectionTitleStyle:
    React.CSSProperties = {
        marginTop: 9,
        marginBottom: 2,

        fontSize: 10,
        lineHeight: 1.3,

        fontWeight: 700,

        textTransform:
            "uppercase",

        letterSpacing:
            "0.04em",

        color:
            "#6b7280",
    };

const buttonStyle:
    React.CSSProperties = {
        border:
            "1px solid #d1d5db",

        borderRadius: 7,

        background:
            "#ffffff",

        color:
            "#111827",

        padding:
            "6px 9px",

        fontSize: 12,

        fontWeight: 600,

        cursor:
            "pointer",

        fontFamily:
            "inherit",
    };

export function DefinitionPopup({
    word,
    left,
    top,
    state,
    explanationState,
    savedState,
    onToggleSave,
    onOpenSavedWords,
    onClose,
    onRetry,
}: DefinitionPopupProps) {

    const saveDisabled =
        savedState.status ===
            "checking"
        ||
        explanationState.status ===
            "idle"
        ||
        explanationState.status ===
            "loading";

    return (
        <section
            aria-label={
                `Definition of ${word}`
            }

            style={{
                ...popupStyle,
                left,
                top,
            }}

            onMouseDown={(
                event
            ) => {
                event.stopPropagation();
            }}
        >
            <div
                style={{
                    display:
                        "flex",

                    justifyContent:
                        "space-between",

                    alignItems:
                        "flex-start",

                    gap: 10,
                }}
            >
                <div>
                    <h2
                        style={
                            headingStyle
                        }
                    >
                        {word}
                    </h2>

                    {state.status ===
                        "success" &&
                        state.result
                            .partOfSpeech && (
                            <div
                                style={
                                    subtleTextStyle
                                }
                            >
                                {
                                    state
                                        .result
                                        .partOfSpeech
                                }
                            </div>
                        )}

                    {state.status ===
                        "success" &&
                        state.result
                            .phonetic && (
                            <div
                                style={
                                    subtleTextStyle
                                }
                            >
                                {
                                    state
                                        .result
                                        .phonetic
                                }
                            </div>
                        )}
                </div>

                <button
                    type="button"

                    aria-label=
                        "Close definition"

                    title="Close"

                    onClick={
                        onClose
                    }

                    style={{
                        ...buttonStyle,

                        border:
                            "none",

                        padding:
                            "3px 6px",

                        fontSize: 17,

                        lineHeight: 1,
                    }}
                >
                    ×
                </button>
            </div>

            {state.status ===
                "loading" && (
                <div
                    style={{
                        marginTop: 8,

                        color:
                            "#6b7280",
                    }}
                >
                    Looking up
                    definition...
                </div>
            )}

            {state.status ===
                "error" && (
                <>
                    <div
                        role="alert"

                        style={{
                            marginTop: 8,

                            color:
                                "#991b1b",
                        }}
                    >
                        {
                            state.message
                        }
                    </div>

                    <div
                        style={{
                            marginTop: 10,
                        }}
                    >
                        <button
                            type="button"

                            onClick={
                                onRetry
                            }

                            style={
                                buttonStyle
                            }
                        >
                            Try again
                        </button>
                    </div>
                </>
            )}

            {state.status ===
                "success" && (
                <>
                    <div
                        style={
                            sectionTitleStyle
                        }
                    >
                        Definition
                    </div>

                    <div>
                        {
                            state.result
                                .definition
                        }
                    </div>

                    <div
                        style={
                            sectionTitleStyle
                        }
                    >
                        Contextual meaning
                    </div>

                    {explanationState.status ===
                        "idle" && (
                            <div
                                style={{
                                    color:
                                        "#6b7280",
                                }}
                            >
                                Waiting for context...
                            </div>
                        )}

                    {explanationState.status ===
                        "loading" && (
                            <div
                                style={{
                                    color:
                                        "#6b7280",
                                }}
                            >
                                Explaining in context...
                            </div>
                        )}

                    {explanationState.status ===
                        "success" && (
                            <div>
                                {
                                    explanationState.text
                                }
                            </div>
                        )}

                    {explanationState.status ===
                        "error" && (
                            <div
                                style={{
                                    color:
                                        "#6b7280",
                                }}
                            >
                                {
                                    explanationState.message
                                }
                            </div>
                        )}
                    <div
                        style={{
                            display: "flex",
                            gap: 6,
                            marginTop: 9,
                        }}
                    >
                        <button
                            type="button"

                            disabled={
                                saveDisabled
                            }

                            onClick={
                                onToggleSave
                            }

                            style={{
                                ...buttonStyle,

                                opacity:
                                    saveDisabled
                                        ? 0.55
                                        : 1,

                                cursor:
                                    saveDisabled
                                        ? "default"
                                        : "pointer",
                            }}
                        >
                            {
                                savedState.status ===
                                    "saved"
                                    ? "Saved ✓"
                                    : savedState.status ===
                                        "checking"
                                        ? "Checking..."
                                        : "Save"
                            }
                        </button>

                        <button
                            type="button"

                            onClick={
                                onOpenSavedWords
                            }

                            style={
                                buttonStyle
                            }
                        >
                            Saved words
                        </button>
                    </div>
                </>
            )}
        </section>
    );
}