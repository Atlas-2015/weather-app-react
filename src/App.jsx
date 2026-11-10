import { useState, useEffect, useCallback, useRef } from 'react';

import WetterAnzeige from './components/WetterAnzeige.jsx';
import WeatherHistory from './components/WeatherHistory.jsx';

import './App.css';


// =====================================================
// CONSTANTS
// =====================================================

const REFRESH_SECONDS = 60;
const REFRESH_MS = REFRESH_SECONDS * 1000;
const STORAGE_KEY = 'weatherHistory';


// =====================================================
// LOAD SEARCH HISTORY FROM LOCAL STORAGE
// =====================================================

function loadHistory() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const data = JSON.parse(saved || '[]');

    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}


// =====================================================
// GET CITY IMAGE FROM WIKIPEDIA
// =====================================================

async function getCityImage(cityName) {
  const url =
    `https://en.wikipedia.org/w/api.php?action=query` +
    `&prop=pageimages` +
    `&titles=${encodeURIComponent(cityName)}` +
    `&redirects=1` +
    `&pithumbsize=800` +
    `&format=json&origin=*`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return '';
    }

    const data = await response.json();
    const pages = Object.values(data.query?.pages || {});

    return pages[0]?.thumbnail?.source || '';
  } catch (error) {
    console.error('City image error:', error);
    return '';
  }
}


// =====================================================
// MAIN REACT COMPONENT
// =====================================================

