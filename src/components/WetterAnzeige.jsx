
import { useState } from 'react';

export default function WetterAnzeige() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [cityImage, setCityImage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Get a city image from Wiki
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
      const page = pages[0];

      // ????????????????????????????
      return page?.thumbnail?.source || '';

    } catch (error) {
      console.error('City image error:', error);
      return '';
    }
  }

  // Search for weater info
  async function handleSearch() {
    const selectedCity = city.trim();

    setWeather(null);
    setCityImage('');
    setError('');

    if (selectedCity === '') {
      setError('Please enter a city name.');
      return;
    }

    setLoading(true);

    const url =
      `https://wttr.in/${encodeURIComponent(selectedCity)}?format=j1`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Weather request failed.');
      }

      const data = await response.json();
      const currentWeather = data.current_condition?.[0];

      if (
        !currentWeather ||
        !currentWeather.weatherDesc?.[0]
      ) {
        throw new Error('Invalid weather data.');
      }

      // Save weather data in React State
      setWeather({
        city: selectedCity,
        temperature: currentWeather.temp_C,
        description: currentWeather.weatherDesc[0].value
      });

      // Load an image only after a successful weather request
      const imageUrl = await getCityImage(selectedCity);
      setCityImage(imageUrl);

    } catch (error) {
      console.error('Weather API error:', error);

      setWeather(null);
      setCityImage('');

      setError(
        'Unable to load weather for this city. Please check the name and try again.'
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="weather-section">

      <h2>Weather Information</h2>

      <div className="search-box">
        <label htmlFor="city-input">City</label>

        <input
          type="text"
          id="city-input"
          placeholder="e.g. Berlin"
          value={city}
          onChange={(event) => setCity(event.target.value)}
        />

        <button
          type="button"
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Search'}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      {/* Weather result */}
      {weather && (
        <div className="weather-result">

          <h3>{weather.city}</h3>

          {cityImage ? (
            <img
              className="city-image"
              src={cityImage}
              alt={`View of ${weather.city}`}
            />
          ) : (
            !loading && (
              <p className="image-message">
                No city image available.
              </p>
            )
          )}

          <p>
            Temperature: {weather.temperature} °C
          </p>

          <p>
            Weather: {weather.description}
          </p>

        </div>
      )}

      {!weather && !error && !loading && (
        <p>Search for a city to see the weather.</p>
      )}

    </section>
  );
}
