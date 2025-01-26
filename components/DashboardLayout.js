import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Footer from './Footer';
import Link from 'next/link';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/');
      return;
    }
    setUser(JSON.parse(userData));
  }, []);

  const handleLogout = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (res.ok) {
        localStorage.removeItem('user');
        router.push('/');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
    
    setIsMenuOpen(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white shadow-lg">
        <div className="container mx-auto px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-12">
              <div className="text-xl font-medium text-blue-600">
                {process.env.NEXT_PUBLIC_BRAND_NAME}
              </div>
              <div className="hidden md:flex space-x-8">
                <Link 
                  href="/dashboard" 
                  className={`text-gray-600 hover:text-gray-900 ${router.pathname === '/dashboard' ? 'text-blue-600 font-medium' : ''}`}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/stocks" 
                  className={`text-gray-600 hover:text-gray-900 ${router.pathname === '/stocks' ? 'text-blue-600 font-medium' : ''}`}
                >
                  Stocks
                </Link>
                <Link 
                  href="/dashboard/holdings" 
                  className={`text-gray-600 hover:text-gray-900 ${router.pathname === '/dashboard/holdings' ? 'text-blue-600 font-medium' : ''}`}
                >
                  Holdings
                </Link>
                <Link 
                  href="/disruption-analysis" 
                  className={`text-gray-600 hover:text-gray-900 ${router.pathname === '/disruption-analysis' ? 'text-blue-600 font-medium' : ''}`}
                >
                  Disruption Analysis
                </Link>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
                >
                  <span>{user.email}</span>
                  <svg 
                    className={`w-4 h-4 transform transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2">
                    <Link 
                      href="/dashboard/profile" 
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Profile
                    </Link>
                    <Link 
                      href="/dashboard/settings" 
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Settings
                    </Link>
                    <hr className="my-2" />
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow bg-gray-50">
        <div className="container mx-auto px-8 py-8">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
