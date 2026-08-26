export type TriggerPlacement =
    "above" | "below";

export interface TriggerPosition {
    left: number;
    top: number;
    placement: TriggerPlacement;
}

const TRIGGER_SIZE = 36;
const GAP = 8;
const VIEWPORT_PADDING = 8;

export function calculateTriggerPosition(
    rect: DOMRect
): TriggerPosition {
    let left =
        rect.left +
        rect.width / 2 -
        TRIGGER_SIZE / 2;

    const maximumLeft =
        window.innerWidth -
        TRIGGER_SIZE -
        VIEWPORT_PADDING;

    left = Math.max(
        VIEWPORT_PADDING,
        Math.min(
            left,
            maximumLeft
        )
    );

    const canShowAbove =
        rect.top >=
        TRIGGER_SIZE +
        GAP +
        VIEWPORT_PADDING;

    if (canShowAbove) {
        return {
            left,
            top:
                rect.top -
                TRIGGER_SIZE -
                GAP,
            placement: "above",
        };
    }

    let top =
        rect.bottom + GAP;

    const maximumTop =
        window.innerHeight -
        TRIGGER_SIZE -
        VIEWPORT_PADDING;

    top = Math.min(
        top,
        maximumTop
    );

    top = Math.max(
        VIEWPORT_PADDING,
        top
    );

    return {
        left,
        top,
        placement: "below",
    };
}

export type PopupPlacement =
    "above" | "below";

export interface PopupPosition {
    left: number;
    top: number;
    placement: PopupPlacement;
}

const POPUP_WIDTH = 260;
const POPUP_HEIGHT_ESTIMATE = 130;
const POPUP_GAP = 10;
const POPUP_VIEWPORT_PADDING = 8;

export function calculatePopupPosition(
    rect: DOMRect
): PopupPosition {

    let left =
        rect.left +
        rect.width / 2 -
        POPUP_WIDTH / 2;

    const maximumLeft =
        window.innerWidth -
        POPUP_WIDTH -
        POPUP_VIEWPORT_PADDING;

    left = Math.max(
        POPUP_VIEWPORT_PADDING,
        Math.min(
            left,
            maximumLeft
        )
    );

    const availableBelow =
        window.innerHeight -
        rect.bottom -
        POPUP_GAP -
        POPUP_VIEWPORT_PADDING;

    const availableAbove =
        rect.top -
        POPUP_GAP -
        POPUP_VIEWPORT_PADDING;

    const showBelow =
        availableBelow >=
            POPUP_HEIGHT_ESTIMATE ||
        availableBelow >=
            availableAbove;

    if (showBelow) {
        const top =
            Math.max(
                POPUP_VIEWPORT_PADDING,
                Math.min(
                    rect.bottom +
                        POPUP_GAP,

                    window.innerHeight -
                        POPUP_HEIGHT_ESTIMATE -
                        POPUP_VIEWPORT_PADDING
                )
            );

        return {
            left,
            top,
            placement: "below",
        };
    }

    const top =
        Math.max(
            POPUP_VIEWPORT_PADDING,
            rect.top -
                POPUP_HEIGHT_ESTIMATE -
                POPUP_GAP
        );

    return {
        left,
        top,
        placement: "above",
    };
}