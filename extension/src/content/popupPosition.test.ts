// @vitest-environment jsdom

import {
    describe,
    expect,
    it,
    beforeEach,
} from "vitest";

import {
    calculatePopupPosition,
    calculateTriggerPosition,
} from "./popupPosition";


function createRect(
    left: number,
    top: number,
    width: number,
    height: number
): DOMRect {

    return {
        left,
        top,
        width,
        height,

        right:
            left + width,

        bottom:
            top + height,

        x: left,
        y: top,

        toJSON:
            () => ({}),
    } as DOMRect;
}


describe(
    "popup positioning",
    () => {

        beforeEach(
            () => {

                Object.defineProperty(
                    window,
                    "innerWidth",
                    {
                        configurable: true,
                        value: 1200,
                    }
                );

                Object.defineProperty(
                    window,
                    "innerHeight",
                    {
                        configurable: true,
                        value: 800,
                    }
                );
            }
        );


        it(
            "keeps trigger inside viewport",
            () => {

                const position =
                    calculateTriggerPosition(
                        createRect(
                            2,
                            300,
                            20,
                            20
                        )
                    );

                expect(
                    position.left
                ).toBeGreaterThanOrEqual(
                    8
                );
            }
        );


        it(
            "keeps popup inside left viewport edge",
            () => {

                const position =
                    calculatePopupPosition(
                        createRect(
                            2,
                            300,
                            20,
                            20
                        )
                    );

                expect(
                    position.left
                ).toBeGreaterThanOrEqual(
                    8
                );
            }
        );
    }
);