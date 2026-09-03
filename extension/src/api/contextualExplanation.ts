import type {
    ContextualExplanationResult,
} from "../types/explanation";


interface ExplanationMessageResponse {
    ok: boolean;

    result?:
        ContextualExplanationResult;

    message?: string;
}


export async function explainWordInContext(
    word: string,
    sentence: string
): Promise<ContextualExplanationResult> {

    let response:
        ExplanationMessageResponse;

    try {
        response =
            await chrome.runtime
                .sendMessage({
                    type:
                        "CRA_CONTEXTUAL_EXPLANATION",

                    word,
                    sentence,
                }) as
                ExplanationMessageResponse;

    } catch {
        throw new Error(
            "Unable to communicate with the extension service worker."
        );
    }

    if (
        !response ||
        !response.ok ||
        !response.result
    ) {
        throw new Error(
            response?.message
            ||
            "Context explanation is unavailable."
        );
    }

    return response.result;
}