export interface ContextualExplanationResult {
    word: string;

    contextualMeaning: string;
}

export type ContextualExplanationState =
    | {
        status: "idle";
    }
    | {
        status: "loading";
    }
    | {
        status: "success";
        text: string;
    }
    | {
        status: "error";
        message: string;
    };