// --- server/index.js (Node.js + Express + axe-core) ---
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { JSDOM } = require("jsdom");
const axe = require("axe-core");
const { createCanvas } = require("canvas");

global.HTMLCanvasElement.prototype.getContext = function (type) {
  return createCanvas(200, 200).getContext(type);
};
const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "1mb" }));

app.post("/analyze", async (req, res) => {
  try {
    const { html } = req.body;
    if (!html) {
      return res.status(400).json({ error: "HTML content is required." });
    }

    const dom = new JSDOM(html, {
      runScripts: "dangerously",
      resources: "usable",
    });

    const { window } = dom;

    // Inject axe-core
    const axeScript = window.document.createElement("script");
    axeScript.textContent = axe.source;
    window.document.head.appendChild(axeScript);

    // Wait for resources to load
    await new Promise((resolve) => {
      window.addEventListener("load", resolve);
    });

    // Now run axe with the global window inside jsdom
    window.axe.run(window.document, {}, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
