import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

export const getStudentDashboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get all enrollments for this user
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            lessons: true,
            category: true,
            _count: {
              select: { lessons: true }
            }
          }
        }
      }
    });

    // Calculate progress for each course
    const coursesWithProgress = await Promise.all(
      enrollments.map(async (enrollment: any) => {
        const course = enrollment.course;
        const totalLessons = course.lessons.length;

        // Get completed lessons
        const lessonIds = course.lessons.map((lesson: any) => lesson.id);
        const completedCount = await prisma.progress.count({
          where: {
            userId,
            lessonId: { in: lessonIds },
            completed: true
          }
        });

        const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

        return {
          id: course.id,
          title: course.title,
          description: course.description,
          price: course.price,
          thumbnail: course.thumbnail,
          category: course.category.name,
          progress: progressPercent,
          completedLessons: completedCount,
          totalLessons: totalLessons,
          enrolledAt: enrollment.createdAt
        };
      })
    );

    res.status(200).json({
      enrolledCourses: coursesWithProgress
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error retrieving student dashboard', error: error.message });
  }
};

export const getAdminStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // ✅ VERIFY ADMIN ROLE
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden: Admin access only' });
    }

    const totalUsers = await prisma.user.count();
    const totalCourses = await prisma.course.count();
    const totalEnrollments = await prisma.enrollment.count();

    const payments = await prisma.payment.findMany({
      where: { status: 'SUCCESS' },
      select: { amount: true }
    });
    const totalRevenue = payments.reduce((acc: any, current: any) => acc + current.amount, 0);

    // ✅ DO NOT EXPOSE EMAIL ADDRESSES
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { 
        id: true, 
        name: true, 
        // ❌ REMOVED: email: true - sensitive data
        role: true, 
        createdAt: true 
      }
    });

    const recentPayments = await prisma.payment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
        course: { select: { title: true } }
      }
    });

    // Generate mock monthly sales data for the dashboard chart
    const monthlySales = [
      { month: 'Jan', sales: totalRevenue * 0.1 },
      { month: 'Feb', sales: totalRevenue * 0.15 },
      { month: 'Mar', sales: totalRevenue * 0.2 },
      { month: 'Apr', sales: totalRevenue * 0.25 },
      { month: 'May', sales: totalRevenue * 0.3 }
    ];

    res.status(200).json({
      summary: {
        totalUsers,
        totalCourses,
        totalEnrollments,
        totalRevenue
      },
      recentUsers,
      recentPayments,
      monthlySales
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error retrieving admin stats', error: error.message });
  }
};
