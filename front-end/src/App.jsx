import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

const App = () => {
  const [files, setFiles] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [predictionResult, setPredictionResult] = useState(null);
  const [isLoading, setIsLoading] = useState({
    analysis: false,
    prediction: false,
  });
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("analysis");

  const onDrop = useCallback((acceptedFiles) => {
    setFiles(acceptedFiles);
    setError(null);
    setAnalysisResult(null);
    setPredictionResult(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
  });

  const handleApiCall = async (endpoint, type) => {
    if (files.length === 0) {
      setError("Please upload a file first.");
      return;
    }
    setIsLoading((prev) => ({ ...prev, [type]: true }));
    setError(null);

    const formData = new FormData();
    formData.append("file", files[0]);

    try {
      const response = await fetch(`http://127.0.0.1:5000/${endpoint}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(
          errData.error || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();

      if (type === "analysis") {
        const chartData = Object.entries(result).map(([name, value]) => ({
          name,
          value,
        }));
        setAnalysisResult(chartData);
        setPredictionResult(null);
        setActiveTab("analysis");
      } else {
        setPredictionResult(result);
        setAnalysisResult(null);
        setActiveTab("prediction");
      }
    } catch (e) {
      setError(e.message || "An error occurred. Please check the console.");
      console.error(e);
    }
    setIsLoading((prev) => ({ ...prev, [type]: false }));
  };

  const COLORS = {
    CONFIRMED: "#00C49F",
    CANDIDATE: "#0088FE",
    "FALSE POSITIVE": "#FF8042",
  };

  const renderAnalysisTab = () =>
    analysisResult ? (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={analysisResult}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) =>
              `${name} ${(percent * 100).toFixed(0)}%`
            }
          >
            {analysisResult.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    ) : (
      <p className="text-gray-500">Analysis results will appear here.</p>
    );

  const renderPredictionTab = () =>
    predictionResult ? (
      <div
        className={`w-full p-4 rounded-lg text-center ${
          predictionResult.isExoplanet ? "bg-green-900/50" : "bg-red-900/50"
        }`}
      >
        <p
          className={`text-3xl font-bold mb-2 ${
            predictionResult.isExoplanet ? "text-green-300" : "text-red-300"
          }`}
        >
          {predictionResult.result}
        </p>
        <p className="text-gray-300 text-lg">
          Confidence: {(predictionResult.confidence * 100).toFixed(0)}%
        </p>
      </div>
    ) : (
      <p className="text-gray-500">
        Prediction for the first valid row will appear here.
      </p>
    );

  return (
    <div className="bg-gray-900 text-white font-sans flex items-center justify-center h-screen w-screen overflow-hidden">
      <div className="max-w-4xl w-full bg-gray-800 rounded-2xl shadow-2xl p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-cyan-400">
              Exoplanet AI Hub
            </h1>
            <p className="text-md text-gray-400 mt-1">
              Analyze datasets or predict outcomes.
            </p>
          </header>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-cyan-400 bg-gray-700"
                : "border-gray-600 hover:border-cyan-500"
            }`}
          >
            <input {...getInputProps()} />
            {files.length > 0 ? (
              <p className="text-green-400">{files[0].name}</p>
            ) : (
              <p>Drop a CSV file here</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <button
              onClick={() => handleApiCall("analyze", "analysis")}
              disabled={isLoading.analysis || files.length === 0}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition-all disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              {isLoading.analysis ? "Analyzing..." : "Analyze Dataset"}
            </button>
            <button
              onClick={() => handleApiCall("predict", "prediction")}
              disabled={isLoading.prediction || files.length === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-all disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              {isLoading.prediction ? "Predicting..." : "Predict First Row"}
            </button>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab("analysis")}
              className={`py-2 px-4 text-lg ${
                activeTab === "analysis"
                  ? "text-cyan-400 border-b-2 border-cyan-400"
                  : "text-gray-400"
              }`}
            >
              Analysis
            </button>
            <button
              onClick={() => setActiveTab("prediction")}
              className={`py-2 px-4 text-lg ${
                activeTab === "prediction"
                  ? "text-cyan-400 border-b-2 border-cyan-400"
                  : "text-gray-400"
              }`}
            >
              Prediction
            </button>
          </div>
          <div className="flex-grow flex items-center justify-center p-4">
            {error ? (
              <p className="text-red-400 text-center">{error}</p>
            ) : activeTab === "analysis" ? (
              renderAnalysisTab()
            ) : (
              renderPredictionTab()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
