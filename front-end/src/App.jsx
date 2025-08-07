import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ScatterChart,
  Scatter,
  ZAxis,
  LineChart,
  Line,
} from "recharts";

const App = () => {
  const [files, setFiles] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [predictionResult, setPredictionResult] = useState(null);
  const [visualizationResult, setVisualizationResult] = useState(null);
  const [lightCurveResult, setLightCurveResult] = useState(null);
  const [isLoading, setIsLoading] = useState({
    analysis: false,
    prediction: false,
    visualization: false,
    lightcurve: false,
  });
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("analysis");
  const [selectedModel, setSelectedModel] = useState("RandomForest");

  const modelOptions = [
    "RandomForest",
    "LogisticRegression",
    "SVM",
    "DecisionTree",
    "NaiveBayes",
  ];

  const onDrop = useCallback((acceptedFiles) => {
    setFiles(acceptedFiles);
    setError(null);
    setAnalysisResult(null);
    setPredictionResult(null);
    setVisualizationResult(null);
    setLightCurveResult(null);
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

    if (type === "prediction") {
      formData.append("model_name", selectedModel);
    }

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

      // Reset all results before setting the new one
      setAnalysisResult(null);
      setPredictionResult(null);
      setVisualizationResult(null);
      setLightCurveResult(null);

      if (type === "analysis") {
        const chartData = Object.entries(result).map(([name, value]) => ({
          name,
          value,
        }));
        setAnalysisResult(chartData);
        setActiveTab("analysis");
      } else if (type === "prediction") {
        setPredictionResult(result);
        setActiveTab("prediction");
      } else if (type === "visualization") {
        setVisualizationResult(result);
        setActiveTab("visualization");
      } else if (type === "lightcurve") {
        setLightCurveResult(result);
        setActiveTab("lightcurve");
      }
    } catch (e) {
      setError(e.message || "An error occurred.");
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

  const renderPredictionTab = () => {
    if (!predictionResult)
      return (
        <p className="text-gray-500">Prediction summary will appear here.</p>
      );
    const {
      model_used,
      exoplanet_detected_count,
      no_exoplanet_detected_count,
      total_rows_predicted,
      accuracy,
    } = predictionResult;
    const detected_percent =
      total_rows_predicted > 0
        ? (exoplanet_detected_count / total_rows_predicted) * 100
        : 0;
    return (
      <div className="w-full text-center">
        <h3 className="text-xl font-bold mb-2 text-gray-300">
          Prediction Summary
        </h3>
        <p className="text-sm text-indigo-300 mb-4">Using {model_used} Model</p>
        <p className="text-gray-400 mb-4">
          Based on {total_rows_predicted.toLocaleString()} valid rows.
        </p>
        <div className="space-y-3 text-left">
          <div className="flex items-center">
            <span className="w-40 text-green-300">Exoplanet Detected:</span>
            <span className="font-mono text-lg">
              {exoplanet_detected_count.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center">
            <span className="w-40 text-red-300">No Exoplanet:</span>
            <span className="font-mono text-lg">
              {no_exoplanet_detected_count.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-4 mt-6 flex overflow-hidden">
          <div
            className="bg-green-500 h-4"
            style={{ width: `${detected_percent}%` }}
          ></div>
        </div>
        {accuracy !== null && (
          <div className="mt-6 border-t border-gray-700 pt-4">
            <h4 className="text-lg font-semibold text-gray-300">
              Model Accuracy on this File
            </h4>
            <p className="text-4xl font-bold text-cyan-400 mt-2">
              {(accuracy * 100).toFixed(2)}%
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderVisualizationTab = () => {
    if (!visualizationResult)
      return (
        <p className="text-gray-500">Data visualizations will appear here.</p>
      );
    return (
      <div className="w-full h-full grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="w-full">
          <h4 className="text-center text-gray-300 mb-2">
            Planet Size Distribution
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={visualizationResult.radius_distribution}
              margin={{ top: 5, right: 20, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
              <XAxis
                dataKey="name"
                angle={-25}
                textAnchor="end"
                height={50}
                interval={0}
                tick={{ fill: "#A0AEC0", fontSize: 10 }}
              />
              <YAxis tick={{ fill: "#A0AEC0", fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: "#1A202C" }} />
              <Bar dataKey="count" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="w-full">
          <h4 className="text-center text-gray-300 mb-2">
            Star Temperature Distribution
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={visualizationResult.star_temp_distribution}
              margin={{ top: 5, right: 20, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
              <XAxis
                dataKey="name"
                angle={-25}
                textAnchor="end"
                height={50}
                interval={0}
                tick={{ fill: "#A0AEC0", fontSize: 10 }}
              />
              <YAxis tick={{ fill: "#A0AEC0", fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: "#1A202C" }} />
              <Bar dataKey="count" fill="#FF8042" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="w-full col-span-1 lg:col-span-2">
          <h4 className="text-center text-gray-300 mb-2">
            Orbital Period vs. Planet Radius
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
              <CartesianGrid stroke="#4A5568" />
              <XAxis
                type="number"
                dataKey="period"
                name="Period (days)"
                domain={[0, "dataMax + 10"]}
                tick={{ fill: "#A0AEC0", fontSize: 12 }}
                label={{
                  value: "Orbital Period (days)",
                  position: "insideBottom",
                  offset: -15,
                  fill: "#A0AEC0",
                }}
              />
              <YAxis
                type="number"
                dataKey="radius"
                name="Radius (Earths)"
                domain={[0, "dataMax + 2"]}
                tick={{ fill: "#A0AEC0", fontSize: 12 }}
                label={{
                  value: "Planet Radius",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#A0AEC0",
                }}
              />
              <ZAxis type="number" range={[10, 100]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{ backgroundColor: "#1A202C" }}
              />
              <Scatter
                name="Confirmed Planets"
                data={visualizationResult.period_vs_radius}
                fill="#0088FE"
                shape="circle"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderLightCurveTab = () => {
    if (!lightCurveResult)
      return (
        <p className="text-gray-500">
          Light curve visualizations will appear here.
        </p>
      );
    return (
      <div className="w-full h-full grid grid-cols-1 grid-rows-2 gap-4">
        <div>
          <h4 className="text-center text-gray-300 mb-2">
            Light Curve (Brightness vs. Time)
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart
              data={lightCurveResult.light_curve}
              margin={{ top: 5, right: 20, left: -10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
              <XAxis
                type="number"
                dataKey="time"
                domain={["dataMin", "dataMax"]}
                tick={{ fill: "#A0AEC0", fontSize: 10 }}
                label={{
                  value: "Time",
                  position: "insideBottom",
                  offset: -15,
                  fill: "#A0AEC0",
                }}
              />
              <YAxis
                dataKey="flux"
                domain={["dataMin - 0.001", "dataMax + 0.001"]}
                tick={{ fill: "#A0AEC0", fontSize: 10 }}
              />
              <Tooltip contentStyle={{ backgroundColor: "#1A202C" }} />
              <Line
                type="monotone"
                dataKey="flux"
                stroke="#2DD4BF"
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h4 className="text-center text-gray-300 mb-2">
            Fourier Transform (Signal Strength vs. Frequency)
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={lightCurveResult.fourier_transform}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
              <XAxis
                dataKey="frequency"
                tick={{ fill: "#A0AEC0", fontSize: 10 }}
                label={{
                  value: "Frequency",
                  position: "insideBottom",
                  offset: -15,
                  fill: "#A0AEC0",
                }}
              />
              <YAxis tick={{ fill: "#A0AEC0", fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: "#1A202C" }} />
              <Bar dataKey="amplitude" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-900 text-white font-sans flex items-center justify-center h-screen w-screen overflow-hidden">
      <div className="max-w-7xl w-full bg-gray-800 rounded-2xl shadow-2xl p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-cyan-400">
              Exoplanet AI Hub
            </h1>
            <p className="text-md text-gray-400 mt-1">
              Analyze, predict, and visualize exoplanet data.
            </p>
          </header>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
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
          <div className="mt-4">
            <label
              htmlFor="model-select"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Select Prediction Model:
            </label>
            <select
              id="model-select"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-indigo-500"
            >
              {modelOptions.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-4 mt-4">
            <button
              onClick={() => handleApiCall("analyze", "analysis")}
              disabled={isLoading.analysis || files.length === 0}
              className="w-full bg-cyan-600 hover:bg-cyan-700 font-bold py-3 px-4 rounded-lg disabled:bg-gray-500"
            >
              Analyze Dataset
            </button>
            <button
              onClick={() => handleApiCall("predict", "prediction")}
              disabled={isLoading.prediction || files.length === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold py-3 px-4 rounded-lg disabled:bg-gray-500"
            >
              Predict All Rows
            </button>
            <button
              onClick={() => handleApiCall("visualize", "visualization")}
              disabled={isLoading.visualization || files.length === 0}
              className="w-full bg-teal-600 hover:bg-teal-700 font-bold py-3 px-4 rounded-lg disabled:bg-gray-500"
            >
              Visualize Summary
            </button>
            <button
              onClick={() => handleApiCall("lightcurve", "lightcurve")}
              disabled={isLoading.lightcurve || files.length === 0}
              className="w-full bg-purple-600 hover:bg-purple-700 font-bold py-3 px-4 rounded-lg disabled:bg-gray-500"
            >
              Visualize Light Curve
            </button>
          </div>
        </div>
        <div className="flex flex-col h-[600px] lg:h-auto">
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
            <button
              onClick={() => setActiveTab("visualization")}
              className={`py-2 px-4 text-lg ${
                activeTab === "visualization"
                  ? "text-cyan-400 border-b-2 border-cyan-400"
                  : "text-gray-400"
              }`}
            >
              Summary
            </button>
            <button
              onClick={() => setActiveTab("lightcurve")}
              className={`py-2 px-4 text-lg ${
                activeTab === "lightcurve"
                  ? "text-cyan-400 border-b-2 border-cyan-400"
                  : "text-gray-400"
              }`}
            >
              Light Curve
            </button>
          </div>
          <div className="flex-grow flex items-center justify-center p-4">
            {error ? (
              <p className="text-red-400 text-center">{error}</p>
            ) : activeTab === "analysis" ? (
              renderAnalysisTab()
            ) : activeTab === "prediction" ? (
              renderPredictionTab()
            ) : activeTab === "visualization" ? (
              renderVisualizationTab()
            ) : (
              renderLightCurveTab()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
