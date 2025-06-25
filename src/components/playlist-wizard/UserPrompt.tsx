import React, { useState, useEffect } from 'react';
import { PlaylistFormData } from '@/app/create-playlist/page';
import { motion } from 'framer-motion';

// Development-only logging helper
const devLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV ONLY] UserPrompt: ${message}`, data || '');
  }
};

interface UserPromptProps {
  formData: PlaylistFormData;
  updateFormData: (field: keyof PlaylistFormData, value: any) => void;
}

// Example prompts that users can quickly select
const examplePrompts = [
  "Songs for a road trip along the coast",
  "Uplifting tracks to start the morning",
  "Mellow tunes for a rainy afternoon",
  "Music that feels like summer vacation in the 90s",
  "Perfect background music for a dinner party"
];

const UserPrompt: React.FC<UserPromptProps> = ({ formData, updateFormData }) => {
  const [prompt, setPrompt] = useState<string>(formData.userPrompt || '');
  
  // Log initial prompt on component mount
  useEffect(() => {
    if (formData.userPrompt) {
      devLog('Initial prompt loaded:', formData.userPrompt);
    }
  }, []);
  
  // Character limit
  const MAX_CHARACTERS = 250;
  
  // Handle prompt change
  const handlePromptChange = (value: string) => {
    // Limit to max characters
    if (value.length <= MAX_CHARACTERS) {
      setPrompt(value);
      updateFormData('userPrompt', value);
      
      // Log prompt changes (throttled to avoid excessive logging)
      if (value.length % 10 === 0 || value.length === 0) {
        devLog('Prompt updated:', value);
      }
    }
  };
  
  // Handle example prompt selection
  const handleExampleSelect = (example: string) => {
    setPrompt(example);
    updateFormData('userPrompt', example);
    devLog('Example prompt selected:', example);
  };
  
  // Calculate remaining characters
  const remainingChars = MAX_CHARACTERS - prompt.length;
  const isNearLimit = remainingChars <= 30;
  
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

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Add Your Personal Touch ✨</h2>
      <p className="text-gray-400 mb-6">
        Tell us more about what you want in your playlist. Be specific about moods, artists, contexts or any special requests.
      </p>
      
      {/* Text input area */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            placeholder="Example: 'I want a playlist that mixes indie folk and electronic music, perfect for a creative coding session'"
            className="w-full bg-[#282828] border border-[#383838] rounded-xl py-4 px-6 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1DB954] focus:border-transparent transition-all duration-300 hover:border-[#1DB954]/50 min-h-[120px]"
            rows={4}
          />
          
          {/* Character counter */}
          <div className={`absolute bottom-4 right-4 text-sm ${
            isNearLimit 
              ? remainingChars <= 0 
                ? 'text-red-500' 
                : 'text-yellow-500' 
              : 'text-gray-500'
          }`}>
            {remainingChars}/{MAX_CHARACTERS}
          </div>
        </div>


      </motion.div>
      
      {/* Example prompts */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-400 mb-3">
          Need inspiration? Try one of these:
        </h3>
        
        <motion.div
          className="flex flex-wrap gap-2"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {examplePrompts.map((example, index) => (
            <motion.button
              key={index}
              type="button"
              onClick={() => handleExampleSelect(example)}
              className="px-4 py-2 rounded-full text-sm font-medium bg-[#282828] text-gray-300 hover:bg-[#333333] transition-all duration-200"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              "{example.length > 30 ? example.substring(0, 27) + '...' : example}"
            </motion.button>
          ))}
        </motion.div>
      </div>
      
      
    </div>
  );
};

export default UserPrompt; 