'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const formRef = useRef<HTMLFormElement>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value,
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Send form data to our API endpoint
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formState),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }
      
      // Reset form and show success message
      if (formRef.current) formRef.current.reset();
      setFormState({ name: '', email: '', subject: '', message: '' });
      setIsSubmitted(true);
      
      // Hide success message after 5 seconds
      setTimeout(() => setIsSubmitted(false), 5000);
    } catch (err: any) {
      console.error('Error submitting form:', err);
      setError(err.message || 'Something went wrong. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#121212]"></div>
        <div className="absolute top-0 -left-40 w-96 h-96 bg-gradient-to-br from-purple-500/20 via-[#1DB954]/20 to-transparent rounded-full filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute top-0 -right-40 w-96 h-96 bg-gradient-to-br from-[#1DB954]/20 via-purple-500/20 to-transparent rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-purple-500/20 via-[#1DB954]/20 to-transparent rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <motion.header 
        className="w-full sticky top-2 z-50 transition-all duration-300 py-5 bg-transparent"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-2xl font-bold flex items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link href="/">
              <img src="/images/diggr.png" alt="Diggr" className="h-14 mr-2" />
            </Link>
          </motion.div>
          <motion.nav 
            className="space-x-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <>
              <Link href="/auth/login" className="group relative overflow-hidden rounded-full inline-block">
                <div className="absolute inset-0 w-full h-full bg-white/10 group-hover:bg-white/15 group-hover:scale-105 transition-all duration-300"></div>
                <div className="absolute inset-[2px] rounded-full bg-black/80 group-hover:bg-black/75 backdrop-blur-xl z-10 transition-all duration-300"></div>
                <span className="relative z-20 px-6 py-2.5 inline-block font-medium text-white text-sm md:text-base">Login</span>
              </Link>
              <Link href="/auth/register" className="group relative overflow-hidden rounded-full inline-block">
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#1DB954] to-[#1DB954]/80 group-hover:scale-105 transition-transform duration-300"></div>
                <div className="absolute inset-[2px] rounded-full bg-black/50 backdrop-blur-xl z-10"></div>
                <span className="relative z-20 px-6 py-2.5 inline-block font-medium text-white text-sm md:text-base">Sign Up</span>
              </Link>
            </>
          </motion.nav>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <motion.h1
            className="text-4xl md:text-5xl font-bold mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Get in Touch
          </motion.h1>
          <motion.p
            className="text-xl text-[#A3A3A3] max-w-3xl mx-auto"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Have questions or feedback? We'd love to hear from you.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 max-w-6xl mx-auto">
          {/* Contact Info */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-[#111111] backdrop-filter backdrop-blur-lg bg-opacity-80 rounded-3xl border border-white/5 p-8 h-full">
              <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
              
              <div className="space-y-8">
                <div className="flex items-start">
                  <div className="bg-[#1DB954]/10 rounded-full p-3 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#1DB954]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-1">Email</h3>
                    <a href="mailto:contact@diggr.xyz" className="text-[#1DB954] hover:underline">contact@diggr.xyz</a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-[#1DB954]/10 rounded-full p-3 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#1DB954]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-1">Location</h3>
                    <p className="text-[#A3A3A3]">Madrid, Spain</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-[#1DB954]/10 rounded-full p-3 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#1DB954]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-1">Social</h3>
                    <div className="flex space-x-4 mt-2">
                      <a 
                        href="https://x.com" 
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#1DB954]/20 transition-colors duration-300"
                        aria-label="X (formerly Twitter)"
                      >
                        <span className="text-[#A3A3A3] hover:text-[#1DB954]">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                        </span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Contact Form */}
          <motion.div 
            className="lg:col-span-3"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-[#111111] backdrop-filter backdrop-blur-lg bg-opacity-80 rounded-3xl border border-white/5 p-8">
              <h2 className="text-2xl font-bold mb-6">Send us a message</h2>
              
              {isSubmitted ? (
                <motion.div 
                  className="bg-[#1DB954]/20 border border-[#1DB954]/50 rounded-2xl p-6 text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-[#1DB954] mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-xl font-medium mb-2">Message sent!</h3>
                  <p className="text-[#A3A3A3]">Thank you for contacting us. We'll get back to you as soon as possible.</p>
                </motion.div>
              ) : (
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="block text-sm font-medium text-[#A3A3A3]">Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formState.name}
                        onChange={handleChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#1DB954]/50 focus:border-transparent transition-all duration-300"
                        placeholder="Your name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-medium text-[#A3A3A3]">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formState.email}
                        onChange={handleChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#1DB954]/50 focus:border-transparent transition-all duration-300"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="subject" className="block text-sm font-medium text-[#A3A3A3]">Subject</label>
                    <select
                      id="subject"
                      name="subject"
                      required
                      value={formState.subject}
                      onChange={handleChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#1DB954]/50 focus:border-transparent transition-all duration-300 appearance-none"
                    >
                      <option value="" disabled>Select a subject</option>
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Technical Support">Technical Support</option>
                      <option value="Billing Question">Billing Question</option>
                      <option value="Feature Request">Feature Request</option>
                      <option value="Partnership">Partnership</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="message" className="block text-sm font-medium text-[#A3A3A3]">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      value={formState.message}
                      onChange={handleChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#1DB954]/50 focus:border-transparent transition-all duration-300"
                      placeholder="How can we help you?"
                    ></textarea>
                  </div>
                  
                  {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-center">
                      <p className="text-red-200">{error}</p>
                    </div>
                  )}
                  
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full relative group overflow-hidden inline-block rounded-xl text-center"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#1DB954] to-purple-500 group-hover:scale-105 transition-transform duration-300"></div>
                    <span className="relative block py-4 font-medium text-white">
                      {isSubmitting ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </div>
                      ) : 'Send Message'}
                    </span>
                  </motion.button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 mt-auto py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="col-span-1 md:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="mb-6"
              >
                <img src="/images/diggr.png" alt="Diggr" className="h-10" />
              </motion.div>
              <motion.p 
                className="text-[#A3A3A3] mb-6 max-w-md"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
              >
                Diggr brings the soul of vinyl crate digging into the digital age, helping you discover music that feels personal and curated.
              </motion.p>
              <motion.div
                className="flex"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <a 
                  href="https://x.com" 
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#1DB954]/20 transition-colors duration-300"
                  aria-label="X (formerly Twitter)"
                >
                  <span className="text-[#A3A3A3] hover:text-[#1DB954]">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </span>
                </a>
              </motion.div>
            </div>
            
            <motion.div
              className="col-span-1"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <h3 className="text-lg font-medium mb-4">Navigation</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/" className="text-[#A3A3A3] hover:text-[#1DB954] transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/#how-it-works" className="text-[#A3A3A3] hover:text-[#1DB954] transition-colors">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/#pricing" className="text-[#A3A3A3] hover:text-[#1DB954] transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-[#1DB954] hover:text-[#1DB954] transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </motion.div>
            
            <motion.div
              className="col-span-1"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <h3 className="text-lg font-medium mb-4">Legal</h3>
              <ul className="space-y-3">
                {['Terms of Service', 'Privacy Policy', 'Cookie Policy'].map(link => (
                  <li key={link}>
                    <Link href={`/${link.toLowerCase().replace(/ /g, '-')}`} className="text-[#A3A3A3] hover:text-[#1DB954] transition-colors">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
          
          <motion.div 
            className="border-t border-white/5 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="text-[#A3A3A3] text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} Diggr. All rights reserved.
            </div>
            <div className="flex items-center">
              <span className="text-[#A3A3A3] text-sm mr-2">Made with</span>
              <span className="text-[#1DB954]">♥</span>
              <span className="text-[#A3A3A3] text-sm ml-2">for music lovers</span>
            </div>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}