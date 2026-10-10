PRAGMA foreign_keys = ON;

-- ============================================
-- CREATE TABLES
-- ============================================

CREATE TABLE students (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

CREATE TABLE courses (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE enrolments (
    id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    UNIQUE (student_id, course_id)
);

-- ============================================
-- INSERT SAMPLE STUDENTS
-- ============================================

INSERT INTO students (id, name, email)
VALUES
    (1, 'Haron Mwania', 'haron@example.com'),
    (2, 'Grace Wanjiku', 'grace@example.com'),
    (3, 'Brian Otieno', 'brian@example.com'),
    (4, 'Mary Achieng', 'mary@example.com');

-- ============================================
-- INSERT SAMPLE COURSES
-- ============================================

INSERT INTO courses (id, name)
VALUES
    (1, 'Database Systems'),
    (2, 'Web Development'),
    (3, 'Computer Networks');

-- ============================================
-- INSERT SAMPLE ENROLMENTS
-- ============================================

INSERT INTO enrolments (id, student_id, course_id, grade)
VALUES
    (1, 1, 1, 'A'),
    (2, 1, 2, 'B'),
    (3, 2, 1, 'B'),
    (4, 2, 3, 'A'),
    (5, 3, 2, 'A');

-- ============================================
-- QUERY 1:
-- All courses for one student by name
-- ============================================

SELECT
    students.name AS student,
    courses.name AS course
FROM students
JOIN enrolments
    ON students.id = enrolments.student_id
JOIN courses
    ON courses.id = enrolments.course_id
WHERE students.name = 'Haron Mwania';

-- ============================================
-- QUERY 2:
-- All students on one course
-- ============================================

SELECT
    students.name AS student,
    courses.name AS course
FROM students
JOIN enrolments
    ON students.id = enrolments.student_id
JOIN courses
    ON courses.id = enrolments.course_id
WHERE courses.name = 'Database Systems';

-- ============================================
-- QUERY 3:
-- Number of students per course
-- ============================================

SELECT
    courses.name AS course,
    COUNT(enrolments.student_id) AS student_count
FROM courses
LEFT JOIN enrolments
    ON courses.id = enrolments.course_id
GROUP BY courses.id, courses.name;

-- ============================================
-- QUERY 4:
-- Students who have no enrolments
-- ============================================

SELECT
    students.name AS student
FROM students
LEFT JOIN enrolments
    ON students.id = enrolments.student_id
WHERE enrolments.id IS NULL;

-- ============================================
-- QUERY 5:
-- Update one enrolment's grade
-- ============================================

UPDATE enrolments
SET grade = 'A+'
WHERE student_id = 1
  AND course_id = 2;