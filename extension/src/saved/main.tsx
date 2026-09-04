import {
    StrictMode,
} from "react";

import {
    createRoot,
} from "react-dom/client";

import {
    SavedWordsPage,
} from "./SavedWordsPage";


const root =
    document.getElementById(
        "root"
    );

if (!root) {
    throw new Error(
        "Saved words root not found."
    );
}

createRoot(root).render(
    <StrictMode>
        <SavedWordsPage />
    </StrictMode>
);