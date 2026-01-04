
import React, { useState } from 'react';
import { User, Role } from '../types';
import { USERS } from '../App';
import { LogIn, Cpu, Network, Activity, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<Role>(Role.FRONT_DESK);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    // Simulate system initialization delay for effect
    setTimeout(() => {
        const user = USERS.find(u => u.role === selectedRole);
        if (user) {
          onLogin(user);
        }
    }, 800);
  };

  const roles = [
    Role.FRONT_DESK,
    Role.CUSTOMER_RESPONSE,
    Role.CORE_NET,
    Role.NET_OPT,
    Role.TRANS,
    Role.CORP,
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-cyan-500/30">
      
      {/* Dynamic Background Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] pointer-events-none animate-pulse" style={{animationDuration: '4s'}}></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[128px] pointer-events-none animate-pulse" style={{animationDuration: '6s'}}></div>
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

      <div className={`
        relative w-full max-w-md 
        bg-slate-900/60 backdrop-blur-2xl 
        border border-white/10 rounded-3xl 
        shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] 
        overflow-hidden 
        transition-all duration-500 ease-out
        ${isLoggingIn ? 'scale-95 opacity-0 translate-y-4' : 'scale-100 opacity-100'}
      `}>
        
        {/* Top Glow Line */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>

        <div className="p-8 md:p-10 flex flex-col items-center">
          
          {/* Logo / Icon */}
          <div className="relative mb-8 group">
             <div className="absolute inset-0 bg-cyan-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
             <div className="relative w-20 h-20 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 flex items-center justify-center shadow-2xl transform group-hover:scale-105 transition-all duration-500">
                <Network className="w-10 h-10 text-cyan-400" />
             </div>
             {/* Decorators */}
             <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
          </div>

          <h1 className="text-2xl font-bold text-white tracking-wider mb-1">IoT 智能工单系统</h1>
          <p className="text-slate-400 text-sm font-medium tracking-wide mb-10">Intelligent Operation Center</p>
          
          <form onSubmit={handleSubmit} className="w-full space-y-6">
            
            <div className="space-y-2 group">
              <label className="text-[10px] font-bold text-cyan-500/80 uppercase tracking-widest ml-1 mb-1 block">
                Access Role / 身份选择
              </label>
              <div className="relative transition-transform duration-300 group-focus-within:scale-[1.02]">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <Cpu className="w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                </div>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as Role)}
                  className="w-full pl-12 pr-10 py-4 bg-slate-950/50 border border-slate-700/50 rounded-xl text-slate-200 font-medium focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500/50 focus:outline-none appearance-none cursor-pointer hover:bg-slate-900/80 transition-all shadow-inner"
                >
                  {roles.map((role) => (
                    <option key={role} value={role} className="bg-slate-900 text-slate-300 py-2">
                      {role}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <div className="w-1.5 h-1.5 border-r-2 border-b-2 border-current rotate-45"></div>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full group relative overflow-hidden bg-cyan-600 hover:bg-cyan-500 text-white py-4 rounded-xl font-bold text-base transition-all duration-300 shadow-[0_0_20px_-5px_rgba(8,145,178,0.4)] hover:shadow-[0_0_25px_-5px_rgba(8,145,178,0.6)]"
            >
              <div className="flex items-center justify-center gap-2 relative z-10">
                <span>进入系统</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
            
          </form>

          {/* Footer Status */}
          <div className="mt-10 flex items-center gap-6 w-full justify-center opacity-60">
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider">SYSTEM ONLINE</span>
             </div>
             <div className="flex items-center gap-2">
                <Activity className="w-3 h-3 text-slate-500" />
                <span className="text-[10px] text-slate-400 font-mono tracking-wider">v2.4.0</span>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};
