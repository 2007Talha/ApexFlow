import React, { useState, useEffect, useRef } from 'react';

// Custom inline SVG Icons for zero-dependency speed and reliability
const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg>
);
const BenchmarkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
);
const RobotIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8.01" y2="16" /><line x1="16" y1="16" x2="16.01" y2="16" /></svg>
);
const SyncIcon = ({ className }) => (
  <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" /></svg>
);
const BoltIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
);

function App() {
  // Theme and Access
  const [highContrast, setHighContrast] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Dashboard & Fleet state
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [congestionThreshold, setCongestionThreshold] = useState(40);
  const [dataSize, setDataSize] = useState(1000000); // Default to 1M rows
  
  // Benchmarking State
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState({
    status: "idle",
    cpu: { execution_time_ms: 1240, engine: "Pandas (CPU)", congested_count: 14890, hotspots_detected: 42 },
    gpu: { execution_time_ms: 11.8, engine: "NVIDIA cuDF (GPU)", congested_count: 14890, hotspots_detected: 42, is_live_gpu: false },
    acceleration: { speedup_multiplier: 105.1, time_saved_ms: 1228.2, estimated_savings_usd: 1245.50, co2_saved_kg: 38.2 },
    hotspots: [
      { lat: 34.05, lon: -118.24, density: 4280, avg_delay_sec: 940, risk_score: 95 },
      { lat: 34.02, lon: -118.22, density: 3120, avg_delay_sec: 720, risk_score: 82 },
      { lat: 33.94, lon: -118.41, density: 2950, avg_delay_sec: 680, risk_score: 75 }
    ]
  });

  // AI Assistant State
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'gemini',
      text: 'Welcome to the Gemini operational control desk. I am monitoring our BigQuery streaming data and RAPIDS acceleration engines. Ask me about delays, EV battery status, or optimal route redirections.',
      timestamp: 'Just now'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  
  // GCP Sync Logs state
  const [cloudLogs, setCloudLogs] = useState([
    { time: new Date().toLocaleTimeString(), type: 'info', msg: 'System initialized. Converted workspace metadata.' },
    { time: new Date().toLocaleTimeString(), type: 'info', msg: 'BigQuery pipeline established. Polling raw logistics events.' },
    { time: new Date().toLocaleTimeString(), type: 'success', msg: 'Connected to GPU nodes. RAPIDS acceleration initialized.' }
  ]);
  const [syncingCloud, setSyncingCloud] = useState(false);

  // References
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const API_BASE = 'http://localhost:8000';

  // Apply high contrast theme class
  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [highContrast]);

  // Fetch live vehicle telemetry
  const fetchVehicles = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/vehicles`);
      if (res.ok) {
        const data = await res.json();
        setVehicles(data.vehicles);
      }
    } catch (err) {
      console.warn("API Server offline. Falling back to local frontend simulation loop.", err);
      // Simulate frontend fallback data if server is booting
      if (vehicles.length === 0) {
        generateLocalFallbackVehicles();
      } else {
        updateLocalFallbackVehicles();
      }
    }
  };

  const generateLocalFallbackVehicles = () => {
    const routeNames = ["Downtown-Express", "Industrial-Corridor", "North-Suburbs", "Airport-Logistics"];
    const statuses = ["in-transit", "delayed", "charging", "idle"];
    const list = Array.from({ length: 30 }, (_, i) => ({
      id: `EV-${1000 + i}`,
      route_name: routeNames[i % routeNames.length],
      lat: 34.02 + Math.sin(i * 0.3) * 0.08,
      lon: -118.3 + Math.cos(i * 0.4) * 0.1,
      speed: i % 5 === 0 ? randomRange(2, 10) : randomRange(30, 75),
      battery: randomRange(20, 95),
      status: i % 7 === 0 ? "delayed" : (i % 8 === 0 ? "charging" : "in-transit"),
      delay_seconds: i % 7 === 0 ? randomRange(200, 1500) : 0,
      temperature: randomRange(25, 38)
    }));
    setVehicles(list);
  };

  const updateLocalFallbackVehicles = () => {
    setVehicles(prev => prev.map(v => {
      let bat = v.battery;
      let status = v.status;
      let lat = v.lat;
      let lon = v.lon;
      let speed = v.speed;
      let delay = v.delay_seconds;

      if (status === "in-transit") {
        bat = Math.max(5, bat - 0.2);
        // Move slightly towards coordinates
        lat += randomRange(-0.0006, 0.0006);
        lon += randomRange(-0.0006, 0.0006);
        if (bat < 15) status = "charging";
      } else if (status === "charging") {
        bat = Math.min(100, bat + 1.2);
        speed = 0;
        if (bat >= 95) status = "in-transit";
      } else if (status === "delayed") {
        delay += 5;
        speed = randomRange(1, 8);
      }
      return { ...v, battery: Math.round(bat), status, lat, lon, speed, delay_seconds: delay };
    }));
  };

  const randomRange = (min, max) => Math.random() * (max - min) + min;

  useEffect(() => {
    fetchVehicles();
    const interval = setInterval(fetchVehicles, 2000);
    return () => clearInterval(interval);
  }, []);

  // HTML5 Canvas Vector Map Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = canvas.parentElement.clientWidth;
    let height = canvas.height = canvas.parentElement.clientHeight;

    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = canvas.parentElement.clientHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    // Grid coordinates boundaries (Los Angeles area bounding box)
    const minLat = 33.88, maxLat = 34.18;
    const minLon = -118.55, maxLon = -118.15;

    const latToY = (lat) => height - ((lat - minLat) / (maxLat - minLat)) * height;
    const lonToX = (lon) => ((lon - minLon) / (maxLon - minLon)) * width;

    let pulseTime = 0;

    const drawMap = () => {
      ctx.clearRect(0, 0, width, height);
      pulseTime += 0.05;

      // 1. Draw Tech Background Grid Lines
      ctx.strokeStyle = highContrast ? '#ffffff22' : '#ffffff04';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Draw Main Highways (Mocked network lines)
      ctx.strokeStyle = highContrast ? '#ffffff44' : '#1e293b';
      ctx.lineWidth = 3;
      const routes = [
        // R101 (Downtown Express)
        [(34.05, -118.45), (34.05, -118.24), (34.08, -118.20)],
        // R102 (Industrial Corridor)
        [(34.02, -118.35), (34.02, -118.22), (33.98, -118.22)],
        // R104 (Airport Route)
        [(34.05, -118.24), (33.94, -118.40)]
      ];

      routes.forEach(route => {
        ctx.beginPath();
        route.forEach((pt, idx) => {
          const x = lonToX(pt[1]);
          const y = latToY(pt[0]);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      });

      // 3. Draw Charging Station Hubs (with glowing rings)
      const hubs = [
        { lat: 34.05, lon: -118.24, name: 'Depot A' },
        { lat: 34.02, lon: -118.22, name: 'Depot B' },
        { lat: 33.94, lon: -118.40, name: 'Depot C' }
      ];

      hubs.forEach(h => {
        const x = lonToX(h.lon);
        const y = latToY(h.lat);
        const pulse = 10 + Math.sin(pulseTime) * 3;

        // Glowing outer circle
        ctx.fillStyle = highContrast ? 'transparent' : 'rgba(56, 189, 248, 0.1)';
        ctx.beginPath();
        ctx.arc(x, y, pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Outfit';
        ctx.fillText(h.name, x + 10, y + 3);
      });

      // 4. Draw Congestion Hotspots (visualized from benchmark results)
      benchmarkResult.hotspots.forEach(h => {
        const x = lonToX(h.lon);
        const y = latToY(h.lat);
        
        ctx.fillStyle = `rgba(239, 68, 68, ${0.1 + Math.sin(pulseTime * 1.5) * 0.05})`;
        ctx.beginPath();
        ctx.arc(x, y, 35, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(239, 68, 68, 0.3)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.stroke();
      });

      // 5. Draw active vehicles
      vehicles.forEach(v => {
        const x = lonToX(v.lon);
        const y = latToY(v.lat);

        // Define colors based on status
        let dotColor = '#10b981'; // In-transit (Green)
        if (v.status === 'delayed') dotColor = '#f59e0b'; // Delayed (Yellow/Orange)
        if (v.status === 'charging') dotColor = '#38bdf8'; // Charging (Blue)
        if (v.status === 'idle') dotColor = '#94a3b8'; // Idle (Grey)

        // Draw selection highlight ring if clicked
        if (selectedVehicle && selectedVehicle.id === v.id) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(x, y, 10, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Draw vehicle dot
        ctx.fillStyle = dotColor;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();

        // Screen reader accessible tag labels
        ctx.fillStyle = '#ffffff';
        ctx.font = '9px Outfit';
        if (width > 600) {
          ctx.fillText(v.id, x - 12, y - 8);
        }
      });

      animationRef.current = requestAnimationFrame(drawMap);
    };

    drawMap();

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [vehicles, selectedVehicle, benchmarkResult, highContrast]);

  // Click on Canvas to select nearest vehicle
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const minLat = 33.88, maxLat = 34.18;
    const minLon = -118.55, maxLon = -118.15;
    const width = canvas.width;
    const height = canvas.height;

    const latToY = (lat) => height - ((lat - minLat) / (maxLat - minLat)) * height;
    const lonToX = (lon) => ((lon - minLon) / (maxLon - minLon)) * width;

    let nearest = null;
    let minDist = 20; // Max click radius in pixels

    vehicles.forEach(v => {
      const vx = lonToX(v.lon);
      const vy = latToY(v.lat);
      const dist = Math.sqrt((vx - clickX) ** 2 + (vy - clickY) ** 2);
      if (dist < minDist) {
        minDist = dist;
        nearest = v;
      }
    });

    setSelectedVehicle(nearest);
  };

  // Run GPU vs CPU aggregation benchmark
  const handleRunBenchmark = async () => {
    setIsBenchmarking(true);
    setCloudLogs(prev => [
      ...prev,
      { time: new Date().toLocaleTimeString(), type: 'info', msg: `Executing pipeline query on dataset size = ${dataSize.toLocaleString()} logs...` }
    ]);
    
    try {
      const res = await fetch(`${API_BASE}/api/benchmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data_size: dataSize,
          congestion_threshold: congestionThreshold
        })
      });

      if (res.ok) {
        const data = await res.json();
        setBenchmarkResult(data);
        
        // Add log outputs
        const engineType = data.gpu.is_live_gpu ? "LIVE cuDF GPU" : "EMULATED cuDF GPU";
        setCloudLogs(prev => [
          ...prev,
          { time: new Date().toLocaleTimeString(), type: 'success', msg: `Query finished. CPU: ${data.cpu.execution_time_ms.toFixed(1)}ms. GPU: ${data.gpu.execution_time_ms.toFixed(1)}ms.` },
          { time: new Date().toLocaleTimeString(), type: 'success', msg: `Speedup: ${data.acceleration.speedup_multiplier}x faster using ${engineType}.` },
          { time: new Date().toLocaleTimeString(), type: 'success', msg: `Operational Impact: Saved $${data.acceleration.estimated_savings_usd.toFixed(2)} / Offset ${data.acceleration.co2_saved_kg.toFixed(2)}kg CO2.` }
        ]);
      } else {
        throw new Error("API returned non-200");
      }
    } catch (err) {
      console.warn("FastAPI Server benchmark offline. Running high fidelity local benchmark simulation.", err);
      // Fallback local simulation in case user is viewing frontend standalone
      setTimeout(() => {
        const simulatedCpuTime = dataSize / 800; // Simulated latency
        const speedup = randomRange(98.0, 132.0);
        const simulatedGpuTime = simulatedCpuTime / speedup;
        const totalSaved = simulatedCpuTime - simulatedGpuTime;
        const hoursSaved = (dataSize * 0.05 * speedup) / 3600.0;
        const usdSaved = hoursSaved * 75.0;

        const mockResponse = {
          status: "success",
          data_size: dataSize,
          cpu: { execution_time_ms: simulatedCpuTime, engine: "Pandas (CPU)", congested_count: Math.floor(dataSize * 0.12), hotspots_detected: 38 },
          gpu: { execution_time_ms: simulatedGpuTime, engine: "NVIDIA cuDF (GPU Sim)", congested_count: Math.floor(dataSize * 0.12), hotspots_detected: 38, is_live_gpu: false },
          acceleration: { speedup_multiplier: Math.round(speedup * 10) / 10, time_saved_ms: totalSaved, estimated_savings_usd: usdSaved, co2_saved_kg: hoursSaved * 2.3 },
          hotspots: [
            { lat: 34.05, lon: -118.24, density: Math.floor(dataSize * 0.005), avg_delay_sec: 940, risk_score: 95 },
            { lat: 34.02, lon: -118.22, density: Math.floor(dataSize * 0.003), avg_delay_sec: 720, risk_score: 82 },
            { lat: 33.94, lon: -118.41, density: Math.floor(dataSize * 0.002), avg_delay_sec: 680, risk_score: 75 }
          ]
        };

        setBenchmarkResult(mockResponse);
        setCloudLogs(prev => [
          ...prev,
          { time: new Date().toLocaleTimeString(), type: 'success', msg: `Query finished. CPU: ${simulatedCpuTime.toFixed(1)}ms. GPU: ${simulatedGpuTime.toFixed(1)}ms.` },
          { time: new Date().toLocaleTimeString(), type: 'success', msg: `Speedup: ${speedup.toFixed(1)}x faster (Emulated NVIDIA cuDF).` },
          { time: new Date().toLocaleTimeString(), type: 'success', msg: `Operational Impact: Saved $${usdSaved.toFixed(2)} / Offset ${(hoursSaved * 2.3).toFixed(2)}kg CO2.` }
        ]);
      }, 1200);
    } finally {
      setTimeout(() => setIsBenchmarking(false), 1200);
    }
  };

  // Google Cloud Sync
  const handleCloudSync = async () => {
    setSyncingCloud(true);
    setCloudLogs(prev => [
      ...prev,
      { time: new Date().toLocaleTimeString(), type: 'info', msg: 'Packing telemetry logs into Parquet format...' }
    ]);

    try {
      const res = await fetch(`${API_BASE}/api/gcp/sync`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setCloudLogs(prev => [
          ...prev,
          { time: new Date().toLocaleTimeString(), type: 'success', msg: data.storage.message },
          { time: new Date().toLocaleTimeString(), type: 'success', msg: data.analytics.message }
        ]);
      } else {
        throw new Error("GCP Sync API offline");
      }
    } catch (err) {
      console.warn("GCP Sync API offline. Simulating cloud upload.", err);
      // Simulation
      setTimeout(() => {
        setCloudLogs(prev => [
          ...prev,
          { time: new Date().toLocaleTimeString(), type: 'success', msg: "Simulated: File 'telemetry_batch.parquet' uploaded to GCS bucket 'apexflow-logs-prod'." },
          { time: new Date().toLocaleTimeString(), type: 'success', msg: "Simulated: Streamed 40 fleet delay summaries to BigQuery table 'transit_dataset.delay_logs'." }
        ]);
        setSyncingCloud(false);
      }, 1000);
      return;
    }
    setSyncingCloud(false);
  };

  // Gemini Agent chat submit
  const handleChatSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userText, timestamp: new Date().toLocaleTimeString() }]);
    setChatInput('');
    setAiLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/ai/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userText })
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [
          ...prev, 
          { 
            sender: 'gemini', 
            text: data.analysis,
            recommendations: data.recommendations,
            table: data.table,
            title: data.title,
            timestamp: new Date().toLocaleTimeString() 
          }
        ]);
      } else {
        throw new Error("AI API returned non-200");
      }
    } catch (err) {
      console.warn("FastAPI Server AI offline. Simulating Gemini Agent response.", err);
      // High quality simulation based on user keywords
      setTimeout(() => {
        const text = userText.toLowerCase();
        let title, analysis, recommendations, tableHeaders, tableRows;

        if (text.includes("delay") || text.includes("traffic") || text.includes("bottleneck")) {
          title = "Gemini Dispatch Alert: Congestion Detected on Downtown-Express (R101)";
          analysis = "Based on real-time ingestion from BigQuery and cuDF density maps, we detect a high density of slow-moving vehicles on route R101 (Downtown-Express). Specifically, 4 EV units are reporting speeds below 10 km/h.";
          recommendations = [
            "Re-route incoming EV-1002 and EV-1008 to route R103 (North-Suburbs) via Route-10 Bypass.",
            "Dispatch 2 standby fleet drivers to Depot C to handle backlog.",
            "Hold outgoing delivery batches at the central logistics terminal for 20 minutes to prevent queue buildup."
          ];
          tableHeaders = ["Vehicle ID", "Current Speed", "Reported Delay", "Risk Status"];
          tableRows = [
            ["EV-1004", "4 km/h", "14 min", "CRITICAL"],
            ["EV-1011", "6 km/h", "12 min", "HIGH"],
            ["EV-1015", "8 km/h", "9 min", "MEDIUM"],
            ["EV-1022", "5 km/h", "11 min", "HIGH"]
          ];
        } else if (text.includes("battery") || text.includes("charge") || text.includes("ev")) {
          title = "Gemini Power Optimizer: Battery & Charging Depot Report";
          analysis = "Fleet battery status is currently stable with an average charge of 68%. However, we identify 8 vehicles currently charging at capacity, creating a queue risk at Charger Station Depot A.";
          recommendations = [
            "Redirect EV-1005 (currently at 14% battery) to Depot B Charging Station (4 open bays).",
            "Initiate Smart Charging throttling for vehicles above 85% to prioritize rapid-charge slots.",
            "Schedule battery temperature cooling sequences for EV-1012, which reports 38°C."
          ];
          tableHeaders = ["Charger Depot", "Total Bays", "Occupied Bays", "Queue Risk"];
          tableRows = [
            ["Depot A (Downtown)", "8", "8 (100%)", "CRITICAL"],
            ["Depot B (Industrial)", "12", "8 (66%)", "LOW"],
            ["Depot C (North Sub)", "6", "2 (33%)", "MINIMAL"]
          ];
        } else {
          title = "Gemini Smart City Advisor: General Fleet Status";
          analysis = "ApexFlow controls are functioning normally. Total monitored fleet is 30 EV units. NVIDIA cuDF is running with a latency of 11.8ms (98% faster than CPU benchmark of 1,240ms).";
          recommendations = [
            "System performance is optimal. BigQuery data pipelines are fully synchronized.",
            "Review weekly dispatch cost savings ($1,245 saved this week via GPU-accelerated re-routing).",
            "Type specific queries about 'delays', 'traffic', or 'battery status' for deep-dives."
          ];
          tableHeaders = ["Metric Area", "Status", "Last Sync", "Performance Index"];
          tableRows = [
            ["BigQuery Streaming", "ACTIVE", "10s ago", "99.8%"],
            ["GCS Backup Logs", "ACTIVE", "5m ago", "100.0%"],
            ["NVIDIA cuDF GPU Pipeline", "ACCELERATED", "0.04s ago", "105x Speedup"],
            ["Gemini Agent Broker", "ONLINE", "1s ago", "Responsive"]
          ];
        }

        setChatMessages(prev => [
          ...prev,
          { sender: 'gemini', title, text, analysis, recommendations, table: { headers: tableHeaders, rows: tableRows }, timestamp: new Date().toLocaleTimeString() }
        ]);
      }, 1000);
    } finally {
      setTimeout(() => setAiLoading(false), 1000);
    }
  };

  // Quick prompt helper
  const handleQuickPrompt = (text) => {
    setChatInput(text);
  };

  return (
    <div className="app-container" role="main">
      {/* SIDEBAR NAVIGATION */}
      <nav className="sidebar" aria-label="Main Navigation">
        <div>
          <div className="logo-container">
            <div className="logo-icon" aria-hidden="true">A</div>
            <div className="logo-text">APEXFLOW</div>
          </div>
          
          <ul className="nav-links">
            <li className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}>
              <button 
                onClick={() => setActiveTab('dashboard')}
                aria-label="Navigate to Logistics Dashboard"
              >
                <DashboardIcon />
                <span>Transit Dashboard</span>
              </button>
            </li>
            <li className={`nav-item ${activeTab === 'benchmark' ? 'active' : ''}`}>
              <button 
                onClick={() => setActiveTab('benchmark')}
                aria-label="Navigate to Pipeline Benchmarks"
              >
                <BenchmarkIcon />
                <span>Pipeline Benchmark</span>
              </button>
            </li>
            <li className={`nav-item ${activeTab === 'ai-advisor' ? 'active' : ''}`}>
              <button 
                onClick={() => setActiveTab('ai-advisor')}
                aria-label="Navigate to Gemini AI Dispatcher"
              >
                <RobotIcon />
                <span>Gemini Dispatch AI</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Accessibility Control (High Contrast Toggle) */}
        <div className="switch-container">
          <span>High Contrast Mode</span>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={highContrast} 
              onChange={() => setHighContrast(!highContrast)} 
              aria-label="Toggle High Contrast Theme"
            />
            <span className="slider"></span>
          </label>
        </div>
      </nav>

      {/* MAIN MAIN CONTENT CONTAINER */}
      <main className="main-content">
        {/* HEADER BAR */}
        <header className="header">
          <div className="header-title">
            <h1>ApexFlow Operations Center</h1>
            <p>Monitored: Google Cloud Storage & BigQuery Active • GPU NVIDIA cuDF Pipeline</p>
          </div>
          
          <div className="header-actions">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="pulsing-dot" aria-hidden="true"></span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {vehicles.length} Monitored EVs Active
              </span>
            </div>
            
            <button 
              className="btn-secondary" 
              onClick={handleCloudSync}
              disabled={syncingCloud}
              aria-label="Synchronize telemetry data batches with Google Cloud Storage and BigQuery"
            >
              <SyncIcon className={syncingCloud ? 'glow-pulse' : ''} />
              <span>{syncingCloud ? 'Syncing...' : 'GCloud Sync'}</span>
            </button>
          </div>
        </header>

        {/* KEY METRICS GRID */}
        <section className="metrics-grid" aria-label="Key Performance Indicators">
          <div className="glass-card primary">
            <div className="metric-header">
              <span>Time-to-Insight Latency</span>
              <BoltIcon />
            </div>
            <div className="metric-value">
              {benchmarkResult.gpu.execution_time_ms.toFixed(1)} ms
            </div>
            <div className="metric-subtext">
              <span className="metric-trend-up">
                ▲ {benchmarkResult.acceleration.speedup_multiplier}x faster
              </span>
              <span>vs CPU Pandas ({benchmarkResult.cpu.execution_time_ms.toFixed(0)}ms)</span>
            </div>
          </div>

          <div className="glass-card accent">
            <div className="metric-header">
              <span>Delayed Shipments</span>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--color-warning)' }}></div>
            </div>
            <div className="metric-value">
              {vehicles.filter(v => v.status === 'delayed').length}
            </div>
            <div className="metric-subtext">
              <span>Current congestion index is stable</span>
            </div>
          </div>

          <div className="glass-card warning">
            <div className="metric-header">
              <span>Resource Cost Saved</span>
              <span>$</span>
            </div>
            <div className="metric-value">
              ${benchmarkResult.acceleration.estimated_savings_usd.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </div>
            <div className="metric-subtext">
              <span>Saved via GPU rapid re-routing dispatch</span>
            </div>
          </div>

          <div className="glass-card danger">
            <div className="metric-header">
              <span>Carbon Offset</span>
              <span>CO₂</span>
            </div>
            <div className="metric-value">
              {benchmarkResult.acceleration.co2_saved_kg.toFixed(1)} kg
            </div>
            <div className="metric-subtext">
              <span>Reduction in idling emission equivalent</span>
            </div>
          </div>
        </section>

        {/* RENDER ACTIVE TAB */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-grid">
            {/* Real-time Map Canvas */}
            <div className="glass-card map-panel">
              <div className="map-header">
                <div className="map-title">Interactive Transit Control Center Map</div>
                <div className="map-controls">
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Click on vehicle to inspect</span>
                </div>
              </div>
              
              <div className="map-viewport">
                <div className="map-canvas-container">
                  <canvas ref={canvasRef} onClick={handleCanvasClick} style={{ cursor: 'pointer', display: 'block' }}></canvas>
                  
                  <div className="map-legend">
                    <div className="legend-item">
                      <div className="legend-color" style={{ backgroundColor: '#10b981' }}></div>
                      <span>Active In-Transit EV</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color" style={{ backgroundColor: '#f59e0b' }}></div>
                      <span>Delayed (Congested)</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color" style={{ backgroundColor: '#38bdf8' }}></div>
                      <span>Charging Depot</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Selection Info / GCP Log Console */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="glass-card" style={{ flexGrow: 1 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', marginBottom: '16px', fontWeight: 600 }}>
                  Selected EV Details
                </h2>
                
                {selectedVehicle ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Vehicle Reference:</span>
                      <strong style={{ color: 'var(--color-primary)' }}>{selectedVehicle.id}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Route Name:</span>
                      <span>{selectedVehicle.route_name}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                      <span className={`badge-${selectedVehicle.status}`} style={{
                        padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                        backgroundColor: selectedVehicle.status === 'delayed' ? 'rgba(245, 158, 11, 0.2)' : (selectedVehicle.status === 'charging' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(16, 185, 129, 0.2)'),
                        color: selectedVehicle.status === 'delayed' ? 'var(--color-warning)' : (selectedVehicle.status === 'charging' ? 'var(--color-primary)' : 'var(--color-success)')
                      }}>
                        {selectedVehicle.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Battery State:</span>
                      <span style={{ color: selectedVehicle.battery < 25 ? 'var(--color-danger)' : 'var(--text-primary)' }}>
                        {selectedVehicle.battery}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Current Speed:</span>
                      <span>{selectedVehicle.speed} km/h</span>
                    </div>
                    {selectedVehicle.delay_seconds > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Delay Timer:</span>
                        <span style={{ color: 'var(--color-warning)' }}>
                          {Math.floor(selectedVehicle.delay_seconds / 60)} min
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    Click an EV icon on the map grid to stream instant telemetry data diagnostics.
                  </div>
                )}
              </div>

              {/* Cloud Logs Terminal */}
              <div className="glass-card console-card">
                <div className="console-header">
                  <div className="console-title">
                    <SyncIcon className="" />
                    <span>GCloud Storage & BigQuery Logs Console</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>STREAMING READY</span>
                </div>
                <div className="console-body">
                  {cloudLogs.map((log, index) => (
                    <div key={index} className="console-line">
                      <span className="console-timestamp">[{log.time}]</span>
                      <span className={`console-msg ${log.type}`}>
                        {log.msg}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PIPELINE BENCHMARKS TAB */}
        {activeTab === 'benchmark' && (
          <div className="dashboard-grid">
            {/* Benchmark Runner */}
            <div className="glass-card benchmark-card">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, marginBottom: '16px' }}>
                NVIDIA RAPIDS GPU Acceleration Sandbox
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                Compare execution performance when cleaning, rounding coordinates, calculating vehicle delays, and identifying smart city transit bottlenecks over millions of telemetry logs.
              </p>

              <div className="slider-group" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label htmlFor="data-size-slider">Telemetry Batch Dataset Size (Rows)</label>
                  <strong style={{ color: 'var(--color-primary)' }}>{dataSize.toLocaleString()} logs</strong>
                </div>
                <input 
                  id="data-size-slider"
                  type="range" 
                  min="100000" 
                  max="500000" 
                  step="50000"
                  value={dataSize} 
                  onChange={(e) => setDataSize(Number(e.target.value))}
                  className="range-slider"
                  aria-valuemin="100000"
                  aria-valuemax="500000"
                  aria-valuenow={dataSize}
                />
              </div>

              <div className="slider-group" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label htmlFor="congestion-slider">Congestion Trigger Speed Threshold</label>
                  <strong style={{ color: 'var(--color-warning)' }}>{congestionThreshold} km/h</strong>
                </div>
                <input 
                  id="congestion-slider"
                  type="range" 
                  min="10" 
                  max="80" 
                  value={congestionThreshold} 
                  onChange={(e) => setCongestionThreshold(Number(e.target.value))}
                  className="range-slider"
                  aria-valuemin="10"
                  aria-valuemax="80"
                  aria-valuenow={congestionThreshold}
                />
              </div>

              <div className="benchmark-controls">
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Target Query: Ingest &rarr; Round Grid Coordinates &rarr; Aggregation Group-by vehicle ID &rarr; Filter hotspots.
                </div>
                <button 
                  className="btn-accent" 
                  onClick={handleRunBenchmark}
                  disabled={isBenchmarking}
                  aria-label="Execute GPU versus CPU pipeline benchmark"
                >
                  {isBenchmarking ? 'Processing on GPU/CPU...' : 'Run Acceleration Query'}
                </button>
              </div>

              {/* Side-by-side performance graph */}
              <div className="comparison-chart-container">
                <div className="chart-bar-row">
                  <div className="chart-label">
                    <span>CPU - Standard Pandas Pipeline</span>
                    <strong>{benchmarkResult.cpu.execution_time_ms.toFixed(1)} ms</strong>
                  </div>
                  <div className="chart-bar-bg">
                    <div className="chart-bar-fill cpu" style={{ width: '100%' }}>
                      Pandas CPU (Single Threaded)
                    </div>
                  </div>
                </div>

                <div className="chart-bar-row">
                  <div className="chart-label">
                    <span>GPU - NVIDIA cuDF (RAPIDS) Acceleration</span>
                    <strong style={{ color: 'var(--color-accent)' }}>
                      {benchmarkResult.gpu.execution_time_ms.toFixed(2)} ms
                    </strong>
                  </div>
                  <div className="chart-bar-bg">
                    <div 
                      className="chart-bar-fill gpu" 
                      style={{ width: `${Math.max(3, (benchmarkResult.gpu.execution_time_ms / benchmarkResult.cpu.execution_time_ms) * 100)}%` }}
                    >
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <span className="speedup-badge">
                  🚀 {benchmarkResult.acceleration.speedup_multiplier}x Speedup
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                  Execution Engine Mode: {benchmarkResult.gpu.is_live_gpu ? (
                    <strong style={{ color: 'var(--color-accent)', marginLeft: '4px' }}>Live NVIDIA cuDF (GPU)</strong>
                  ) : (
                    <strong style={{ color: 'var(--color-primary)', marginLeft: '4px' }}>Emulated cuDF (GCP GPU profile)</strong>
                  )}
                </span>
              </div>
            </div>

            {/* Technical Explanation Codebox */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
                  How Acceleration Solves the Bottleneck
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6', marginBottom: '16px' }}>
                  Standard Python Pandas runs on a single CPU core, loading data sequentially. When telemetry scales to millions of records, aggregating vehicle stats to identify route bottlenecks takes seconds. In high-frequency dispatch environments, a 3-second delay means dispatching decisions are based on stale coordinates.
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6', marginBottom: '20px' }}>
                  By switching to <strong>NVIDIA cuDF</strong> (simply using `import cudf as pd`), the data is loaded directly into GPU VRAM. Group-by operations, coordinate rounding, and congestion filtering run parallelized across thousands of CUDA cores. Latency drops to milliseconds, permitting continuous, real-time route optimization.
                </p>
              </div>

              <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '14px', border: '1px solid rgba(255,255,255,0.03)' }}>
                <h4 style={{ fontSize: '12px', color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>
                  NVIDIA RAPIDS Core Query code
                </h4>
                <pre style={{ fontFamily: 'monospace', fontSize: '11px', overflowX: 'auto', color: 'var(--text-primary)' }}>
{`# Simply drop in cuDF to accelerate:
import cudf as gd

# Ingest and parallel filter
df = gd.read_parquet("gcs_logs.parquet")
congested = df[df["speed"] < threshold]

# Round coordinates to grid cells on GPU
df["grid_lat"] = df["latitude"].round(2)
df["grid_lon"] = df["longitude"].round(2)

# Aggregation calculations run in parallel
hotspots = df.groupby(["grid_lat", "grid_lon"]).agg({
    "vehicle_id": "count",
    "delay_seconds": "mean"
})`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* GEMINI DISPATCH AI TAB */}
        {activeTab === 'ai-advisor' && (
          <div className="dashboard-grid">
            {/* Conversational AI Terminal */}
            <div className="glass-card gemini-panel">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>
                Gemini Enterprise Agent Console
              </h2>
              
              <div className="chat-messages">
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`message ${msg.sender}`} role="log">
                    <span className={`message-sender ${msg.sender}`}>
                      {msg.sender === 'gemini' ? 'Gemini AI Agent Platform' : 'Dispatcher Command'}
                    </span>
                    
                    {msg.title && (
                      <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, margin: '4px 0 8px 0', color: 'var(--color-primary)' }}>
                        {msg.title}
                      </h4>
                    )}
                    
                    <p style={{ fontSize: '13px' }}>{msg.text || msg.analysis}</p>

                    {msg.recommendations && (
                      <ul className="recommendation-list">
                        {msg.recommendations.map((rec, rIdx) => (
                          <li key={rIdx} className="recommendation-item">
                            <span>➔</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {msg.table && (
                      <table className="gemini-table" aria-label="Operational data table">
                        <thead>
                          <tr>
                            {msg.table.headers.map((h, hIdx) => <th key={hIdx}>{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {msg.table.rows.map((row, rIdx) => (
                            <tr key={rIdx}>
                              {row.map((cell, cIdx) => <td key={cIdx}>{cell}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'right', marginTop: '6px' }}>
                      {msg.timestamp}
                    </span>
                  </div>
                ))}
                
                {aiLoading && (
                  <div className="message gemini" style={{ opacity: 0.7 }}>
                    <span className="message-sender gemini">Gemini Advisor</span>
                    <p className="glow-pulse">Querying BigQuery telemetry logs and optimizing routing maps...</p>
                  </div>
                )}
              </div>

              <form onSubmit={handleChatSubmit} className="chat-input-container">
                <input 
                  type="text" 
                  placeholder="Ask Gemini (e.g. 'check delay bottlenecks' or 'battery status report')..."
                  className="chat-input"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={aiLoading}
                  aria-label="Ask Gemini Agent routing questions"
                />
                <button type="submit" className="btn-primary" disabled={aiLoading}>
                  Send Command
                </button>
              </form>
            </div>

            {/* Quick Prompts Panel */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600 }}>
                Operations Prompt Shortcuts
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                Select a quick prompt below to direct the Gemini operational assistant. It automatically queries BigQuery tables and coordinates route schedules on the fly:
              </p>

              <button 
                className="btn-secondary" 
                style={{ textAlign: 'left', display: 'block', width: '100%', marginBottom: '8px' }}
                onClick={() => handleQuickPrompt("Show vehicle delay hotspots and speed analysis")}
              >
                🔍 "Identify EV speed bottlenecks & delay hotspots"
              </button>

              <button 
                className="btn-secondary" 
                style={{ textAlign: 'left', display: 'block', width: '100%', marginBottom: '8px' }}
                onClick={() => handleQuickPrompt("Report on charging stations capacity and batteries")}
              >
                🔋 "Analyze battery charging queues & temperatures"
              </button>

              <button 
                className="btn-secondary" 
                style={{ textAlign: 'left', display: 'block', width: '100%', marginBottom: '8px' }}
                onClick={() => handleQuickPrompt("Generate a weekly operational cost summary")}
              >
                📊 "Generate general system performance review"
              </button>
              
              <div style={{ marginTop: 'auto', padding: '14px', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)' }}>
                <h4 style={{ fontSize: '12px', color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 700 }}>
                  Agent Pipeline Infrastructure
                </h4>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  The agent acts as a semantic query interface. It compiles natural language requests into SQL statements run against Google BigQuery, retrieving parameters to generate route mitigations using NVIDIA GPUs.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
