import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Coffee, LogOut, ShieldCheck, User as UserIcon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-900 flex items-center justify-center text-amber-100 shadow-sm">
              <Coffee size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-lg tracking-tight">
                  Coffee Ninja
                </span>
                <span className="text-xs bg-amber-100 text-amber-900 font-medium px-2 py-0.5 rounded-full">
                  Inquiries
                </span>
              </div>
              <p className="text-xs text-gray-500">Service Operations Desk</p>
            </div>
          </div>

          {/* User profile & Sign Out */}
          {user && (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="text-sm font-semibold text-gray-800">{user.name}</span>
                  {user.role === 'manager' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      <ShieldCheck size={12} />
                      Manager
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 flex items-center justify-end gap-1">
                  <UserIcon size={11} />
                  <span>{user.email}</span>
                  <span className="text-gray-300">•</span>
                  <span className="capitalize text-amber-800 font-medium">
                    {user.department} Dept
                  </span>
                </div>
              </div>

              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 rounded-lg transition-colors border border-gray-200"
                title="Sign out of workspace"
              >
                <LogOut size={14} />
                <span className="hidden xs:inline">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
