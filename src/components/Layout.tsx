
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Bell, User, Plus, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // This will be managed by auth context later
  
  const navigation = [
    { name: 'Questions', href: '/', current: location.pathname === '/' },
    { name: 'Tags', href: '/tags', current: location.pathname === '/tags' },
    { name: 'Users', href: '/users', current: location.pathname === '/users' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <span className="text-xl font-bold text-gray-900">StackIt</span>
              </Link>
            </div>

            {/* Navigation - Desktop */}
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    item.current
                      ? 'text-orange-600 bg-orange-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Search Bar */}
            <div className="hidden md:flex items-center flex-1 max-w-lg mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search questions..."
                  className="pl-10 pr-4 py-2 w-full"
                />
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {isLoggedIn ? (
                <>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/ask">
                      <Plus className="w-4 h-4 mr-2" />
                      Ask Question
                    </Link>
                  </Button>
                  
                  <button className="relative p-2 text-gray-600 hover:text-gray-900">
                    <Bell className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                      3
                    </span>
                  </button>
                  
                  <button className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link to="/register">Sign Up</Link>
                  </Button>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 text-gray-600 hover:text-gray-900"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <div className="space-y-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`block px-3 py-2 text-sm font-medium rounded-md ${
                      item.current
                        ? 'text-orange-600 bg-orange-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              
              {/* Mobile Search */}
              <div className="mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search questions..."
                    className="pl-10 pr-4 py-2 w-full"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
