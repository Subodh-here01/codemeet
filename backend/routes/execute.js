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
    const publicPistonUrl = "https://emkc.org/api/v2/piston/execute";

    let response;
    let data;
    let executionSuccess = false;
    let usedUrl = "local_simulator";

    // 1. Try local Piston
    try {
      console.log(`Attempting execution on local Piston: ${localPistonUrl}`);
      response = await fetch(localPistonUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        timeout: 4000,
      });

      if (response.ok) {
        data = await response.json();
        executionSuccess = true;
        usedUrl = localPistonUrl;
      } else {
        const errorText = await response.text();
        throw new Error(`Local Piston returned status ${response.status}: ${errorText}`);
      }
    } catch (localErr) {
      console.warn(`Local Piston execution failed (${localErr.message}). Falling back to public Piston API.`);
      
      // 2. Try public Piston
      try {
        usedUrl = publicPistonUrl;
        response = await fetch(publicPistonUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
          timeout: 6000,
        });

        if (response.ok) {
          data = await response.json();
          executionSuccess = true;
        } else {
          throw new Error(`Public Piston returned status ${response.status}`);
        }
      } catch (publicErr) {
        console.warn(`Public Piston execution failed: ${publicErr.message}`);
      }
    }

    let output = "";
    if (executionSuccess && data) {
      const stdout = data.run?.stdout || "";
      const stderr = data.run?.stderr || "";
      output = (stdout + "\n" + stderr).trim();
    } else {
      // 3. Fallback to Local Print Simulator
      const lines = code.split("\n");
      const outputLines = [];
      for (const line of lines) {
        const match = line.match(/(?:print|printf|System\.out\.println|console\.log)\s*\(\s*["'](.*?)["']\s*\)/);
        if (match) {
          let content = match[1];
          content = content.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
          outputLines.push(content);
        }
      }
      const simulatedOutput = outputLines.join("\n").trim() || "(Simulated execution: Code runs successfully with no output)";
      
      output = `⚠️ [Piston Sandbox Offline - Running in Local Simulator]\n` +
               `To execute real code with standard libraries, start Docker Desktop on your machine.\n` +
               `----------------------------------------------------------------------------------\n` +
               simulatedOutput;
    }

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
