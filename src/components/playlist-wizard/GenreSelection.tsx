import React, { useState } from 'react';
import { PlaylistFormData } from '@/app/create-playlist/page';
import { motion } from 'framer-motion';

interface GenreSelectionProps {
  formData: PlaylistFormData;
  updateFormData: (field: keyof PlaylistFormData, value: any) => void;
}

// List of genres with their subgenres and emojis
const genreOptions = [
  {
    name: 'Rock',
    value: 'rock',
    emoji: '🎸',
    subgenres: ['Alternative', 'Classic Rock', 'Indie', 'Punk', 'Metal', 'Hard Rock', 'Progressive']
  },
  {
    name: 'Pop',
    value: 'pop',
    emoji: '🎵',
    subgenres: ['Synth-pop', 'K-pop', 'Dance-pop', 'Electropop', 'Indie Pop', 'Pop Rock', 'Dream Pop']
  },
  {
    name: 'Hip Hop',
    value: 'hip-hop',
    emoji: '🎤',
    subgenres: ['Trap', 'Drill', 'Boom Bap', 'Alternative Hip Hop', 'Gangsta Rap', 'East Coast', 'West Coast']
  },
  {
    name: 'Electronic',
    value: 'electronic',
    emoji: '🎛️',
    subgenres: ['House', 'Techno', 'Drum & Bass', 'Dubstep', 'Ambient', 'Trance', 'IDM', 'Jungle']
  },
  {
    name: 'R&B',
    value: 'r&b',
    emoji: '🎷',
    subgenres: ['Soul', 'Neo-Soul', 'Contemporary R&B', 'Funk', 'Motown', 'Quiet Storm', 'New Jack Swing']
  },
  {
    name: 'Jazz',
    value: 'jazz',
    emoji: '🎺',
    subgenres: ['Bebop', 'Swing', 'Fusion', 'Modal', 'Free Jazz', 'Cool Jazz', 'Hard Bop']
  },
  {
    name: 'Classical',
    value: 'classical',
    emoji: '🎻',
    subgenres: ['Baroque', 'Romantic', 'Contemporary Classical', 'Minimalist', 'Opera', 'Symphony', 'Chamber Music']
  },
  {
    name: 'Latin',
    value: 'latin',
    emoji: '💃',
    subgenres: ['Reggaeton', 'Salsa', 'Bachata', 'Dembow', 'Cumbia', 'Samba', 'Corridos']
  },
  {
    name: 'Folk',
    value: 'folk',
    emoji: '🪕',
    subgenres: ['Traditional Folk', 'Contemporary Folk', 'Indie Folk', 'Folk Rock', 'Americana', 'Singer-Songwriter', 'Celtic']
  },
  {
    name: 'Reggae',
    value: 'reggae',
    emoji: '🏝️',
    subgenres: ['Dub', 'Roots Reggae', 'Dancehall', 'Ska', 'Rocksteady', 'Ragga']
  },
  {
    name: 'Metal',
    value: 'metal',
    emoji: '🤘',
    subgenres: ['Heavy Metal', 'Thrash Metal', 'Death Metal', 'Black Metal', 'Doom Metal', 'Power Metal', 'Progressive Metal']
  },
  {
    name: 'Blues',
    value: 'blues',
    emoji: '🎹',
    subgenres: ['Chicago Blues', 'Delta Blues', 'Electric Blues', 'Jump Blues', 'Blues Rock', 'Soul Blues', 'Contemporary Blues']
  }
];

