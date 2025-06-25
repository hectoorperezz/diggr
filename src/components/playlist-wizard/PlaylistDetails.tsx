import React, { useState } from 'react';
import { PlaylistFormData } from '@/app/create-playlist/page';
import { motion } from 'framer-motion';

interface PlaylistDetailsProps {
  formData: PlaylistFormData;
  updateFormData: (field: keyof PlaylistFormData, value: any) => void;
}

const PlaylistDetails: React.FC<PlaylistDetailsProps> = ({ formData, updateFormData }) => {
  const [playlistName, setPlaylistName] = useState(formData.playlistName);
  const [description, setDescription] = useState(formData.description);
  const [trackCount, setTrackCount] = useState(formData.trackCount);
  const [isPublic, setIsPublic] = useState(formData.isPublic);
  const [uniquenessLevel, setUniquenessLevel] = useState(formData.uniquenessLevel);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Handle playlist name change
  const handlePlaylistNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPlaylistName(value);
    updateFormData('playlistName', value);
  };

  // Handle description change
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setDescription(value);
    updateFormData('description', value);
  };

  // Handle track count change
  const handleTrackCountChange = (value: number) => {
    if (value >= 10 && value <= 50) {
      setTrackCount(value);
      updateFormData('trackCount', value);
    }
  };

  // Handle visibility change
  const handleVisibilityChange = (value: boolean) => {
    setIsPublic(value);
    updateFormData('isPublic', value);
  };

  // Handle uniqueness level change
  const handleUniquenessChange = (value: number) => {
    setUniquenessLevel(value);
    updateFormData('uniquenessLevel', value);
  };

  // Define uniqueness labels with emojis
  const uniquenessLabels = [
    { value: 1, label: 'Mainstream', emoji: '📻', description: 'Popular hits everyone knows and loves. Think Billboard Hot 100 and radio favorites.' },
    { value: 2, label: 'Popular Mix', emoji: '🎵', description: 'Mostly popular tracks with some lesser-known songs from well-known artists.' },
    { value: 3, label: 'Balanced', emoji: '⚖️', description: 'Equal mix of popular hits and deeper cuts for a varied listening experience.' },
    { value: 4, label: 'Rare Mix', emoji: '💎', description: 'Mostly lesser-known tracks with a few recognizable songs to anchor the playlist.' },
    { value: 5, label: 'Deep Cuts', emoji: '🔍', description: 'Hidden gems, B-sides, and underground tracks for true music explorers.' },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
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

  // Get current uniqueness label
  const currentUniqueness = uniquenessLabels.find(l => l.value === uniquenessLevel);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Playlist Details ✨</h2>
      <p className="text-gray-400 mb-6">
        Customize the final details of your playlist before we create it for you.
      </p>
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Playlist name */}
        <motion.div 
          className="mb-6"
          variants={itemVariants}
        >
          <label htmlFor="playlist-name" className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
            <span className="mr-2">🎵</span> Playlist Name
          </label>
          <div className="relative">
            <input
              type="text"
              id="playlist-name"
              className={`w-full bg-[#282828] border ${focusedField === 'name' ? 'border-[#1DB954]' : 'border-[#383838]'} rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1DB954] focus:border-transparent transition-all duration-300`}
              placeholder="My Awesome Playlist"
              value={playlistName}
              onChange={handlePlaylistNameChange}
              maxLength={100}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
            />
            {playlistName && (
              <motion.div 
                className="absolute right-3 top-3 text-gray-400"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                {playlistName.length >= 5 && (
                  <span className="text-green-500">✓</span>
                )}
              </motion.div>
            )}
          </div>
          <motion.p 
            className={`text-xs mt-2 ${playlistName.length > 80 ? 'text-orange-400' : 'text-gray-500'}`}
            animate={{ 
              scale: playlistName.length > 80 ? [1, 1.05, 1] : 1,
              transition: { repeat: playlistName.length > 80 ? Infinity : 0, repeatType: "reverse", duration: 0.5 } 
            }}
          >
            {playlistName.length}/100 characters
          </motion.p>
        </motion.div>
        
        {/* Description */}
        <motion.div 
          className="mb-6"
          variants={itemVariants}
        >
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
            <span className="mr-2">📝</span> Description (optional)
          </label>
          <div className="relative">
            <textarea
              id="description"
              rows={3}
              className={`w-full bg-[#282828] border ${focusedField === 'description' ? 'border-[#1DB954]' : 'border-[#383838]'} rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1DB954] focus:border-transparent transition-all duration-300`}
              placeholder="Describe your playlist..."
              value={description}
              onChange={handleDescriptionChange}
              maxLength={300}
              onFocus={() => setFocusedField('description')}
              onBlur={() => setFocusedField(null)}
            />
          </div>
          <motion.p 
            className={`text-xs mt-2 ${description.length > 240 ? 'text-orange-400' : 'text-gray-500'}`}
            animate={{ 
              scale: description.length > 240 ? [1, 1.05, 1] : 1,
              transition: { repeat: description.length > 240 ? Infinity : 0, repeatType: "reverse", duration: 0.5 } 
            }}
          >
            {description.length}/300 characters
          </motion.p>
        </motion.div>
        
        {/* Track count */}
        <motion.div 
          className="mb-8"
          variants={itemVariants}
        >
          <label htmlFor="track-count" className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
            <span className="mr-2">🎧</span> Number of Tracks: <span className="ml-1 text-[#1DB954] font-bold">{trackCount}</span>
          </label>
          <div className="flex items-center space-x-4">
            <motion.button
              type="button"
              onClick={() => handleTrackCountChange(trackCount - 5)}
              disabled={trackCount <= 10}
              className={`rounded-full w-10 h-10 flex items-center justify-center ${
                trackCount <= 10 
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                  : 'bg-[#282828] text-white hover:bg-[#333333]'
              }`}
              whileHover={trackCount > 10 ? { scale: 1.1 } : {}}
              whileTap={trackCount > 10 ? { scale: 0.9 } : {}}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </motion.button>
            
            <div className="flex-grow relative">
              <input
                type="range"
                id="track-count"
                min="10"
                max="50"
                step="5"
                value={trackCount}
                onChange={(e) => handleTrackCountChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#1DB954]"
              />
              
              <motion.div 
                className="absolute -top-7 text-white text-xs bg-[#1DB954] rounded-md px-2 py-1 transform -translate-x-1/2 shadow-lg"
                style={{ left: `${((trackCount - 10) / 40) * 100}%` }}
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
              >
                {trackCount}
              </motion.div>
            </div>
            
            <motion.button
              type="button"
              onClick={() => handleTrackCountChange(trackCount + 5)}
              disabled={trackCount >= 50}
              className={`rounded-full w-10 h-10 flex items-center justify-center ${
                trackCount >= 50 
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                  : 'bg-[#282828] text-white hover:bg-[#333333]'
              }`}
              whileHover={trackCount < 50 ? { scale: 1.1 } : {}}
              whileTap={trackCount < 50 ? { scale: 0.9 } : {}}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </motion.button>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>10 tracks</span>
            <span>50 tracks</span>
          </div>
        </motion.div>
        
        {/* Visibility */}
        <motion.div 
          className="mb-8"
          variants={itemVariants}
        >
          <span className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
            <span className="mr-2">🔒</span> Playlist Privacy
          </span>
          <div className="flex space-x-4">
            <motion.button
              type="button"
              onClick={() => handleVisibilityChange(true)}
              className={`flex-1 py-3 px-4 rounded-lg transition-all ${
                isPublic 
                  ? 'bg-[#1DB954] text-white shadow-md' 
                  : 'bg-[#282828] text-gray-300 hover:bg-[#333333]'
              }`}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex items-center justify-center">
                <span className="text-xl mr-2">🌎</span>
                Public
              </div>
            </motion.button>
            <motion.button
              type="button"
              onClick={() => handleVisibilityChange(false)}
              className={`flex-1 py-3 px-4 rounded-lg transition-all ${
                !isPublic 
                  ? 'bg-[#1DB954] text-white shadow-md' 
                  : 'bg-[#282828] text-gray-300 hover:bg-[#333333]'
              }`}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex items-center justify-center">
                <span className="text-xl mr-2">🔒</span>
                Private
              </div>
            </motion.button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            {isPublic 
              ? 'Your playlist will be visible to anyone on Spotify' 
              : 'Your playlist will only be visible to you'}
          </p>
        </motion.div>
        
        {/* Uniqueness slider */}
        <motion.div 
          className="mb-6"
          variants={itemVariants}
        >
          <label htmlFor="uniqueness" className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
            <span className="mr-2">{currentUniqueness?.emoji}</span> Uniqueness Level
          </label>
          <div className="bg-gradient-to-r from-[#1a1a1a] via-[#202020] to-[#1a1a1a] p-5 rounded-xl mb-5 shadow-lg border border-[#333]/20">
            <div className="flex items-center justify-between mb-5">
              {uniquenessLabels.map((level) => (
                <motion.span 
                  key={level.value}
                  className="flex flex-col items-center cursor-pointer"
                  onClick={() => handleUniquenessChange(level.value)}
                  animate={{ 
                    scale: uniquenessLevel === level.value ? 1.1 : 1,
                    y: uniquenessLevel === level.value ? -3 : 0
                  }}
                  whileHover={{ scale: 1.05, y: -2 }}
                >
                  <span className={`text-2xl mb-1 transition-all duration-300 ${uniquenessLevel === level.value ? 'grayscale-0' : 'grayscale opacity-60'}`}>
                    {level.emoji}
                  </span>
                  <span className={`text-xs transition-all duration-300 ${uniquenessLevel === level.value ? 'text-[#1DB954] font-bold' : 'text-gray-400'}`}>
                    {level.label.split(' ')[0]}
                  </span>
                </motion.span>
              ))}
            </div>
            
            <div className="relative mb-6">
              {/* Track background */}
              <div className="h-2 bg-[#333] rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-[#1DB954]/80 to-[#1DB954]"
                  style={{ width: `${((uniquenessLevel - 1) / 4) * 100}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${((uniquenessLevel - 1) / 4) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              
              {/* Tick marks */}
              <div className="w-full flex justify-between absolute -top-1">
                {[1, 2, 3, 4, 5].map(value => (
                  <motion.div
                    key={value}
                    className={`h-4 w-1 rounded-full ${uniquenessLevel >= value ? 'bg-[#1DB954]' : 'bg-gray-600'}`}
                    whileHover={{ height: 6 }}
                  />
                ))}
              </div>
              
              {/* Interactive slider area - improved for better UX */}
              <div className="absolute inset-0 -top-3 -bottom-3">
                <input
                  type="range"
                  id="uniqueness"
                  min="1"
                  max="5"
                  step="1"
                  value={uniquenessLevel}
                  onChange={(e) => handleUniquenessChange(parseInt(e.target.value))}
                  className="w-full h-8 opacity-0 cursor-pointer absolute z-10"
                  style={{ touchAction: 'none' }}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <motion.button
                type="button"
                onClick={() => handleUniquenessChange(Math.max(1, uniquenessLevel - 1))}
                disabled={uniquenessLevel <= 1}
                className={`rounded-full w-10 h-10 flex items-center justify-center ${
                  uniquenessLevel <= 1 
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                    : 'bg-[#282828] text-white hover:bg-[#333333]'
                }`}
                whileHover={uniquenessLevel > 1 ? { scale: 1.1 } : {}}
                whileTap={uniquenessLevel > 1 ? { scale: 0.9 } : {}}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </motion.button>
              
              <div className="relative flex-grow">
                {/* Visual indicators for slider positions */}
                <div className="flex justify-between px-1">
                  {uniquenessLabels.map((level) => (
                    <div 
                      key={level.value}
                      className="w-0.5 h-0.5 bg-transparent"
                    />
                  ))}
                </div>
              </div>
              
              <motion.button
                type="button"
                onClick={() => handleUniquenessChange(Math.min(5, uniquenessLevel + 1))}
                disabled={uniquenessLevel >= 5}
                className={`rounded-full w-10 h-10 flex items-center justify-center ${
                  uniquenessLevel >= 5 
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                    : 'bg-[#282828] text-white hover:bg-[#333333]'
                }`}
                whileHover={uniquenessLevel < 5 ? { scale: 1.1 } : {}}
                whileTap={uniquenessLevel < 5 ? { scale: 0.9 } : {}}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </motion.button>
            </div>
          </div>
          
          <motion.div 
            className="bg-[#282828] p-5 rounded-lg border border-[#333]/30 shadow-inner"
            animate={{ 
              backgroundColor: uniquenessLevel === 5 ? ['#282828', '#1e3a29', '#282828'] : '#282828' 
            }}
            transition={{ duration: 2, repeat: uniquenessLevel === 5 ? Infinity : 0 }}
          >
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-3">{currentUniqueness?.emoji}</span>
              <div>
                <span className="font-medium text-[#1DB954] block">{currentUniqueness?.label}</span>
                <div className="flex mt-1">
                  {Array(5).fill(0).map((_, i) => (
                    <motion.span
                      key={i}
                      className={`h-1 w-4 rounded-full mr-1 ${
                        i < uniquenessLevel ? 'bg-[#1DB954]' : 'bg-gray-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed pl-10">
              {currentUniqueness?.description}
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PlaylistDetails; 