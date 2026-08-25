interface SelectionTriggerProps {
    left: number;
    top: number;
    onClick: () => void;
}

export function SelectionTrigger({
    left,
    top,
    onClick,
}: SelectionTriggerProps) {
    return (
        <button
            type="button"
            aria-label="Explain selected word"
            title="Explain selected word"
            onMouseDown={(event) => {
                event.preventDefault();
            }}
            onClick={(event) => {
                event.stopPropagation();
                onClick();
            }}
            style={{
                position: "fixed",
                left,
                top,
                width: 36,
                height: 36,
                border: "none",
                borderRadius: "50%",
                background: "#111827",
                color: "#ffffff",
                fontSize: 18,
                lineHeight: "36px",
                textAlign: "center",
                padding: 0,
                margin: 0,
                cursor: "pointer",
                boxShadow:
                    "0 4px 14px rgba(0, 0, 0, 0.22)",
                zIndex: 2147483647,
                fontFamily:
                    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
        >
            ✦
        </button>
    );
}