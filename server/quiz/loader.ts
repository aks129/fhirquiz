import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { storage } from '../storage';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface QuizBank {
  quiz: {
    slug: string;
    title: string;
    description: string;
    timeLimit?: number;
    passingScore?: number;
  };
  questions: Array<{
    id: string;
    stem: string;
    choices: Array<{
      id: string;
      label: string;
      is_correct: boolean;
    }>;
    explanation: string;
    tags: string[];
  }>;
}

export async function loadQuizBanks() {
  const bankDir = process.env.NODE_ENV === 'production'
    ? path.join(process.cwd(), 'dist/quiz/bank')
    : path.join(__dirname, 'bank');
  const files = ['day1.json', 'day2.json', 'day3.json', 'fhir.json'];
  
  for (const file of files) {
    try {
      const filePath = path.join(bankDir, file);
      const content = await fs.readFile(filePath, 'utf8');
      const quizBank: QuizBank = JSON.parse(content);
      
      // Create or update quiz
      const existingQuiz = await storage.getQuizBySlug(quizBank.quiz.slug);
      let quiz;
      
      if (existingQuiz) {
        console.log(`Quiz ${quizBank.quiz.slug} already exists, skipping...`);
        continue;
      } else {
        quiz = await storage.createQuiz({
          slug: quizBank.quiz.slug,
          title: quizBank.quiz.title,
          description: quizBank.quiz.description,
          timeLimit: quizBank.quiz.timeLimit || null,
          passingScore: quizBank.quiz.passingScore || 80,
          isActive: true
        });
      }
      
      // Create questions and choices
      for (let qIndex = 0; qIndex < quizBank.questions.length; qIndex++) {
        const questionData = quizBank.questions[qIndex];
        
        const question = await storage.createQuestion({
          quizId: quiz.id,
          questionText: questionData.stem,
          explanation: questionData.explanation,
          tags: questionData.tags,
          order: qIndex
        });
        
        // Create choices
        for (let cIndex = 0; cIndex < questionData.choices.length; cIndex++) {
          const choiceData = questionData.choices[cIndex];
          
          await storage.createChoice({
            questionId: question.id,
            choiceText: choiceData.label,
            isCorrect: choiceData.is_correct,
            order: cIndex
          });
        }
      }
      
      console.log(`Loaded quiz: ${quizBank.quiz.title} (${quizBank.questions.length} questions)`);
    } catch (error) {
      console.error(`Error loading quiz bank ${file}:`, error);
    }
  }
}