const GenreSelection: React.FC<GenreSelectionProps> = ({ formData, updateFormData }) => {
  const [selectedGenres, setSelectedGenres] = useState<string[]>(formData.genres);
  const [selectedSubGenres, setSelectedSubGenres] = useState<string[]>(formData.subGenres);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGenre, setExpandedGenre] = useState<string | null>(null);

  // Handle genre selection
  const handleGenreSelect = (genreValue: string) => {
    let updatedGenres: string[];
    
    if (selectedGenres.includes(genreValue)) {
      updatedGenres = [];
      
      // Also remove any subgenres from this genre
      const genreOption = genreOptions.find(g => g.value === genreValue);
      if (genreOption) {
        const subgenresToRemove = genreOption.subgenres;
        const updatedSubGenres = selectedSubGenres.filter(sg => 
          !subgenresToRemove.includes(sg)
        );
        setSelectedSubGenres(updatedSubGenres);
        updateFormData('subGenres', updatedSubGenres);
      }
    } else {
      // Allow only one genre selection
      updatedGenres = [genreValue];
      
      // Remove any subgenres from previously selected genres
      const previousGenre = selectedGenres[0];
      if (previousGenre) {
        const previousGenreOption = genreOptions.find(g => g.value === previousGenre);
        if (previousGenreOption) {
          const subgenresToRemove = previousGenreOption.subgenres;
          const updatedSubGenres = selectedSubGenres.filter(sg => 
            !subgenresToRemove.includes(sg)
          );
          setSelectedSubGenres(updatedSubGenres);
          updateFormData('subGenres', updatedSubGenres);
        }
      }
      
      // Auto-expand the genre when selected
      setExpandedGenre(genreValue);
    }
    
    setSelectedGenres(updatedGenres);
    updateFormData('genres', updatedGenres);
  };

  // Handle subgenre selection
  const handleSubGenreSelect = (subgenre: string, parentGenre: string) => {
    let updatedSubGenres: string[];
    
    if (selectedSubGenres.includes(subgenre)) {
      updatedSubGenres = selectedSubGenres.filter(sg => sg !== subgenre);
    } else {
      // Ensure parent genre is selected
      if (!selectedGenres.includes(parentGenre)) {
        // Replace any existing genre with this one
        setSelectedGenres([parentGenre]);
        updateFormData('genres', [parentGenre]);
      }
      
      // Limit to 3 subgenres maximum
      if (selectedSubGenres.length >= 3) {
        // Show max subgenres reached notification
        showMaxSubgenresReached();
        return;
      }
      
      updatedSubGenres = [...selectedSubGenres, subgenre];
    }
    
    setSelectedSubGenres(updatedSubGenres);
    updateFormData('subGenres', updatedSubGenres);
  };

  // Max subgenres notification
  const [showMaxReached, setShowMaxReached] = useState(false);
  
  const showMaxSubgenresReached = () => {
    setShowMaxReached(true);
    setTimeout(() => {
      setShowMaxReached(false);
    }, 2000);
  };

  // Toggle expanded genre
  const toggleGenreExpand = (genreValue: string) => {
    if (expandedGenre === genreValue) {
      setExpandedGenre(null);
    } else {
      setExpandedGenre(genreValue);
    }
  };

  // Filter genres based on search term
  const filteredGenres = searchTerm 
    ? genreOptions.filter(genre => 
        genre.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        genre.subgenres.some(sg => sg.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : genreOptions;

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

  const subgenreVariants = {
    hidden: { height: 0, opacity: 0, overflow: "hidden" },
    visible: { 
      height: "auto", 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Select Your Music Vibes ✨</h2>
      <p className="text-gray-400 mb-6">
        Choose one musical genre and up to 3 specific subgenres for your playlist.
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
          placeholder="Search genres..."
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
      
      {selectedGenres.length > 0 && (
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-sm font-medium text-gray-400 mb-3">Selected Genre:</h3>
          <div className="flex flex-wrap gap-2">
            {selectedGenres.map(genre => {
              const genreOption = genreOptions.find(g => g.value === genre);
              return (
                <motion.span 
                  key={genre} 
                  className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-[#1DB954] text-white shadow-lg shadow-[#1DB954]/20"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  layout
                >
                  <span className="mr-1">{genreOption?.emoji}</span>
                  {genreOption?.name}
                  <button
                    type="button"
                    className="ml-2 inline-flex items-center transition-transform duration-200 hover:rotate-90"
                    onClick={() => handleGenreSelect(genre)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </motion.span>
              );
            })}
          </div>
        </motion.div>
      )}
      
      {selectedSubGenres.length > 0 && (
        <motion.div 
          className="mb-8 relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-sm font-medium text-gray-400 mb-3">
            Selected Subgenres: <span className={`font-bold ${selectedSubGenres.length === 3 ? 'text-[#1DB954]' : ''}`}>{selectedSubGenres.length}/3</span>
          </h3>
          
          {/* Max subgenres reached animation - improved styling */}
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
                Maximum of 3 subgenres reached! Remove one to add another.
              </div>
            </motion.div>
          )}
          
          <div className="flex flex-wrap gap-2">
            {selectedSubGenres.map(subgenre => (
              <motion.span 
                key={subgenre} 
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#333333] text-white border border-[#1DB954]/50"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                layout
              >
                {subgenre}
                <button
                  type="button"
                  className="ml-2 inline-flex items-center transition-transform duration-200 hover:rotate-90"
                  onClick={() => {
                    const updatedSubGenres = selectedSubGenres.filter(sg => sg !== subgenre);
                    setSelectedSubGenres(updatedSubGenres);
                    updateFormData('subGenres', updatedSubGenres);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}
      
      {/* Genre list */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {filteredGenres.map(genre => (
          <motion.div 
            key={genre.value} 
            className={`bg-gradient-to-br ${
              selectedGenres.includes(genre.value)
                ? 'from-[#1DB954]/20 to-[#1DB954]/5 border-[#1DB954]'
                : 'from-[#282828] to-[#1A1A1A] border-transparent hover:from-[#333333] hover:to-[#222222]'
            } rounded-xl p-4 border-2 transition-colors duration-300 shadow-md cursor-pointer`}
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleGenreSelect(genre.value)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    selectedGenres.includes(genre.value)
                      ? 'bg-[#1DB954] text-white'
                      : 'bg-[#333333] text-gray-400 hover:bg-[#444444]'
                  }`}
                  aria-label={`Select ${genre.name}`}
                >
                  {selectedGenres.includes(genre.value) ? (
                    <motion.svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-6 w-6" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </motion.svg>
                  ) : (
                    <span className="text-xl">{genre.emoji}</span>
                  )}
                </div>
                <div>
                  <div className="text-lg font-medium cursor-pointer">
                    {genre.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {genre.subgenres.length} subgenres
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent genre selection
                  toggleGenreExpand(genre.value);
                }}
                className={`p-1 rounded-full transition-transform duration-300 ${expandedGenre === genre.value ? 'rotate-180' : ''}`}
                aria-label={`${expandedGenre === genre.value ? 'Collapse' : 'Expand'} subgenres`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            {/* Subgenres */}
            <motion.div 
              className="ml-6 space-y-2 overflow-hidden"
              variants={subgenreVariants}
              initial="hidden"
              animate={expandedGenre === genre.value || selectedGenres.includes(genre.value) ? "visible" : "hidden"}
              onClick={(e) => e.stopPropagation()} // Prevent genre selection when clicking in subgenres area
            >
              <div className="grid grid-cols-2 gap-2 mt-2">
                {genre.subgenres.map(subgenre => (
                  <motion.div 
                    key={`${genre.value}-${subgenre}`} 
                    className="flex items-center"
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent genre selection
                        handleSubGenreSelect(subgenre, genre.value);
                      }}
                      disabled={!selectedGenres.includes(genre.value)}
                      className={`w-full px-3 py-2 rounded-lg text-left text-sm flex items-center space-x-2 transition-all duration-200 ${
                        selectedSubGenres.includes(subgenre)
                          ? 'bg-[#1DB954]/30 text-white'
                          : selectedGenres.includes(genre.value)
                            ? 'bg-[#333333] text-gray-300 hover:bg-[#444444]'
                            : 'bg-[#333333] text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {selectedSubGenres.includes(subgenre) && (
                        <motion.svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-4 w-4 flex-shrink-0" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 500 }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </motion.svg>
                      )}
                      <span className={selectedSubGenres.includes(subgenre) ? 'ml-1' : ''}>{subgenre}</span>
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
      
      {filteredGenres.length === 0 && (
        <motion.div 
          className="text-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="text-6xl mb-4 block">🔍</span>
          <p className="text-gray-400 text-lg">No genres found matching "{searchTerm}"</p>
          <p className="text-gray-500 mt-2">Try a different search term</p>
        </motion.div>
      )}
    </div>
  );
};

export default GenreSelection; 