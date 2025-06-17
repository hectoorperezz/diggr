'use client';
import { useSearchParams } from 'next/navigation';

export default function ClientSearchParams() {
  const params = useSearchParams();
  // You can add logic here to use params, or pass them as props to children if needed.
  // For now, this is a placeholder to satisfy the Suspense boundary requirement.
  return null;
} 