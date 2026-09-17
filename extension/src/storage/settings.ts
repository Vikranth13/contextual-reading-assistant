import {
    DEFAULT_SETTINGS,
    type UserSettings,
} from "../types/settings";


const SETTINGS_KEY =
    "cra_settings_v1";


export async function getSettings():
Promise<UserSettings> {

    const data =
        await chrome.storage.local
            .get(
                SETTINGS_KEY
            );

    const stored =
        data[SETTINGS_KEY] as
            Partial<UserSettings>
            | undefined;

    return {
        ...DEFAULT_SETTINGS,
        ...stored,
    };
}


export async function updateSettings(
    changes:
        Partial<UserSettings>
): Promise<UserSettings> {

    const current =
        await getSettings();

    const updated = {
        ...current,
        ...changes,
    };

    await chrome.storage.local
        .set({
            [SETTINGS_KEY]:
                updated,
        });

    return updated;
}