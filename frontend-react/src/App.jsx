import React, { useState, useEffect } from 'react';
import './App.css'; // Make sure you have this imported

export default function DictionaryApp() {
  const [words, setWords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch data from your .NET backend
  useEffect(() => {
    // Replace '/api/dictionary' with your actual .NET endpoint if it's different
    fetch('/api/dictionary') 
      .then(response => response.json())
      .then(data => {
        setWords(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching data:", error);
        setLoading(false);
      });
  }, []);

  // Filter words based on user search
  const filteredWords = words.filter(item => 
    item.word?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Enterprise Dictionary API</h1>
        <p className="environment-badge">Live Production Environment</p>
      </header>

      <main className="main-content">
        <div className="search-container">
          <input 
            type="text" 
            placeholder="Search dictionary..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {loading ? (
          <div className="loading-state">Loading backend data...</div>
        ) : (
          <div className="grid-container">
            {filteredWords.map((item, index) => (
              <div key={index} className="word-card">
                <h3>{item.word}</h3>
                <p>{item.definition}</p>
              </div>
            ))}
          </div>
        )}
        
        {!loading && filteredWords.length === 0 && (
          <div className="empty-state">No matching words found.</div>
        )}
      </main>
    </div>
  );
}