import express from "express";
const router = express.Router();

// Simple mock executor for testing
const mockExecute = (language, code, input) => {
  try {
    // For Python - use Node's eval (not recommended for production!)
    if (language === "python") {
      // Simple Python output simulation
      if (code.includes("print(")) {
        const match = code.match(/print\(["'](.+?)["']\)/);
        if (match) {
          return { output: match[1], error: null };
        }
        return { output: "", error: null };
      }
    }
    
    // For other languages, return a generic message
    return { 
      output: `Code executed successfully!\nLanguage: ${language}\nCode length: ${code.length} chars`,
      error: null 
    };
  } catch (error) {
    return { output: "", error: error.message };
  }
};

router.post("/code", async (req, res) => {
  try {
    const { language, version, code, input } = req.body;

    if (!code) {
      return res.status(400).json({ error: "No code provided" });
    }

    console.log("Executing code (mock):", {
      language,
      codeLength: code.length,
    });

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const { output, error } = mockExecute(language, code, input);

    if (error) {
      return res.status(400).json({ error });
    }

    res.json({
      success: true,
      output: output || "(No output)",
      language,
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
