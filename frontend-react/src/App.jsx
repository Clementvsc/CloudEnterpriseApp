import React, { useState, useEffect } from 'react';
import './App.css'; // Make sure you import the stylesheet

export default function DictionaryApp() {
  const [words, setWords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState(null);

  // FETCH DATA: Connects to the .NET Backend
  useEffect(() => {
    // Replace '/api/dictionary' with your actual .NET endpoint route if different!
    fetch('/api/dictionary') 
      .then(async response => {
        if (!response.ok) {
          throw new Error(`Backend Connection Failed (HTTP ${response.status})`);
        }
        return response.json();
      })
      .then(data => {
        // Defensive Check: Ensure we received an array before attempting to sort/render
        if (Array.isArray(data)) {
          // Sort words alphabetically immediately
          const sortedData = data.sort((a, b) => {
            const wordA = (a.word || '').toLowerCase();
            const wordB = (b.word || '').toLowerCase();
            return wordA.localeCompare(wordB);
          });
          setWords(sortedData);
        } else {
          console.error("⛔ ERROR: Backend sent non-array data:", data);
          setWords([]);
          setErrorStatus("Data Contract Mismatch. Backend must send an array.");
        }
        setLoading(false);
      })
      .catch(error => {
        console.error("⛔ API CONNECTION ERROR:", error);
        setErrorStatus(error.message);
        setLoading(false);
      });
  }, []);

  // FILTER LOGIC: Live search that handles object formatting [{word: "..."}]
  const filteredWords = words.filter(item => {
    const textToSearch = item?.word || '';
    return textToSearch.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Enterprise Dictionary API</h1>
        <p className="environment-label">Target: webapp-prod-2468 (South India Cluster)</p>
      </header>

      <main className="main-content">
        <div className="search-container">
          <input 
            type="text" 
            placeholder="Search dictionary for a specific word..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {/* LOADING & ERROR BANNERS */}
        {loading && <div className="status-banner loading"> Connecting to .NET Backend...</div>}
        
        {errorStatus && (
          <div className="status-banner error">
            <strong>Deployment Success, Integration Error:</strong> <br/>
            {errorStatus} <br/>
            Check your .NET Controller return type and endpoint routing.
          </div>
        )}

        {/* DATA GRID */}
        {!loading && !errorStatus && (
          <div className="grid-container">
            {filteredWords.map((item, index) => (
              <div key={index} className="word-card">
                <div className="word-header">
                  <h3>{item.word || "Unknown Word"}</h3>
                  <span className="part-of-speech">{item.partOfSpeech || "n."}</span>
                </div>
                <p className="definition">{item.definition || "No definition provided."}</p>
                <div className="card-footer">
                  <span className="source">Source: Enterprise API</span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {!loading && !errorStatus && filteredWords.length === 0 && (
          <div className="status-banner info"> No words match your current search criteria.</div>
        )}
      </main>
    </div>
  );
}