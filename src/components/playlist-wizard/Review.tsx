import React, { useState, useRef } from 'react';
import { PlaylistFormData } from '@/app/create-playlist/page';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface ReviewProps {
  formData: PlaylistFormData;
  updateFormData: (field: keyof PlaylistFormData, value: any) => void;
}

// Genre data for displaying names with emojis
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
  // etc...
];

// Regions data for displaying names with emojis
const regionOptions = [
  {
    continent: 'North America',
    emoji: '🌎',
    regions: [
      { name: 'United States', value: 'us', emoji: '🇺🇸' },
      { name: 'Canada', value: 'canada', emoji: '🇨🇦' },
      { name: 'Mexico', value: 'mexico', emoji: '🇲🇽' },
      { name: 'Caribbean', value: 'caribbean', emoji: '🏝️' },
    ]
  },
  // etc...
];

// Era options with emojis
const eraOptions = [
  { decade: '1950s', value: '1950s', emoji: '🎸' },
  { decade: '1960s', value: '1960s', emoji: '☮️' },
  { decade: '1970s', value: '1970s', emoji: '🕺' },
  { decade: '1980s', value: '1980s', emoji: '📼' },
  { decade: '1990s', value: '1990s', emoji: '💿' },
  { decade: '2000s', value: '2000s', emoji: '💻' },
  { decade: '2010s', value: '2010s', emoji: '📱' },
  { decade: '2020s', value: '2020s', emoji: '🎧' },
];

// Specific era options with emojis
const specificEraOptions = [
  { name: 'Classic Rock Era', value: 'classic-rock', emoji: '🤘' },
  { name: 'Disco Era', value: 'disco', emoji: '🪩' },
  { name: 'New Wave Era', value: 'new-wave', emoji: '🎹' },
  { name: 'Golden Age of Hip Hop', value: 'golden-hiphop', emoji: '🎤' },
  // etc...
];

// Language options with emojis
const languageOptions = [
  { name: 'English', value: 'english', emoji: '🇬🇧' },
  { name: 'Spanish', value: 'spanish', emoji: '🇪🇸' },
  { name: 'French', value: 'french', emoji: '🇫🇷' },
  { name: 'German', value: 'german', emoji: '🇩🇪' },
  // etc...
];

// Uniqueness levels with emojis
const uniquenessLevels = [
  { value: 1, label: 'Mainstream', emoji: '📻' },
  { value: 2, label: 'Balanced - Popular', emoji: '🎵' },
  { value: 3, label: 'Balanced', emoji: '⚖️' },
  { value: 4, label: 'Balanced - Obscure', emoji: '💎' },
  { value: 5, label: 'Deep Cuts', emoji: '🔍' },
];

