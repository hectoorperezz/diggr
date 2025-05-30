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
    emoji: '🌎',
    regions: [
      { name: 'United States', value: 'us', emoji: '🇺🇸' },
      { name: 'Canada', value: 'canada', emoji: '🇨🇦' },
      { name: 'Mexico', value: 'mexico', emoji: '🇲🇽' },
      { name: 'Caribbean', value: 'caribbean', emoji: '🏝️' },
    ]
  },
  {
    continent: 'Europe',
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
    emoji: '💃',
    regions: [
      { name: 'Brazil', value: 'brazil', emoji: '🇧🇷' },
      { name: 'Argentina', value: 'argentina', emoji: '🇦🇷' },
      { name: 'Colombia', value: 'colombia', emoji: '🇨🇴' },
      { name: 'Chile', value: 'chile', emoji: '🇨🇱' },
      { name: 'Peru', value: 'peru', emoji: '🇵🇪' },
    ]
  },
  {
    continent: 'Asia',
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
    emoji: '🏝️',
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
  { name: 'Swedish', value: 'swedish', emoji: '🇸🇪' },
  { name: 'Dutch', value: 'dutch', emoji: '🇳🇱' },
  { name: 'Afrobeats', value: 'afrobeats', emoji: '🥁' },
  { name: 'Latin', value: 'latin', emoji: '💃' },
  { name: 'Indigenous Languages', value: 'indigenous', emoji: '🏞️' },
];

const RegionSelection: React.FC<RegionSelectionProps> = ({ formData, updateFormData }) => {
  const [selectedRegions, setSelectedRegions] = useState<string[]>(formData.regions);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(formData.languages);
  const [activeTab, setActiveTab] = useState<'regions' | 'languages'>('regions');
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredContinent, setHoveredContinent] = useState<string | null>(null);
  const [activeContinent, setActiveContinent] = useState<string | null>(null);

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

  // Handle continent selection for filtering
  const handleContinentSelect = (continent: string) => {
    if (activeContinent === continent) {
      setActiveContinent(null);
    } else {
      setActiveContinent(continent);
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
          
          {/* Max regions reached animation */}
          {showMaxReachedType === 'regions' && (
            <motion.div 
              className="absolute -top-2 left-0 right-0 bg-[#ff4d4f]/20 text-[#ff4d4f] text-center py-2 rounded-lg"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              Maximum of 3 regions reached! Remove one to add another.
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
                No regions selected yet. Explore the map below! ⬇️
              </motion.span>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-8 relative">
          <h3 className="text-sm font-medium text-gray-400 mb-3">
            Selected Languages: <span className={`font-bold ${selectedLanguages.length === 3 ? 'text-[#1DB954]' : ''}`}>{selectedLanguages.length}/3</span>
          </h3>
          
          {/* Max languages reached animation */}
          {showMaxReachedType === 'languages' && (
            <motion.div 
              className="absolute -top-2 left-0 right-0 bg-[#ff4d4f]/20 text-[#ff4d4f] text-center py-2 rounded-lg"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              Maximum of 3 languages reached! Remove one to add another.
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
      
      {/* Continent filters for regions */}
      {activeTab === 'regions' && !searchTerm && (
        <motion.div 
          className="flex flex-wrap gap-2 mb-6"
          variants={containerVariants}
          initial="hidden" 
          animate="visible"
        >
          {regionOptions.map(continent => (
            <motion.button
              key={continent.continent}
              onClick={() => handleContinentSelect(continent.continent)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center ${
                activeContinent === continent.continent
                  ? 'bg-[#1DB954] text-white shadow-md shadow-[#1DB954]/20'
                  : 'bg-[#282828] text-gray-300 hover:bg-[#333333]'
              }`}
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="mr-2">{continent.emoji}</span>
              {continent.continent}
            </motion.button>
          ))}
        </motion.div>
      )}
      
      {/* Region list */}
      {activeTab === 'regions' && (
        <>
          {filteredRegionOptions.length > 0 ? (
            <motion.div 
              className="space-y-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredRegionOptions.map(continent => (
                (!activeContinent || activeContinent === continent.continent) && (
                  <motion.div 
                    key={continent.continent}
                    variants={itemVariants}
                    className="bg-gradient-to-br from-[#282828] to-[#1A1A1A] p-5 rounded-xl shadow-md"
                    onMouseEnter={() => setHoveredContinent(continent.continent)}
                    onMouseLeave={() => setHoveredContinent(null)}
                  >
                    <h3 className="text-lg font-medium mb-4 flex items-center">
                      <motion.span 
                        className="text-xl mr-2"
                        animate={hoveredContinent === continent.continent ? { scale: [1, 1.2, 1], rotate: [0, 10, 0] } : {}}
                        transition={{ duration: 0.5 }}
                      >
                        {continent.emoji}
                      </motion.span>
                      {continent.continent}
                    </h3>
                    <motion.div 
                      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
                      variants={containerVariants}
                    >
                      {continent.regions.map(region => (
                        <motion.button
                          key={region.value}
                          type="button"
                          onClick={() => handleRegionSelect(region.value)}
                          className={`py-3 px-4 rounded-lg text-sm transition-all duration-200 flex items-center justify-center ${
                            selectedRegions.includes(region.value)
                              ? 'bg-[#1DB954] text-white shadow-md' 
                              : 'bg-[#333333] text-gray-300 hover:bg-[#444444] hover:scale-105'
                          }`}
                          variants={itemVariants}
                          whileHover={{ y: -5 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className="text-xl mr-2">{region.emoji}</span>
                          {region.name}
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