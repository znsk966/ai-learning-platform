//src/pages/HomePage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/layout/Footer';

const welcomeMessages = [
  { lang: 'English', text: 'AI Powered Learning' },
  { lang: 'Français', text: 'Apprentissage par IA' },
  { lang: 'Deutsch', text: 'KI-gestütztes Lernen' },
  { lang: 'Македонски', text: 'Учење со вештачка интелигенција' },
  { lang: 'Español', text: 'Aprendizaje con IA' },
  { lang: 'Italiano', text: 'Apprendimento con IA' },
  { lang: 'Português', text: 'Aprendizado com IA' },
  { lang: 'Nederlands', text: 'AI-gestuurd Leren' },
];

const HomePage = () => {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % welcomeMessages.length);
        setFade(true);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const current = welcomeMessages[index];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center">
          <p className={`text-sm font-medium text-blue-500 mb-2 tracking-wide uppercase transition-opacity duration-400 ${fade ? 'opacity-100' : 'opacity-0'}`}>
            {current.lang}
          </p>
          <h1 className={`text-4xl font-bold text-gray-800 md:text-6xl transition-opacity duration-400 ${fade ? 'opacity-100' : 'opacity-0'}`}>
            {current.text}
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Start your journey with our interactive modules and lessons.
          </p>
          <div className="mt-8 space-x-4">
            <Link
              to="/login"
              className="px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-6 py-3 font-semibold text-blue-600 bg-white border border-blue-600 rounded-lg shadow-md hover:bg-gray-100"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HomePage;