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
    const { language, version, code, input } = req.body;

    if (!code) {
      return res.status(400).json({ error: "No code provided" });
    }

    const pistonLanguage = languageMap[language] || "python";

    const requestBody = {
      language: pistonLanguage,
      version: version || "*",
      files: [
        {
          content: code,
        },
      ],
      stdin: input || "",
    };

    // Use local Piston server (Docker) 
    // When running in Docker: http://piston:2000
    // When running locally: http://localhost:2000
    const pistonHost = process.env.PISTON_URL || "http://localhost:2000";
    const pistonApiUrl = `${pistonHost}/api/v2/execute`;

    console.log("Executing code on Piston:", {
      pistonApiUrl,
      language: pistonLanguage,
      codeLength: code.length,
    });

    const response = await fetch(pistonApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      timeout: 30000,
    });

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
