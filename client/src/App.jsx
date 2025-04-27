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
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({
    analyze: false,
    contrast: false,
    keyboard: false,
  });
  const [error, setError] = useState("");

  const handleRequest = async (endpoint, key) => {
    setLoading((prev) => ({ ...prev, [key]: true }));
    setError("");
    try {
      const res = await axios.post(`http://localhost:5000/${endpoint}`, {
        html,
      });
      setResults((prev) => ({ ...prev, [key]: res.data }));
    } catch (err) {
      console.error(`${key} request failed:`, err);
      setError(`Failed to fetch ${key} results. Please try again.`);
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const buttons = [
    {
      label: "Run Analyzer",
      action: () => handleRequest("analyze", "analyze"),
      loadingKey: "analyze",
    },
    {
      label: "Check Color Contrast",
      action: () => handleRequest("contrast", "contrast"),
      loadingKey: "contrast",
    },
    {
      label: "Simulate Keyboard Navigation",
      action: () => handleRequest("keyboard", "keyboard"),
      loadingKey: "keyboard",
    },
  ];

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
          {buttons.map((btn, idx) => (
            <button
              key={idx}
              onClick={btn.action}
              disabled={loading[btn.loadingKey]}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-medium disabled:opacity-50"
            >
              {loading[btn.loadingKey] ? "Processing..." : btn.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-4 mt-4 bg-red-100 text-red-800 rounded shadow-sm">
            ❌ {error}
          </div>
        )}

        {Object.keys(results).length > 0 && (
          <div className="mt-6 space-y-8">
            {results.analyze && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-semibold">
                    🚨 Accessibility Issues ({results.analyze.violations.length}
                    )
                  </h2>
                  {results.analyze.violations.length > 0 && (
                    <CSVLink
                      data={results.analyze.violations.map((v) => ({
                        id: v.id,
                        description: v.description,
                        impact: v.impact,
                        suggestion:
                          suggestions[v.id] || "Refer to documentation",
                      }))}
                      filename="accessibility-report.csv"
                      className="text-sm px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
                    >
                      Export CSV
                    </CSVLink>
                  )}
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
                <h2 className="text-2xl font-semibold mb-3">
                  🎨 Color Contrast Issues (
                  {results.contrast.contrastIssues.length})
                </h2>
                {results.contrast.contrastIssues.length > 0 ? (
                  <ul className="space-y-3">
                    {results.contrast.contrastIssues.map((c, idx) => (
                      <li
                        key={idx}
                        className="p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded"
                      >
                        <p className="text-sm">{c.message}</p>
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
              <div className="p-4 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800">
                <h2 className="text-2xl font-semibold mb-3">
                  ⌨️ Tabbable Elements ({results.keyboard.tabbable.length})
                </h2>
                {results.keyboard.tabbable.length > 0 ? (
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
                ) : (
                  <div className="p-3 bg-green-100 text-green-800 rounded shadow">
                    ✅ No tabbable elements issues found!
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
