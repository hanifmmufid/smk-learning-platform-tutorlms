#!/bin/bash

# SMK Learning Platform - Database Seed Script
# This script populates the database with demo data

echo "🌱 Starting database seed..."
echo ""

# Database connection details
DB_HOST="localhost"
DB_PORT="5436"
DB_NAME="smk_learning_platform"
DB_USER="ubuntu"
DB_PASSWORD="odoo2024secure"

# Export password for psql
export PGPASSWORD="$DB_PASSWORD"

# Check database connection
echo "📡 Testing database connection..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1

if [ $? -ne 0 ]; then
  echo "❌ Failed to connect to database"
  echo "   Host: $DB_HOST:$DB_PORT"
  echo "   Database: $DB_NAME"
  echo "   User: $DB_USER"
  exit 1
fi

echo "✅ Database connection successful"
echo ""

# Run seed files
echo "👤 Seeding users..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$(dirname "$0")/seed-users.sql"

if [ $? -eq 0 ]; then
  echo "✅ Users seeded successfully"
else
  echo "❌ Failed to seed users"
  exit 1
fi

echo ""
echo "🎉 Database seed completed!"
echo ""
echo "📝 Demo Credentials:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Admin:"
echo "  Email: admin@smk.com"
echo "  Password: admin123"
echo ""
echo "Teacher:"
echo "  Email: teacher@smk.com"
echo "  Password: teacher123"
echo ""
echo "Student:"
echo "  Email: student@smk.com"
echo "  Password: student123"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
