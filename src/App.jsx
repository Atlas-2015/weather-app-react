
import { useState, useEffect, useCallback, useRef } from 'react';
import WetterAnzeige from './components/WetterAnzeige.jsx';
import WeatherHistory from './components/WeatherHistory.jsx';
import './App.css';

const REFRESH_SECONDS = 60;
const REFRESH_MS = REFRESH_SECONDS * 1000;
const STORAGE_KEY = 'weatherHistory';

// Load saved search history
function loadHistory() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const data = JSON.parse(saved || '[]');

    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// Get a city image from Wikipedia
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

export default function App() {

  // React State
  const [city, setCity] = useState('');
  const [activeCity, setActiveCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [cityImage, setCityImage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [history, setHistory] = useState(loadHistory);

  const [lastUpdated, setLastUpdated] = useState(null);
  const [nextUpdateAt, setNextUpdateAt] = useState(null);
  const [now, setNow] = useState(Date.now());

  const requestIdRef = useRef(0);

  // Save search history in localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Storage error:', error);
    }
  }, [history]);

  // Reusable weather API function
  const fetchWeather = useCallback(async (cityName, saveHistory = false) => {
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

      setWeather({
        city: cityName,
        temperature: currentWeather.temp_C,
        description: currentWeather.weatherDesc[0].value
      });

      setActiveCity(cityName);
      setLastUpdated(new Date().toLocaleTimeString('en-GB'));

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
  }, []);

  // Handle manual search
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

  // Automatic weather updates every 60 seconds
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

  // Update countdown every second
  useEffect(() => {
    const timerId = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  const secondsLeft = nextUpdateAt === null
    ? null
    : Math.max(0, Math.ceil((nextUpdateAt - now) / 1000));

  // Clear saved history
  function clearHistory() {
    setHistory([]);
  }

  return (
    <main className="app">

      <h1>Weather App</h1>

      

      

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

      <WeatherHistory
        history={history}
        onClearHistory={clearHistory}
      />

    </main>
  );
}
