const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { JSDOM } = require("jsdom");
const axe = require("axe-core");
const { createCanvas } = require("canvas");
const { HTMLHint } = require("htmlhint");
const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: "1mb" }));

// Mock HTMLCanvasElement and getContext
if (typeof global.HTMLCanvasElement === "undefined") {
  global.HTMLCanvasElement = function () {};
}

global.HTMLCanvasElement.prototype.getContext = function (type) {
  return createCanvas(200, 200).getContext(type);
};

app.post("/analyze", async (req, res) => {
  try {
    const { html } = req.body;
    if (!html)
      return res.status(400).json({ error: "HTML content is required." });

    const dom = new JSDOM(html, {
      runScripts: "dangerously",
      resources: "usable",
    });

    const { window } = dom;
    const document = window.document;

    // Inject axe-core
    const axeScript = document.createElement("script");
    axeScript.textContent = axe.source;
    document.head.appendChild(axeScript);

    await new Promise((resolve) => window.addEventListener("load", resolve));

    // Axe-core analysis
    const axeResults = await new Promise((resolve, reject) => {
      window.axe.run(document, {}, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // HTMLHint analysis
    const htmlHintResults = HTMLHint.verify(html, {
      "tag-pair": true,
      "doctype-first": true,
      "id-unique": true,
      "title-require": true,
      "attr-no-duplication": true,
      "html-lang-require": true,
    });

    res.json({ violations: axeResults.violations, hints: htmlHintResults });
  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/contrast", async (req, res) => {
  try {
    const { html } = req.body;
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const elements = Array.from(document.querySelectorAll("*")).filter((el) => {
      const style = dom.window.getComputedStyle(el);
      return style && style.color && style.backgroundColor;
    });

    const contrastIssues = elements.map((el) => {
      const style = dom.window.getComputedStyle(el);
      const color = style.color;
      const bgColor = style.backgroundColor;
      return {
        element: el.outerHTML,
        color,
        backgroundColor: bgColor,
        message: `Check contrast between text color ${color} and background ${bgColor}`,
      };
    });

    res.json({ contrastIssues });
  } catch (error) {
    console.error("Contrast error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/keyboard", async (req, res) => {
  try {
    const { html } = req.body;
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const tabbableElements = Array.from(
      document.querySelectorAll(
        "a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex], [contenteditable]"
      )
    ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);

    res.json({ tabbable: tabbableElements.map((el) => el.outerHTML) });
  } catch (error) {
    console.error("Keyboard simulation error:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
