import Link from 'next/link';

import { Zap, Lock, Users } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6 selection:bg-blue-200 overflow-hidden relative">
      {/* Decorative background blobs */}
      <div className="absolute top-0 -z-10 h-full w-full bg-white">
        <div className="absolute bottom-auto left-auto right-0 top-0 h-[500px] w-[500px] -translate-x-[30%] translate-y-[20%] rounded-full bg-[rgba(59,130,246,0.1)] opacity-50 blur-[80px]"></div>
        <div className="absolute bottom-0 left-0 h-[300px] w-[300px] translate-x-[20%] -translate-y-[20%] rounded-full bg-[rgba(99,102,241,0.08)] opacity-40 blur-[60px]"></div>
      </div>

      <div className="max-w-4xl mx-auto text-center space-y-8 z-10 animate-in fade-in zoom-in duration-1000">
        {/* Main Headline */}
        <h1 className="text-6xl md:text-8xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 pb-2">
          Welcome to Edulink.
        </h1>
        
        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          The ultimate collaborative study platform for students. Connect with peers, share resources, and master your subjects together.
        </p>
        
        {/* Call to Action Button */}
        <div className="pt-8">
          <Link 
            href="/auth" 
            className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-300 bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 hover:shadow-blue-500/30 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            <span>Enter Workspace</span>
            <svg 
              className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Trust Badges / Info */}
      <div className="absolute bottom-10 w-full flex justify-center gap-8 text-slate-400 text-sm font-medium opacity-60">
        <span className="flex items-center gap-1.5"><Zap size={14} /> Built with Next.js</span>
        <span className="flex items-center gap-1.5"><Lock size={14} /> Secure Auth</span>
        <span className="flex items-center gap-1.5"><Users size={14} /> Peer Learning</span>
      </div>
    </main>
  );
}
