import React, { useState } from 'react';
import { PlaylistFormData } from '@/app/create-playlist/page';
import { motion } from 'framer-motion';

interface RegionSelectionProps {
  formData: PlaylistFormData;
  updateFormData: (field: keyof PlaylistFormData, value: any) => void;
}

// List of region options grouped by continent with emojis
const regionOptions = [
  {
    continent: 'North America',
    value: 'north-america',
    emoji: '🌎',
    regions: [
      { name: 'United States', value: 'us', emoji: '🇺🇸' },
      { name: 'Canada', value: 'canada', emoji: '🇨🇦' },
    ]
  },
  {
    continent: 'Europe',
    value: 'europe',
    emoji: '🌍',
    regions: [
      { name: 'United Kingdom', value: 'uk', emoji: '🇬🇧' },
      { name: 'France', value: 'france', emoji: '🇫🇷' },
      { name: 'Germany', value: 'germany', emoji: '🇩🇪' },
      { name: 'Italy', value: 'italy', emoji: '🇮🇹' },
      { name: 'Spain', value: 'spain', emoji: '🇪🇸' },
      { name: 'Scandinavia', value: 'scandinavia', emoji: '🇸🇪' },
      { name: 'Eastern Europe', value: 'eastern-europe', emoji: '🇵🇱' },
    ]
  },
  {
    continent: 'Latin America',
    value: 'latin-america',
    emoji: '🌎',
    regions: [
      { name: 'Mexico', value: 'mexico', emoji: '🇲🇽' },
      { name: 'Cuba', value: 'cuba', emoji: '🇨🇺' },
      { name: 'Puerto Rico', value: 'puerto-rico', emoji: '🇵🇷' },
      { name: 'Brazil', value: 'brazil', emoji: '🇧🇷' },
      { name: 'Argentina', value: 'argentina', emoji: '🇦🇷' },
      { name: 'Colombia', value: 'colombia', emoji: '🇨🇴' },
      { name: 'Chile', value: 'chile', emoji: '🇨🇱' },
      { name: 'Peru', value: 'peru', emoji: '🇵🇪' },
    ]
  },
  {
    continent: 'Asia',
    value: 'asia',
    emoji: '🌏',
    regions: [
      { name: 'Japan', value: 'japan', emoji: '🇯🇵' },
      { name: 'South Korea', value: 'south-korea', emoji: '🇰🇷' },
      { name: 'China', value: 'china', emoji: '🇨🇳' },
      { name: 'India', value: 'india', emoji: '🇮🇳' },
      { name: 'Southeast Asia', value: 'southeast-asia', emoji: '🌴' },
      { name: 'Middle East', value: 'middle-east', emoji: '🕌' },
    ]
  },
  {
    continent: 'Africa',
    value: 'africa',
    emoji: '🌍',
    regions: [
      { name: 'West Africa', value: 'west-africa', emoji: '🇳🇬' },
      { name: 'East Africa', value: 'east-africa', emoji: '🇰🇪' },
      { name: 'North Africa', value: 'north-africa', emoji: '🇪🇬' },
      { name: 'South Africa', value: 'south-africa', emoji: '🇿🇦' },
    ]
  },
  {
    continent: 'Oceania',
    value: 'oceania',
    emoji: '🌏',
    regions: [
      { name: 'Australia', value: 'australia', emoji: '🇦🇺' },
      { name: 'New Zealand', value: 'new-zealand', emoji: '🇳🇿' },
      { name: 'Pacific Islands', value: 'pacific-islands', emoji: '🌺' },
    ]
  },
];

// List of language options with emojis
const languageOptions = [
  { name: 'English', value: 'english', emoji: '🇬🇧' },
  { name: 'Spanish', value: 'spanish', emoji: '🇪🇸' },
  { name: 'French', value: 'french', emoji: '🇫🇷' },
  { name: 'German', value: 'german', emoji: '🇩🇪' },
  { name: 'Portuguese', value: 'portuguese', emoji: '🇵🇹' },
  { name: 'Italian', value: 'italian', emoji: '🇮🇹' },
  { name: 'Japanese', value: 'japanese', emoji: '🇯🇵' },
  { name: 'Korean', value: 'korean', emoji: '🇰🇷' },
  { name: 'Mandarin', value: 'mandarin', emoji: '🇨🇳' },
  { name: 'Hindi', value: 'hindi', emoji: '🇮🇳' },
  { name: 'Arabic', value: 'arabic', emoji: '🇸🇦' },
  { name: 'Russian', value: 'russian', emoji: '🇷🇺' },
];

