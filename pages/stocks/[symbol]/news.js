import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function NewsPage() {
  const router = useRouter();
  const { symbol } = router.query;
  const [news, setNews] = useState([]);

  useEffect(() => {
    if (symbol) {
      fetchNews();
    }
  }, [symbol]);

  const fetchNews = async () => {
    try {
      const response = await fetch(`https://news.google.com/rss/search?q=${symbol}&hl=sv&gl=SE&ceid=SE:sv`);
      const text = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');
      const items = xmlDoc.getElementsByTagName('item');
      const newsItems = Array.from(items).slice(0, 10).map(item => ({
        title: item.getElementsByTagName('title')[0].textContent,
        link: item.getElementsByTagName('link')[0].textContent,
      }));
      setNews(newsItems);
    } catch (error) {
      console.error('Error fetching news:', error);
    }
  };

  return (
    <div className="container mx-auto px-8 py-16">
      <h1 className="text-3xl font-bold mb-8">News for {symbol}</h1>
      <ul>
        {news.map((item, index) => (
          <li key={index} className="mb-4">
            <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
