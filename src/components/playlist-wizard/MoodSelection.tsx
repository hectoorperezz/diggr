import React, { useState } from 'react';
import { PlaylistFormData } from '@/app/create-playlist/page';
import { motion } from 'framer-motion';

interface MoodSelectionProps {
  formData: PlaylistFormData;
  updateFormData: (field: keyof PlaylistFormData, value: any) => void;
}

// List of mood options with emojis
const moodOptions = [
  {
    category: 'Energy',
    icon: '⚡',
    moods: [
      { name: 'Energetic', value: 'energetic', emoji: '💪' },
      { name: 'Relaxed', value: 'relaxed', emoji: '😌' },
      { name: 'Calm', value: 'calm', emoji: '🧘' },
      { name: 'Intense', value: 'intense', emoji: '🔥' },
      { name: 'Mellow', value: 'mellow', emoji: '🌊' },
    ]
  },
  {
    category: 'Emotion',
    icon: '💖',
    moods: [
      { name: 'Happy', value: 'happy', emoji: '😊' },
      { name: 'Sad', value: 'sad', emoji: '😢' },
      { name: 'Angry', value: 'angry', emoji: '😠' },
      { name: 'Nostalgic', value: 'nostalgic', emoji: '🕰️' },
      { name: 'Romantic', value: 'romantic', emoji: '💘' },
      { name: 'Melancholic', value: 'melancholic', emoji: '🥀' },
    ]
  },
  {
    category: 'Atmosphere',
    icon: '🌈',
    moods: [
      { name: 'Dreamy', value: 'dreamy', emoji: '✨' },
      { name: 'Dark', value: 'dark', emoji: '🌙' },
      { name: 'Uplifting', value: 'uplifting', emoji: '🎈' },
      { name: 'Ethereal', value: 'ethereal', emoji: '🌌' },
      { name: 'Gritty', value: 'gritty', emoji: '🧱' },
      { name: 'Spacey', value: 'spacey', emoji: '🚀' },
      { name: 'Atmospheric', value: 'atmospheric', emoji: '☁️' },
    ]
  },
  {
    category: 'Setting',
    icon: '🏙️',
    moods: [
      { name: 'Party', value: 'party', emoji: '🎉' },
      { name: 'Study', value: 'study', emoji: '📚' },
      { name: 'Workout', value: 'workout', emoji: '🏋️' },
      { name: 'Focus', value: 'focus', emoji: '🎯' },
      { name: 'Chill', value: 'chill', emoji: '🛋️' },
      { name: 'Driving', value: 'driving', emoji: '🚗' },
      { name: 'Background', value: 'background', emoji: '🎧' },
    ]
  },
  {
    category: 'Tempo',
    icon: '⏱️',
    moods: [
      { name: 'Fast', value: 'fast', emoji: '⚡' },
      { name: 'Slow', value: 'slow', emoji: '🐢' },
      { name: 'Moderate', value: 'moderate', emoji: '➡️' },
      { name: 'Upbeat', value: 'upbeat', emoji: '⬆️' },
      { name: 'Downtempo', value: 'downtempo', emoji: '⬇️' },
    ]
  }
];

