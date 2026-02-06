export class GenAIEngine {
  async analyze(input, settings) {
    const { name, level, interest } = settings.user;
    const { isPro, isInterview, isChaos, isRewrite } = settings;

    // Use Vite environment variable for security
    const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

    const systemInstruction = `
      You are "Happie", an AI Code Mentor. 
      Student Name: ${name}. 
      Student Level: ${level}. 
      Theme: Use ${interest} metaphors.
      
      BEHAVIOR RULES:
      1. Tone: ${isChaos ? 'Be chaotic, funny, and slightly unhinged.' : 'Be professional but encouraging.'}
      2. Mode: ${isInterview ? 'Do not give answers. Ask 2-3 Socratic questions to lead them to the solution.' : 'Provide a code review and optimization.'}
      3. Complexity: Use ${isPro ? 'high-level architectural terms' : 'simple beginner-friendly terms'}.
      4. Rewrite: ${isRewrite ? 'Include a full, optimized version of their code in the "rewrittenCode" field.' : 'Set "rewrittenCode" to null.'}
      
      OUTPUT FORMAT:
      You MUST return your response as a JSON object with these exact keys:
      {
        "title": "A creative title",
        "moodTag": "A 2-word mood",
        "analysis": "Your main feedback (personalized)",
        "suggestion": "Brief tip or interview questions",
        "rewrittenCode": "The full code string OR null",
        "whyMatters": "Why this specific fix is important for their level",
        "futureHint": "A piece of advice for the future",
        "transparency": "Briefly explain why you chose this tone"
      }
    `;

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: `Here is my code or question: ${input}` }
          ],
          response_format: { type: "json_object" },
          temperature: isChaos ? 1.2 : 0.7
        })
      });

      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);

    } catch (error) {
      console.error("Groq API Error:", error);
      return {
        title: "Connection Error",
        moodTag: "Vibe: Offline",
        analysis: "I couldn't reach my brain (Groq). Check your API key!",
        suggestion: "// Error details in console",
        rewrittenCode: null,
        whyMatters: "Connectivity is the backbone of GenAI.",
        futureHint: "Always handle your API errors gracefully.",
        transparency: "The fetch call failed."
      };
    }
  }
}