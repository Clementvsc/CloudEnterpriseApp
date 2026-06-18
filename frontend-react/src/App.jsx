import React, { useState } from 'react';
import './App.css';

export default function DictionaryApp() {
  const [searchTerm, setSearchTerm] = useState('');
  const [wordData, setWordData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState(null);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setErrorStatus(null);
    setWordData(null);

    try {
      const response = await fetch(`/api/dictionary/${encodeURIComponent(searchTerm)}`);
      
      if (response.status === 404) {
        throw new Error(`We couldn't find a definition for '${searchTerm}'.`);
      }
      if (!response.ok) {
        throw new Error(`System Error (HTTP ${response.status})`);
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setWordData(data[0]);
      } else {
        throw new Error("Received unexpected data structure.");
      }
    } catch (error) {
      setErrorStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to find the first available audio pronunciation in the API data
  const audioUrl = wordData?.phonetics?.find(p => p.audio && p.audio.length > 0)?.audio;

  const playAudio = () => {
    if (audioUrl) {
      new Audio(audioUrl).play();
    }
  };

  return (
    <div className="app-layout">
      <div className="background-glow"></div>
      
      <div className="main-container">
        <header className="header-section fade-in">
          <div className="badge">Production Environment</div>
          <h1>Lexicon API</h1>
          <p>Enterprise vocabulary routing and resolution.</p>
        </header>

        <form onSubmit={handleSearch} className="search-bar-wrapper fade-in-up">
          <input 
            type="text" 
            placeholder="Search for a cloud concept, IT term, or any word..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            autoComplete="off"
          />
          <button type="submit" className={`search-button ${loading ? 'loading-btn' : ''}`} disabled={loading}>
            {loading ? <span className="spinner"></span> : "Search"}
          </button>
        </form>

        {/* Error State */}
        {errorStatus && (
          <div className="alert-box error fade-in-up">
            <span className="icon">⚠️</span> {errorStatus}
          </div>
        )}

        {/* Results State */}
        {!loading && !errorStatus && wordData && (
          <div className="results-card slide-up">
            <div className="word-header">
              <div className="title-group">
                <h2>{wordData.word}</h2>
                {wordData.phonetic && <span className="phonetic">{wordData.phonetic}</span>}
              </div>
              
              {audioUrl && (
                <button onClick={playAudio} className="audio-button" title="Play pronunciation">
                  🔊 Listen
                </button>
              )}
            </div>
            
            <div className="meanings-list">
              {wordData.meanings.map((meaning, index) => (
                <div key={index} className="meaning-block" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="part-of-speech">
                    <span className="pos-badge">{meaning.partOfSpeech}</span>
                  </div>
                  <ol className="definitions">
                    {meaning.definitions.slice(0, 3).map((def, dIndex) => (
                      <li key={dIndex}>
                        <p className="def-text">{def.definition}</p>
                        {def.example && <p className="def-example">"{def.example}"</p>}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
            
            <div className="card-footer">
              <p>Data provided by The Free Dictionary API via .NET Proxy</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}