
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

          {/* Modern Weather Temperature Card */}
<div
  className="
    my-5
    rounded-2xl
    bg-white
    p-5
    shadow-md
    ring-1 ring-sky-100
    transition-all duration-300
    hover:-translate-y-1
    hover:shadow-xl
    dark:bg-slate-700
    dark:ring-slate-600
  "
>
  <div className="flex items-center justify-between gap-4">

    <div>
      <div className="text-sm font-medium text-slate-500 dark:text-slate-300">
        Current Temperature
      </div>

      <div className="mt-2 text-5xl font-extrabold text-sky-700 dark:text-sky-200">
        {weather.temperature}°C
      </div>

      <div className="mt-2 text-sm text-slate-600 dark:text-slate-200">
        {weather.description}
      </div>
    </div>

    <span className="text-5xl" aria-hidden="true">
      🌡️
    </span>

  </div>
</div>

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
