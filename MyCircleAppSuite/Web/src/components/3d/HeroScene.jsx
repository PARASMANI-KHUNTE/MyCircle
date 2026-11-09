import React from 'react';

const HeroScene = () => {
    // Static minimalist background - no animation, just solid colors
    return (
        <div className="absolute top-0 right-0 w-[50%] h-[400px] bg-black/50 pointer-events-none">
            {/* Orange accent bar */}
            <div className="absolute bottom-0 left-0 w-full h-px bg-orange/60" />
            {/* Orange circle accent */}
            <div className="absolute -top-6 left-6 w-16 h-16 bg-orange/20 rounded-full opacity-70" />
        </div>
    );
};

export default HeroScene;