import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Mock data for initial display to show a sample light curve
const initialData = Array.from({ length: 500 }, (_, i) => ({
  time: i,
  flux: 1.0 - Math.sin(i / 20) * 0.02 - Math.random() * 0.005,
}));

const App = () => {
  const [files, setFiles] = useState([]);
  const [data, setData] = useState(initialData); // State for the chart's data
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // This function now reads the CSV file to display it on the chart
  const onDrop = useCallback((acceptedFiles) => {
    setFiles(acceptedFiles);
    setError(null);
    setPrediction(null);

    const file = acceptedFiles[0];
    const reader = new FileReader();

    reader.onabort = () => console.log("file reading was aborted");
    reader.onerror = () => console.log("file reading has failed");
    reader.onload = () => {
      try {
        const binaryStr = reader.result;
        const lines = binaryStr.split("\n").slice(1); // Assume a header row and skip it
        const parsedData = lines
          .map((line) => {
            const columns = line.split(",");
            // Assumes time is in the first column and flux in the second for light curve data
            const time = parseFloat(columns[0]);
            const flux = parseFloat(columns[1]);

            if (!isNaN(time) && !isNaN(flux)) {
              return { time, flux };
            }
            return null;
          })
          .filter(Boolean); // Filter out any null (invalid) rows

        if (parsedData.length === 0) {
          setError(
            "Could not parse CSV. Ensure it has 'time' and 'flux' columns."
          );
          return;
        }

        setData(parsedData);
      } catch (e) {
        setError(
          "Error parsing file. Please ensure it's a valid light curve CSV."
        );
        console.error(e);
      }
    };
    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
  });

  // This function sends the uploaded file to your Python backend for analysis.
  const handleAnalyze = async () => {
    if (files.length === 0) {
      setError("Please upload a file first.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setPrediction(null);

    const formData = new FormData();
    formData.append("file", files[0]);

    try {
      // Note: The current Python backend expects summary features, not raw light curves.
      // This call will fail unless the backend is updated to process light curve data.
      const response = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        body: formData,
      });

      console.log("got it TTTTTTTTTtt");

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(
          errData.error || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      setPrediction(result);
    } catch (e) {
      setError(
        e.message ||
          "Failed to analyze data. Make sure the backend server is running."
      );
      console.error(e);
    }

    setIsLoading(false);
  };

  return (
    <div className="bg-gray-900 text-white font-sans flex h-screen w-screen overflow-hidden">
      {/* Sidebar for Controls */}
      <aside className="w-full max-w-xs md:max-w-sm h-full bg-gray-800 p-4 md:p-6 flex flex-col shadow-2xl z-10">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-cyan-400">Exoplanet AI</h1>
          <p className="text-sm text-gray-400 mt-1">Light Curve Analysis</p>
        </header>

        <div className="flex-grow flex flex-col justify-between">
          {/* Top part of sidebar for upload */}
          <div>
            <h2 className="text-xl font-semibold mb-3 text-cyan-300">
              1. Upload Data
            </h2>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-cyan-400 bg-gray-700"
                  : "border-gray-600 hover:border-cyan-500"
              }`}
            >
              <input {...getInputProps()} />
              {files.length > 0 ? (
                <p className="text-green-400 text-sm break-words">
                  {files[0].name}
                </p>
              ) : (
                <p className="text-sm">Drop a light curve CSV here</p>
              )}
            </div>
            <button
              onClick={handleAnalyze}
              disabled={isLoading || files.length === 0}
              className="w-full mt-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-all transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              {isLoading ? "Analyzing..." : "2. Analyze Data"}
            </button>
          </div>

          {/* Bottom part of sidebar for results */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-3 text-cyan-300">
              3. Results
            </h2>
            <div className="bg-gray-900 rounded-lg p-4 min-h-[120px] flex items-center justify-center">
              {isLoading && <p className="text-cyan-400">Analyzing...</p>}
              {error && (
                <p className="text-red-400 text-center text-sm">{error}</p>
              )}
              {prediction && (
                <div className="w-full text-center">
                  <p
                    className={`text-2xl font-bold mb-1 ${
                      prediction.isExoplanet ? "text-green-300" : "text-red-300"
                    }`}
                  >
                    {prediction.result}
                  </p>
                  <p className="text-gray-300 text-md">
                    Confidence: {(prediction.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              )}
              {!isLoading && !error && !prediction && (
                <p className="text-gray-500 text-sm">Prediction appears here</p>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chart Area */}
      <main className="flex-grow h-full p-2 sm:p-4 md:p-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, left: -15, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
            <XAxis
              dataKey="time"
              stroke="#A0AEC0"
              tick={{ fontSize: 12 }}
              label={{
                value: "Time",
                position: "insideBottom",
                offset: -15,
                fill: "#A0AEC0",
              }}
            />
            <YAxis
              stroke="#A0AEC0"
              tick={{ fontSize: 12 }}
              domain={["auto", "auto"]}
              allowDataOverflow={true}
              label={{
                value: "Normalized Flux",
                angle: -90,
                position: "insideLeft",
                fill: "#A0AEC0",
                style: { textAnchor: "middle" },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1A202C",
                border: "1px solid #4A5568",
              }}
            />
            <Line
              type="monotone"
              dataKey="flux"
              stroke="#2DD4BF"
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default App;
