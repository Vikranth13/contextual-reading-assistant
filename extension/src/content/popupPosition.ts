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