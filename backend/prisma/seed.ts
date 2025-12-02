import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Clear existing data (in correct order due to foreign keys)
  console.log("🗑️  Clearing existing data...");
  await prisma.enrollment.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.class.deleteMany();
  await prisma.user.deleteMany();

  // Hash password for all demo users
  const password = await bcrypt.hash("admin123", 10);
  const teacherPassword = await bcrypt.hash("teacher123", 10);
  const studentPassword = await bcrypt.hash("student123", 10);

  // Create Admin User
  console.log("👤 Creating admin user...");
  const admin = await prisma.user.create({
    data: {
      email: "admin@smk.com",
      password: password,
      name: "Administrator",
      role: "ADMIN",
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // Create Teacher Users
  console.log("👨‍🏫 Creating teacher users...");
  const teachers = await Promise.all([
    prisma.user.create({
      data: {
        email: "teacher@smk.com",
        password: teacherPassword,
        name: "Budi Santoso",
        role: "TEACHER",
      },
    }),
    prisma.user.create({
      data: {
        email: "teacher2@smk.com",
        password: teacherPassword,
        name: "Siti Rahayu",
        role: "TEACHER",
      },
    }),
    prisma.user.create({
      data: {
        email: "teacher3@smk.com",
        password: teacherPassword,
        name: "Ahmad Wijaya",
        role: "TEACHER",
      },
    }),
  ]);
  console.log(`✅ ${teachers.length} teachers created`);

  // Create Student Users
  console.log("👨‍🎓 Creating student users...");
  const students = await Promise.all([
    prisma.user.create({
      data: {
        email: "student@smk.com",
        password: studentPassword,
        name: "Andi Pratama",
        role: "STUDENT",
      },
    }),
    prisma.user.create({
      data: {
        email: "student2@smk.com",
        password: studentPassword,
        name: "Dewi Lestari",
        role: "STUDENT",
      },
    }),
    prisma.user.create({
      data: {
        email: "student3@smk.com",
        password: studentPassword,
        name: "Rizki Ramadhan",
        role: "STUDENT",
      },
    }),
    prisma.user.create({
      data: {
        email: "student4@smk.com",
        password: studentPassword,
        name: "Putri Amelia",
        role: "STUDENT",
      },
    }),
    prisma.user.create({
      data: {
        email: "student5@smk.com",
        password: studentPassword,
        name: "Dimas Prasetyo",
        role: "STUDENT",
      },
    }),
  ]);
  console.log(`✅ ${students.length} students created`);

  // Create Classes
  console.log("🏫 Creating classes...");
  const classes = await Promise.all([
    prisma.class.create({
      data: {
        name: "X TKJ 1",
        grade: 10,
        academicYear: "2024/2025",
      },
    }),
    prisma.class.create({
      data: {
        name: "X TKJ 2",
        grade: 10,
        academicYear: "2024/2025",
      },
    }),
    prisma.class.create({
      data: {
        name: "XI TKJ 1",
        grade: 11,
        academicYear: "2024/2025",
      },
    }),
    prisma.class.create({
      data: {
        name: "XII TKJ 1",
        grade: 12,
        academicYear: "2024/2025",
      },
    }),
  ]);
  console.log(`✅ ${classes.length} classes created`);

  // Create Subjects
  console.log("📚 Creating subjects...");
  const subjects = await Promise.all([
    // Class X TKJ 1
    prisma.subject.create({
      data: {
        name: "Pemrograman Web",
        classId: classes[0].id,
        teacherId: teachers[0].id,
      },
    }),
    prisma.subject.create({
      data: {
        name: "Jaringan Komputer",
        classId: classes[0].id,
        teacherId: teachers[1].id,
      },
    }),
    prisma.subject.create({
      data: {
        name: "Sistem Operasi",
        classId: classes[0].id,
        teacherId: teachers[2].id,
      },
    }),
    // Class X TKJ 2
    prisma.subject.create({
      data: {
        name: "Pemrograman Web",
        classId: classes[1].id,
        teacherId: teachers[0].id,
      },
    }),
    prisma.subject.create({
      data: {
        name: "Database",
        classId: classes[1].id,
        teacherId: teachers[1].id,
      },
    }),
    // Class XI TKJ 1
    prisma.subject.create({
      data: {
        name: "Pemrograman Mobile",
        classId: classes[2].id,
        teacherId: teachers[0].id,
      },
    }),
    prisma.subject.create({
      data: {
        name: "Administrasi Server",
        classId: classes[2].id,
        teacherId: teachers[2].id,
      },
    }),
    // Class XII TKJ 1
    prisma.subject.create({
      data: {
        name: "Proyek Akhir",
        classId: classes[3].id,
        teacherId: teachers[0].id,
      },
    }),
  ]);
  console.log(`✅ ${subjects.length} subjects created`);

  // Create Enrollments
  console.log("📝 Creating enrollments...");
  const enrollments = await Promise.all([
    // Enroll students 0-2 to X TKJ 1 subjects
    ...subjects.slice(0, 3).flatMap((subject) =>
      students.slice(0, 3).map((student) =>
        prisma.enrollment.create({
          data: {
            studentId: student.id,
            classId: classes[0].id,
            subjectId: subject.id,
          },
        })
      )
    ),
    // Enroll students 3-4 to X TKJ 2 subjects
    ...subjects.slice(3, 5).flatMap((subject) =>
      students.slice(3, 5).map((student) =>
        prisma.enrollment.create({
          data: {
            studentId: student.id,
            classId: classes[1].id,
            subjectId: subject.id,
          },
        })
      )
    ),
  ]);
  console.log(`✅ ${enrollments.length} enrollments created`);

  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📊 Summary:");
  console.log(`- ${students.length + teachers.length + 1} users`);
  console.log(`- ${classes.length} classes`);
  console.log(`- ${subjects.length} subjects`);
  console.log(`- ${enrollments.length} enrollments`);
  console.log("\n📝 Demo Credentials:");
  console.log("Admin: admin@smk.com / admin123");
  console.log("Teacher: teacher@smk.com / teacher123");
  console.log("Student: student@smk.com / student123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
