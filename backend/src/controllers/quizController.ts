import { Request, Response } from 'express';
import prisma from '../config/db';
import * as xlsx from 'xlsx';
import fs from 'fs';

export const uploadQuizExcel = async (req: Request, res: Response) => {
  try {
    const { lessonId, title, passScore } = req.body;
    const file = req.file;

    if (!file || !lessonId) {
      return res.status(400).json({ message: 'Missing file or lessonId' });
    }

    // Check if lesson exists
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(404).json({ message: 'Lesson not found' });
    }

    // Parse Excel file
    const workbook = xlsx.readFile(file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rawData = xlsx.utils.sheet_to_json(worksheet) as any[];

    if (!rawData || rawData.length === 0) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({ message: 'Excel file is empty or invalid format' });
    }

    // Format questions
    const questions = rawData.map((row) => {
      // Assuming columns: Question, Option1, Option2, Option3, Option4, CorrectOption (1-4), Points
      const options = [row.Option1, row.Option2, row.Option3, row.Option4].filter(Boolean).map(String);
      
      let correctIdx = Number(row.CorrectOption) - 1;
      if (isNaN(correctIdx) || correctIdx < 0 || correctIdx >= options.length) {
        correctIdx = 0; // fallback
      }

      return {
        questionText: String(row.Question || 'بدون سؤال'),
        options: options.length > 0 ? options : ['صح', 'خطأ'], // fallback
        correctOption: correctIdx,
        points: Number(row.Points) || 1,
      };
    });

    // Check if quiz already exists for this lesson and delete it (replace)
    const existingQuiz = await prisma.quiz.findUnique({ where: { lessonId } });
    if (existingQuiz) {
      await prisma.quiz.delete({ where: { id: existingQuiz.id } });
    }

    // Use Nested Writes to create the quiz and its questions
    const newQuiz = await prisma.quiz.create({
      data: {
        title: title || 'اختبار الدرس',
        passScore: Number(passScore) || 50,
        lessonId: lessonId,
        questions: {
          create: questions,
        },
      },
      include: {
        questions: true,
      },
    });

    // Clean up temporary file
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

    res.status(201).json({ message: 'Quiz created successfully', quiz: newQuiz });
  } catch (error: any) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Quiz upload error:', error);
    res.status(500).json({ message: 'Error uploading quiz', error: error.message });
  }
};

export const getQuizByLesson = async (req: Request, res: Response) => {
  try {
    const { lessonId } = req.params;
    
    const quiz = await prisma.quiz.findUnique({
      where: { lessonId },
      include: {
        questions: {
          select: {
            id: true,
            questionText: true,
            options: true,
            points: true,
            // DO NOT SEND correctOption to the frontend!
          }
        }
      }
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    res.status(200).json({ quiz });
  } catch (error: any) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ message: 'Error fetching quiz', error: error.message });
  }
};

export const submitQuiz = async (req: Request, res: Response) => {
  try {
    const { lessonId } = req.params;
    const { answers } = req.body; // { [questionId]: selectedOptionIndex }
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const quiz = await prisma.quiz.findUnique({
      where: { lessonId },
      include: { questions: true }
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    let totalPoints = 0;
    let earnedPoints = 0;
    const results = quiz.questions.map((q) => {
      totalPoints += q.points;
      const selectedOption = answers[q.id];
      const isCorrect = selectedOption === q.correctOption;
      if (isCorrect) earnedPoints += q.points;
      
      return {
        questionId: q.id,
        isCorrect,
        correctOption: q.correctOption // Now we can reveal it
      };
    });

    const scorePercentage = Math.round((earnedPoints / totalPoints) * 100);
    const passed = scorePercentage >= quiz.passScore;

    // Optional: save to database if you have a QuizResult model
    // For now, we'll mark the lesson as complete if passed
    if (passed) {
      const progress = await prisma.progress.findUnique({
        where: { userId_lessonId: { userId, lessonId } }
      });
      
      if (!progress) {
        await prisma.progress.create({
          data: { userId, lessonId, completed: true }
        });
      } else if (!progress.completed) {
        await prisma.progress.update({
          where: { id: progress.id },
          data: { completed: true }
        });
      }
    }

    res.status(200).json({
      score: scorePercentage,
      passed,
      earnedPoints,
      totalPoints,
      results
    });
  } catch (error: any) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ message: 'Error submitting quiz', error: error.message });
  }
};
