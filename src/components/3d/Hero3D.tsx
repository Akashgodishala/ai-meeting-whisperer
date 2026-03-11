import React, { useState, useEffect } from 'react';

// Professional AI Agent Component
const Hero3D = () => {
  const [currentMessage, setCurrentMessage] = useState(0);
  
  const messages = [
    "Waiting for your call...",
    "Enter the Voice World",
    "Let's talk with AI!",
    "Retailer Voice Agent is ready"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-[500px] relative flex items-center justify-center overflow-hidden">
      
      {/* Simple AI Agent Image */}
      <div className="relative">
        <img 
          src="/lovable-uploads/e01a9cfd-7c25-48a9-9fa5-f274a6f740b7.png"
          alt="Retailer Voice Agent"
          className="w-96 h-auto object-contain"
        />

        {/* Speech Bubble */}
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-xl px-6 py-3 shadow-xl border border-primary/20 min-w-max z-10">
          <div className="text-sm font-medium text-primary text-center whitespace-nowrap">
            {messages[currentMessage]}
          </div>
          {/* Speech bubble arrow */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-6 border-r-6 border-t-6 border-transparent border-t-white/95"></div>
        </div>
      </div>
    </div>
  );
};

export default Hero3D;