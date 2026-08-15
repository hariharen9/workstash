import React from 'react';
import { Heart, ExternalLink, Shield } from 'lucide-react';

export const Footer: React.FC<{ onOpenPrivacy: () => void }> = ({ onOpenPrivacy }) => {
  return (
    <footer className="w-full shrink-0 border-t border-line bg-surface/80 backdrop-blur-md px-6 sm:px-12 md:px-32 lg:px-44 pt-7 pb-24 md:pb-8 text-xs text-muted z-10">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        {/* Left: Logo, Name & Motto */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-5 h-5 rounded-[6px] bg-[conic-gradient(from_220deg,theme(colors.violet),theme(colors.teal),theme(colors.amber),theme(colors.violet))] grid place-items-center shadow-brand shrink-0">
            <span className="w-1.5 h-1.5 rounded-[2px] bg-void"></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display font-semibold text-text tracking-tight text-[0.85rem]">
              WorkStash
            </span>
            <span className="text-line">·</span>
            <span className="text-faint font-medium text-[0.75rem]">
              Spatial task workspace
            </span>
          </div>
        </div>

        {/* Middle: Crafted with ❤️ by Hariharen */}
        <div className="flex items-center gap-1 text-[0.78rem] text-muted font-medium">
          <span>Crafted with</span>
          <Heart size={12} className="text-danger fill-danger animate-pulse mx-0.5" />
          <span>by</span>
          <a
            href="https://hariharen.site"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-text hover:text-violet underline decoration-line hover:decoration-violet underline-offset-4 transition-all flex items-center gap-1 ml-0.5 group"
          >
            <span>Hariharen</span>
            <ExternalLink size={10} className="text-faint group-hover:text-violet transition-colors" />
          </a>
        </div>

        {/* Right: Copyright, License, Privacy Policy */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-[0.75rem] font-mono text-faint shrink-0">
          <span>© 2026 WorkStash</span>
          <span className="text-line">·</span>
          <a
            href="https://opensource.org/licenses/MIT"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text transition-colors cursor-pointer"
            title="Licensed under the MIT License"
          >
            MIT License
          </a>
          <span className="text-line">·</span>
          <button
            type="button"
            onClick={onOpenPrivacy}
            className="hover:text-text transition-colors cursor-pointer text-[0.75rem] font-mono flex items-center gap-1 bg-transparent border-none p-0 text-faint hover:underline underline-offset-2"
          >
            <Shield size={11} className="text-teal" />
            <span>Privacy Policy</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