export default function App() {

  // ---------------------------------------------------
  // REACT STATE
  // ---------------------------------------------------

  // Load saved theme from localStorage
const [isDarkMode, setIsDarkMode] = useState(() => {
  try {
    return localStorage.getItem('weatherDarkMode') === 'true';
  } catch {
    return false;
  }
});

  // Weather search
  const [city, setCity] = useState('');
  const [activeCity, setActiveCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [cityImage, setCityImage] = useState('');

  // Error and loading
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Search history
  const [history, setHistory] = useState(loadHistory);

  // Automatic updates
  const [lastUpdated, setLastUpdated] = useState(null);
  const [nextUpdateAt, setNextUpdateAt] = useState(null);
  const [now, setNow] = useState(Date.now());

  const requestIdRef = useRef(0);

  // Save selected theme to localStorage
useEffect(() => {
  try {
    localStorage.setItem('weatherDarkMode', String(isDarkMode));
  } catch (error) {
    console.error('Theme storage error:', error);
  }
}, [isDarkMode]);


  // ---------------------------------------------------
  // SAVE HISTORY TO LOCAL STORAGE
  // ---------------------------------------------------

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(history)
      );
    } catch (error) {
      console.error('Storage error:', error);
    }
  }, [history]);


  // ---------------------------------------------------
  // REUSABLE WEATHER API FUNCTION
  // ---------------------------------------------------

  const fetchWeather = useCallback(
    async (cityName, saveHistory = false) => {

      const requestId = ++requestIdRef.current;

      setError('');
      setLoading(true);

      if (saveHistory) {
        setActiveCity('');
        setWeather(null);
        setCityImage('');
        setLastUpdated(null);
        setNextUpdateAt(null);
      }

      try {
        const url =
          `https://wttr.in/${encodeURIComponent(cityName)}?format=j1`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Weather request failed.');
        }

        const data = await response.json();
        const currentWeather = data.current_condition?.[0];

        if (
          !currentWeather ||
          !Number.isFinite(Number(currentWeather.temp_C)) ||
          !currentWeather.weatherDesc?.[0]?.value
        ) {
          throw new Error('Invalid weather data.');
        }

        // Ignore outdated requests
        if (requestId !== requestIdRef.current) {
          return;
        }

        // Save weather data
        setWeather({
          city: cityName,
          temperature: currentWeather.temp_C,
          description: currentWeather.weatherDesc[0].value
        });

        setActiveCity(cityName);

        setLastUpdated(
          new Date().toLocaleTimeString('en-GB')
        );

        // Save history only for manual searches
        if (saveHistory) {

          setNextUpdateAt(Date.now() + REFRESH_MS);

          const imageUrl = await getCityImage(cityName);

          if (requestId !== requestIdRef.current) {
            return;
          }

          setCityImage(imageUrl);

          const newEntry = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            city: cityName,
            image: imageUrl
          };

          setHistory((previousHistory) => [
            ...previousHistory,
            newEntry
          ]);
        }

      } catch (error) {

        if (requestId !== requestIdRef.current) {
          return;
        }

        console.error('Weather API error:', error);

        setError(
          saveHistory
            ? 'Unable to load weather for this city. Please check the name and try again.'
            : 'Automatic weather update failed. The next update will be attempted automatically.'
        );

      } finally {

        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    []
  );


  // ---------------------------------------------------
  // HANDLE MANUAL SEARCH
  // ---------------------------------------------------

  function handleSearch(event) {
    event.preventDefault();

    const selectedCity = city.trim();

    if (selectedCity === '') {

      requestIdRef.current += 1;

      setActiveCity('');
      setWeather(null);
      setCityImage('');
      setLastUpdated(null);
      setNextUpdateAt(null);
      setLoading(false);

      setError('Please enter a city name.');
      return;
    }

    fetchWeather(selectedCity, true);
  }


  // ---------------------------------------------------
  // AUTOMATIC WEATHER UPDATE EVERY 60 SECONDS
  // ---------------------------------------------------

  useEffect(() => {

    if (!activeCity) {
      return;
    }

    const intervalId = setInterval(() => {

      setNextUpdateAt(Date.now() + REFRESH_MS);

      fetchWeather(activeCity, false);

    }, REFRESH_MS);

    return () => clearInterval(intervalId);

  }, [activeCity, fetchWeather]);


  // ---------------------------------------------------
  // UPDATE COUNTDOWN EVERY SECOND
  // ---------------------------------------------------

  useEffect(() => {

    const timerId = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timerId);

  }, []);


  const secondsLeft =
    nextUpdateAt === null
      ? null
      : Math.max(
          0,
          Math.ceil((nextUpdateAt - now) / 1000)
        );


  // ---------------------------------------------------
  // CLEAR SEARCH HISTORY
  // ---------------------------------------------------

  function clearHistory() {
    setHistory([]);
  }


  // ---------------------------------------------------
  // DARK MODE TOGGLE
  // ---------------------------------------------------

  function toggleDarkMode() {
    setIsDarkMode((previousMode) => !previousMode);
  }


  // =====================================================
  // JSX - APPLICATION INTERFACE
  // =====================================================

  return (

    <main className={`app ${isDarkMode ? 'dark' : ''}`}>

      {/* DARK MODE BUTTON */}

      <button
  type="button"
  onClick={toggleDarkMode}
  aria-pressed={isDarkMode}
  className="
    mb-5
    rounded-xl
    bg-slate-800
    px-5 py-3
    font-semibold
    text-white
    shadow-lg
    transition-all
    duration-300
    hover:scale-105
    hover:shadow-xl
    active:scale-95
    dark:bg-amber-400
    dark:text-slate-900
    dark:hover:bg-amber-300
  "
>
  {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
</button>


      {/* WEATHER APP BANNER */}

     <div
  className="
    mb-6
    rounded-2xl
    bg-linear-to-r
    from-sky-500
    to-indigo-600
    p-6
    text-center
    shadow-xl
    transition-all
    duration-500
    dark:from-slate-800
    dark:via-indigo-950
    dark:to-slate-900
    "
    >

        <div className="mb-3 text-5xl">
          🌤️
        </div>

        <p className="text-2xl font-bold text-white">
          Weather Forecast
        </p>

        <p className="mt-2 text-blue-100">
          Your daily weather at a glance
        </p>

        {/* Live Auto-Update Counter */}
      <div
      className="
      mt-4
      rounded-full
      bg-white/20
      px-4 py-2
      text-sm text-white
      font-medium
      transition-all duration-300
      "
    >
    {activeCity
    ? `🔄 Next update in ${secondsLeft ?? 60} seconds`
    : '🌍 Search for a city to start auto-updates'}
    </div>

    {/* Animated Auto-Update Progress Bar */}
{activeCity && secondsLeft !== null && (
  <div className="mt-3">
    {/* Progress Percentage */}
<div className="mb-2 flex items-center justify-between">

  <span className="text-sm font-medium text-white">
    Update progress
  </span>

  <span className="text-sm font-bold text-emerald-300">
    {Math.round(
      ((REFRESH_SECONDS - secondsLeft) / REFRESH_SECONDS) * 100
    )}%
  </span>

</div>

    <div
      className="
        h-3
        w-full
        overflow-hidden
        rounded-full
        bg-white/20
      "
    >
      <div
        className="
          h-full
          rounded-full
          bg-emerald-400
          shadow-lg
          transition-[width]
          duration-1000
          ease-linear
        "
        style={{
          width: `${
            Math.min(
              100,
              Math.max(
                0,
                ((REFRESH_SECONDS - secondsLeft) / REFRESH_SECONDS) * 100
              )
            )
          }%`
        }}
      />
    </div>

  </div>
)}

      </div>


      {/* WEATHER INFORMATION COMPONENT */}

      <WetterAnzeige
        city={city}
        onCityChange={setCity}
        onSearch={handleSearch}
        weather={weather}
        cityImage={cityImage}
        error={error}
        loading={loading}
        lastUpdated={lastUpdated}
        secondsLeft={secondsLeft}
      />


      {/* WEATHER SEARCH HISTORY */}

      <WeatherHistory
        history={history}
        onClearHistory={clearHistory}
      />

    </main>

  );
}