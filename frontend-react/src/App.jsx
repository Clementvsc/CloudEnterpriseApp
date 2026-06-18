import React, { useState } from 'react';
import './App.css';

export default function DictionaryApp() {
  const [searchTerm, setSearchTerm] = useState('');
  const [wordData, setWordData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState(null);

  // Triggered when the user clicks Search or presses Enter
  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setErrorStatus(null);
    setWordData(null);

    try {
      // Call our .NET proxy endpoint with the requested word
      const response = await fetch(`/api/dictionary/${encodeURIComponent(searchTerm)}`);
      
      if (response.status === 404) {
        throw new Error(`Word '${searchTerm}' not found in the live dictionary.`);
      }
      if (!response.ok) {
        throw new Error(`Backend Connection Failed (HTTP ${response.status})`);
      }

      const data = await response.json();
      // The public API returns an array, we grab the first detailed entry
      if (Array.isArray(data) && data.length > 0) {
        setWordData(data[0]);
      } else {
        throw new Error("Invalid data structure received.");
      }
    } catch (error) {
      console.error("API Error:", error);
      setErrorStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Global Dictionary Search</h1>
        <p className="environment-label">Connected via .NET Live Proxy</p>
      </header>

      <main className="main-content">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="search-container" style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="Type any word in the English language..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            style={{ margin: 0, flexGrow: 1 }}
          />
          <button type="submit" disabled={loading} style={{ padding: '0 20px', borderRadius: '10px', cursor: 'pointer' }}>
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {/* Error State */}
        {errorStatus && (
          <div className="status-banner error" style={{ borderLeft: '5px solid #ef4444', backgroundColor: '#fee2e2', padding: '15px' }}>
            {errorStatus}
          </div>
        )}

        {/* Live Data Display */}
        {!loading && !errorStatus && wordData && (
          <div className="word-card" style={{ padding: '30px', backgroundColor: 'white', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div className="word-header" style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
              <h2 style={{ fontSize: '2.5rem', margin: 0, textTransform: 'capitalize' }}>{wordData.word}</h2>
              {wordData.phonetic && <span style={{ color: '#666', fontFamily: 'monospace' }}>{wordData.phonetic}</span>}
            </div>
            
            {wordData.meanings.map((meaning, index) => (
              <div key={index} style={{ marginBottom: '20px' }}>
                <h4 style={{ color: '#3b82f6', textTransform: 'uppercase', fontSize: '0.9rem' }}>{meaning.partOfSpeech}</h4>
                <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                  {meaning.definitions.slice(0, 3).map((def, dIndex) => (
                    <li key={dIndex} style={{ marginBottom: '8px', lineHeight: '1.5' }}>{def.definition}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}