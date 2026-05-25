import { Router, Request, Response } from 'express';
import {
  getCategories,
  createCategory,
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
  createLesson,
  updateLesson,
  deleteLesson,
  toggleLessonProgress,
  getCourseProgress,
  addReview,
  getSecureVideoUrl
} from '../controllers/courseController';
import { protect, authorize, optionalAuth } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// Categories
router.get('/categories', getCategories);
router.post('/categories', protect as any, authorize('ADMIN') as any, createCategory);

// Courses CRUD + Enrollment
router.get('/', getCourses);
router.get('/:id', optionalAuth as any, getCourseById as any);
router.post('/', protect as any, authorize('ADMIN') as any, createCourse as any);
router.put('/:id', protect as any, authorize('ADMIN') as any, updateCourse);
router.delete('/:id', protect as any, authorize('ADMIN') as any, deleteCourse);
router.post('/enroll', protect as any, enrollCourse as any);

// Lessons CRUD
router.post('/lessons', protect as any, authorize('ADMIN') as any, createLesson);
router.put('/lessons/:id', protect as any, authorize('ADMIN') as any, updateLesson);
router.delete('/lessons/:id', protect as any, authorize('ADMIN') as any, deleteLesson);

// Progress
router.post('/progress/toggle', protect as any, toggleLessonProgress as any);
router.get('/progress/:courseId', protect as any, getCourseProgress as any);

// Secure Video
router.get('/lessons/:lessonId/secure-url', protect as any, getSecureVideoUrl as any);

// Reviews
router.post('/reviews', protect as any, addReview as any);

// File Upload Utility Endpoint
router.post('/upload', protect as any, upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    // Return relative URL to file
    const fileUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({
      message: 'File uploaded successfully',
      fileUrl
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Upload error', error: error.message });
  }
});

export default router;
