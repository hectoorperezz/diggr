import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface ButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  target?: string;
  rel?: string;
}

export default function Button({
  children,
  onClick,
  href,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  target,
  rel,
}: ButtonProps) {
  // Define variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: 'bg-gradient-to-r from-[#1DB954] to-[#1DB954]/80',
          hoverBg: 'group-hover:scale-105',
          textColor: 'text-white',
          borderColor: '',
        };
      case 'secondary':
        return {
          bg: 'bg-gradient-to-r from-purple-500 to-purple-500/80',
          hoverBg: 'group-hover:scale-105',
          textColor: 'text-white',
          borderColor: '',
        };
      case 'outline':
        return {
          bg: 'bg-white/10',
          hoverBg: 'group-hover:scale-105',
          textColor: 'text-white',
          borderColor: '',
        };
      case 'danger':
        return {
          bg: 'bg-red-500/20',
          hoverBg: 'group-hover:scale-105',
          textColor: 'text-red-500',
          borderColor: '',
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-[#1DB954] to-[#1DB954]/80',
          hoverBg: 'group-hover:scale-105',
          textColor: 'text-white',
          borderColor: '',
        };
    }
  };

  // Define size styles with improved padding
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: 'px-5 py-2.5',
          text: 'text-sm',
          iconSize: 'w-4 h-4',
          iconMargin: 'mx-2',
        };
      case 'lg':
        return {
          padding: 'px-10 py-4',
          text: 'text-lg',
          iconSize: 'w-6 h-6',
          iconMargin: 'mx-3',
        };
      default:
        return {
          padding: 'px-8 py-3',
          text: 'text-base',
          iconSize: 'w-5 h-5',
          iconMargin: 'mx-2.5',
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  
  // Determine if this is an icon-only button
  const isIconOnly = icon && !children;
  
  const buttonContent = (
    <>
      <div className={`absolute inset-0 ${variantStyles.bg} ${variantStyles.hoverBg} transition-transform duration-300`}></div>
      <div className="absolute inset-[2px] rounded-full bg-black/50 backdrop-blur-xl z-10"></div>
      <span className={`
        relative z-20 
        flex items-center justify-center 
        w-full 
        ${variantStyles.textColor} 
        ${sizeStyles.text} 
        font-medium 
        ${className.includes('p-0') ? '' : sizeStyles.padding}
        ${isIconOnly ? 'p-0' : ''}
      `}>
        {icon && iconPosition === 'left' && (
          <span className={`
            ${sizeStyles.iconSize} 
            flex-shrink-0
            ${children ? 'mr-2 sm:mr-3' : ''}
          `}>
            {icon}
          </span>
        )}
        {children && <span className="whitespace-nowrap overflow-hidden text-ellipsis">{children}</span>}
        {icon && iconPosition === 'right' && (
          <span className={`
            ${sizeStyles.iconSize} 
            flex-shrink-0
            ${children ? 'ml-2 sm:ml-3' : ''}
          `}>
            {icon}
          </span>
        )}
      </span>
    </>
  );

  if (href) {
    return (
      <motion.div
        className={`${fullWidth ? 'w-full' : 'inline-block'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        whileHover={disabled ? {} : { scale: 1.03 }}
        whileTap={disabled ? {} : { scale: 0.97 }}
      >
        <Link 
          href={disabled ? '#' : href} 
          className={`relative group overflow-hidden ${fullWidth ? 'w-full block' : 'inline-block'} rounded-full ${className}`} 
          onClick={disabled ? (e) => e.preventDefault() : undefined}
          target={target}
          rel={rel}
        >
          {buttonContent}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`relative group overflow-hidden ${fullWidth ? 'w-full' : 'inline-block'} rounded-full ${className}`}
      whileHover={disabled ? {} : { scale: 1.03 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
    >
      {buttonContent}
    </motion.button>
  );
} 