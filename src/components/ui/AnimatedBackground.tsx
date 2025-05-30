import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedBackgroundProps {
  variant?: 'default' | 'green' | 'purple' | 'error';
  intensity?: 'low' | 'medium' | 'high';
  animated?: boolean;
}

export default function AnimatedBackground({
  variant = 'default',
  intensity = 'medium',
  animated = true,
}: AnimatedBackgroundProps) {
  // Configure colors based on variant
  const getColors = () => {
    switch (variant) {
      case 'green':
        return {
          first: 'from-[#1DB954]/30',
          second: 'via-purple-500/10',
          third: 'to-[#1DB954]/20',
        };
      case 'purple':
        return {
          first: 'from-purple-500/30',
          second: 'via-[#1DB954]/10',
          third: 'to-purple-500/20',
        };
      case 'error':
        return {
          first: 'from-red-500/30',
          second: 'via-purple-500/10',
          third: 'to-red-500/20',
        };
      default:
        return {
          first: 'from-purple-500/20',
          second: 'via-[#1DB954]/20',
          third: 'to-transparent',
        };
    }
  };

  // Configure opacity based on intensity
  const getOpacity = () => {
    switch (intensity) {
      case 'low':
        return 'opacity-30';
      case 'high':
        return 'opacity-70';
      default:
        return 'opacity-50';
    }
  };

  const colors = getColors();
  const opacity = getOpacity();

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#121212]"></div>
      
      {/* First blob */}
      <motion.div 
        className={`absolute top-0 -left-40 w-96 h-96 bg-gradient-to-br ${colors.first} ${colors.second} ${colors.third} rounded-full filter blur-3xl ${opacity} ${animated ? 'animate-blob' : ''}`}
        animate={animated ? {} : { 
          scale: [1, 1.05, 1],
          opacity: [0.4, 0.5, 0.4],
        }}
        transition={animated ? {} : { 
          duration: 8, 
          repeat: Infinity,
          repeatType: "reverse" 
        }}
      />
      
      {/* Second blob */}
      <motion.div 
        className={`absolute top-0 -right-40 w-96 h-96 bg-gradient-to-br ${colors.third} ${colors.first} ${colors.second} rounded-full filter blur-3xl ${opacity} ${animated ? 'animate-blob animation-delay-2000' : ''}`}
        animate={animated ? {} : { 
          scale: [1, 1.05, 1],
          opacity: [0.4, 0.5, 0.4],
        }}
        transition={animated ? {} : { 
          duration: 8, 
          repeat: Infinity,
          repeatType: "reverse",
          delay: 2
        }}
      />
      
      {/* Third blob */}
      <motion.div 
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-br ${colors.second} ${colors.third} ${colors.first} rounded-full filter blur-3xl ${opacity} ${animated ? 'animate-blob animation-delay-4000' : ''}`}
        animate={animated ? {} : { 
          scale: [1, 1.05, 1],
          opacity: [0.4, 0.5, 0.4],
        }}
        transition={animated ? {} : { 
          duration: 8, 
          repeat: Infinity,
          repeatType: "reverse",
          delay: 4
        }}
      />
    </div>
  );
} 