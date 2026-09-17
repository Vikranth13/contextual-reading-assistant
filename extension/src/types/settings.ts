export interface UserSettings {
    enableContextualExplanations: boolean;
    showPhonetic: boolean;
}


export const DEFAULT_SETTINGS:
    UserSettings = {

    enableContextualExplanations:
        true,

    showPhonetic:
        true,
};