const Review: React.FC<ReviewProps> = ({ formData, updateFormData }) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(formData.coverImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Helper function to toggle section
  const toggleSection = (section: string) => {
    if (activeSection === section) {
      setActiveSection(null);
    } else {
      setActiveSection(section);
    }
  };

  // Helper function to get genre names and emojis
  const getGenreInfo = () => {
    return formData.genres.map(genre => {
      const genreOption = genreOptions.find(g => g.value === genre);
      return genreOption 
        ? { name: genreOption.name, emoji: genreOption.emoji }
        : { name: genre, emoji: '🎵' };
    });
  };

  // Helper function to get subgenre names
  const getSubGenreNames = () => {
    return formData.subGenres;
  };

  // Helper function to get era names and emojis
  const getEraInfo = () => {
    return formData.eras.map(era => {
      const decadeEra = eraOptions.find(e => e.value === era);
      if (decadeEra) return { name: decadeEra.decade, emoji: decadeEra.emoji };
      
      const specificEra = specificEraOptions.find(e => e.value === era);
      if (specificEra) return { name: specificEra.name, emoji: specificEra.emoji };
      
      return { name: era, emoji: '🎵' };
    });
  };

  // Helper function to get region names and emojis
  const getRegionInfo = () => {
    return formData.regions.map(region => {
      for (const continent of regionOptions) {
        const regionObj = continent.regions.find(r => r.value === region);
        if (regionObj) return { name: regionObj.name, emoji: regionObj.emoji };
      }
      return { name: region, emoji: '🌍' };
    });
  };

  // Helper function to get language names and emojis
  const getLanguageInfo = () => {
    return formData.languages.map(language => {
      const languageOption = languageOptions.find(l => l.value === language);
      return languageOption 
        ? { name: languageOption.name, emoji: languageOption.emoji }
        : { name: language, emoji: '🔤' };
    });
  };

  // Helper function to get uniqueness level info
  const getUniquenessInfo = () => {
    const level = uniquenessLevels.find(l => l.value === formData.uniquenessLevel);
    return level 
      ? { label: level.label, emoji: level.emoji } 
      : { label: formData.uniquenessLevel.toString(), emoji: '⚖️' };
  };

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

  const cardVariants = {
    collapsed: { height: 'auto', opacity: 1 },
    expanded: { 
      height: 'auto', 
      opacity: 1,
      transition: { 
        duration: 0.3, 
        staggerChildren: 0.05
      }
    }
  };

  const childVariants = {
    collapsed: { opacity: 0, height: 0, overflow: 'hidden' },
    expanded: { 
      opacity: 1,
      height: 'auto',
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  // Handle file selection and upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check if the file is a jpeg or png
    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      toast.error('Please select a JPEG or PNG image');
      return;
    }
    
    // Check if the file is less than 256KB (Spotify limit)
    if (file.size > 256 * 1024) {
      toast.error('Image must be less than 256KB');
      return;
    }
    
    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      processImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const processImage = async (imageDataUrl: string) => {
    try {
      // Convert PNG to JPEG if needed
      let jpegDataUrl = imageDataUrl;
      if (imageDataUrl.startsWith('data:image/png')) {
        jpegDataUrl = await convertPngToJpeg(imageDataUrl);
      }
      
      // Set the preview image
      setPreviewImage(jpegDataUrl);
      
      // Update the form data with the base64 image
      updateFormData('coverImage', jpegDataUrl);
      
      toast.success('Cover image uploaded successfully!');
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process image');
    } finally {
      setIsUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Convert PNG to JPEG using Canvas
  const convertPngToJpeg = (pngDataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Fill with black background (since JPEG doesn't support transparency)
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the image on top
        ctx.drawImage(img, 0, 0);
        
        // Convert to JPEG data URL
        const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        resolve(jpegDataUrl);
      };
      
      img.onerror = () => {
        reject(new Error('Error loading image'));
      };
      
      img.src = pngDataUrl;
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 flex items-center">
        <span className="mr-2">🎉</span> Review Your Playlist
      </h2>
      <p className="text-gray-400 mb-6">
        Review your selections before creating your personalized playlist.
      </p>
      
      <motion.div 
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Playlist Cover Image */}
        <motion.div 
          className="bg-gradient-to-br from-[#282828] to-[#1A1A1A] rounded-xl p-5 shadow-md cursor-pointer"
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
          onClick={() => toggleSection('cover')}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium flex items-center">
              <span className="text-xl mr-2">🖼️</span>
              Playlist Cover Image
            </h3>
            <motion.span 
              animate={{ rotate: activeSection === 'cover' ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </motion.span>
          </div>
          
          <motion.div
            variants={cardVariants}
            initial="collapsed"
            animate={activeSection === 'cover' ? 'expanded' : 'collapsed'}
          >
            <motion.div 
              variants={childVariants}
              className="mt-4 space-y-3"
            >
              <div className="flex flex-col items-center">
                <div className="relative w-48 h-48 mb-4 bg-black rounded-lg overflow-hidden">
                  {previewImage ? (
                    <img 
                      src={previewImage} 
                      alt="Playlist cover preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#282828]">
                      <span className="text-5xl mb-2">🎵</span>
                      <span className="text-xs text-gray-400">No image selected</span>
                    </div>
                  )}
                </div>
                
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  disabled={isUploading}
                />
                
                <motion.button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-[#1DB954] text-white rounded-full text-sm font-medium mb-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isUploading}
                >
                  {isUploading ? 'Processing...' : previewImage ? 'Change Image' : 'Upload Cover Image'}
                </motion.button>
                
                <p className="text-xs text-gray-400 text-center">
                  Add a custom cover image for your playlist.<br />
                  JPEG or PNG, max 256KB.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
        
        {/* Playlist details */}
        <motion.div 
          className="bg-gradient-to-br from-[#282828] to-[#1A1A1A] rounded-xl p-5 shadow-md cursor-pointer"
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
          onClick={() => toggleSection('details')}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium flex items-center">
              <span className="text-xl mr-2">📋</span>
              Playlist Details
            </h3>
            <motion.span 
              animate={{ rotate: activeSection === 'details' ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </motion.span>
          </div>
          
          <motion.div
            variants={cardVariants}
            initial="collapsed"
            animate={activeSection === 'details' ? 'expanded' : 'collapsed'}
          >
            <motion.div 
              variants={childVariants}
              className="mt-4 space-y-3"
            >
              <div className="flex items-center">
                <span className="text-gray-400 mr-2">🎵</span>
                <span className="text-gray-400">Name:</span>{' '}
                <span className="text-white ml-2 font-medium">{formData.playlistName || 'No name provided'}</span>
              </div>
              {formData.description && (
                <div className="flex items-start">
                  <span className="text-gray-400 mr-2">📝</span>
                  <span className="text-gray-400">Description:</span>{' '}
                  <span className="text-white ml-2">{formData.description}</span>
                </div>
              )}
              <div className="flex items-center">
                <span className="text-gray-400 mr-2">🎧</span>
                <span className="text-gray-400">Number of Tracks:</span>{' '}
                <span className="text-white ml-2">{formData.trackCount}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-400 mr-2">{formData.isPublic ? '🌎' : '🔒'}</span>
                <span className="text-gray-400">Privacy:</span>{' '}
                <span className="text-white ml-2">{formData.isPublic ? 'Public' : 'Private'}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-400 mr-2">{getUniquenessInfo().emoji}</span>
                <span className="text-gray-400">Uniqueness Level:</span>{' '}
                <span className="text-white ml-2">{getUniquenessInfo().label}</span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
        
        {/* Genres */}
        <motion.div 
          className="bg-gradient-to-br from-[#282828] to-[#1A1A1A] rounded-xl p-5 shadow-md cursor-pointer"
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
          onClick={() => toggleSection('genres')}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium flex items-center">
              <span className="text-xl mr-2">🎸</span>
              Genres
            </h3>
            <motion.span 
              animate={{ rotate: activeSection === 'genres' ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </motion.span>
          </div>
          
          <motion.div
            variants={cardVariants}
            initial="collapsed"
            animate={activeSection === 'genres' ? 'expanded' : 'collapsed'}
          >
            <motion.div 
              variants={childVariants}
              className="mt-4"
            >
              {formData.genres.length > 0 ? (
                <div>
                  <div className="mb-3">
                    <span className="text-gray-400">Main Genres:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {getGenreInfo().map((genre, index) => (
                        <motion.span 
                          key={index} 
                          className="px-3 py-1 bg-[#1DB954]/20 rounded-lg text-sm flex items-center"
                          whileHover={{ scale: 1.05 }}
                        >
                          <span className="mr-2">{genre.emoji}</span>
                          {genre.name}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                  {formData.subGenres.length > 0 && (
                    <div>
                      <span className="text-gray-400">Subgenres:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {getSubGenreNames().map((subgenre, index) => (
                          <motion.span 
                            key={index} 
                            className="px-3 py-1 bg-[#383838] rounded-lg text-sm"
                            whileHover={{ scale: 1.05 }}
                          >
                            {subgenre}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No genres selected</p>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
        
        {/* Moods */}
        <motion.div 
          className="bg-gradient-to-br from-[#282828] to-[#1A1A1A] rounded-xl p-5 shadow-md cursor-pointer"
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
          onClick={() => toggleSection('moods')}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium flex items-center">
              <span className="text-xl mr-2">🎭</span>
              Moods
            </h3>
            <motion.span 
              animate={{ rotate: activeSection === 'moods' ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </motion.span>
          </div>
          
          <motion.div
            variants={cardVariants}
            initial="collapsed"
            animate={activeSection === 'moods' ? 'expanded' : 'collapsed'}
          >
            <motion.div 
              variants={childVariants}
              className="mt-4"
            >
              {formData.moods.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {formData.moods.map((mood, index) => (
                    <motion.span 
                      key={index} 
                      className="px-3 py-1 bg-[#1DB954]/20 rounded-lg text-sm"
                      whileHover={{ scale: 1.05 }}
                    >
                      {mood}
                    </motion.span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No moods selected</p>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
        
        {/* Eras */}
        <motion.div 
          className="bg-gradient-to-br from-[#282828] to-[#1A1A1A] rounded-xl p-5 shadow-md cursor-pointer"
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
          onClick={() => toggleSection('eras')}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium flex items-center">
              <span className="text-xl mr-2">⏳</span>
              Eras
            </h3>
            <motion.span 
              animate={{ rotate: activeSection === 'eras' ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </motion.span>
          </div>
          
          <motion.div
            variants={cardVariants}
            initial="collapsed"
            animate={activeSection === 'eras' ? 'expanded' : 'collapsed'}
          >
            <motion.div 
              variants={childVariants}
              className="mt-4"
            >
              {formData.eras.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {getEraInfo().map((era, index) => (
                    <motion.span 
                      key={index} 
                      className="px-3 py-1 bg-[#1DB954]/20 rounded-lg text-sm flex items-center"
                      whileHover={{ scale: 1.05 }}
                    >
                      <span className="mr-2">{era.emoji}</span>
                      {era.name}
                    </motion.span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No eras selected</p>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
        
        {/* Regions and Languages */}
        <motion.div 
          className="bg-gradient-to-br from-[#282828] to-[#1A1A1A] rounded-xl p-5 shadow-md cursor-pointer"
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
          onClick={() => toggleSection('regions')}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium flex items-center">
              <span className="text-xl mr-2">🌎</span>
              Regions & Languages
            </h3>
            <motion.span 
              animate={{ rotate: activeSection === 'regions' ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </motion.span>
          </div>
          
          <motion.div
            variants={cardVariants}
            initial="collapsed"
            animate={activeSection === 'regions' ? 'expanded' : 'collapsed'}
          >
            <motion.div 
              variants={childVariants}
              className="mt-4 space-y-4"
            >
              <div>
                <span className="text-gray-400">Regions:</span>
                {formData.regions.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {getRegionInfo().map((region, index) => (
                      <motion.span 
                        key={index} 
                        className="px-3 py-1 bg-[#1DB954]/20 rounded-lg text-sm flex items-center"
                        whileHover={{ scale: 1.05 }}
                      >
                        <span className="mr-2">{region.emoji}</span>
                        {region.name}
                      </motion.span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500 ml-2 block mt-1">No regions selected</span>
                )}
              </div>
              <div>
                <span className="text-gray-400">Languages:</span>
                {formData.languages.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {getLanguageInfo().map((language, index) => (
                      <motion.span 
                        key={index} 
                        className="px-3 py-1 bg-[#1DB954]/20 rounded-lg text-sm flex items-center"
                        whileHover={{ scale: 1.05 }}
                      >
                        <span className="mr-2">{language.emoji}</span>
                        {language.name}
                      </motion.span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500 ml-2 block mt-1">No languages selected</span>
                )}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
        
        {/* Ready to create message */}
        <motion.div 
          className="bg-gradient-to-r from-[#1DB954]/20 to-[#1DB954]/10 rounded-xl p-5 shadow-md text-center"
          variants={itemVariants}
          animate={{ 
            scale: [1, 1.02, 1],
            transition: { repeat: Infinity, repeatType: "reverse", duration: 2 }
          }}
        >
          <h3 className="text-lg font-medium mb-2 flex items-center justify-center">
            <span className="text-xl mr-2">✨</span>
            Ready to Create Your Playlist
          </h3>
          <p className="text-gray-400">
            Click the "Create Playlist" button below to generate your personalized playlist with AI.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Review; 