import { PrismaClient } from '@prisma/client';
import { Role, Priority, ComplaintStatus, TargetRole } from '../src/types/enums';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ─── Departments ────────────────────────────────────────────
  const departments = await Promise.all([
    prisma.department.upsert({
      where: { code: 'CS' },
      update: {},
      create: { name: 'Computer Science', code: 'CS', description: 'Computer Science and Engineering Department' },
    }),
    prisma.department.upsert({
      where: { code: 'ME' },
      update: {},
      create: { name: 'Mechanical Engineering', code: 'ME', description: 'Mechanical Engineering Department' },
    }),
    prisma.department.upsert({
      where: { code: 'CE' },
      update: {},
      create: { name: 'Civil Engineering', code: 'CE', description: 'Civil Engineering Department' },
    }),
    prisma.department.upsert({
      where: { code: 'EC' },
      update: {},
      create: { name: 'Electronics & Communication', code: 'EC', description: 'Electronics and Communication Engineering' },
    }),
    prisma.department.upsert({
      where: { code: 'BA' },
      update: {},
      create: { name: 'Business Administration', code: 'BA', description: 'Business Administration Department' },
    }),
    prisma.department.upsert({
      where: { code: 'PHY' },
      update: {},
      create: { name: 'Physics', code: 'PHY', description: 'Department of Physics' },
    }),
  ]);
  console.log(`✅ Created ${departments.length} departments`);

  // ─── Categories ────────────────────────────────────────────
  const categoryData = [
    { name: 'Academic', slug: 'academic', description: 'Issues related to academics, curriculum, and faculty' },
    { name: 'Hostel', slug: 'hostel', description: 'Hostel and accommodation related complaints' },
    { name: 'Maintenance', slug: 'maintenance', description: 'Infrastructure and maintenance issues' },
    { name: 'Transport', slug: 'transport', description: 'College bus and transport related issues' },
    { name: 'Library', slug: 'library', description: 'Library facilities and resources' },
    { name: 'Examination', slug: 'examination', description: 'Examination related complaints' },
    { name: 'IT Support', slug: 'it-support', description: 'Computer labs and IT infrastructure' },
    { name: 'Harassment', slug: 'harassment', description: 'Harassment and disciplinary issues' },
    { name: 'Facilities', slug: 'facilities', description: 'Campus facilities and amenities' },
    { name: 'Other', slug: 'other', description: 'Other miscellaneous complaints' },
  ];

  const categories = await Promise.all(
    categoryData.map((cat) =>
      prisma.category.upsert({
        where: { slug: cat.slug },
        update: {},
        create: cat,
      })
    )
  );
  console.log(`✅ Created ${categories.length} categories`);

  // ─── Admin User ────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@college.edu' },
    update: {},
    create: {
      email: 'admin@college.edu',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });
  console.log('✅ Admin user created: admin@college.edu / Admin@123');

  // ─── Staff Users ────────────────────────────────────────────
  const staffPassword = await bcrypt.hash('Staff@123', 12);
  const staffData = [
    {
      email: 'staff1@college.edu',
      fullName: 'Dr. Rajesh Kumar',
      employeeId: 'EMP-10001',
      phone: '9876543210',
      departmentId: departments[0].id,
      designation: 'Associate Professor',
    },
    {
      email: 'staff2@college.edu',
      fullName: 'Prof. Anitha Sharma',
      employeeId: 'EMP-10002',
      phone: '9876543211',
      departmentId: departments[1].id,
      designation: 'Assistant Professor',
    },
    {
      email: 'staff3@college.edu',
      fullName: 'Mr. Vikram Singh',
      employeeId: 'EMP-10003',
      phone: '9876543212',
      departmentId: departments[2].id,
      designation: 'Technical Staff',
    },
  ];

  const staffUsers = await Promise.all(
    staffData.map(async (s) => {
      const user = await prisma.user.upsert({
        where: { email: s.email },
        update: {},
        create: { email: s.email, password: staffPassword, role: Role.STAFF },
      });
      const staff = await prisma.staff.upsert({
        where: { employeeId: s.employeeId },
        update: {},
        create: {
          userId: user.id,
          fullName: s.fullName,
          employeeId: s.employeeId,
          phone: s.phone,
          departmentId: s.departmentId,
          designation: s.designation,
        },
      });
      return { user, staff };
    })
  );
  console.log(`✅ Created ${staffUsers.length} staff: staff1@college.edu, staff2@college.edu, staff3@college.edu / Staff@123`);

  // ─── Student Users ────────────────────────────────────────────
  const studentPassword = await bcrypt.hash('Student@123', 12);
  const studentData = [
    {
      email: 'student1@college.edu',
      fullName: 'Arjun Patel',
      registerNumber: '2021CS001',
      phone: '9123456780',
      departmentId: departments[0].id,
      academicYear: '3rd Year',
    },
    {
      email: 'student2@college.edu',
      fullName: 'Priya Nair',
      registerNumber: '2021CS002',
      phone: '9123456781',
      departmentId: departments[0].id,
      academicYear: '3rd Year',
    },
    {
      email: 'student3@college.edu',
      fullName: 'Rahul Mehta',
      registerNumber: '2022ME001',
      phone: '9123456782',
      departmentId: departments[1].id,
      academicYear: '2nd Year',
    },
    {
      email: 'student4@college.edu',
      fullName: 'Sneha Krishnan',
      registerNumber: '2020BA001',
      phone: '9123456783',
      departmentId: departments[4].id,
      academicYear: '4th Year',
    },
    {
      email: 'student5@college.edu',
      fullName: 'Amit Desai',
      registerNumber: '2023EC001',
      phone: '9123456784',
      departmentId: departments[3].id,
      academicYear: '1st Year',
    },
  ];

  const studentUsers = await Promise.all(
    studentData.map(async (s) => {
      const user = await prisma.user.upsert({
        where: { email: s.email },
        update: {},
        create: { email: s.email, password: studentPassword, role: Role.STUDENT },
      });
      const student = await prisma.student.upsert({
        where: { registerNumber: s.registerNumber },
        update: {},
        create: {
          userId: user.id,
          fullName: s.fullName,
          registerNumber: s.registerNumber,
          phone: s.phone,
          departmentId: s.departmentId,
          academicYear: s.academicYear,
        },
      });
      return { user, student };
    })
  );
  console.log(`✅ Created ${studentUsers.length} students`);

  // ─── Sample Complaints ────────────────────────────────────────────
  const complaintSamples = [
    {
      complaintId: 'COMP-2024-00001',
      studentId: studentUsers[0].student.id,
      assignedStaffId: staffUsers[0].staff.id,
      departmentId: departments[0].id,
      categoryId: categories[0].id,
      title: 'Professor absent for 3 consecutive lectures',
      description: 'Our Data Structures professor has been absent for the past 3 lectures without any prior notice or substitute arrangements. This is affecting our exam preparation.',
      priority: Priority.HIGH,
      status: ComplaintStatus.RESOLVED,
      location: 'Block A, Room 204',
      resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      complaintId: 'COMP-2024-00002',
      studentId: studentUsers[1].student.id,
      assignedStaffId: staffUsers[0].staff.id,
      departmentId: departments[0].id,
      categoryId: categories[6].id,
      title: 'Computer lab systems frequently crashing',
      description: 'The computers in Lab 3 keep crashing during programming exercises. Multiple students have lost their work. The systems need urgent maintenance.',
      priority: Priority.URGENT,
      status: ComplaintStatus.IN_PROGRESS,
      location: 'Computer Lab 3, Block B',
    },
    {
      complaintId: 'COMP-2024-00003',
      studentId: studentUsers[2].student.id,
      assignedStaffId: null,
      departmentId: departments[1].id,
      categoryId: categories[2].id,
      title: 'Broken benches in mechanical workshop',
      description: 'Several benches in the mechanical workshop are broken and pose a safety hazard. Students have been asked to stand during practical sessions.',
      priority: Priority.MEDIUM,
      status: ComplaintStatus.SUBMITTED,
      location: 'Mechanical Workshop, Block C',
    },
    {
      complaintId: 'COMP-2024-00004',
      studentId: studentUsers[3].student.id,
      assignedStaffId: staffUsers[1].staff.id,
      departmentId: departments[4].id,
      categoryId: categories[4].id,
      title: 'Requested books not available in library',
      description: 'Books on Management Accounting and Strategic Marketing that were requested 2 months ago are still not procured. The library staff says the orders are pending.',
      priority: Priority.LOW,
      status: ComplaintStatus.ASSIGNED,
      location: 'Central Library',
    },
    {
      complaintId: 'COMP-2024-00005',
      studentId: studentUsers[4].student.id,
      assignedStaffId: null,
      departmentId: departments[3].id,
      categoryId: categories[3].id,
      title: 'College bus route 5 frequently delayed',
      description: 'Bus route 5 covering Sector 12 and Sector 14 areas has been delayed by 30-45 minutes daily for the past two weeks. Students are consistently late to first period.',
      priority: Priority.HIGH,
      status: ComplaintStatus.SUBMITTED,
      location: 'Bus Stop - Sector 12',
    },
  ];

  for (const c of complaintSamples) {
    const existing = await prisma.complaint.findUnique({ where: { complaintId: c.complaintId } });
    if (!existing) {
      const complaint = await prisma.complaint.create({ data: c });
      // Create history
      await prisma.complaintHistory.create({
        data: {
          complaintId: complaint.id,
          changedById: adminUser.id,
          oldStatus: undefined,
          newStatus: ComplaintStatus.SUBMITTED,
          comment: 'Complaint submitted by student',
        },
      });
      if (c.status !== ComplaintStatus.SUBMITTED && c.assignedStaffId) {
        await prisma.complaintHistory.create({
          data: {
            complaintId: complaint.id,
            changedById: adminUser.id,
            oldStatus: ComplaintStatus.SUBMITTED,
            newStatus: ComplaintStatus.ASSIGNED,
            comment: 'Complaint assigned to staff',
          },
        });
      }
      if (c.status === ComplaintStatus.IN_PROGRESS) {
        await prisma.complaintHistory.create({
          data: {
            complaintId: complaint.id,
            changedById: adminUser.id,
            oldStatus: ComplaintStatus.ASSIGNED,
            newStatus: ComplaintStatus.IN_PROGRESS,
            comment: 'Staff is working on the complaint',
          },
        });
      }
      if (c.status === ComplaintStatus.RESOLVED) {
        await prisma.complaintHistory.create({
          data: {
            complaintId: complaint.id,
            changedById: adminUser.id,
            oldStatus: ComplaintStatus.IN_PROGRESS,
            newStatus: ComplaintStatus.RESOLVED,
            comment: 'Complaint has been resolved. Professor attendance issue addressed with department head.',
          },
        });
      }
    }
  }
  console.log(`✅ Created ${complaintSamples.length} sample complaints`);

  // ─── Announcements ────────────────────────────────────────────
  await prisma.announcement.upsert({
    where: { id: 'ann-001' },
    update: {},
    create: {
      id: 'ann-001',
      title: 'Welcome to the College Complaint Management System',
      content: 'Dear Students and Staff, we are pleased to launch our new Complaint Management System. You can now submit, track, and resolve complaints efficiently. Please use this platform for all your grievances.',
      authorId: adminUser.id,
      targetRole: TargetRole.ALL,
      isActive: true,
    },
  });
  await prisma.announcement.upsert({
    where: { id: 'ann-002' },
    update: {},
    create: {
      id: 'ann-002',
      title: 'Semester End Exam Schedule Released',
      content: 'The semester end examination schedule has been released. Please check the examination section for detailed timetables. All complaints regarding examination should be submitted before 5 days of the exam.',
      authorId: adminUser.id,
      targetRole: TargetRole.STUDENT,
      isActive: true,
    },
  });
  console.log('✅ Created announcements');

  // ─── Default Settings ────────────────────────────────────────────
  const settingsData = [
    { key: 'maintenance_mode', value: 'false', description: 'Enable maintenance mode' },
    { key: 'max_file_size', value: '10485760', description: 'Maximum file upload size in bytes (10MB)' },
    { key: 'allowed_file_types', value: 'jpg,jpeg,png,gif,webp,pdf', description: 'Allowed file types for upload' },
    { key: 'max_files_per_complaint', value: '5', description: 'Maximum attachments per complaint' },
    { key: 'college_name', value: 'GreenValley College of Engineering', description: 'College name' },
    { key: 'college_email', value: 'admin@college.edu', description: 'College contact email' },
    { key: 'complaint_auto_close_days', value: '30', description: 'Auto-close resolved complaints after N days' },
  ];

  for (const s of settingsData) {
    await prisma.settings.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log('✅ Created default settings');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Test Accounts:');
  console.log('  Admin:    admin@college.edu / Admin@123');
  console.log('  Staff:    staff1@college.edu / Staff@123');
  console.log('  Staff:    staff2@college.edu / Staff@123');
  console.log('  Staff:    staff3@college.edu / Staff@123');
  console.log('  Student:  student1@college.edu / Student@123');
  console.log('  Student:  student2@college.edu / Student@123');
  console.log('  Student:  student3@college.edu / Student@123');
  console.log('  Student:  student4@college.edu / Student@123');
  console.log('  Student:  student5@college.edu / Student@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
