import React from "react";

const HeartRateMonitor = ({ color = "#5eead4", opacity = 0.3, scale = 1 }) => {
    return (
        <div
            className="ecg-container"
            style={{
                width: "100%",
                maxWidth: "600px",
                height: "120px",
                overflow: "hidden",
                position: "relative",
                opacity: opacity,
                transform: `scale(${scale})`,
                pointerEvents: "none",
            }}
        >
            <svg
                viewBox="0 0 400 100"
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
            >
                {/* ECG Line */}
                <path
                    className="ecg-path"
                    d="M 0 50 L 50 50 L 60 40 L 70 70 L 85 20 L 100 80 L 110 50 L 160 50 L 170 40 L 180 70 L 195 20 L 210 80 L 220 50 L 270 50 L 280 40 L 290 70 L 305 20 L 320 80 L 330 50 L 400 50"
                    fill="none"
                    stroke={color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Subtle Pulse Dots at peaks */}
                {[85, 195, 305].map((x, i) => (
                    <circle
                        key={i}
                        cx={x}
                        cy="20"
                        r="3"
                        fill={color}
                        className="heartbeat-dot"
                        style={{ animationDelay: `${i * 1.3}s` }}
                    />
                ))}
            </svg>
        </div>
    );
};

export default HeartRateMonitor;
