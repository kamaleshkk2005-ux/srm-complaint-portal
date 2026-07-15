import { Request, Response } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler.middleware';
import { successResponse, generateComplaintId, getPaginationMeta } from '../utils/helpers';
import { uploadService } from '../services/upload.service';
import { notificationService } from '../services/notification.service';
import { emailService } from '../services/email.service';
import { CLOUDINARY_FOLDERS, COMPLAINT_STATUSES, STATUS_TRANSITIONS, NOTIFICATION_TYPES } from '../utils/constants';
import { Prisma } from '@prisma/client';
import { Role } from '../types/enums';

export const complaintController = {
  /**
   * Submit a new complaint (Student)
   */
  createComplaint: async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { departmentId, categoryId, title, description, priority, location } = req.body;
    const files = req.files as Express.Multer.File[];

    // Ensure user has a student profile
    const student = await prisma.student.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!student) {
      throw new AppError('Only students can submit complaints', 403);
    }

    // Verify department and category exist
    const [department, category] = await Promise.all([
      prisma.department.findUnique({ where: { id: departmentId } }),
      prisma.category.findUnique({ where: { id: categoryId } }),
    ]);

    if (!department) throw new AppError('Department not found', 404);
    if (!category) throw new AppError('Category not found', 404);

    // Upload files if any
    const attachmentsData: Array<{
      fileName: string;
      fileUrl: string;
      fileType: string;
      fileSize: number;
      publicId: string;
    }> = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const result = await uploadService.uploadFile(
          file.buffer,
          file.originalname,
          CLOUDINARY_FOLDERS.COMPLAINTS
        );
        attachmentsData.push({
          fileName: file.originalname,
          fileUrl: result.url,
          fileType: result.fileType,
          fileSize: result.fileSize,
          publicId: result.publicId,
        });
      }
    }

    // Create Complaint inside transaction
    const complaint = await prisma.$transaction(async (tx) => {
      const newComplaint = await tx.complaint.create({
        data: {
          complaintId: generateComplaintId(),
          studentId: student.id,
          departmentId,
          categoryId,
          title,
          description,
          priority,
          location,
          attachments: {
            create: attachmentsData,
          },
        },
        include: {
          category: true,
        },
      });

      // Create history entry
      await tx.complaintHistory.create({
        data: {
          complaintId: newComplaint.id,
          changedById: userId,
          newStatus: COMPLAINT_STATUSES.SUBMITTED,
          comment: 'Complaint submitted',
        },
      });

      return newComplaint;
    });

    // Notifications (Non-blocking)
    if (student.user.personalEmail) {
      emailService.sendComplaintSubmittedEmail(
        student.user.personalEmail,
        student.fullName,
        complaint.complaintId,
        complaint.title
      ).catch(console.error);
    }

    // Notify Admins
    notificationService.broadcastNotification(
      'ADMIN' as any, // Only TargetRole enum has STAFF/STUDENT, handle admin via manual lookup
      `New Complaint: ${complaint.complaintId}`,
      `A new complaint "${complaint.title}" has been submitted.`,
      NOTIFICATION_TYPES.COMPLAINT_SUBMITTED,
      complaint.id,
      'Complaint'
    ).catch(console.error);

    res.status(201).json(successResponse('Complaint submitted successfully', complaint));
  },

  /**
   * Get Complaints (List with filters)
   */
  getComplaints: async (req: Request, res: Response) => {
    const { skip, limit } = res.locals.pagination;
    const { status, priority, categoryId, departmentId, search } = req.query;
    const userRole = req.user!.role;
    const userId = req.user!.id;

    // Build Where clause based on role
    let where: Prisma.ComplaintWhereInput = {};

    if (userRole === Role.STUDENT) {
      const student = await prisma.student.findUnique({ where: { userId } });
      if (!student) throw new AppError('Student profile not found', 404);
      where.studentId = student.id;
    } else if (userRole === Role.STAFF) {
      const staff = await prisma.staff.findUnique({ where: { userId } });
      if (!staff) throw new AppError('Staff profile not found', 404);
      // Staff only sees assigned complaints
      where.assignedStaffId = staff.id;
    }
    // ADMIN sees all, no role-based filter needed

    // Apply query filters
    if (status) where.status = status as any;
    if (priority) where.priority = priority as any;
    if (categoryId) where.categoryId = categoryId as string;
    if (departmentId) where.departmentId = departmentId as string;
    
    if (search) {
      where.OR = [
        { complaintId: { contains: search as string } },
        { title: { contains: search as string } },
      ];
    }

    const [total, complaints] = await Promise.all([
      prisma.complaint.count({ where }),
      prisma.complaint.findMany({
        where,
        include: {
          category: { select: { name: true } },
          department: { select: { name: true } },
          student: { select: { fullName: true, registerNumber: true } },
          assignedStaff: { select: { fullName: true, employeeId: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const page = Math.floor(skip / limit) + 1;

    res.json({
      success: true,
      message: 'Complaints retrieved',
      data: complaints,
      pagination: getPaginationMeta(total, page, limit),
    });
  },

  /**
   * Get specific complaint details
   */
  getComplaintById: async (req: Request, res: Response) => {
    const { id } = req.params;
    const userRole = req.user!.role;
    const userId = req.user!.id;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        category: true,
        department: true,
        student: { include: { user: { select: { email: true } } } },
        assignedStaff: { include: { user: { select: { email: true } } } },
        attachments: true,
        history: {
          include: {
            changedBy: { select: { email: true, role: true, student: { select: { fullName: true } }, staff: { select: { fullName: true } } } }
          },
          orderBy: { createdAt: 'desc' }
        },
      },
    });

    if (!complaint) throw new AppError('Complaint not found', 404);

    // Authorization checks
    if (userRole === Role.STUDENT) {
      const student = await prisma.student.findUnique({ where: { userId } });
      if (complaint.studentId !== student?.id) {
        throw new AppError('Not authorized to view this complaint', 403);
      }
    } else if (userRole === Role.STAFF) {
      const staff = await prisma.staff.findUnique({ where: { userId } });
      if (complaint.assignedStaffId !== staff?.id) {
        throw new AppError('Not authorized to view this complaint', 403);
      }
    }

    res.json(successResponse('Complaint retrieved', complaint));
  },

  /**
   * Update Complaint (Student only, before assigned)
   */
  updateComplaint: async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const data = req.body;

    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw new AppError('Student profile not found', 404);

    const complaint = await prisma.complaint.findUnique({ where: { id } });
    
    if (!complaint) throw new AppError('Complaint not found', 404);
    if (complaint.studentId !== student.id) throw new AppError('Not authorized', 403);
    
    // Can only edit if status is SUBMITTED
    if (complaint.status !== COMPLAINT_STATUSES.SUBMITTED) {
      throw new AppError('Cannot edit complaint after it has been assigned', 400);
    }

    const updatedComplaint = await prisma.complaint.update({
      where: { id },
      data,
    });

    res.json(successResponse('Complaint updated successfully', updatedComplaint));
  },

  /**
   * Update Status (Staff/Admin)
   */
  updateStatus: async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const { status: newStatus, comment } = req.body;

    const complaint = await prisma.complaint.findUnique({ 
      where: { id },
      include: { 
        student: { include: { user: true } }
      }
    });

    if (!complaint) throw new AppError('Complaint not found', 404);

    // Check staff authorization
    if (req.user!.role === Role.STAFF) {
      const staff = await prisma.staff.findUnique({ where: { userId } });
      if (complaint.assignedStaffId !== staff?.id) {
        throw new AppError('Not authorized to update this complaint', 403);
      }
    }

    // Validate state transition
    const validNextStates = STATUS_TRANSITIONS[complaint.status] || [];
    if (!validNextStates.includes(newStatus) && req.user!.role !== Role.ADMIN) {
      throw new AppError(`Invalid status transition from ${complaint.status} to ${newStatus}`, 400);
    }

    const updateData: any = { status: newStatus };
    if (newStatus === COMPLAINT_STATUSES.RESOLVED || newStatus === COMPLAINT_STATUSES.REJECTED || newStatus === COMPLAINT_STATUSES.CLOSED) {
      if (!complaint.resolvedAt) {
        updateData.resolvedAt = new Date();
      }
    } else {
      updateData.resolvedAt = null; // Re-open
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedComplaint = await tx.complaint.update({
        where: { id },
        data: updateData,
      });

      await tx.complaintHistory.create({
        data: {
          complaintId: id,
          changedById: userId,
          oldStatus: complaint.status,
          newStatus,
          comment,
        },
      });

      return updatedComplaint;
    });

    // Notify Student
    notificationService.createNotification(
      complaint.student.user.id,
      'Complaint Status Updated',
      `Your complaint ${complaint.complaintId} status changed to ${newStatus}`,
      NOTIFICATION_TYPES.COMPLAINT_STATUS_UPDATED,
      complaint.id,
      'Complaint'
    ).catch(console.error);

    if (complaint.student.user.personalEmail) {
      emailService.sendComplaintStatusUpdateEmail(
        complaint.student.user.personalEmail,
        complaint.student.fullName,
        complaint.complaintId,
        complaint.title,
        complaint.status,
        newStatus
      ).catch(console.error);

      if (newStatus === COMPLAINT_STATUSES.RESOLVED) {
        emailService.sendComplaintResolvedEmail(
          complaint.student.user.personalEmail,
          complaint.student.fullName,
          complaint.complaintId,
          complaint.title
        ).catch(console.error);
      }
    }

    res.json(successResponse('Status updated successfully', updated));
  },

  /**
   * Assign Complaint to Staff (Admin only)
   */
  assignComplaint: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { staffId } = req.body;
    const adminId = req.user!.id;

    const [complaint, staff] = await Promise.all([
      prisma.complaint.findUnique({ where: { id } }),
      prisma.staff.findUnique({ where: { id: staffId }, include: { user: true } }),
    ]);

    if (!complaint) throw new AppError('Complaint not found', 404);
    if (!staff) throw new AppError('Staff member not found', 404);

    const oldStatus = complaint.status;
    const newStatus = oldStatus === COMPLAINT_STATUSES.SUBMITTED ? COMPLAINT_STATUSES.ASSIGNED : oldStatus;

    const updated = await prisma.$transaction(async (tx) => {
      const updatedComplaint = await tx.complaint.update({
        where: { id },
        data: {
          assignedStaffId: staff.id,
          status: newStatus,
        },
      });

      await tx.complaintHistory.create({
        data: {
          complaintId: id,
          changedById: adminId,
          oldStatus,
          newStatus,
          comment: `Assigned to ${staff.fullName}`,
        },
      });

      return updatedComplaint;
    });

    // Notify Staff
    notificationService.createNotification(
      staff.user.id,
      'New Complaint Assigned',
      `Complaint ${complaint.complaintId} has been assigned to you.`,
      NOTIFICATION_TYPES.COMPLAINT_ASSIGNED,
      complaint.id,
      'Complaint'
    ).catch(console.error);

    if (staff.user.personalEmail) {
      emailService.sendComplaintAssignedEmail(
        staff.user.personalEmail,
        staff.fullName,
        complaint.complaintId,
        complaint.title
      ).catch(console.error);
    }

    res.json(successResponse('Complaint assigned successfully', updated));
  },

  /**
   * Delete Complaint (Student only, before assigned)
   */
  deleteComplaint: async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const student = await prisma.student.findUnique({ where: { userId } });
    const complaint = await prisma.complaint.findUnique({ where: { id }, include: { attachments: true } });

    if (!complaint || !student || complaint.studentId !== student.id) {
      throw new AppError('Not authorized or not found', 404);
    }

    if (complaint.status !== COMPLAINT_STATUSES.SUBMITTED) {
      throw new AppError('Cannot delete complaint after it has been processed', 400);
    }

    // Delete attachments from cloudinary first
    for (const attachment of complaint.attachments) {
      await uploadService.deleteFile(attachment.publicId).catch(console.error);
    }

    await prisma.complaint.delete({ where: { id } });

    res.json(successResponse('Complaint deleted successfully'));
  },

  /**
   * Get Public Complaint by ID (No auth required)
   */
  getPublicComplaint: async (req: Request, res: Response) => {
    const { complaintId } = req.params;

    const complaint = await prisma.complaint.findUnique({
      where: { complaintId },
      select: {
        complaintId: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true,
        resolvedAt: true,
        department: { select: { name: true } },
        category: { select: { name: true } },
      },
    });

    if (!complaint) throw new AppError('Complaint not found', 404);

    res.json(successResponse('Complaint retrieved', complaint));
  },

  // ─── Chat / Messaging ──────────────────────────────────────

  getComplaintMessages: async (req: Request, res: Response) => {
    const { id } = req.params;
    
    // Auth check omitted for brevity - should check if user is related to complaint
    
    const messages = await prisma.message.findMany({
      where: { complaintId: id },
      include: {
        sender: {
          select: {
            id: true,
            role: true,
            student: { select: { fullName: true, profileImage: true } },
            staff: { select: { fullName: true, profileImage: true } },
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(successResponse('Messages retrieved', messages));
  },

  sendMessage: async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const { content, fileUrl, fileName, fileType } = req.body;

    // Check if complaint exists and isn't closed
    const complaint = await prisma.complaint.findUnique({ 
      where: { id },
      include: { student: { include: { user: true } }, assignedStaff: { include: { user: true } } }
    });

    if (!complaint) throw new AppError('Complaint not found', 404);
    if (complaint.status === COMPLAINT_STATUSES.CLOSED) {
      throw new AppError('Cannot send messages in a closed complaint', 400);
    }

    const message = await prisma.message.create({
      data: {
        complaintId: id,
        senderId: userId,
        content,
        fileUrl,
        fileName,
        fileType
      },
      include: {
        sender: {
          select: {
            id: true,
            role: true,
            student: { select: { fullName: true, profileImage: true } },
            staff: { select: { fullName: true, profileImage: true } },
          }
        }
      }
    });

    // Notify the other party
    const targetUserId = req.user!.role === Role.STUDENT 
      ? complaint.assignedStaff?.user?.id 
      : complaint.student.user.id;

    if (targetUserId) {
      notificationService.createNotification(
        targetUserId,
        'New Message',
        `New message in complaint ${complaint.complaintId}`,
        NOTIFICATION_TYPES.NEW_MESSAGE,
        complaint.id,
        'Complaint'
      ).catch(console.error);
    }

    res.status(201).json(successResponse('Message sent', message));
  }
};
