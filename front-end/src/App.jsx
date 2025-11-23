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
  const [comparisonResult, setComparisonResult] = useState(null);
  const [isLoading, setIsLoading] = useState({
    analysis: false,
    prediction: false,
    visualization: false,
    lightcurve: false,
    comparison: false,
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
    setComparisonResult(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
  });

  const handleDownload = async () => {
    if (files.length === 0) return;
    const formData = new FormData();
    formData.append("file", files[0]);
    formData.append("model_name", selectedModel);
    try {
      const response = await fetch("http://127.0.0.1:5000/download", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `predictions_${selectedModel}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError("Download failed: " + e.message);
    }
  };

  const handleApiCall = async (endpoint, type) => {
    if (files.length === 0) {
      setError("Please upload a file first.");
      return;
    }
    setIsLoading((prev) => ({ ...prev, [type]: true }));
    setError(null);

    const formData = new FormData();
    formData.append("file", files[0]);

    if (type === "prediction" || type === "analysis" || type === "visualization") {
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
      setComparisonResult(null);

      if (type === "analysis") {
        setAnalysisResult(result);
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
      } else if (type === "comparison") {
        setComparisonResult(result);
        setActiveTab("comparison");
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

  const renderAnalysisTab = () => {
    if (!analysisResult) {
      return <p className="text-gray-500">Analysis results will appear here.</p>;
    }

    const { model_used, raw_distribution, model_distribution, total_analyzed, metrics } = analysisResult;

    const rawChartData = Object.entries(raw_distribution || {}).map(([name, value]) => ({
      name,
      value,
    }));

    const modelChartData = Object.entries(model_distribution || {}).map(([name, value]) => ({
      name,
      value,
    }));

    return (
      <div className="w-full">
        <h3 className="text-xl font-bold mb-2 text-gray-300 text-center">
          Analysis using {model_used} Model
        </h3>
        <p className="text-gray-400 text-center mb-4">
          {total_analyzed.toLocaleString()} rows analyzed
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {rawChartData.length > 0 && (
            <div>
              <h4 className="text-center text-gray-400 text-sm mb-2">Raw Dataset Distribution</h4>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={rawChartData}
                    cx="50%"
                    cy="40%"
                    outerRadius={50}
                    innerRadius={25}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {rawChartData.map((entry, index) => (
                      <Cell key={`cell-raw-${index}`} fill={COLORS[entry.name] || "#8884d8"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: '11px' }}
                    formatter={(value, entry) => `${value}: ${entry.payload.value}%`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div>
            <h4 className="text-center text-gray-400 text-sm mb-2">Model Predictions</h4>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={modelChartData}
                  cx="50%"
                  cy="40%"
                  outerRadius={50}
                  innerRadius={25}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {modelChartData.map((entry, index) => (
                    <Cell key={`cell-model-${index}`} fill={COLORS[entry.name] || "#8884d8"} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ fontSize: '11px' }}
                  formatter={(value, entry) => `${value}: ${entry.payload.value}%`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        {metrics && (
          <div className="mt-4 border-t border-gray-700 pt-4">
            <h4 className="text-lg font-semibold text-gray-300 text-center mb-3">Model Performance</h4>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-gray-700 rounded p-2">
                <p className="text-xs text-gray-400">Accuracy</p>
                <p className="text-lg font-bold text-cyan-400">{metrics.accuracy}%</p>
              </div>
              <div className="bg-gray-700 rounded p-2">
                <p className="text-xs text-gray-400">Precision</p>
                <p className="text-lg font-bold text-green-400">{metrics.precision}%</p>
              </div>
              <div className="bg-gray-700 rounded p-2">
                <p className="text-xs text-gray-400">Recall</p>
                <p className="text-lg font-bold text-yellow-400">{metrics.recall}%</p>
              </div>
              <div className="bg-gray-700 rounded p-2">
                <p className="text-xs text-gray-400">F1 Score</p>
                <p className="text-lg font-bold text-purple-400">{metrics.f1}%</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

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
      metrics,
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
        {metrics && (
          <div className="mt-6 border-t border-gray-700 pt-4">
            <div className="grid grid-cols-4 gap-2 text-center mb-4">
              <div className="bg-gray-700 rounded p-2">
                <p className="text-xs text-gray-400">Accuracy</p>
                <p className="text-lg font-bold text-cyan-400">{metrics.accuracy}%</p>
              </div>
              <div className="bg-gray-700 rounded p-2">
                <p className="text-xs text-gray-400">Precision</p>
                <p className="text-lg font-bold text-green-400">{metrics.precision}%</p>
              </div>
              <div className="bg-gray-700 rounded p-2">
                <p className="text-xs text-gray-400">Recall</p>
                <p className="text-lg font-bold text-yellow-400">{metrics.recall}%</p>
              </div>
              <div className="bg-gray-700 rounded p-2">
                <p className="text-xs text-gray-400">F1 Score</p>
                <p className="text-lg font-bold text-purple-400">{metrics.f1}%</p>
              </div>
            </div>
            <h4 className="text-sm font-semibold text-gray-400 mb-2">Confusion Matrix</h4>
            <div className="grid grid-cols-2 gap-1 max-w-xs mx-auto text-sm">
              <div className="bg-green-900 p-2 rounded">
                <p className="text-gray-400 text-xs">True Positive</p>
                <p className="text-green-300 font-bold">{metrics.confusion_matrix.tp}</p>
              </div>
              <div className="bg-red-900 p-2 rounded">
                <p className="text-gray-400 text-xs">False Positive</p>
                <p className="text-red-300 font-bold">{metrics.confusion_matrix.fp}</p>
              </div>
              <div className="bg-yellow-900 p-2 rounded">
                <p className="text-gray-400 text-xs">False Negative</p>
                <p className="text-yellow-300 font-bold">{metrics.confusion_matrix.fn}</p>
              </div>
              <div className="bg-blue-900 p-2 rounded">
                <p className="text-gray-400 text-xs">True Negative</p>
                <p className="text-blue-300 font-bold">{metrics.confusion_matrix.tn}</p>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={handleDownload}
          className="mt-4 w-full bg-gray-600 hover:bg-gray-500 py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Predictions CSV
        </button>
      </div>
    );
  };

  const renderVisualizationTab = () => {
    if (!visualizationResult)
      return (
        <p className="text-gray-500">Data visualizations will appear here.</p>
      );
    const { model_used, total_predicted_exoplanets } = visualizationResult;
    return (
      <div className="w-full h-full">
        <div className="text-center mb-4">
          <h3 className="text-lg font-bold text-gray-300">
            Visualization using {model_used} Model
          </h3>
          <p className="text-sm text-teal-400">
            {total_predicted_exoplanets?.toLocaleString()} predicted exoplanets
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                name="Predicted Exoplanets"
                data={visualizationResult.period_vs_radius}
                fill="#0088FE"
                shape="circle"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        </div>
      </div>
    );
  };

  const renderComparisonTab = () => {
    if (!comparisonResult)
      return <p className="text-gray-500">Model comparison will appear here.</p>;

    const { total_rows, has_ground_truth, results } = comparisonResult;
    return (
      <div className="w-full">
        <h3 className="text-lg font-bold text-gray-300 text-center mb-2">
          Model Comparison
        </h3>
        <p className="text-gray-400 text-center text-sm mb-4">
          {total_rows.toLocaleString()} rows analyzed
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left p-2 text-gray-400">Model</th>
                <th className="text-right p-2 text-gray-400">Exoplanets</th>
                {has_ground_truth && (
                  <>
                    <th className="text-right p-2 text-gray-400">Accuracy</th>
                    <th className="text-right p-2 text-gray-400">Precision</th>
                    <th className="text-right p-2 text-gray-400">Recall</th>
                    <th className="text-right p-2 text-gray-400">F1</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={r.model} className={`border-b border-gray-700 ${i === 0 && has_ground_truth ? 'bg-green-900/30' : ''}`}>
                  <td className="p-2 font-medium text-gray-200">
                    {r.model}
                    {i === 0 && has_ground_truth && <span className="ml-2 text-xs text-green-400">Best</span>}
                  </td>
                  <td className="text-right p-2 text-cyan-400">{r.exoplanets.toLocaleString()}</td>
                  {has_ground_truth && (
                    <>
                      <td className="text-right p-2 text-cyan-400">{r.accuracy}%</td>
                      <td className="text-right p-2 text-green-400">{r.precision}%</td>
                      <td className="text-right p-2 text-yellow-400">{r.recall}%</td>
                      <td className="text-right p-2 text-purple-400">{r.f1}%</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {has_ground_truth && (
          <ResponsiveContainer width="100%" height={200} className="mt-4">
            <BarChart data={results} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: "#A0AEC0", fontSize: 10 }} />
              <YAxis type="category" dataKey="model" tick={{ fill: "#A0AEC0", fontSize: 10 }} width={100} />
              <Tooltip contentStyle={{ backgroundColor: "#1A202C" }} />
              <Bar dataKey="accuracy" fill="#00C49F" name="Accuracy %" />
            </BarChart>
          </ResponsiveContainer>
        )}
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
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-cyan-400 bg-gray-700"
                : "border-gray-600 hover:border-cyan-500"
            }`}
          >
            <input {...getInputProps()} />
            {files.length > 0 ? (
              <div>
                <p className="text-green-400 font-medium">{files[0].name}</p>
                <p className="text-gray-400 text-sm mt-1">
                  Size: {(files[0].size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-gray-300">Drop a CSV file here</p>
                <p className="text-gray-500 text-sm mt-1">or click to browse</p>
              </div>
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
              className="w-full bg-cyan-600 hover:bg-cyan-700 font-bold py-3 px-4 rounded-lg disabled:bg-gray-500 flex items-center justify-center gap-2"
            >
              {isLoading.analysis && <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>}
              {isLoading.analysis ? "Analyzing..." : "Analyze Dataset"}
            </button>
            <button
              onClick={() => handleApiCall("predict", "prediction")}
              disabled={isLoading.prediction || files.length === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold py-3 px-4 rounded-lg disabled:bg-gray-500 flex items-center justify-center gap-2"
            >
              {isLoading.prediction && <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>}
              {isLoading.prediction ? "Predicting..." : "Predict All Rows"}
            </button>
            <button
              onClick={() => handleApiCall("visualize", "visualization")}
              disabled={isLoading.visualization || files.length === 0}
              className="w-full bg-teal-600 hover:bg-teal-700 font-bold py-3 px-4 rounded-lg disabled:bg-gray-500 flex items-center justify-center gap-2"
            >
              {isLoading.visualization && <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>}
              {isLoading.visualization ? "Visualizing..." : "Visualize Summary"}
            </button>
            <button
              onClick={() => handleApiCall("lightcurve", "lightcurve")}
              disabled={isLoading.lightcurve || files.length === 0}
              className="w-full bg-purple-600 hover:bg-purple-700 font-bold py-3 px-4 rounded-lg disabled:bg-gray-500 flex items-center justify-center gap-2"
            >
              {isLoading.lightcurve && <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>}
              {isLoading.lightcurve ? "Processing..." : "Visualize Light Curve"}
            </button>
            <button
              onClick={() => handleApiCall("compare", "comparison")}
              disabled={isLoading.comparison || files.length === 0}
              className="w-full bg-orange-600 hover:bg-orange-700 font-bold py-3 px-4 rounded-lg disabled:bg-gray-500 flex items-center justify-center gap-2"
            >
              {isLoading.comparison && <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>}
              {isLoading.comparison ? "Comparing..." : "Compare All Models"}
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
            <button
              onClick={() => setActiveTab("comparison")}
              className={`py-2 px-4 text-lg ${
                activeTab === "comparison"
                  ? "text-cyan-400 border-b-2 border-cyan-400"
                  : "text-gray-400"
              }`}
            >
              Compare
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
            ) : activeTab === "lightcurve" ? (
              renderLightCurveTab()
            ) : (
              renderComparisonTab()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
