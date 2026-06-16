import { useState, useEffect } from 'react';
import './App.css';

function App() {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [telemetry, setTelemetry] = useState({
    status: 'Connecting...', activeEnvironment: '--', appVersion: '--', timestamp: '--:--:--'
  });
  const [hasError, setHasError] = useState(false);
  const [isLive, setIsLive] = useState(true);
  
  // NEW FEATURE: Activity Log & Notifications
  const [logs, setLogs] = useState([]); 
  const [toast, setToast] = useState(null);

  // Helper function to trigger pop-up notifications
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000); // Disappears after 3 seconds
  };

  // ==========================================
  // API: TELEMETRY
  // ==========================================
  const fetchTelemetry = async () => {
    try {
      const response = await fetch('http://localhost:5135/api/status'); // Keep your specific port!
      const data = await response.json();
      const formattedTime = new Date(data.timestamp).toLocaleTimeString();
      
      setTelemetry({ ...data, timestamp: formattedTime });
      setHasError(false);
      
      // Add this successful ping to the top of our log list (keep max 4)
      setLogs(prevLogs => [{ time: formattedTime, msg: 'Server Ping OK', status: 'success' }, ...prevLogs].slice(0, 4));

    } catch (err) {
      if (!hasError) showToast('Connection to backend lost!', 'error');
      setHasError(true);
      setTelemetry(prev => ({ ...prev, status: 'CONNECTION FAILED', activeEnvironment: 'Offline' }));
      setLogs(prevLogs => [{ time: new Date().toLocaleTimeString(), msg: 'Connection Failed', status: 'error' }, ...prevLogs].slice(0, 4));
    }
  };

  useEffect(() => {
    fetchTelemetry();
    let intervalId;
    if (isLive) intervalId = setInterval(fetchTelemetry, 5000);
    return () => clearInterval(intervalId);
  }, [isLive]);

  // ==========================================
  // API: DICTIONARY
  // ==========================================
  const [searchWord, setSearchWord] = useState('');
  const [dictionaryData, setDictionaryData] = useState(null);
  const [dictError, setDictError] = useState('');

  const searchDictionary = async (e) => {
    e.preventDefault();
    if (!searchWord) return;

    try {
      setDictError('');
      setDictionaryData(null);
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${searchWord}`);
      
      if (!response.ok) throw new Error("Word not found");
      const data = await response.json();
      
      setDictionaryData(data[0]);
      showToast(`Found definition for "${searchWord}"`, 'success');
    } catch (err) {
      setDictError("Word not found in the open-source database.");
      showToast('Word not found', 'error');
    }
  };

  // ==========================================
  // UI RENDER
  // ==========================================
  return (
    <div className="dashboard-wrapper">
      
      {/* Toast Notification Node */}
      {toast && (
        <div className={`toast-notification fade-in toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* MODULE 1: System Telemetry */}
      <div className="dashboard-card glass-panel">
        <div className="card-header">
          <h2>
            <span className={`status-dot ${hasError ? 'error-dot' : ''} ${isLive && !hasError ? 'live-pulse' : ''}`}></span>
            Live Telemetry
          </h2>
          <button className={`toggle-btn ${isLive ? 'active' : 'paused'}`} onClick={() => setIsLive(!isLive)}>
            {isLive ? 'Live: ON' : 'Live: PAUSED'}
          </button>
        </div>
        
        <div className="telemetry-grid">
          <div className="metric-box">
            <span className="metric-label">Status</span>
            <span className="metric-value" style={{ color: hasError ? '#ef4444' : '#38bdf8' }}>{telemetry.status}</span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Environment</span>
            <span className="metric-value tag">{telemetry.activeEnvironment}</span>
          </div>
        </div>

        <div className="activity-stream">
          <h3 className="stream-title">Recent Activity</h3>
          {logs.length === 0 ? <span className="empty-log">Awaiting data...</span> : logs.map((log, index) => (
            <div key={index} className="log-entry fade-in">
              <span className="log-time">{log.time}</span>
              <span className={`log-msg ${log.status === 'error' ? 'log-error' : 'log-success'}`}>{log.msg}</span>
            </div>
          ))}
        </div>
      </div>

      {/* MODULE 2: Dictionary */}
      <div className="dashboard-card glass-panel dictionary-card">
        <div className="card-header">
          <h2>🌍 Global Dictionary</h2>
        </div>
        
        <form onSubmit={searchDictionary} className="search-form">
          <input 
            type="text" 
            className="search-input" 
            placeholder="Type a word..." 
            value={searchWord}
            onChange={(e) => setSearchWord(e.target.value)}
          />
          <button type="submit" className="search-btn">Search</button>
        </form>

        {dictError && <div className="dict-error">{dictError}</div>}

        {dictionaryData && (
          <div className="dict-results fade-in">
            <div className="dict-word-header">
              <h3>{dictionaryData.word}</h3>
              <span className="phonetic">{dictionaryData.phonetic}</span>
            </div>
            <div className="dict-definition">
              <span className="part-of-speech">{dictionaryData.meanings[0].partOfSpeech}</span>
              <p>{dictionaryData.meanings[0].definitions[0].definition}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;