-- Enable foreign keys in SQLite
PRAGMA foreign_keys = ON;

-- ==========================================
-- 1. TABLE CREATION
-- ==========================================

CREATE TABLE students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE
);

CREATE TABLE courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL
);

-- Join table for the Many-to-Many relationship
CREATE TABLE enrolments (
  student_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  grade TEXT,
  -- Composite primary key prevents the same student enrolling in the same course twice
  PRIMARY KEY (student_id, course_id),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- ==========================================
-- 2. INSERT SAMPLE DATA
-- ==========================================

INSERT INTO students (name, email) VALUES 
  ('Alice Johnson', 'alice@example.com'),
  ('Bob Smith', 'bob@example.com'),
  ('Charlie Brown', 'charlie@example.com'),
  ('Diana Prince', 'diana@example.com'); -- Diana will have no enrolments

INSERT INTO courses (title) VALUES 
  ('Web Development 101'),
  ('Data Structures'),
  ('Database Systems');

INSERT INTO enrolments (student_id, course_id, grade) VALUES 
  (1, 1, 'A'),  -- Alice in Web Dev
  (1, 2, 'B'),  -- Alice in Data Structures
  (2, 1, 'C'),  -- Bob in Web Dev
  (2, 3, 'A'),  -- Bob in Database Systems
  (3, 2, 'B+'); -- Charlie in Data Structures

-- ==========================================
-- 3. QUERIES
-- ==========================================

-- Query 1: All courses for one student (by name)
SELECT courses.title, enrolments.grade
FROM courses
JOIN enrolments ON courses.id = enrolments.course_id
JOIN students ON students.id = enrolments.student_id
WHERE students.name = 'Alice Johnson';

-- Query 2: All students on one course
SELECT students.name, students.email
FROM students
JOIN enrolments ON students.id = enrolments.student_id
JOIN courses ON courses.id = enrolments.course_id
WHERE courses.title = 'Web Development 101';

-- Query 3: The number of students per course
SELECT courses.title, COUNT(enrolments.student_id) AS total_students
FROM courses
LEFT JOIN enrolments ON courses.id = enrolments.course_id
GROUP BY courses.id, courses.title;

-- Query 4: Students who have no enrolments
SELECT students.name, students.email
FROM students
LEFT JOIN enrolments ON students.id = enrolments.student_id
WHERE enrolments.course_id IS NULL;

-- Query 5: Update of one enrolment's grade
UPDATE enrolments 
SET grade = 'A+' 
WHERE student_id = 2 AND course_id = 3; 
-- (Updates Bob's grade in Database Systems to A+)