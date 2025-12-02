const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient({});

async function main() {
  console.log("🌱 Starting seed...");

  // Clear existing data
  console.log("🗑️  Clearing existing users...");
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

  console.log("\n🎉 Seed completed successfully!");
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
