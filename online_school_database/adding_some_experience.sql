-- =============================================================================
-- Script: Add new Teacher + Course + full history for StudentID=12 (k4sr405@gmail.com)
-- =============================================================================
-- Assumptions:
--   - Student UserID = 12 (k4sr405@gmail.com) already exists, Status='Active'
--   - Teacher registered 2 weeks ago
--   - Course created 10 days ago, ended 2 days ago (so Status should be 'Completed')
--   - 3 assignments, student submitted all, all graded 20/20
--   - Attendance: 4 sessions, alternating Present/Absent
--   - Certificate issued (FinalScore = 20 >= 10, course Completed, EndDate passed)
-- =============================================================================

SET @StudentID = 12;

-- ---------------------------------------------------------------------------
-- 1. Create the Teacher (User + Teacher row)
-- ---------------------------------------------------------------------------
INSERT INTO `User` (FullName, Email, PasswordHash, Role, PhoneNumber, RegistrationDate, IsDeleted)
VALUES ('Sara Ahmadi', 'sara.teacher@onlineschool.test', 'HASH_TEACH_NEW', 'Teacher', '09120000099', DATE_SUB(NOW(), INTERVAL 14 DAY), 0);

SET @TeacherID = LAST_INSERT_ID();

INSERT INTO Teacher (TeacherID, Expertise, HireDate, TotalIncome)
VALUES (@TeacherID, 'Machine Learning', DATE_SUB(CURDATE(), INTERVAL 14 DAY), 0);

-- ---------------------------------------------------------------------------
-- 2. Create the Course
--    Created 10 days ago, ended 2 days ago -> Status = 'Completed'
-- ---------------------------------------------------------------------------
INSERT INTO Course (TeacherID, Title, Description, Price, StartDate, EndDate, Capacity, Status, IsDeleted)
VALUES (
    @TeacherID,
    'Intro to Machine Learning',
    'A short introductory course on machine learning fundamentals.',
    1500.00,
    DATE_SUB(NOW(), INTERVAL 10 DAY),
    DATE_SUB(NOW(), INTERVAL 2 DAY),
    10,
    'Completed',
    0
);

SET @CourseID = LAST_INSERT_ID();

-- ---------------------------------------------------------------------------
-- 3. Enroll the student (Successful) + matching Payment (Successful)
-- ---------------------------------------------------------------------------
-- Temporarily disable the capacity trigger concern: course just created, capacity fine.
INSERT INTO Enrollment (StudentID, CourseID, EnrollmentDate, Status, FinalScore, ProgressPercent)
VALUES (@StudentID, @CourseID, DATE_SUB(NOW(), INTERVAL 10 DAY), 'Successful', 20.00, 100);

SET @EnrollmentID = LAST_INSERT_ID();

INSERT INTO Payment (StudentID, CourseID, Amount, PaymentDate, Status, TransactionID)
VALUES (@StudentID, @CourseID, 1500.00, DATE_SUB(NOW(), INTERVAL 10 DAY), 'Successful', CONCAT('TXN-NEW-', @CourseID, '-', @StudentID));

-- ---------------------------------------------------------------------------
-- 4. Create 3 Assignments (due dates before course end, in the past)
-- ---------------------------------------------------------------------------
INSERT INTO Assignment (CourseID, Title, Description, DueDate, MaxScore)
VALUES
(@CourseID, 'ML Assignment 1', 'Linear regression basics.', DATE_SUB(NOW(), INTERVAL 8 DAY), 20),
(@CourseID, 'ML Assignment 2', 'Classification with KNN.', DATE_SUB(NOW(), INTERVAL 6 DAY), 20),
(@CourseID, 'ML Assignment 3', 'Model evaluation metrics.', DATE_SUB(NOW(), INTERVAL 4 DAY), 20);

SET @Assign1 = LAST_INSERT_ID();
SET @Assign2 = @Assign1 + 1;
SET @Assign3 = @Assign1 + 2;

-- ---------------------------------------------------------------------------
-- 5. Submissions for all 3 assignments, all scored 20/20
-- ---------------------------------------------------------------------------
INSERT INTO Submission (AssignmentID, StudentID, SubmissionDate, FileURL, Score, Feedback)
VALUES
(@Assign1, @StudentID, DATE_SUB(NOW(), INTERVAL 8 DAY), 'https://files.example.com/ml_hw1_submission.pdf', 20.00, 'Excellent work'),
(@Assign2, @StudentID, DATE_SUB(NOW(), INTERVAL 6 DAY), 'https://files.example.com/ml_hw2_submission.pdf', 20.00, 'Perfect'),
(@Assign3, @StudentID, DATE_SUB(NOW(), INTERVAL 4 DAY), 'https://files.example.com/ml_hw3_submission.pdf', 20.00, 'Outstanding');

-- ---------------------------------------------------------------------------
-- 6. Attendance: 4 sessions, alternating Present/Absent
--    Session dates must be within [StartDate, EndDate] of the course
-- ---------------------------------------------------------------------------
INSERT INTO Attendance (StudentID, CourseID, SessionDate, Status)
VALUES
(@StudentID, @CourseID, DATE_SUB(CURDATE(), INTERVAL 9 DAY), 'Present'),
(@StudentID, @CourseID, DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'Absent'),
(@StudentID, @CourseID, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'Present'),
(@StudentID, @CourseID, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'Absent');

-- ---------------------------------------------------------------------------
-- 7. Recalculate GPA (FinalScore = 20 already set on Enrollment above)
-- ---------------------------------------------------------------------------
CALL sp_UpdateStudentGPA(@StudentID);

-- ---------------------------------------------------------------------------
-- 8. Issue Certificate for this course
--    Eligibility: Status='Successful', FinalScore>=10, Course Completed, EndDate <= NOW()
-- ---------------------------------------------------------------------------
CALL sp_IssueCertificatesForCourse(@CourseID);

-- ---------------------------------------------------------------------------
-- Summary output
-- ---------------------------------------------------------------------------
SELECT @TeacherID AS NewTeacherID, @CourseID AS NewCourseID, @EnrollmentID AS EnrollmentID,
       @Assign1 AS Assignment1ID, @Assign2 AS Assignment2ID, @Assign3 AS Assignment3ID;

SELECT * FROM vw_StudentTranscript WHERE StudentID = @StudentID AND CourseID = @CourseID;
SELECT * FROM vw_StudentCertificates WHERE StudentID = @StudentID AND CourseID = @CourseID;
SELECT * FROM Attendance WHERE StudentID = @StudentID AND CourseID = @CourseID;
SELECT * FROM Submission WHERE StudentID = @StudentID AND AssignmentID IN (@Assign1, @Assign2, @Assign3);