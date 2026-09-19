import React from 'react';
import MagicBento from '../ReactBits/MagicBento';
import './HowItWorksSection.css'; // Keep this for the header styles

const steps = [
  {
    num: "01",
    title: "CREATE",
    desc: "Open a canvas and start with a blank workspace."
  },
  {
    num: "02",
    title: "SHARE",
    desc: "Invite others into the same room with an instant URL."
  },
  {
    num: "03",
    title: "COLLABORATE",
    desc: "Draw, move, connect, and watch changes sync instantly."
  }
];

const HowItWorksSection = () => {
  return (
    <section className="hiw-section">
      <div className="hiw-header">
        <span className="hiw-badge">HOW IT WORKS</span>
        <h2>Start collaborating in seconds.</h2>
        <p>Zero installation. No cumbersome account setup required to start drawing.</p>
      </div>

      <div className="hiw-container">
        {/* We can still keep your background line for aesthetic context */}
        <div className="hiw-connecting-line"></div>
        
        {/* Replace the static grid with MagicBento */}
        <MagicBento 
          cards={steps}
          textAutoHide={false} 
          enableStars={true}
          enableSpotlight={true}
          enableBorderGlow={true}
          enableTilt={true}
          enableMagnetism={true}
          clickEffect={true}
          spotlightRadius={300}
          particleCount={12}
          glowColor="168, 85, 247" /* Matches your theme #a855f7 */
        />
      </div>
    </section>
  );
};

export default HowItWorksSection;