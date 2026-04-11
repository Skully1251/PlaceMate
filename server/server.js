import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import Groq from 'groq-sdk';

// Initialize Express App
const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"]
  })
);

app.use(express.json());

// Initialize Groq AI
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const modelName = "openai/gpt-oss-120b";

// API Route for handling interview chat
app.post('/api/chat', async (req, res) => {
  try {
    const { history } = req.body;

    if (!history) {
      return res.status(400).json({ error: 'Chat history is required.' });
    }

    // Convert Gemini history format to Groq/OpenAI compatible format
    const messages = history.map(msg => ({
      role: msg.role === 'model' ? 'assistant' : msg.role,
      content: msg.parts[0].text
    }));

    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: modelName,
      max_tokens: 1000,
    });

    const text = chatCompletion.choices[0]?.message?.content || "";
    res.json({ message: text });

  } catch (error) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ error: 'Failed to get response from AI model.' });
  }
});

// API Route for generating DSA questions
app.post('/api/dsa/question', async (req, res) => {
  try {
    const { difficulty } = req.body;

    if (!difficulty) {
      return res.status(400).json({ error: 'Difficulty level is required.' });
    }

    const difficultyLevel = difficulty === 'intern' ? 'medium' : 'medium-hard';
    const prompt = `Generate a single data structures and algorithms coding problem suitable for a ${difficultyLevel} level ${difficulty === 'intern' ? 'internship' : 'SDE'} interview. 
    
    The problem should be similar to LeetCode-style questions.
    
    Return ONLY a JSON object with the following structure:
    {
      "title": "Problem Title",
      "description": "Detailed problem description with examples, constraints, and input/output format",
      "difficulty": "${difficultyLevel}"
    }
    
    Make sure the description is clear, complete, and includes at least one example.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: modelName,
    });
    const text = chatCompletion.choices[0]?.message?.content || "";
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const questionData = JSON.parse(jsonMatch[0]);
      res.json({ question: questionData });
    } else {
      // Fallback question
      res.json({
        question: {
          title: 'Two Sum',
          description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.\n\nExample 1:\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: Because nums[0] + nums[1] == 9, we return [0, 1].\n\nConstraints:\n- 2 <= nums.length <= 10^4\n- -10^9 <= nums[i] <= 10^9\n- -10^9 <= target <= 10^9',
          difficulty: difficultyLevel
        }
      });
    }

  } catch (error) {
    console.error('Error in /api/dsa/question:', error);
    res.status(500).json({ error: 'Failed to generate DSA question.' });
  }
});

// API Route for evaluating DSA solutions
app.post('/api/dsa/evaluate', async (req, res) => {
  try {
    const { question, code, language, explanation } = req.body;

    if (!question || !code || !language || !explanation) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const prompt = `You are an expert technical interviewer evaluating a candidate's DSA solution.
    
    Problem: ${question.title}
    Description: ${question.description}
    
    Candidate's Code (${language}):
    ${code}
    
    Candidate's Explanation:
    ${explanation}
    
    Evaluate the candidate's solution and explanation. Consider:
    1. Correctness of the approach
    2. Code quality and readability
    3. Time and space complexity
    4. Explanation clarity
    5. Edge case handling
    
    Return ONLY a JSON object with this structure:
    {
      "score": <number 0-100>,
      "strengths": ["strength 1", "strength 2", ...],
      "weaknesses": ["weakness 1", "weakness 2", ...],
      "advice": ["advice 1", "advice 2", ...]
    }`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: modelName,
    });
    const text = chatCompletion.choices[0]?.message?.content || "";
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const feedback = JSON.parse(jsonMatch[0]);
      res.json({ feedback });
    } else {
      res.status(500).json({ error: 'Failed to parse feedback.' });
    }

  } catch (error) {
    console.error('Error in /api/dsa/evaluate:', error);
    res.status(500).json({ error: 'Failed to evaluate DSA solution.' });
  }
});

// API Route for generating LaTeX resume
app.post('/api/resume/generate', async (req, res) => {
  try {
    const { github, linkedin, codolio, email, jobDesc, repos } = req.body;

    if (!github || !linkedin || !email || !jobDesc || !repos) {
      return res.status(400).json({ error: 'Missing required fields for resume generation.' });
    }

    const prompt = `You are an expert ATS-friendly resume generator.
Given the following user details:
- GitHub: ${github}
- LinkedIn: ${linkedin}
- Codolio: ${codolio}
- Email: ${email}
- Job Description: ${jobDesc}
- Selected Repositories: ${JSON.stringify(repos)}

Generate a clean, professional, ATS-friendly LaTeX resume. Use a standard article class without custom fonts. 
Include sections for Contact Info, Experience/Projects (based on the repos), and Skills (inferred from job description and repos). DO NOT use markdown code blocks (\`\`\`latex) in the output, just return the raw LaTeX code directly. Ensure the LaTeX code compiles successfully.`;

    const startTime = Date.now();
    
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: modelName,
    });
    
    let latexCode = chatCompletion.choices[0]?.message?.content || "";
    const endTime = Date.now();
    
    // Clean up if the model wrapped it in markdown
    if (latexCode.startsWith('\`\`\`latex')) {
       latexCode = latexCode.replace(/^\`\`\`latex\n?/, '').replace(/\n?\`\`\`$/, '');
    } else if (latexCode.startsWith('\`\`\`')) {
       latexCode = latexCode.replace(/^\`\`\`\n?/, '').replace(/\n?\`\`\`$/, '');
    }

    res.json({ 
      latex: latexCode.trim(),
      timeTakenMs: endTime - startTime
    });

  } catch (error) {
    console.error('Error in /api/resume/generate:', error);
    res.status(500).json({ error: 'Failed to generate resume.' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});