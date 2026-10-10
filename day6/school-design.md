# School Database Design

## Students Table

The `students` table stores information about each student. It contains the student's ID, name and email address. The ID is the primary key and uniquely identifies each student. The email field is also unique so that two students cannot use the same email address.

## Courses Table

The `courses` table stores information about the courses offered by the school. It contains a course ID and course name. The course ID is the primary key and uniquely identifies each course.

## Enrolments Table

The `enrolments` table records the relationship between students and courses. It contains the student ID, course ID and the student's grade for that course. The student ID and course ID are foreign keys that reference the `students` and `courses` tables. The table also has a unique constraint on the combination of student ID and course ID to prevent the same student from enrolling in the same course more than once.

## Relationships

There is a one-to-many relationship between `students` and `enrolments` because one student can have many enrolment records, while each enrolment belongs to one student.

There is also a one-to-many relationship between `courses` and `enrolments` because one course can have many enrolment records, while each enrolment belongs to one course.

Together, `students` and `courses` have a many-to-many relationship. One student can take many courses, and one course can have many students. The `enrolments` table is needed as a join table to represent this many-to-many relationship. It also allows us to store additional information about the relationship, such as the student's grade.

## Index

I would add an index on `enrolments(student_id)` because the system will frequently need to find all courses taken by a particular student. An index can make these searches faster, especially as the number of enrolment records grows.

## SQL or NoSQL?

I would choose SQL for this school system because the data has clear relationships between students, courses and enrolments. Students and courses have structured fields, while enrolments connect the two and contain a grade. A relational database such as SQLite, MySQL or PostgreSQL provides primary keys, foreign keys, unique constraints and JOIN operations that are well suited to this type of structured and relational data. SQL also helps maintain data integrity and prevents invalid relationships between records.
