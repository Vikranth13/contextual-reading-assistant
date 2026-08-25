console.log(
    "[CRA] Service worker loaded."
);

chrome.runtime.onInstalled.addListener(() => {
    console.log(
        "[CRA] Contextual Reading Assistant installed or updated."
    );
});