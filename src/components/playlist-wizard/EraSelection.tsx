import React, { useState } from 'react';
import { PlaylistFormData } from '@/app/create-playlist/page';
import { motion } from 'framer-motion';

interface EraSelectionProps {
  formData: PlaylistFormData;
  updateFormData: (field: keyof PlaylistFormData, value: any) => void;
}

// List of era options with emojis
const eraOptions = [
  { decade: '17th Century', value: '17th-century', emoji: '🏛️', description: 'Baroque period, early classical compositions, and court music' },
  { decade: '18th Century', value: '18th-century', emoji: '📜', description: 'Classical period, chamber music, and early symphonies' },
  { decade: '19th Century', value: '19th-century', emoji: '🎭', description: 'Romantic era, opera, and nationalist compositions' },
  { decade: 'First Half 20th Century', value: 'early-20th-century', emoji: '🎻', description: 'Ragtime, early jazz, classical modernism, and swing' },
  { decade: '1950s', value: '1950s', emoji: '🎸', description: 'The birth of rock & roll, early R&B, and doo-wop' },
  { decade: '1960s', value: '1960s', emoji: '☮️', description: 'British Invasion, psychedelic rock, and Motown' },
  { decade: '1970s', value: '1970s', emoji: '🕺', description: 'Disco, punk, progressive rock, and early hip-hop' },
  { decade: '1980s', value: '1980s', emoji: '📼', description: 'New wave, synthpop, hair metal, and early hip-hop' },
  { decade: '1990s', value: '1990s', emoji: '💿', description: 'Grunge, gangsta rap, boy bands, and electronic dance music' },
  { decade: '2000s', value: '2000s', emoji: '💻', description: 'Pop punk, indie rock, emo, and mainstream hip-hop' },
  { decade: '2010s', value: '2010s', emoji: '📱', description: 'EDM, trap, streaming-era pop, and indie alternatives' },
  { decade: '2020s', value: '2020s', emoji: '🎧', description: 'Current hits and emerging trends' },
];

const EraSelection: React.FC<EraSelectionProps> = ({ formData, updateFormData }) => {
  const [selectedEras, setSelectedEras] = useState<string[]>(formData.eras);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Handle era selection
  const handleEraSelect = (era: string) => {
    let updatedEras: string[];
    
    if (selectedEras.includes(era)) {
      updatedEras = selectedEras.filter(e => e !== era);
    } else {
      // Limit to 3 eras maximum
      if (selectedEras.length >= 3) {
        showMaxErasReached();
        return;
      }
      updatedEras = [...selectedEras, era];
    }
    
    setSelectedEras(updatedEras);
    updateFormData('eras', updatedEras);
  };

  // Max eras notification
  const [showMaxReached, setShowMaxReached] = useState(false);
  
  const showMaxErasReached = () => {
    setShowMaxReached(true);
    setTimeout(() => {
      setShowMaxReached(false);
    }, 2000);
  };

  // Find era name from value
  const getEraName = (eraValue: string): string => {
    const decadeEra = eraOptions.find(era => era.value === eraValue);
    if (decadeEra) return decadeEra.decade;
    
    return eraValue;
  };

  // Find era emoji from value
  const getEraEmoji = (eraValue: string): string => {
    const decadeEra = eraOptions.find(era => era.value === eraValue);
    if (decadeEra) return decadeEra.emoji;
    
    return '🎵';
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.05
      } 
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  const pulseAnimation = {
    scale: [1, 1.05, 1],
    transition: { 
      duration: 1.5, 
      repeat: Infinity,
      repeatType: "reverse" as const
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Pick a Music Era ⏳</h2>
      <p className="text-gray-400 mb-6">
        Choose up to 3 musical eras you want to include in your playlist.
      </p>
      
      {/* Selected eras */}
      <div className="mb-8 relative">
        <h3 className="text-sm font-medium text-gray-400 mb-3">
          Selected Eras: <span className={`font-bold ${selectedEras.length === 3 ? 'text-[#1DB954]' : ''}`}>{selectedEras.length}/3</span>
        </h3>

        {/* Max eras reached animation - improved styling */}
        {showMaxReached && (
          <motion.div 
            className="mb-4 bg-[#ff4d4f]/10 border border-[#ff4d4f]/30 text-[#ff4d4f] text-center py-3 px-4 rounded-lg shadow-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Maximum of 3 eras reached! Remove one to add another.
            </div>
          </motion.div>
        )}
        
        <div className="flex flex-wrap gap-3">
          {selectedEras.length > 0 ? (
            <motion.div
              className="flex flex-wrap gap-3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {selectedEras.map(era => (
                <motion.span 
                  key={era} 
                  className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-[#1DB954] text-white shadow-lg shadow-[#1DB954]/20"
                  variants={itemVariants}
                  layout
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="mr-2">{getEraEmoji(era)}</span>
                  {getEraName(era)}
                  <button
                    type="button"
                    className="ml-2 inline-flex items-center transition-all duration-200 hover:rotate-90"
                    onClick={() => handleEraSelect(era)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </motion.span>
              ))}
            </motion.div>
          ) : (
            <motion.span 
              className="text-gray-500 text-sm italic py-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              No eras selected yet. Travel through time below! ⬇️
            </motion.span>
          )}
        </div>
      </div>
      
      {/* Decades grid */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {eraOptions.map(era => (
          <motion.button
            key={era.value}
            type="button"
            onClick={() => handleEraSelect(era.value)}
            onMouseEnter={() => setHoveredItem(era.value)}
            onMouseLeave={() => setHoveredItem(null)}
            className={`flex flex-col items-start p-6 rounded-xl transition-all text-left ${
              selectedEras.includes(era.value)
                ? 'bg-gradient-to-br from-[#1DB954]/20 to-[#1DB954]/5 border border-[#1DB954]' 
                : 'bg-gradient-to-br from-[#282828] to-[#1A1A1A] hover:from-[#333333] hover:to-[#222222] border border-transparent'
            }`}
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center w-full justify-between">
              <div className="flex items-center">
                <motion.span 
                  className={`text-3xl mr-4 ${selectedEras.includes(era.value) ? '' : ''}`}
                  animate={hoveredItem === era.value || selectedEras.includes(era.value) ? pulseAnimation : {}}
                >
                  {era.emoji}
                </motion.span>
                <h3 className={`text-lg font-medium ${selectedEras.includes(era.value) ? 'text-[#1DB954]' : 'text-white'}`}>
                  {era.decade}
                </h3>
              </div>
              {selectedEras.includes(era.value) && (
                <motion.span 
                  className="text-[#1DB954]"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </motion.span>
              )}
            </div>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
};

export default EraSelection; 