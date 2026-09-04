import {
    useEffect,
    useState,
} from "react";

import {
    getSavedWords,
    removeSavedWord,
} from "../api/savedWords";

import type {
    SavedWord,
} from "../types/savedWord";


export function SavedWordsPage() {

    const [
        words,
        setWords,
    ] =
        useState<SavedWord[]>(
            []
        );

    const [
        loading,
        setLoading,
    ] =
        useState(true);

    const [
        error,
        setError,
    ] =
        useState("");


    


    async function handleDelete(
        id: string
    ) {

        try {
            await removeSavedWord(
                id
            );

            setWords(
                (
                    current
                ) =>
                    current.filter(
                        (word) =>
                            word.id !==
                                id
                    )
            );

        } catch {
            setError(
                "Unable to remove saved word."
            );
        }
    }


    useEffect(
        () => {
            let cancelled = false;

            getSavedWords()
                .then(
                    (items) => {
                        if (cancelled) {
                            return;
                        }

                        setWords(
                            items
                        );

                        setError(
                            ""
                        );
                    }
                )
                .catch(
                    () => {
                        if (cancelled) {
                            return;
                        }

                        setError(
                            "Unable to load saved words."
                        );
                    }
                )
                .finally(
                    () => {
                        if (cancelled) {
                            return;
                        }

                        setLoading(
                            false
                        );
                    }
                );

            return () => {
                cancelled = true;
            };
        },
        []
    );


    return (
        <main
            style={{
                maxWidth: 760,
                margin:
                    "40px auto",
                padding:
                    "0 20px",

                fontFamily:
                    "system-ui, sans-serif",

                color:
                    "#111827",
            }}
        >
            <h1>
                Saved Words
            </h1>

            <p
                style={{
                    color:
                        "#6b7280",
                }}
            >
                Vocabulary saved while
                reading.
            </p>

            {loading && (
                <p>
                    Loading...
                </p>
            )}

            {error && (
                <p
                    style={{
                        color:
                            "#991b1b",
                    }}
                >
                    {error}
                </p>
            )}

            {!loading &&
                words.length ===
                    0 && (
                    <p>
                        No saved words yet.
                    </p>
                )}

            <div
                style={{
                    display: "grid",
                    gap: 14,
                }}
            >
                {words.map(
                    (item) => (
                        <article
                            key={
                                item.id
                            }

                            style={{
                                border:
                                    "1px solid #e5e7eb",

                                borderRadius:
                                    10,

                                padding:
                                    16,

                                background:
                                    "#ffffff",
                            }}
                        >
                            <div
                                style={{
                                    display:
                                        "flex",

                                    justifyContent:
                                        "space-between",

                                    gap: 12,
                                }}
                            >
                                <div>
                                    <strong
                                        style={{
                                            fontSize:
                                                18,
                                        }}
                                    >
                                        {
                                            item.word
                                        }
                                    </strong>

                                    {
                                        item.partOfSpeech &&
                                        (
                                            <span
                                                style={{
                                                    marginLeft:
                                                        8,

                                                    color:
                                                        "#6b7280",
                                                }}
                                            >
                                                {
                                                    item.partOfSpeech
                                                }
                                            </span>
                                        )
                                    }
                                </div>

                                <button
                                    type="button"

                                    onClick={
                                        () =>
                                            void handleDelete(
                                                item.id
                                            )
                                    }
                                >
                                    Remove
                                </button>
                            </div>

                            <p>
                                {
                                    item.definition
                                }
                            </p>

                            {
                                item.contextualMeaning &&
                                (
                                    <>
                                        <strong>
                                            Contextual meaning
                                        </strong>

                                        <p>
                                            {
                                                item.contextualMeaning
                                            }
                                        </p>
                                    </>
                                )
                            }

                            <p
                                style={{
                                    color:
                                        "#6b7280",

                                    fontSize:
                                        13,
                                }}
                            >
                                {
                                    item.sentence
                                }
                            </p>
                        </article>
                    )
                )}
            </div>
        </main>
    );
}