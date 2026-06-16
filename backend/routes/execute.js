import express from "express";
const router = express.Router();

// Map language names to Piston language identifiers
const languageMap = {
  c: "c",
  cpp: "cpp",
  java: "java",
  python: "python",
  javascript: "javascript",
  typescript: "typescript",
};

router.post("/code", async (req, res) => {
  try {
    const { language, code, input } = req.body;

    if (!code) {
      return res.status(400).json({ error: "No code provided" });
    }

    const pistonLanguage = languageMap[language] || "python";

    const requestBody = {
      language: pistonLanguage,
      version: "*", // Use wildcard to match any installed version on the runner
      files: [
        {
          content: code,
        },
      ],
      stdin: input || "",
    };

    const localPistonHost = process.env.PISTON_URL || "http://localhost:2000";
    const localPistonUrl = `${localPistonHost}/api/v2/execute`;
    const publicPistonUrl = "https://emkc.org/api/v2/execute";

    let response;
    let usedUrl = localPistonUrl;

    try {
      console.log(`Attempting execution on local Piston: ${localPistonUrl}`);
      response = await fetch(localPistonUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        timeout: 5000,
      });

      if (!response.ok) {
        throw new Error(`Local Piston returned status ${response.status}`);
      }
    } catch (localErr) {
      console.warn(`Local Piston execution failed (${localErr.message}). Falling back to public Piston API.`);
      usedUrl = publicPistonUrl;
      response = await fetch(publicPistonUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        timeout: 25000,
      });
    }

    const data = await response.json();

    if (!response.ok) {
      console.error("Piston API error:", data);
      return res.status(response.status).json({
        error: `Code execution failed: ${response.statusText}`,
        details: data,
      });
    }

    // Extract output from Piston response
    const stdout = data.run?.stdout || "";
    const stderr = data.run?.stderr || "";
    const output = (stdout + "\n" + stderr).trim();

    res.json({
      success: true,
      output: output || "(No output)",
      language: pistonLanguage,
      usedUrl,
    });
  } catch (error) {
    console.error("Error in execute endpoint:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

export default router;