const RegionSelection: React.FC<RegionSelectionProps> = ({ formData, updateFormData }) => {
  const [selectedRegions, setSelectedRegions] = useState<string[]>(formData.regions);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(formData.languages);
  const [activeTab, setActiveTab] = useState<'regions' | 'languages'>('regions');
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredContinent, setHoveredContinent] = useState<string | null>(null);
  const [expandedContinent, setExpandedContinent] = useState<string | null>(null);

  // Handle region selection
  const handleRegionSelect = (region: string) => {
    let updatedRegions: string[];
    
    if (selectedRegions.includes(region)) {
      updatedRegions = selectedRegions.filter(r => r !== region);
    } else {
      // Limit to 3 regions maximum
      if (selectedRegions.length >= 3) {
        showMaxReached('regions');
        return;
      }
      updatedRegions = [...selectedRegions, region];
    }
    
    setSelectedRegions(updatedRegions);
    updateFormData('regions', updatedRegions);
  };

  // Handle language selection
  const handleLanguageSelect = (language: string) => {
    let updatedLanguages: string[];
    
    if (selectedLanguages.includes(language)) {
      updatedLanguages = selectedLanguages.filter(l => l !== language);
    } else {
      // Limit to 3 languages maximum
      if (selectedLanguages.length >= 3) {
        showMaxReached('languages');
        return;
      }
      updatedLanguages = [...selectedLanguages, language];
    }
    
    setSelectedLanguages(updatedLanguages);
    updateFormData('languages', updatedLanguages);
  };

  // Max selection notification
  const [showMaxReachedType, setShowMaxReachedType] = useState<string | null>(null);
  
  const showMaxReached = (type: 'regions' | 'languages') => {
    setShowMaxReachedType(type);
    setTimeout(() => {
      setShowMaxReachedType(null);
    }, 2000);
  };

  // Get region name and emoji from value
  const getRegionInfo = (regionValue: string): { name: string, emoji: string } => {
    for (const continent of regionOptions) {
      const regionObj = continent.regions.find(r => r.value === regionValue);
      if (regionObj) return { name: regionObj.name, emoji: regionObj.emoji };
    }
    return { name: regionValue, emoji: '🌍' };
  };

  // Get language name and emoji from value
  const getLanguageInfo = (languageValue: string): { name: string, emoji: string } => {
    const languageOption = languageOptions.find(l => l.value === languageValue);
    return languageOption 
      ? { name: languageOption.name, emoji: languageOption.emoji }
      : { name: languageValue, emoji: '🔤' };
  };

  // Filter regions based on search term
  const filteredRegionOptions = searchTerm
    ? regionOptions.map(continent => ({
        ...continent,
        regions: continent.regions.filter(region => 
          region.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(continent => continent.regions.length > 0)
    : regionOptions;

  // Filter languages based on search term
  const filteredLanguageOptions = searchTerm
    ? languageOptions.filter(language => 
        language.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : languageOptions;

  // Toggle expanded continent
  const toggleContinentExpand = (continentValue: string) => {
    if (expandedContinent === continentValue) {
      setExpandedContinent(null);
    } else {
      setExpandedContinent(continentValue);
    }
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
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  const tabVariants = {
    inactive: { color: "#9CA3AF", borderColor: "transparent" },
    active: { 
      color: "#1DB954", 
      borderColor: "#1DB954",
      transition: { duration: 0.2 } 
    }
  };

  const subregionVariants = {
    hidden: { height: 0, opacity: 0, overflow: "hidden" },
    visible: { 
      height: "auto", 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Select Regions & Languages 🌎</h2>
      <p className="text-gray-400 mb-6">
        Choose the regions and languages you want to include in your playlist.
      </p>
      
      {/* Tab selection */}
      <div className="flex border-b border-gray-700 mb-6">
        <motion.button
          onClick={() => setActiveTab('regions')}
          className={`relative px-6 py-3 text-sm font-medium border-b-2 ${
            activeTab === 'regions' 
              ? 'border-[#1DB954]' 
              : 'border-transparent'
          }`}
          variants={tabVariants}
          animate={activeTab === 'regions' ? 'active' : 'inactive'}
          whileHover={{ backgroundColor: "#252525" }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center">
            <span className="mr-2">🗺️</span>
            Regions
          </div>
          {activeTab === 'regions' && (
            <motion.div 
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1DB954]"
              layoutId="tabIndicator"
            />
          )}
        </motion.button>
        <motion.button
          onClick={() => setActiveTab('languages')}
          className={`relative px-6 py-3 text-sm font-medium border-b-2 ${
            activeTab === 'languages' 
              ? 'border-[#1DB954]' 
              : 'border-transparent'
          }`}
          variants={tabVariants}
          animate={activeTab === 'languages' ? 'active' : 'inactive'}
          whileHover={{ backgroundColor: "#252525" }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center">
            <span className="mr-2">🔤</span>
            Languages
          </div>
          {activeTab === 'languages' && (
            <motion.div 
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1DB954]"
              layoutId="tabIndicator"
            />
          )}
        </motion.button>
      </div>
      
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
          placeholder={`Search ${activeTab === 'regions' ? 'regions' : 'languages'}...`}
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
      
      {/* Selected items */}
      {activeTab === 'regions' ? (
        <div className="mb-8 relative">
          <h3 className="text-sm font-medium text-gray-400 mb-3">
            Selected Regions: <span className={`font-bold ${selectedRegions.length === 3 ? 'text-[#1DB954]' : ''}`}>{selectedRegions.length}/3</span>
          </h3>
          
          {/* Max regions reached animation - improved styling */}
          {showMaxReachedType === 'regions' && (
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
                Maximum of 3 regions reached! Remove one to add another.
              </div>
            </motion.div>
          )}
          
          <div className="flex flex-wrap gap-2">
            {selectedRegions.length > 0 ? (
              <motion.div
                className="flex flex-wrap gap-2"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {selectedRegions.map(region => {
                  const regionInfo = getRegionInfo(region);
                  return (
                    <motion.span 
                      key={region} 
                      className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-[#1DB954] text-white shadow-lg shadow-[#1DB954]/20"
                      variants={itemVariants}
                      layout
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="mr-2 text-xl">{regionInfo.emoji}</span>
                      {regionInfo.name}
                      <button
                        type="button"
                        className="ml-2 inline-flex items-center transition-all duration-200 hover:rotate-90"
                        onClick={() => handleRegionSelect(region)}
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
                No regions selected yet. Explore the options below! ⬇️
              </motion.span>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-8 relative">
          <h3 className="text-sm font-medium text-gray-400 mb-3">
            Selected Languages: <span className={`font-bold ${selectedLanguages.length === 3 ? 'text-[#1DB954]' : ''}`}>{selectedLanguages.length}/3</span>
          </h3>
          
          {/* Max languages reached animation - improved styling */}
          {showMaxReachedType === 'languages' && (
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
                Maximum of 3 languages reached! Remove one to add another.
              </div>
            </motion.div>
          )}
          
          <div className="flex flex-wrap gap-2">
            {selectedLanguages.length > 0 ? (
              <motion.div
                className="flex flex-wrap gap-2"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {selectedLanguages.map(language => {
                  const languageInfo = getLanguageInfo(language);
                  return (
                    <motion.span 
                      key={language} 
                      className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-[#1DB954] text-white shadow-lg shadow-[#1DB954]/20"
                      variants={itemVariants}
                      layout
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="mr-2 text-xl">{languageInfo.emoji}</span>
                      {languageInfo.name}
                      <button
                        type="button"
                        className="ml-2 inline-flex items-center transition-all duration-200 hover:rotate-90"
                        onClick={() => handleLanguageSelect(language)}
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
                No languages selected yet. Find your voice below! ⬇️
              </motion.span>
            )}
          </div>
        </div>
      )}
      
      {/* Region list with dropdown approach */}
      {activeTab === 'regions' && (
        <>
          {filteredRegionOptions.length > 0 ? (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredRegionOptions.map(continent => (
                <motion.div 
                  key={continent.continent}
                  variants={itemVariants}
                  className={`bg-gradient-to-br from-[#282828] to-[#1A1A1A] p-5 rounded-xl shadow-md cursor-pointer`}
                  onMouseEnter={() => setHoveredContinent(continent.continent)}
                  onMouseLeave={() => setHoveredContinent(null)}
                  onClick={() => toggleContinentExpand(continent.value)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#333333] text-gray-400">
                        <span className="text-xl">{continent.emoji}</span>
                      </div>
                      <div>
                        <div className="text-lg font-medium">
                          {continent.continent}
                        </div>
                        <div className="text-xs text-gray-500">
                          {continent.regions.length} regions
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click from triggering
                        toggleContinentExpand(continent.value);
                      }}
                      className={`p-1 rounded-full transition-transform duration-300 ${expandedContinent === continent.value ? 'rotate-180' : ''}`}
                      aria-label={`${expandedContinent === continent.value ? 'Collapse' : 'Expand'} regions`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Regions dropdown */}
                  <motion.div 
                    className="ml-6 space-y-2 overflow-hidden"
                    variants={subregionVariants}
                    initial="hidden"
                    animate={expandedContinent === continent.value ? "visible" : "hidden"}
                    onClick={(e) => e.stopPropagation()} // Prevent clicks in dropdown from triggering card
                  >
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {continent.regions.map(region => (
                        <motion.div 
                          key={`${continent.value}-${region.value}`} 
                          className="flex items-center"
                          whileHover={{ x: 5 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent card click from triggering
                              handleRegionSelect(region.value);
                            }}
                            className={`w-full px-3 py-2 rounded-lg text-left text-sm flex items-center space-x-2 transition-all duration-200 ${
                              selectedRegions.includes(region.value)
                                ? 'bg-[#1DB954]/30 text-white'
                                : 'bg-[#333333] text-gray-300 hover:bg-[#444444]'
                            }`}
                          >
                            {selectedRegions.includes(region.value) && (
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
                            <span className="mr-2 text-xl">{region.emoji}</span>
                            <span>{region.name}</span>
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <span className="text-6xl mb-4 block">🔍</span>
              <p className="text-gray-400 text-lg">No regions found matching "{searchTerm}"</p>
              <p className="text-gray-500 mt-2">Try a different search term</p>
            </motion.div>
          )}
        </>
      )}
      
      {/* Language list */}
      {activeTab === 'languages' && (
        <>
          {filteredLanguageOptions.length > 0 ? (
            <motion.div 
              className="bg-gradient-to-br from-[#282828] to-[#1A1A1A] p-5 rounded-xl shadow-md"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <span className="text-xl mr-2">🔤</span>
                Languages
              </h3>
              <motion.div 
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
                variants={containerVariants}
              >
                {filteredLanguageOptions.map(language => (
                  <motion.button
                    key={language.value}
                    type="button"
                    onClick={() => handleLanguageSelect(language.value)}
                    className={`py-3 px-4 rounded-lg text-sm transition-all duration-200 flex items-center justify-center ${
                      selectedLanguages.includes(language.value)
                        ? 'bg-[#1DB954] text-white shadow-md' 
                        : 'bg-[#333333] text-gray-300 hover:bg-[#444444] hover:scale-105'
                    }`}
                    variants={itemVariants}
                    whileHover={{ y: -5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-xl mr-2">{language.emoji}</span>
                    {language.name}
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>
          ) : (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <span className="text-6xl mb-4 block">🔍</span>
              <p className="text-gray-400 text-lg">No languages found matching "{searchTerm}"</p>
              <p className="text-gray-500 mt-2">Try a different search term</p>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default RegionSelection; 