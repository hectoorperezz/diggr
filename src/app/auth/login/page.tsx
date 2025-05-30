'use client';

import React from 'react';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <img src="/images/diggr.png" alt="Diggr" className="h-16 mx-auto" />
          </Link>
          <h1 className="text-2xl font-bold mt-6">Welcome back</h1>
          <p className="text-[#A3A3A3] mt-2">Log in to your account to continue</p>
        </div>
        
        <div className="bg-[#181818] rounded-2xl shadow-md p-6">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-center">Log In</h3>
          </div>
          <div>
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
} 