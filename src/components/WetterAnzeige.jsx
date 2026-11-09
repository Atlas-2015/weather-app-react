
export default function WetterAnzeige({
  city,
  onCityChange,
  onSearch,
  weather,
  cityImage,
  error,
  loading,
  lastUpdated,
  secondsLeft
}) {

  return (
    <section className="weather-section">

      <h2>Weather Information</h2>

      {/* City search */}
      <form className="search-box" onSubmit={onSearch}>

        <label htmlFor="city-input">City</label>

        <input
          id="city-input"
          type="text"
          placeholder="e.g. Berlin"
          value={city}
          onChange={(event) =>
            onCityChange(event.target.value)
          }
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Search'}
        </button>

      </form>

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
            <strong>Temperature:</strong> {weather.temperature} °C
          </p>

          <p>
            <strong>Weather:</strong> {weather.description}
          </p>

          {/* Automatic update information */}
          <div className="update-info">

            <p>
              <strong>Last updated:</strong>{' '}
              {lastUpdated || 'Not yet updated'}
            </p>

            <p>
              <strong>Next update in:</strong>{' '}
              {secondsLeft !== null
                ? `${secondsLeft} seconds`
                : 'Not scheduled'}
            </p>

          </div>

        </div>
      )}

      {!weather && !error && !loading && (
        <p>Search for a city to see the weather.</p>
      )}

      {loading && !weather && (
        <p className="loading-message">
          Loading weather information...
        </p>
      )}

    </section>
  );
}
