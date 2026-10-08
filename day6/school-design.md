# School Database Design

## Table Explanations & Relationships

- **`students` Table**: Stores core entity data for individuals attending the school. It maintains a 1-to-Many (1:N) relationship with `enrolments`.
- **`courses` Table**: Stores core entity data for the classes offered. It also maintains a 1-to-Many (1:N) relationship with `enrolments`.
- **`enrolments` Table (Join Table)**: Facilitates a Many-to-Many (N:M) relationship between students and courses. A join table is required because standard relational database normalization rules dictate that columns must hold atomic values; you cannot store a comma-separated list of course IDs inside the `students` table. The join table correctly maps the intersection of a specific student and a specific course, while also providing a logical place to store relationship-specific attributes like a `grade`.

## Recommended Index

I would add the following index to the system:
`CREATE INDEX idx_enrolments_course_id ON enrolments(course_id);`

**Reason:** By default, the composite primary key `(student_id, course_id)` acts as an index that optimizes queries starting with `student_id`. However, querying for "all students in a specific course" will require filtering heavily by `course_id`. Adding an index explicitly on `course_id` prevents slow, full-table scans when retrieving class rosters.

## Architecture Choice: SQL vs. NoSQL

I would choose a relational SQL database (like PostgreSQL or SQLite) over a NoSQL document store for this school system. Educational systems are inherently highly structured and relational; courses, students, and grades have strict, predictable associations. SQL's engine-enforced constraints (such as `FOREIGN KEY` and `UNIQUE`) ensure that a student cannot be enrolled in a course that doesn't exist, preventing orphaned data. Additionally, the need for transactional integrity (ACID properties) when processing mass enrolments or grade updates makes SQL the much safer and more reliable paradigm for this specific domain.