const MoodSelection: React.FC<MoodSelectionProps> = ({ formData, updateFormData }) => {
  const [selectedMoods, setSelectedMoods] = useState<string[]>(formData.moods);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Handle mood selection
  const handleMoodSelect = (mood: string) => {
    let updatedMoods: string[];
    
    if (selectedMoods.includes(mood)) {
      updatedMoods = selectedMoods.filter(m => m !== mood);
    } else {
      // Limit to 5 moods maximum
      if (selectedMoods.length >= 5) {
        // Use a more engaging approach than an alert
        showMaxMoodsReached();
        return;
      }
      updatedMoods = [...selectedMoods, mood];
    }
    
    setSelectedMoods(updatedMoods);
    updateFormData('moods', updatedMoods);
  };

  // Show max moods reached animation/notification
  const [showMaxReached, setShowMaxReached] = useState(false);
  
  const showMaxMoodsReached = () => {
    setShowMaxReached(true);
    setTimeout(() => {
      setShowMaxReached(false);
    }, 2000);
  };

  // Filter moods based on search term
  const filteredMoodOptions = searchTerm
    ? moodOptions.map(category => ({
        ...category,
        moods: category.moods.filter(mood => 
          mood.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(category => category.moods.length > 0)
    : moodOptions;

  // Find mood by value
  const findMood = (value: string) => {
    for (const category of moodOptions) {
      const mood = category.moods.find(m => m.value === value);
      if (mood) return mood;
    }
    return null;
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.03
      } 
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 400, damping: 20 }
    }
  };

  const categoryVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Set the Mood 🎭</h2>
      <p className="text-gray-400 mb-6">
        Choose up to 5 moods to define the emotional tone of your playlist.
      </p>
      
      {/* Search box */}
      <motion.div 
        className="relative mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <input
          type="text"
          className="w-full bg-[#282828] border border-[#383838] rounded-full py-3 px-6 pl-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1DB954] focus:border-transparent transition-all duration-300 hover:border-[#1DB954]/50"
          placeholder="Search moods..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <svg 
          className="absolute left-4 top-3.5 h-5 w-5 text-gray-500" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </motion.div>
      
      {/* Selected moods */}
      <div className="mb-8 relative">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Selected Moods: <span className={`font-bold ${selectedMoods.length === 5 ? 'text-[#1DB954]' : ''}`}>{selectedMoods.length}/5</span></h3>
        
        {/* Max moods reached animation */}
        {showMaxReached && (
          <motion.div 
            className="absolute -top-2 left-0 right-0 bg-[#ff4d4f]/20 text-[#ff4d4f] text-center py-2 rounded-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            Maximum of 5 moods reached! Remove one to add another.
          </motion.div>
        )}
        
        <div className="flex flex-wrap gap-2">
          {selectedMoods.length > 0 ? (
            <motion.div
              className="flex flex-wrap gap-2"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {selectedMoods.map(mood => {
                // Find the mood object
                const moodObject = findMood(mood);
                return (
                  <motion.span 
                    key={mood} 
                    className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-[#1DB954] text-white shadow-lg shadow-[#1DB954]/20"
                    variants={itemVariants}
                    layout
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="mr-2 text-xl">{moodObject?.emoji}</span>
                    {moodObject?.name || mood}
                    <button
                      type="button"
                      className="ml-2 inline-flex items-center transition-all duration-200 hover:rotate-90"
                      onClick={() => handleMoodSelect(mood)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </motion.span>
                );
              })}
            </motion.div>
          ) : (
            <motion.span 
              className="text-gray-500 text-sm italic py-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              No moods selected yet. Pick some below! ⬇️
            </motion.span>
          )}
        </div>
      </div>
      
      {/* Category tabs */}
      {!searchTerm && (
        <motion.div 
          className="flex flex-wrap gap-2 mb-6"
          variants={containerVariants}
          initial="hidden" 
          animate="visible"
        >
          {moodOptions.map(category => (
            <motion.button
              key={category.category}
              onClick={() => setActiveCategory(activeCategory === category.category ? null : category.category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center ${
                activeCategory === category.category
                  ? 'bg-[#1DB954] text-white shadow-md shadow-[#1DB954]/20'
                  : 'bg-[#282828] text-gray-300 hover:bg-[#333333]'
              }`}
              variants={categoryVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="mr-2">{category.icon}</span>
              {category.category}
            </motion.button>
          ))}
        </motion.div>
      )}
      
      {/* Mood categories */}
      {filteredMoodOptions.length > 0 ? (
        <motion.div 
          className="space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredMoodOptions.map(category => (
            (!activeCategory || activeCategory === category.category) && (
              <motion.div 
                key={category.category}
                variants={itemVariants}
                className="bg-gradient-to-br from-[#282828] to-[#1A1A1A] p-5 rounded-xl shadow-md"
              >
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <span className="text-xl mr-2">{category.icon}</span>
                  {category.category}
                </h3>
                <motion.div 
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
                  variants={containerVariants}
                >
                  {category.moods.map(mood => (
                    <motion.button
                      key={mood.value}
                      type="button"
                      onClick={() => handleMoodSelect(mood.value)}
                      className={`py-3 px-4 rounded-lg text-sm transition-all duration-200 flex flex-col items-center justify-center ${
                        selectedMoods.includes(mood.value)
                          ? 'bg-[#1DB954] text-white shadow-md' 
                          : 'bg-[#333333] text-gray-300 hover:bg-[#444444] hover:scale-105'
                      }`}
                      variants={itemVariants}
                      whileHover={{ y: -5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="text-2xl mb-1">{mood.emoji}</span>
                      {mood.name}
                    </motion.button>
                  ))}
                </motion.div>
              </motion.div>
            )
          ))}
        </motion.div>
      ) : (
        <motion.div 
          className="text-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="text-6xl mb-4 block">🔍</span>
          <p className="text-gray-400 text-lg">No moods found matching "{searchTerm}"</p>
          <p className="text-gray-500 mt-2">Try a different search term</p>
        </motion.div>
      )}
    </div>
  );
};

export default MoodSelection; 