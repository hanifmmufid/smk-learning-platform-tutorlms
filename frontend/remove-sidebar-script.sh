#!/bin/bash

# Script to remove Sidebar imports from all pages
# This will use sed to remove the problematic patterns

FILES=(
  "src/pages/Teacher/TeacherMaterialsPage.tsx"
  "src/pages/Teacher/TeacherAssignmentsPage.tsx"
  "src/pages/Teacher/TeacherQuizzesPage.tsx"
  "src/pages/Teacher/TeacherGradesPage.tsx"
  "src/pages/Student/StudentMaterialsPage.tsx"
  "src/pages/Student/StudentAssignmentsPage.tsx"
  "src/pages/Student/StudentQuizzesPage.tsx"
  "src/pages/Student/StudentGradesPage.tsx"
)

for file in "${FILES[@]}"; do
  echo "Processing $file..."

  # Create backup
  cp "$file" "$file.bak"

  # Remove Sidebar import lines
  sed -i '/import.*Sidebar.*from.*layout\/Sidebar/d' "$file"

  # Remove sidebarOpen state
  sed -i '/const \[sidebarOpen.*setSidebarOpen\]/d' "$file"

  # Remove handleLogout function
  sed -i '/const handleLogout = async/,/^  };$/d' "$file"

  # Remove navItems array
  sed -i '/const navItems = \[/,/^  \];$/d' "$file"

  # Remove imports of useNavigate, useThemeStore if only used for sidebar
  # (This is tricky, skip for now)

  echo "Done with $file"
done

echo "All files processed. Backups saved with .bak extension"
