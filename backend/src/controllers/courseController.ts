import { Request, Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

// --- CATEGORIES ---

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { courses: true }
        }
      }
    });
    res.status(200).json(categories);
  } catch (error: any) {
    res.status(500).json({ message: 'Error retrieving categories', error: error.message });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, slug } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ message: 'Name and slug are required' });
    }
    const category = await prisma.category.create({
      data: { name, slug }
    });
    res.status(201).json(category);
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
};

// --- COURSES ---

export const getCourses = async (req: Request, res: Response) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        category: true,
        lessons: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: { enrollments: true, reviews: true }
        }
      }
    });
    res.status(200).json(courses);
  } catch (error: any) {
    res.status(500).json({ message: 'Error retrieving courses', error: error.message });
  }
};

export const getCourseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        category: true,
        lessons: {
          orderBy: { order: 'asc' }
        },
        reviews: {
          include: {
            user: {
              select: { name: true }
            }
          }
        },
        _count: {
          select: { enrollments: true }
        }
      }
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.status(200).json(course);
  } catch (error: any) {
    res.status(500).json({ message: 'Error retrieving course', error: error.message });
  }
};

export const createCourse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, price, categoryId, thumbnail } = req.body;
    const instructorId = req.user?.userId;

    if (!title || !description || !categoryId || !instructorId) {
      return res.status(400).json({ message: 'Title, description, categoryId are required' });
    }

    const course = await prisma.course.create({
      data: {
        title,
        description,
        price: parseFloat(price) || 0.0,
        thumbnail: thumbnail || null,
        categoryId,
        instructorId,
      }
    });

    res.status(201).json(course);
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating course', error: error.message });
  }
};

export const updateCourse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, price, categoryId, thumbnail } = req.body;

    const course = await prisma.course.update({
      where: { id },
      data: {
        title,
        description,
        price: price !== undefined ? parseFloat(price) : undefined,
        thumbnail,
        categoryId
      }
    });

    res.status(200).json(course);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating course', error: error.message });
  }
};

export const deleteCourse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.course.delete({ where: { id } });
    res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting course', error: error.message });
  }
};

// --- ENROLLMENT & PAYMENTS (Mock Payment Integrations) ---

export const enrollCourse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId } = req.body;
    const userId = req.user?.userId;

    if (!userId || !courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId }
      }
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    // If course is free (price = 0) or paid
    // Generate a payment transaction
    const transactionId = 'TXN-' + Math.random().toString(36).substring(2, 11).toUpperCase();
    await prisma.payment.create({
      data: {
        userId,
        courseId,
        amount: course.price,
        status: 'SUCCESS', // Mock successful checkout
        transactionId
      }
    });

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId
      },
      include: {
        course: true
      }
    });

    res.status(201).json({
      message: 'Enrolled successfully',
      enrollment
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error enrolling in course', error: error.message });
  }
};

// --- LESSONS ---

export const createLesson = async (req: Request, res: Response) => {
  try {
    const { courseId, title, content, videoUrl, duration, order } = req.body;
    if (!courseId || !title) {
      return res.status(400).json({ message: 'Course ID and title are required' });
    }

    const lesson = await prisma.lesson.create({
      data: {
        courseId,
        title,
        content: content || '',
        videoUrl: videoUrl || '',
        duration: parseInt(duration) || 0,
        order: parseInt(order) || 0,
      }
    });

    res.status(201).json(lesson);
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating lesson', error: error.message });
  }
};

export const updateLesson = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, videoUrl, duration, order } = req.body;

    const lesson = await prisma.lesson.update({
      where: { id },
      data: {
        title,
        content,
        videoUrl,
        duration: duration !== undefined ? parseInt(duration) : undefined,
        order: order !== undefined ? parseInt(order) : undefined,
      }
    });

    res.status(200).json(lesson);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating lesson', error: error.message });
  }
};

export const deleteLesson = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.lesson.delete({ where: { id } });
    res.status(200).json({ message: 'Lesson deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting lesson', error: error.message });
  }
};

// --- PROGRESS ---

export const toggleLessonProgress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { lessonId } = req.body;
    const userId = req.user?.userId;

    if (!userId || !lessonId) {
      return res.status(400).json({ message: 'Lesson ID is required' });
    }

    const existingProgress = await prisma.progress.findUnique({
      where: {
        userId_lessonId: { userId, lessonId }
      }
    });

    let progress;
    if (existingProgress) {
      // Toggle completion status
      progress = await prisma.progress.update({
        where: { id: existingProgress.id },
        data: { completed: !existingProgress.completed }
      });
    } else {
      // Create new progress record marked as true
      progress = await prisma.progress.create({
        data: {
          userId,
          lessonId,
          completed: true
        }
      });
    }

    res.status(200).json({
      message: 'Progress updated successfully',
      progress
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error toggling progress', error: error.message });
  }
};

export const getCourseProgress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.userId;

    if (!userId || !courseId) {
      return res.status(400).json({ message: 'Unauthorized or invalid parameters' });
    }

    // Get all lessons in this course
    const lessons = await prisma.lesson.findMany({
      where: { courseId },
      select: { id: true }
    });

    const lessonIds = lessons.map((lesson: any) => lesson.id);

    // Get completed progress records for these lessons
    const completedProgress = await prisma.progress.count({
      where: {
        userId,
        lessonId: { in: lessonIds },
        completed: true
      }
    });

    const totalLessons = lessons.length;
    const percentage = totalLessons > 0 ? Math.round((completedProgress / totalLessons) * 100) : 0;

    // Return completed lesson ids as well to update UI checked states
    const progressList = await prisma.progress.findMany({
      where: {
        userId,
        lessonId: { in: lessonIds }
      },
      select: { lessonId: true, completed: true }
    });

    res.status(200).json({
      percentage,
      completedCount: completedProgress,
      totalCount: totalLessons,
      progressList
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error calculating progress', error: error.message });
  }
};

// --- REVIEWS ---

export const addReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId, rating, comment } = req.body;
    const userId = req.user?.userId;

    if (!userId || !courseId || !rating || !comment) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const review = await prisma.review.upsert({
      where: {
        userId_courseId: { userId, courseId }
      },
      update: {
        rating: parseInt(rating),
        comment
      },
      create: {
        userId,
        courseId,
        rating: parseInt(rating),
        comment
      }
    });

    res.status(201).json(review);
  } catch (error: any) {
    res.status(500).json({ message: 'Error adding/updating review', error: error.message });
  }
};
