import Link from 'next/link';

export default function Navbar({ onLoginClick }) {
  return (
    <nav className="flex justify-between items-center py-6 px-8">
      <div className="text-xl font-medium text-blue-600">{process.env.NEXT_PUBLIC_BRAND_NAME}</div>
      <div className="flex items-center space-x-8">
        <Link href="/" className="text-gray-600 hover:text-gray-900">Home</Link>
        <Link href="/stocks" className="text-gray-600 hover:text-gray-900">Stocks</Link>
        <Link href="/disruption-analysis" className="text-gray-600 hover:text-gray-900">Disruption Analysis</Link>
        <Link href="#" className="text-gray-600 hover:text-gray-900">About</Link>
        <button 
          onClick={onLoginClick}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Login
        </button>
      </div>
    </nav>
  );
}
