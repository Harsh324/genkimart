import React from "react";

type Props = {
    width?: string | number;
    height?: string | number;
    className?: string;
};

const Shimmer: React.FC<Props> = ({ width = "100%", height = "1rem", className }) => {
    return (
        <div
            className={`animate-pulse bg-gray-300 rounded ${className || ""}`}
            style={{ width, height }}
        />
    );
};

export default Shimmer;
