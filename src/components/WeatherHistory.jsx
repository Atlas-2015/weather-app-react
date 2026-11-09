
export default function WeatherHistory({
  history,
  onClearHistory
}) {

  return (
    <section className="history-section">

      <div className="history-header">
        <h2>Search History</h2>

        <span className="history-count">
          {history.length} searches
        </span>
      </div>

      {history.length === 0 ? (
        <p className="empty-history">
          No cities searched yet.
        </p>
      ) : (
        <>
          {/* List of previously searched cities */}
          <table className="history-table">

            <thead>
              <tr>
                <th>Image</th>
                <th>City</th>
              </tr>
            </thead>

            <tbody>
              {history.map((entry) => (
                <tr key={entry.id}>

                  <td>
                    {entry.image ? (
                      <img
                        src={entry.image}
                        alt={`View of ${entry.city}`}
                      />
                    ) : (
                      <span className="no-image">
                        No image
                      </span>
                    )}
                  </td>

                  <td>{entry.city}</td>

                </tr>
              ))}
            </tbody>

          </table>

          <button
            type="button"
            className="clear-history-button"
            onClick={onClearHistory}
          >
            Clear History
          </button>
        </>
      )}

    </section>
  );
}
