import React, { useState } from "react";
import axios from "axios";
import { CSVLink } from "react-csv";

const suggestions = {
  "image-alt": "Add meaningful alt text to <img> elements.",
  label: "Ensure each input has a corresponding <label>.",
  "button-name": "Buttons should have visible text or an accessible name.",
  "html-has-lang": "Add a lang attribute to the <html> tag.",
  "document-title": "Add a <title> element inside the <head>.",
  "link-name": "Links should have clear text or accessible name.",
  "duplicate-id": "Ensure each id is unique within the document.",
};

export default function App() {
  const [html, setHtml] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/analyze", { html });
      setResults((prev) => ({ ...prev, analyze: res.data }));
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleContrast = async () => {
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/contrast", { html });
      setResults((prev) => ({ ...prev, contrast: res.data }));
    } catch (error) {
      console.error("Contrast check failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyboard = async () => {
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/keyboard", { html });
      setResults((prev) => ({ ...prev, keyboard: res.data }));
    } catch (error) {
      console.error("Keyboard simulation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">♿ Accessibility Analyzer</h1>

        <textarea
          className="w-full h-60 p-3 border border-gray-300 dark:border-gray-700 rounded shadow-sm bg-white dark:bg-gray-800 resize-none"
          placeholder="<html>...</html>"
          value={html}
          onChange={(e) => setHtml(e.target.value)}
        />

        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-medium disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Run Analyzer"}
          </button>
          <button
            onClick={handleContrast}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-medium disabled:opacity-50"
          >
            Check Color Contrast
          </button>
          <button
            onClick={handleKeyboard}
            disabled={loading}
            className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded font-medium disabled:opacity-50"
          >
            Simulate Keyboard Navigation
          </button>
        </div>

        {results && (
          <div className="mt-6 space-y-6">
            {results.analyze && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xl font-semibold">
                    🚨 Accessibility Issues
                  </h2>
                  <CSVLink
                    data={results.analyze.violations.map((v) => ({
                      id: v.id,
                      description: v.description,
                      impact: v.impact,
                      suggestion: suggestions[v.id] || "Refer to documentation",
                    }))}
                    filename="accessibility-report.csv"
                    className="text-sm px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
                  >
                    Export CSV
                  </CSVLink>
                </div>
                {results.analyze.violations.length > 0 ? (
                  <ul className="space-y-4">
                    {results.analyze.violations.map((v, idx) => (
                      <li
                        key={idx}
                        className="p-4 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <strong>{v.id}</strong>
                          <span
                            className={`text-xs px-2 py-1 rounded uppercase font-semibold
                            ${
                              v.impact === "critical"
                                ? "bg-red-200 text-red-800"
                                : v.impact === "serious"
                                ? "bg-orange-200 text-orange-800"
                                : v.impact === "moderate"
                                ? "bg-yellow-200 text-yellow-800"
                                : "bg-blue-200 text-blue-800"
                            }`}
                          >
                            {v.impact}
                          </span>
                        </div>
                        <p className="text-sm">{v.description}</p>
                        <p className="mt-1 text-xs text-green-600 italic">
                          💡 Suggestion: {suggestions[v.id] || v.help}
                        </p>
                        <ul className="mt-2 list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                          {v.nodes.map((n, i) => (
                            <li key={i} className="break-words">
                              {n.html}
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 bg-green-100 text-green-800 rounded shadow">
                    ✅ No accessibility violations found!
                  </div>
                )}
              </div>
            )}

            {results.contrast && (
              <div className="p-4 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800">
                <h2 className="text-xl font-semibold mb-3">
                  🎨 Color Contrast Issues
                </h2>
                {results.contrast.contrastIssues.length > 0 ? (
                  <ul className="space-y-3">
                    {results.contrast.contrastIssues.map((c, idx) => (
                      <li
                        key={idx}
                        className="p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded"
                      >
                        <p className="text-sm text-gray-800 dark:text-gray-200">
                          {c.message}
                        </p>
                        <div className="mt-1 text-xs text-gray-500 break-words">
                          {c.element}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-3 bg-green-100 text-green-800 rounded shadow">
                    ✅ No color contrast issues found!
                  </div>
                )}
              </div>
            )}

            {results.keyboard && (
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  ⌨️ Tabbable Elements
                </h2>
                <ul className="space-y-2 text-sm">
                  {results.keyboard.tabbable.map((el, idx) => (
                    <li
                      key={idx}
                      className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded break-words"
                    >
                      {el}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
