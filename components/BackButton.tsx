import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface BackButtonProps {
  href: string;
  label?: string;
}

export function BackButton({ href, label = 'חזור' }: BackButtonProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-blue-200 text-blue-600 hover:text-white hover:bg-blue-600 hover:border-blue-600 rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md group"
    >
      <ArrowRight
        size={20}
        className="transition-transform duration-200 group-hover:-translate-x-1"
      />
      {label}
    </Link>
  );
}
