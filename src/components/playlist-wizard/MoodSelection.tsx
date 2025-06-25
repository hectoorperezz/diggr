import React, { useState, useEffect } from 'react';
import { PlaylistFormData } from '@/app/create-playlist/page';
import { motion } from 'framer-motion';

interface MoodSelectionProps {
  formData: PlaylistFormData;
  updateFormData: (field: keyof PlaylistFormData, value: any) => void;
}

// Simplified list of mood options with emojis - reduced to 3 categories
const moodOptions = [
  {
    category: 'Tempo',
    icon: '⚡',
    moods: [
      { name: 'Downtempo', value: 'downtempo', emoji: '⬇️' },
      { name: 'Midtempo', value: 'midtempo', emoji: '➡️' },
      { name: 'Upbeat', value: 'upbeat', emoji: '⬆️' },
    ]
  },
  {
    category: 'Emotion',
    icon: '💖',
    moods: [
      { name: 'Happy', value: 'happy', emoji: '😊' },
      { name: 'Sad', value: 'sad', emoji: '😢' },
      { name: 'Nostalgic', value: 'nostalgic', emoji: '🕰️' },
      { name: 'Romantic', value: 'romantic', emoji: '💘' },
    ]
  },
  {
    category: 'Setting',
    icon: '🏙️',
    moods: [
      { name: 'Party', value: 'party', emoji: '🎉' },
      { name: 'Focus', value: 'focus', emoji: '🎯' },
      { name: 'Workout', value: 'workout', emoji: '🏋️' },
      { name: 'Chill', value: 'chill', emoji: '🛋️' },
    ]
  }
];

const MoodSelection: React.FC<MoodSelectionProps> = ({ formData, updateFormData }) => {
  // Track selected moods by category
  const [selectedMoodsByCategory, setSelectedMoodsByCategory] = useState<Record<string, string | null>>({
    'Tempo': null,
    'Emotion': null,
    'Setting': null
  });
  
  // Initialize from formData
  useEffect(() => {
    const initialMoodsByCategory: Record<string, string | null> = {
      'Tempo': null,
      'Emotion': null,
      'Setting': null
    };
    
    formData.moods.forEach(mood => {
      // Find which category this mood belongs to
      for (const category of moodOptions) {
        const found = category.moods.find(m => m.value === mood);
        if (found) {
          initialMoodsByCategory[category.category] = mood;
          break;
        }
      }
    });
    
    setSelectedMoodsByCategory(initialMoodsByCategory);
  }, [formData.moods]);
  
  // Derived state for all selected moods
  const selectedMoods = Object.values(selectedMoodsByCategory).filter(Boolean) as string[];
  
  // Find which category a mood belongs to
  const findMoodCategory = (moodValue: string): string | null => {
    for (const category of moodOptions) {
      if (category.moods.some(m => m.value === moodValue)) {
        return category.category;
      }
    }
    return null;
  };
  
  // Handle mood selection
  const handleMoodSelect = (mood: string) => {
    // Find which category this mood belongs to
    const category = findMoodCategory(mood);
    if (!category) return;
    
    const updatedMoodsByCategory = { ...selectedMoodsByCategory };
    
    // If already selected, deselect it
    if (selectedMoodsByCategory[category] === mood) {
      updatedMoodsByCategory[category] = null;
    } else {
      // Otherwise, select it (replacing any previous selection in this category)
      updatedMoodsByCategory[category] = mood;
    }
    
    setSelectedMoodsByCategory(updatedMoodsByCategory);
    
    // Update the form data with all selected moods
    const allSelectedMoods = Object.values(updatedMoodsByCategory).filter(Boolean) as string[];
    updateFormData('moods', allSelectedMoods);
  };

  const [searchTerm, setSearchTerm] = useState('');

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

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Set the Mood 🎭</h2>
      <p className="text-gray-400 mb-6">
        Select one mood from each category to define your playlist's emotional tone.
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
        <h3 className="text-sm font-medium text-gray-400 mb-3">Selected Moods:</h3>
        
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
                // Find the category
                const category = findMoodCategory(mood);
                
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
                    <span className="opacity-75 mr-1">{category}:</span> {moodObject?.name || mood}
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
      
      {/* Mood categories */}
      {filteredMoodOptions.length > 0 ? (
        <motion.div 
          className="space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredMoodOptions.map(category => (
            <motion.div 
              key={category.category}
              variants={itemVariants}
              className="bg-gradient-to-br from-[#282828] to-[#1A1A1A] p-5 rounded-xl shadow-md"
            >
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <span className="text-xl mr-2">{category.icon}</span>
                {category.category}
                {selectedMoodsByCategory[category.category] && (
                  <span className="ml-2 text-xs bg-[#1DB954]/20 text-[#1DB954] px-2 py-1 rounded-full">
                    Selected
                  </span>
                )}
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
                      selectedMoodsByCategory[category.category] === mood.value
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
          ))}
        </motion.div>
      ) : (
        <motion.div
          className="text-center py-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-gray-400">No moods match your search.</p>
        </motion.div>
      )}
    </div>
  );
};

export default MoodSelection; 