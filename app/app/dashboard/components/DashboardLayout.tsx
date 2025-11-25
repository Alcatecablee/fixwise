import { Button } from "@/components/ui/button";
"use client";

'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    tier: string;
    plan: string;
  };
  activeSection?: string;
}

export default function DashboardLayout({ children, user, activeSection = 'overview' }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: Date;
  }>>([]);
  const router = useRouter();

  // [NeuroLint] Replace mock data with API fetch:
const navigation = [
  { name: 'Overview', href: '/dashboard', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z', current: activeSection === 'overview' },
  { name: 'Projects', href: '/dashboard/projects', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', current: activeSection === 'projects' },
  { name: 'Analytics', href: '/dashboard/analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', current: activeSection === 'analytics' },
  { name: 'Code Analysis', href: '/dashboard/analysis', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4', current: activeSection === 'analysis' },
  { name: 'Collaboration', href: '/dashboard/collaboration', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', current: activeSection === 'collaboration' }];


  // [NeuroLint] Replace mock data with API fetch:
const enterpriseNavigation = [
  { name: 'Team Management', href: '/dashboard/team', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z', current: activeSection === 'team' },
  { name: 'API Keys', href: '/dashboard/api-keys', icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z', current: activeSection === 'api-keys' },
  { name: 'Monitoring', href: '/dashboard/monitoring', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', current: activeSection === 'monitoring' }];


  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        router.push('/login');
      }
    } catch (error) {
      // [NeuroLint] Removed console.error: 'Logout error:', error
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Mobile sidebar overlay */}
      {sidebarOpen &&
      <div
        className="fixed inset-0 z-40 lg:hidden"
        onClick={() => setSidebarOpen(false)}>

          <div className="fixed inset-0 bg-gray-900 bg-opacity-75"></div>
        </div>
      }

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 shadow-lg border-r border-gray-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
      sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
      }>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-white">NeuroLint</h1>
            </div>
          </div>
          <Button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-300 hover:bg-gray-800" >

            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) =>
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              item.current ?
              'bg-blue-900/50 text-blue-300 border-r-2 border-blue-500' :
              'text-gray-300 hover:bg-gray-800 hover:text-white'}`
              }>

                <svg
                className={`mr-3 h-5 w-5 ${
                item.current ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-300'}`
                }
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24" key={item.id || item}>

                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} key={item.id || item} />
                </svg>
                {item.name}
              </Link>
            )}
          </div>

          {user.tier === 'enterprise' &&
          <>
              <div className="mt-8 pt-6 border-t border-gray-700">
                <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Enterprise
                </h3>
                <div className="mt-3 space-y-1">
                  {enterpriseNavigation.map((item) =>
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  item.current ?
                  'bg-purple-900/50 text-purple-300 border-r-2 border-purple-500' :
                  'text-gray-300 hover:bg-gray-800 hover:text-white'}`
                  }>

                      <svg
                    className={`mr-3 h-5 w-5 ${
                    item.current ? 'text-purple-400' : 'text-gray-400 group-hover:text-gray-300'}`
                    }
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24" key={item.id || item}>

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} key={item.id || item} />
                      </svg>
                      {item.name}
                    </Link>
                )}
                </div>
              </div>
            </>
          }
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 bg-gray-900 shadow-sm border-b border-gray-800">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <Button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-300 hover:bg-gray-800" >

                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Button onClick={handleClick} className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded-md" >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </Button>

              {/* User menu */}
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user.firstName ? user.firstName.charAt(0) : user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-white">
                      {user.firstName || user.email}
                    </div>
                    <div className="text-xs text-gray-400 capitalize">
                      {user.tier} Plan
                    </div>
                  </div>
                </div>
              </div>

              {/* Logout button */}
              <Button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded-md"
                title="Logout" >

                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </Button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 bg-black">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>);

}