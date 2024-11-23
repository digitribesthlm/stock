import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function WelcomePage() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (showLoginModal) {
      const savedEmail = localStorage.getItem('rememberedEmail');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    }
  }, [showLoginModal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        localStorage.setItem('user', JSON.stringify(data.user));
        router.replace('/dashboard');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('An error occurred during login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onLoginClick={() => setShowLoginModal(true)} />

      <main>
        {/* Hero Section with Stock Market Background */}
        <div 
          className="relative bg-cover bg-center bg-no-repeat h-[600px] flex items-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')"
          }}
        >
          <div className="absolute inset-0 bg-black opacity-60"></div>
          <div className="container mx-auto px-8 relative z-10 text-white">
            <div className="max-w-2xl">
              <h1 className="text-5xl font-bold mb-6 leading-tight">
                AI-Powered Stock Analysis
              </h1>
              <p className="text-xl mb-8 text-gray-200">
                Harness the power of advanced AI and Peter Lynch's legendary investment strategy to uncover hidden stock market opportunities.
              </p>
              <div className="flex space-x-4">
                <button 
                  onClick={() => setShowLoginModal(true)}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Service Features Section */}
        <div className="container mx-auto px-8 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4 text-blue-600">🧠</div>
              <h3 className="text-xl font-semibold mb-4">AI-Driven Classification</h3>
              <p className="text-gray-600">
                Our advanced AI model analyzes thousands of stocks, identifying hidden patterns and potential investment opportunities beyond traditional metrics.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4 text-green-600">📈</div>
              <h3 className="text-xl font-semibold mb-4">Peter Lynch Strategy</h3>
              <p className="text-gray-600">
                Leveraging the legendary investor's approach of understanding businesses, we help you find stocks with strong fundamentals and growth potential.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4 text-purple-600">🔍</div>
              <h3 className="text-xl font-semibold mb-4">Comprehensive Analysis</h3>
              <p className="text-gray-600">
                Deep dive into company metrics, insider ownership, earnings growth, and market positioning to make informed investment decisions.
              </p>
            </div>
          </div>
        </div>

        {/* About Peter Lynch Section */}
        <div className="bg-blue-50 py-16">
          <div className="container mx-auto px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6 text-gray-900">
                Inspired by Peter Lynch's Investment Philosophy
              </h2>
              <p className="text-lg text-gray-700 mb-8">
                Peter Lynch, one of the most successful investors in history, believed in understanding businesses from the ground up. 
                Our AI model follows his core principles: invest in what you know, look for companies with strong fundamentals, 
                and focus on long-term growth potential.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Login Modal - Unchanged from previous implementation */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full relative">
            {/* Login modal content remains the same as in previous implementation */}
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <h3 className="text-2xl font-bold mb-6">Login to Your Account</h3>
            
            {error && (
              <div className="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span className="ml-2 text-sm text-gray-600">Remember me</span>
                  </label>
                  
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-700">
                    Forgot password?
                  </a>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Login
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
