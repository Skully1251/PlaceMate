/**
 * Question Randomization Engine
 * Provides utilities for random question selection across all interview modules.
 */

/**
 * Returns a random number between 4 and 6 (inclusive) for question count per session.
 */
export function getRandomQuestionCount() {
  return Math.floor(Math.random() * 3) + 4; // 4, 5, or 6
}

/**
 * Fisher-Yates shuffle — returns a new shuffled copy of the array.
 */
export function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Pool of behavioral/HR question topics.
 * These are injected as "topic hints" into the AI prompt to ensure variety per session.
 */
const BEHAVIORAL_TOPIC_POOL = [
  "Tell me about a time you handled a difficult conflict at work",
  "Describe a situation where you had to meet a tight deadline",
  "Give an example of when you showed leadership",
  "Tell me about a time you failed and what you learned",
  "Describe a situation where you had to work with a difficult team member",
  "How do you handle stress and pressure at work",
  "Tell me about a time you went above and beyond your job responsibilities",
  "Describe a situation where you had to adapt to a major change",
  "Give an example of a time you solved a complex problem creatively",
  "Tell me about a time you received constructive criticism",
  "Describe a project you are most proud of",
  "How do you prioritize tasks when you have multiple deadlines",
  "Tell me about a time you had to persuade someone to see your point of view",
  "Describe a situation where you took initiative without being asked",
  "Give an example of how you handle ambiguity in your work",
  "Tell me about a time you mentored or helped a colleague",
  "Describe a situation where you had to make a decision with incomplete information",
  "How do you handle disagreements with your manager",
  "Tell me about a time you improved a process or workflow",
  "Describe your approach to learning a new technology or skill quickly",
  "Give an example of when you had to balance quality with speed",
  "Tell me about a time you contributed to team morale",
  "Describe a situation where you had to deal with an unhappy stakeholder",
  "How do you stay motivated during repetitive or mundane tasks",
];

/**
 * Returns `count` random, non-repeating behavioral topics from the pool.
 */
export function generateBehavioralTopics(count) {
  const shuffled = shuffleArray(BEHAVIORAL_TOPIC_POOL);
  return shuffled.slice(0, count);
}

/**
 * Generates a mixed-difficulty array for DSA questions.
 * Ensures at least 1 Easy, 1 Hard, and fills the rest with Medium.
 * Example output for count=5: ['easy', 'medium', 'hard', 'medium', 'easy']
 */
export function generateDSADifficultyMix(count) {
  const difficulties = ['easy', 'hard']; // Guarantee at least one of each
  const remaining = count - 2;
  for (let i = 0; i < remaining; i++) {
    const options = ['easy', 'medium', 'medium', 'hard']; // Weighted toward medium
    difficulties.push(options[Math.floor(Math.random() * options.length)]);
  }
  return shuffleArray(difficulties);
}
