import { Request, Response } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler.middleware';
import { successResponse } from '../utils/helpers';
import slugify from 'slugify';

export const masterController = {
  // ─── Departments ─────────────────────────────────────────────

  getDepartments: async (req: Request, res: Response) => {
    // Only return active ones for public/dropdowns unless admin requests all
    const isAdmin = req.user?.role === 'ADMIN';
    const where = isAdmin ? {} : { isActive: true };

    const departments = await prisma.department.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    res.json(successResponse('Departments retrieved', departments));
  },

  createDepartment: async (req: Request, res: Response) => {
    const { name, code, description } = req.body;

    const existingCode = await prisma.department.findUnique({ where: { code } });
    if (existingCode) throw new AppError('Department code already exists', 400);

    const existingName = await prisma.department.findUnique({ where: { name } });
    if (existingName) throw new AppError('Department name already exists', 400);

    const department = await prisma.department.create({
      data: { name, code, description },
    });
    res.status(201).json(successResponse('Department created', department));
  },

  updateDepartment: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description } = req.body; // Don't allow updating code

    if (name) {
      const existing = await prisma.department.findFirst({
        where: { name, id: { not: id } },
      });
      if (existing) throw new AppError('Department name already exists', 400);
    }

    const updated = await prisma.department.update({
      where: { id },
      data: { name, description },
    });
    res.json(successResponse('Department updated', updated));
  },

  deleteDepartment: async (req: Request, res: Response) => {
    // Check if it's used
    const count = await prisma.student.count({ where: { departmentId: req.params.id } });
    if (count > 0) throw new AppError('Cannot delete department as it has students assigned', 400);

    await prisma.department.delete({ where: { id: req.params.id } });
    res.json(successResponse('Department deleted'));
  },

  toggleDepartmentStatus: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isActive } = req.body;

    const updated = await prisma.department.update({
      where: { id },
      data: { isActive },
    });
    res.json(successResponse(`Department ${isActive ? 'activated' : 'deactivated'}`, updated));
  },

  // ─── Categories ──────────────────────────────────────────────

  getCategories: async (req: Request, res: Response) => {
    const isAdmin = req.user?.role === 'ADMIN';
    const where = isAdmin ? {} : { isActive: true };

    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    res.json(successResponse('Categories retrieved', categories));
  },

  createCategory: async (req: Request, res: Response) => {
    const { name, description } = req.body;
    const slug = slugify(name, { lower: true, strict: true });

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) throw new AppError('Category already exists', 400);

    const category = await prisma.category.create({
      data: { name, slug, description },
    });
    res.status(201).json(successResponse('Category created', category));
  },

  updateCategory: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description } = req.body;
    
    let updateData: any = { description };
    
    if (name) {
      const slug = slugify(name, { lower: true, strict: true });
      const existing = await prisma.category.findFirst({
        where: { slug, id: { not: id } },
      });
      if (existing) throw new AppError('Category name already exists', 400);
      
      updateData.name = name;
      updateData.slug = slug;
    }

    const updated = await prisma.category.update({
      where: { id },
      data: updateData,
    });
    res.json(successResponse('Category updated', updated));
  },

  deleteCategory: async (req: Request, res: Response) => {
    const count = await prisma.complaint.count({ where: { categoryId: req.params.id } });
    if (count > 0) throw new AppError('Cannot delete category as it has complaints assigned', 400);

    await prisma.category.delete({ where: { id: req.params.id } });
    res.json(successResponse('Category deleted'));
  },

  toggleCategoryStatus: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isActive } = req.body;

    const updated = await prisma.category.update({
      where: { id },
      data: { isActive },
    });
    res.json(successResponse(`Category ${isActive ? 'activated' : 'deactivated'}`, updated));
  }
};
