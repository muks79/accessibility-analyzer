import React, { useState } from "react";
import axios from "axios";

export default function App() {
  const [html, setHtml] = useState("");
  const [results, setResults] = useState(null);

  const handleAnalyze = async () => {
    const res = await axios.post("http://localhost:5000/analyze", { html });
    setResults(res.data);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Accessibility Analyzer</h1>
      <textarea
        className="w-full p-2 border rounded h-60"
        placeholder="Paste your HTML here..."
        value={html}
        onChange={(e) => setHtml(e.target.value)}
      />
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
        onClick={handleAnalyze}
      >
        Analyze
      </button>
      {results && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold">Results:</h2>
          <ul className="mt-2 space-y-2">
            {results.violations.map((v, idx) => (
              <li key={idx} className="border p-2 rounded">
                <strong>{v.id}</strong>: {v.description}
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {v.nodes.map((n, i) => (
                    <li key={i}>{n.html}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
