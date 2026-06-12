-- =============================================================================
-- Online School Management System (MySQL Version) - FULLY FIXED v2
-- =============================================================================

DROP DATABASE IF EXISTS OnlineSchoolDB;
CREATE DATABASE OnlineSchoolDB;
USE OnlineSchoolDB;

-- =============================================================================
-- TABLES
-- =============================================================================

CREATE TABLE `User` (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    FullName VARCHAR(100) NOT NULL,
    Email VARCHAR(255) NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    Role VARCHAR(20) NOT NULL,
    PhoneNumber VARCHAR(20) NULL,
    RegistrationDate DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    IsDeleted TINYINT(1) NOT NULL DEFAULT 0,
    CONSTRAINT UQ_User_Email UNIQUE (Email),
    CONSTRAINT CK_User_FullName CHECK (CHAR_LENGTH(FullName) BETWEEN 3 AND 100),
    CONSTRAINT CK_User_Role CHECK (Role IN ('Admin', 'Teacher', 'Student'))
);

CREATE TABLE Student (
    StudentID INT NOT NULL PRIMARY KEY,
    DateOfBirth DATE NULL,
    GPA DECIMAL(4,2) NOT NULL DEFAULT 0,
    Status VARCHAR(20) NOT NULL DEFAULT 'Active',
    CONSTRAINT FK_Student_User FOREIGN KEY (StudentID) REFERENCES `User`(UserID),
    CONSTRAINT CK_Student_GPA CHECK (GPA BETWEEN 0 AND 20),
    CONSTRAINT CK_Student_Status CHECK (Status IN ('Active', 'Inactive'))
);

CREATE TABLE Teacher (
    TeacherID INT NOT NULL PRIMARY KEY,
    Expertise VARCHAR(200) NOT NULL,
    HireDate DATE NOT NULL DEFAULT (CURDATE()),
    TotalIncome DECIMAL(18,2) NOT NULL DEFAULT 0,
    CONSTRAINT FK_Teacher_User FOREIGN KEY (TeacherID) REFERENCES `User`(UserID),
    CONSTRAINT CK_Teacher_TotalIncome CHECK (TotalIncome >= 0)
);

-- NOTE: Course.Status now includes 'Draft' to represent a course the teacher
-- is still preparing. While a course is 'Draft' or 'Active', students cannot
-- enroll (enrollment is only allowed while status = 'Upcoming').
-- 'Active' means the course is currently being held (in progress) -- new
-- enrollments are blocked so the teacher has time to deliver existing content
-- without late joiners disrupting the course.
CREATE TABLE Course (
    CourseID INT AUTO_INCREMENT PRIMARY KEY,
    TeacherID INT NOT NULL,
    Title VARCHAR(150) NOT NULL,
    Description TEXT NULL,
    Price DECIMAL(12,2) NOT NULL,
    StartDate DATETIME(0) NOT NULL,
    EndDate DATETIME(0) NOT NULL,
    Capacity INT NOT NULL,
    Status VARCHAR(20) NOT NULL DEFAULT 'Draft',
    IsDeleted TINYINT(1) NOT NULL DEFAULT 0,
    CONSTRAINT FK_Course_Teacher FOREIGN KEY (TeacherID) REFERENCES Teacher(TeacherID),
    CONSTRAINT CK_Course_Title CHECK (CHAR_LENGTH(Title) BETWEEN 3 AND 150),
    CONSTRAINT CK_Course_Price CHECK (Price >= 0),
    CONSTRAINT CK_Course_Capacity CHECK (Capacity > 0),
    CONSTRAINT CK_Course_Status CHECK (Status IN ('Draft', 'Upcoming', 'Active', 'Completed', 'Cancelled')),
    CONSTRAINT CK_Course_Dates CHECK (EndDate > StartDate)
);

CREATE TABLE Enrollment (
    EnrollmentID INT AUTO_INCREMENT PRIMARY KEY,
    StudentID INT NOT NULL,
    CourseID INT NOT NULL,
    EnrollmentDate DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    Status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    FinalScore DECIMAL(4,2) NULL,
    ProgressPercent INT NOT NULL DEFAULT 0,
    CONSTRAINT FK_Enrollment_Student FOREIGN KEY (StudentID) REFERENCES Student(StudentID),
    CONSTRAINT FK_Enrollment_Course FOREIGN KEY (CourseID) REFERENCES Course(CourseID),
    CONSTRAINT UQ_Enrollment_Student_Course UNIQUE (StudentID, CourseID),
    CONSTRAINT CK_Enrollment_Status CHECK (Status IN ('Pending', 'Successful', 'Failed', 'Dropped')),
    CONSTRAINT CK_Enrollment_FinalScore CHECK (FinalScore IS NULL OR FinalScore BETWEEN 0 AND 20),
    CONSTRAINT CK_Enrollment_Progress CHECK (ProgressPercent BETWEEN 0 AND 100)
);

CREATE TABLE Assignment (
    AssignmentID INT AUTO_INCREMENT PRIMARY KEY,
    CourseID INT NOT NULL,
    Title VARCHAR(150) NOT NULL,
    Description TEXT NULL,
    DueDate DATETIME(0) NOT NULL,
    MaxScore DECIMAL(4,2) NOT NULL,
    CONSTRAINT FK_Assignment_Course FOREIGN KEY (CourseID) REFERENCES Course(CourseID),
    CONSTRAINT CK_Assignment_Title CHECK (CHAR_LENGTH(Title) BETWEEN 3 AND 150),
    CONSTRAINT CK_Assignment_MaxScore CHECK (MaxScore > 0 AND MaxScore <= 20)
);

CREATE TABLE Submission (
    SubmissionID INT AUTO_INCREMENT PRIMARY KEY,
    AssignmentID INT NOT NULL,
    StudentID INT NOT NULL,
    SubmissionDate DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    FileURL VARCHAR(500) NOT NULL,
    Score DECIMAL(4,2) NULL,
    Feedback TEXT NULL,
    CONSTRAINT FK_Submission_Assignment FOREIGN KEY (AssignmentID) REFERENCES Assignment(AssignmentID) ON DELETE CASCADE,
    CONSTRAINT FK_Submission_Student FOREIGN KEY (StudentID) REFERENCES Student(StudentID),
    CONSTRAINT UQ_Submission_Assignment_Student UNIQUE (AssignmentID, StudentID),
    CONSTRAINT CK_Submission_Score CHECK (Score IS NULL OR Score BETWEEN 0 AND 20)
);

CREATE TABLE Attendance (
    AttendanceID INT AUTO_INCREMENT PRIMARY KEY,
    StudentID INT NOT NULL,
    CourseID INT NOT NULL,
    SessionDate DATE NOT NULL,
    Status VARCHAR(20) NOT NULL,
    CONSTRAINT FK_Attendance_Student FOREIGN KEY (StudentID) REFERENCES Student(StudentID),
    CONSTRAINT FK_Attendance_Course FOREIGN KEY (CourseID) REFERENCES Course(CourseID),
    CONSTRAINT UQ_Attendance UNIQUE (StudentID, CourseID, SessionDate),
    CONSTRAINT CK_Attendance_Status CHECK (Status IN ('Present', 'Absent'))
);

CREATE TABLE Payment (
    PaymentID INT AUTO_INCREMENT PRIMARY KEY,
    StudentID INT NOT NULL,
    CourseID INT NOT NULL,
    Amount DECIMAL(12,2) NOT NULL,
    PaymentDate DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    Status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    TransactionID VARCHAR(100) NULL,
    CONSTRAINT FK_Payment_Student FOREIGN KEY (StudentID) REFERENCES Student(StudentID),
    CONSTRAINT FK_Payment_Course FOREIGN KEY (CourseID) REFERENCES Course(CourseID),
    CONSTRAINT UQ_Payment_TransactionID UNIQUE (TransactionID),
    CONSTRAINT CK_Payment_Amount CHECK (Amount >= 0),
    CONSTRAINT CK_Payment_Status CHECK (Status IN ('Pending', 'Successful', 'Failed', 'Refunded'))
);

CREATE TABLE Certificate (
    CertificateID INT AUTO_INCREMENT PRIMARY KEY,
    StudentID INT NOT NULL,
    CourseID INT NOT NULL,
    IssueDate DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    CertificateCode VARCHAR(100) NOT NULL,
    CONSTRAINT FK_Certificate_Student FOREIGN KEY (StudentID) REFERENCES Student(StudentID),
    CONSTRAINT FK_Certificate_Course FOREIGN KEY (CourseID) REFERENCES Course(CourseID),
    CONSTRAINT UQ_Certificate_Student_Course UNIQUE (StudentID, CourseID),
    CONSTRAINT UQ_Certificate_Code UNIQUE (CertificateCode)
);

CREATE TABLE FinancialReportLog (
    ReportID INT AUTO_INCREMENT PRIMARY KEY,
    ReportYear INT,
    ReportMonth INT,
    TotalRevenue DECIMAL(18,2),
    GeneratedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- NEW: Announcements posted by a course's teacher
CREATE TABLE Announcement (
    AnnouncementID INT AUTO_INCREMENT PRIMARY KEY,
    CourseID INT NOT NULL,
    Title VARCHAR(150) NOT NULL,
    Content TEXT NOT NULL,
    CreatedAt DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    UpdatedAt DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),
    CONSTRAINT FK_Announcement_Course FOREIGN KEY (CourseID) REFERENCES Course(CourseID) ON DELETE CASCADE,
    CONSTRAINT CK_Announcement_Title CHECK (CHAR_LENGTH(Title) BETWEEN 3 AND 150),
    CONSTRAINT CK_Announcement_Content CHECK (CHAR_LENGTH(Content) >= 1)
);

-- =============================================================================
-- SAMPLE DATA (with explicit IDs)
-- =============================================================================

SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

INSERT INTO `User` (UserID, FullName, Email, PasswordHash, Role, PhoneNumber, RegistrationDate, IsDeleted) VALUES
(1,  'System Admin', 'admin@onlineschool.test',  'HASH_ADMIN_001',  'Admin',   '09120000001', DATE_SUB(NOW(), INTERVAL 30 DAY), 0),
(2,  'Alice Teacher', 'alice.teacher@onlineschool.test', 'HASH_TEACH_002', 'Teacher', '09120000002', DATE_SUB(NOW(), INTERVAL 90 DAY), 0),
(3,  'Bob Teacher',   'bob.teacher@onlineschool.test',   'HASH_TEACH_003', 'Teacher', '09120000003', DATE_SUB(NOW(), INTERVAL 85 DAY), 0),
(4,  'John Student',   'john.student@onlineschool.test',  'HASH_STUD_004',  'Student', '09120000004', DATE_SUB(NOW(), INTERVAL 70 DAY), 0),
(5,  'Mary Student',   'mary.student@onlineschool.test',  'HASH_STUD_005',  'Student', '09120000005', DATE_SUB(NOW(), INTERVAL 68 DAY), 0),
(6,  'Chris Student',  'chris.student@onlineschool.test', 'HASH_STUD_006',  'Student', '09120000006', DATE_SUB(NOW(), INTERVAL 66 DAY), 0),
(7,  'Lily Student',   'lily.student@onlineschool.test',  'HASH_STUD_007',  'Student', '09120000007', DATE_SUB(NOW(), INTERVAL 64 DAY), 0),
(8,  'Omar Student',   'omar.student@onlineschool.test',  'HASH_STUD_008',  'Student', '09120000008', DATE_SUB(NOW(), INTERVAL 62 DAY), 0),
(9,  'Nina Student',   'nina.student@onlineschool.test',  'HASH_STUD_009',  'Student', '09120000009', DATE_SUB(NOW(), INTERVAL 60 DAY), 0),
(10, 'Paul Student',   'paul.student@onlineschool.test',  'HASH_STUD_010',  'Student', '09120000010', DATE_SUB(NOW(), INTERVAL 58 DAY), 0),
(11, 'Eva Student',    'eva.student@onlineschool.test',   'HASH_STUD_011',  'Student', '09120000011', DATE_SUB(NOW(), INTERVAL 56 DAY), 0);

INSERT INTO Student (StudentID, DateOfBirth, GPA, Status) VALUES
(4,  '2003-05-12', 0, 'Active'),
(5,  '2004-02-18', 0, 'Active'),
(6,  '2002-11-03', 0, 'Active'),
(7,  '2003-08-21', 0, 'Active'),
(8,  '2005-01-14', 0, 'Active'),
(9,  '2004-09-30', 0, 'Active'),
(10, '2003-03-07', 0, 'Active'),
(11, '2001-12-25', 0, 'Inactive');

INSERT INTO Teacher (TeacherID, Expertise, HireDate, TotalIncome) VALUES
(2, 'Database and SQL', '2021-09-01', 0),
(3, 'Artificial Intelligence', '2020-10-15', 0);

-- Courses:
--  1 SQL Basics      -> Completed (past)
--  2 Database Design -> Active (in progress, enrollment closed)
--  3 AI Fundamentals  -> Upcoming (enrollment OPEN - mock "can enroll" course)
--  4 Networks         -> Completed (past)
--  5 Algorithms       -> Active (in progress, enrollment closed)
--  6 Web Development  -> Draft (teacher still preparing, enrollment closed)
--  7 Cloud Computing  -> Upcoming (enrollment OPEN - mock "can enroll" course)
INSERT INTO Course (CourseID, TeacherID, Title, Description, Price, StartDate, EndDate, Capacity, Status, IsDeleted) VALUES
(1, 2, 'SQL Basics', 'Introductory SQL course', 1200.00, DATE_SUB(NOW(), INTERVAL 120 DAY), DATE_SUB(NOW(), INTERVAL 90 DAY), 3, 'Completed', 0),
(2, 2, 'Database Design', 'Relational model and normalization', 1500.00, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_ADD(NOW(), INTERVAL 20 DAY), 4, 'Active', 0),
(3, 3, 'AI Fundamentals', 'Basic AI and machine learning concepts', 1800.00, DATE_ADD(NOW(), INTERVAL 10 DAY), DATE_ADD(NOW(), INTERVAL 50 DAY), 4, 'Upcoming', 0),
(4, 3, 'Networks', 'Computer networks and protocols', 1000.00, DATE_SUB(NOW(), INTERVAL 60 DAY), DATE_SUB(NOW(), INTERVAL 30 DAY), 5, 'Completed', 0),
(5, 2, 'Algorithms', 'Algorithms and problem solving', 1400.00, DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_ADD(NOW(), INTERVAL 15 DAY), 5, 'Active', 0),
(6, 2, 'Web Development', 'Full-stack web development with modern frameworks', 1600.00, DATE_ADD(NOW(), INTERVAL 25 DAY), DATE_ADD(NOW(), INTERVAL 70 DAY), 6, 'Draft', 0),
(7, 3, 'Cloud Computing', 'Intro to cloud infrastructure and deployment', 1700.00, DATE_ADD(NOW(), INTERVAL 14 DAY), DATE_ADD(NOW(), INTERVAL 60 DAY), 5, 'Upcoming', 0);

INSERT INTO Assignment (AssignmentID, CourseID, Title, Description, DueDate, MaxScore) VALUES
(1, 1, 'SQL Query Set 1', 'Write 5 SELECT queries covering joins and aggregation.', DATE_SUB(NOW(), INTERVAL 100 DAY), 20),
(2, 1, 'SQL Query Set 2', 'Write queries using subqueries and window functions.', DATE_SUB(NOW(), INTERVAL 95 DAY), 20),
(3, 2, 'Normalization Task', 'Normalize the given schema to 3NF and explain each step.', DATE_ADD(NOW(), INTERVAL 10 DAY), 20),
(4, 4, 'Network Basics Quiz', 'Answer the quiz covering OSI and TCP/IP layers.', DATE_SUB(NOW(), INTERVAL 35 DAY), 20),
(5, 5, 'Algorithms Homework', 'Implement and analyze the given sorting algorithms.', DATE_ADD(NOW(), INTERVAL 10 DAY), 20);

INSERT INTO Enrollment (EnrollmentID, StudentID, CourseID, EnrollmentDate, Status, FinalScore, ProgressPercent) VALUES
(1, 4, 1, DATE_SUB(NOW(), INTERVAL 119 DAY), 'Successful', 18.00, 100),
(2, 5, 1, DATE_SUB(NOW(), INTERVAL 118 DAY), 'Successful', 15.00, 100),
(3, 6, 1, DATE_SUB(NOW(), INTERVAL 117 DAY), 'Successful',  9.00, 100),
(4, 7, 2, DATE_SUB(NOW(), INTERVAL 9 DAY),  'Successful', 14.00,  50),
(5, 8, 2, DATE_SUB(NOW(), INTERVAL 8 DAY),  'Pending',    NULL,   10),
(6, 9, 4, DATE_SUB(NOW(), INTERVAL 59 DAY), 'Successful', 17.00, 100),
(7,10, 5, DATE_SUB(NOW(), INTERVAL 14 DAY), 'Failed',      NULL,   20),
(8,11, 5, DATE_SUB(NOW(), INTERVAL 13 DAY), 'Dropped',     NULL,    0),
(9, 4, 5, DATE_SUB(NOW(), INTERVAL 12 DAY), 'Successful', 12.00,  80),
(10,5, 4, DATE_SUB(NOW(), INTERVAL 58 DAY), 'Successful', 11.00, 100);

INSERT INTO Payment (PaymentID, StudentID, CourseID, Amount, PaymentDate, Status, TransactionID) VALUES
(1, 4, 1, 1200.00, DATE_SUB(NOW(), INTERVAL 119 DAY), 'Successful', 'TXN-000001'),
(2, 5, 1, 1200.00, DATE_SUB(NOW(), INTERVAL 118 DAY), 'Successful', 'TXN-000002'),
(3, 6, 1, 1200.00, DATE_SUB(NOW(), INTERVAL 117 DAY), 'Successful', 'TXN-000003'),
(4, 7, 2, 1500.00, DATE_SUB(NOW(), INTERVAL 9 DAY),  'Successful', 'TXN-000004'),
(5, 8, 2, 1500.00, DATE_SUB(NOW(), INTERVAL 8 DAY),  'Pending',    'TXN-000005'),
(6, 9, 4, 1000.00, DATE_SUB(NOW(), INTERVAL 59 DAY), 'Successful', 'TXN-000006'),
(7,10, 5, 1400.00, DATE_SUB(NOW(), INTERVAL 14 DAY), 'Failed',      'TXN-000007'),
(8,11, 5, 1400.00, DATE_SUB(NOW(), INTERVAL 13 DAY), 'Refunded',    'TXN-000008'),
(9, 4, 5, 1400.00, DATE_SUB(NOW(), INTERVAL 12 DAY), 'Successful', 'TXN-000009'),
(10,5, 4, 1000.00, DATE_SUB(NOW(), INTERVAL 58 DAY), 'Successful', 'TXN-000010');

INSERT INTO Submission (SubmissionID, AssignmentID, StudentID, SubmissionDate, FileURL, Score, Feedback) VALUES
(1, 1, 4, DATE_SUB(NOW(), INTERVAL 100 DAY), 'https://files.example.com/s1_a1.pdf', 18.00, 'Good work'),
(2, 2, 4, DATE_SUB(NOW(), INTERVAL 94 DAY),  'https://files.example.com/s1_a2.pdf', 17.00, 'Solid answer'),
(3, 1, 5, DATE_SUB(NOW(), INTERVAL 99 DAY),  'https://files.example.com/s2_a1.pdf', 15.00, 'Correct'),
(4, 1, 6, DATE_SUB(NOW(), INTERVAL 98 DAY),  'https://files.example.com/s3_a1.pdf',  9.00, 'Needs improvement'),
(5, 3, 7, DATE_SUB(NOW(), INTERVAL 1 DAY),   'https://files.example.com/s4_a3.pdf', 14.00, 'Nice submission'),
(6, 4, 9, DATE_SUB(NOW(), INTERVAL 40 DAY),  'https://files.example.com/s5_a4.pdf', 17.00, 'Well done'),
(7, 5, 4, DATE_SUB(NOW(), INTERVAL 2 DAY),   'https://files.example.com/s6_a5.pdf', 12.00, 'Good'),
(8, 4, 5, DATE_SUB(NOW(), INTERVAL 39 DAY),  'https://files.example.com/s7_a4.pdf', 11.00, 'Accepted');

INSERT INTO Attendance (AttendanceID, StudentID, CourseID, SessionDate, Status) VALUES
(1, 4, 1, DATE_SUB(CURDATE(), INTERVAL 110 DAY), 'Present'),
(2, 5, 1, DATE_SUB(CURDATE(), INTERVAL 109 DAY), 'Present'),
(3, 6, 1, DATE_SUB(CURDATE(), INTERVAL 108 DAY), 'Absent'),
(4, 7, 2, DATE_SUB(CURDATE(), INTERVAL 5 DAY),  'Present'),
(5, 9, 4, DATE_SUB(CURDATE(), INTERVAL 45 DAY), 'Present'),
(6, 4, 5, DATE_SUB(CURDATE(), INTERVAL 5 DAY),  'Present');

-- Mock announcements: teacher 2 (Alice) posted in courses 1, 2, 5; teacher 3 (Bob) in course 4.
INSERT INTO Announcement (AnnouncementID, CourseID, Title, Content, CreatedAt) VALUES
(1, 1, 'Welcome to SQL Basics', 'Welcome everyone! Please check the syllabus and complete Assignment 1 by the due date.', DATE_SUB(NOW(), INTERVAL 119 DAY)),
(2, 1, 'Course Completed', 'Thanks for a great course. Certificates will be issued shortly for those who passed.', DATE_SUB(NOW(), INTERVAL 89 DAY)),
(3, 2, 'Live Session Schedule', 'Our live sessions will be held every Tuesday at 6 PM. Recordings will be posted afterwards.', DATE_SUB(NOW(), INTERVAL 9 DAY)),
(4, 5, 'Assignment Reminder', 'Reminder: Algorithms Homework is due soon. Reach out if you have questions.', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(5, 4, 'Final Grades Posted', 'Final grades and certificates have been processed for Networks.', DATE_SUB(NOW(), INTERVAL 29 DAY));

SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;

ALTER TABLE `User` AUTO_INCREMENT = 12;
ALTER TABLE Course AUTO_INCREMENT = 8;
ALTER TABLE Assignment AUTO_INCREMENT = 6;
ALTER TABLE Enrollment AUTO_INCREMENT = 11;
ALTER TABLE Payment AUTO_INCREMENT = 11;
ALTER TABLE Submission AUTO_INCREMENT = 9;
ALTER TABLE Attendance AUTO_INCREMENT = 7;
ALTER TABLE Certificate AUTO_INCREMENT = 1;
ALTER TABLE FinancialReportLog AUTO_INCREMENT = 1;
ALTER TABLE Announcement AUTO_INCREMENT = 6;

-- =============================================================================
-- FUNCTION
-- =============================================================================

DELIMITER //

CREATE FUNCTION fn_CalculateStudentGPA(p_StudentID INT)
RETURNS DECIMAL(4,2)
DETERMINISTIC
BEGIN
    DECLARE v_Result DECIMAL(4,2);
    SELECT COALESCE(AVG(FinalScore), 0) INTO v_Result
    FROM Enrollment
    WHERE StudentID = p_StudentID
      AND Status = 'Successful'
      AND FinalScore IS NOT NULL;
    RETURN COALESCE(v_Result, 0);
END //

DELIMITER ;

-- =============================================================================
-- PROCEDURES (all in one DELIMITER block)
-- =============================================================================

DELIMITER //

CREATE PROCEDURE sp_CalculateStudentGPA(IN p_StudentID INT)
BEGIN
    DECLARE v_NewGPA DECIMAL(4,2);
    IF NOT EXISTS (SELECT 1 FROM Student WHERE StudentID = p_StudentID) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student not found.';
    END IF;
    SET v_NewGPA = fn_CalculateStudentGPA(p_StudentID);
    UPDATE Student SET GPA = v_NewGPA WHERE StudentID = p_StudentID;
    SELECT p_StudentID AS StudentID, v_NewGPA AS CalculatedGPA;
END //

-- ENROLLMENT: only allowed while Course.Status = 'Upcoming'.
-- 'Draft'    -> teacher still preparing content, not open yet.
-- 'Active'   -> course already in progress, new enrollments blocked.
-- 'Completed'/'Cancelled' -> course is over.
CREATE PROCEDURE sp_EnrollStudentInCourse(
    IN p_StudentID INT,
    IN p_CourseID INT,
    IN p_Amount DECIMAL(12,2),
    IN p_TransactionID VARCHAR(100)
)
BEGIN
    DECLARE v_CoursePrice DECIMAL(12,2);
    DECLARE v_Capacity INT;
    DECLARE v_CourseStatus VARCHAR(20);
    DECLARE v_StudentStatus VARCHAR(20);
    DECLARE v_ExistingCount INT;
    DECLARE v_SuccessfulCount INT;
    DECLARE v_TeacherID INT;
    DECLARE v_EnrollmentID INT;
    DECLARE v_PaymentID INT;
    DECLARE v_GeneratedTransactionID VARCHAR(100);
    DECLARE v_StudentName VARCHAR(100);
    DECLARE v_CourseTitle VARCHAR(150);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SELECT s.Status, u.FullName INTO v_StudentStatus, v_StudentName
    FROM Student s
    INNER JOIN `User` u ON s.StudentID = u.UserID
    WHERE s.StudentID = p_StudentID AND u.IsDeleted = 0;

    IF v_StudentStatus IS NULL OR v_StudentStatus <> 'Active' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student not found or inactive.';
    END IF;

    SELECT c.Price, c.Capacity, c.Status, c.TeacherID, c.Title
    INTO v_CoursePrice, v_Capacity, v_CourseStatus, v_TeacherID, v_CourseTitle
    FROM Course c
    WHERE c.CourseID = p_CourseID AND c.IsDeleted = 0;

    IF v_CourseStatus IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Course not found.';
    END IF;

    IF v_CourseStatus <> 'Upcoming' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Enrollment is only open while the course status is Upcoming.';
    END IF;

    IF p_Amount <> v_CoursePrice THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Payment amount does not match course price.';
    END IF;

    SELECT COUNT(*) INTO v_ExistingCount
    FROM Enrollment
    WHERE StudentID = p_StudentID AND CourseID = p_CourseID;

    IF v_ExistingCount > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'The student is already enrolled in this course.';
    END IF;

    SELECT COUNT(*) INTO v_SuccessfulCount
    FROM Enrollment
    WHERE CourseID = p_CourseID AND Status = 'Successful';

    IF v_SuccessfulCount >= v_Capacity THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Course capacity has been reached.';
    END IF;

    SET v_GeneratedTransactionID = COALESCE(p_TransactionID, CONCAT('TRX-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 1000000), 6, '0')));

    INSERT INTO Enrollment (StudentID, CourseID, EnrollmentDate, Status, FinalScore, ProgressPercent)
    VALUES (p_StudentID, p_CourseID, NOW(), 'Pending', NULL, 0);
    SET v_EnrollmentID = LAST_INSERT_ID();

    INSERT INTO Payment (StudentID, CourseID, Amount, PaymentDate, Status, TransactionID)
    VALUES (p_StudentID, p_CourseID, p_Amount, NOW(), 'Pending', v_GeneratedTransactionID);
    SET v_PaymentID = LAST_INSERT_ID();

    UPDATE Enrollment SET Status = 'Successful' WHERE EnrollmentID = v_EnrollmentID;
    UPDATE Payment SET Status = 'Successful' WHERE PaymentID = v_PaymentID;
    UPDATE Teacher SET TotalIncome = TotalIncome + p_Amount WHERE TeacherID = v_TeacherID;

    CALL sp_CalculateStudentGPA(p_StudentID);

    COMMIT;

    SELECT v_EnrollmentID AS EnrollmentID, v_PaymentID AS PaymentID,
           v_GeneratedTransactionID AS TransactionID, v_StudentName AS StudentName,
           v_CourseTitle AS CourseTitle, 'Enrollment completed successfully.' AS Message;
END //

CREATE PROCEDURE sp_SubmitAssignment(
    IN p_AssignmentID INT,
    IN p_StudentID INT,
    IN p_FileURL VARCHAR(500)
)
BEGIN
    DECLARE v_CourseID INT;
    DECLARE v_DueDate DATETIME(0);
    DECLARE v_StudentStatus VARCHAR(20);
    DECLARE v_ExistingSubmissionID INT;
    DECLARE v_ExistingScore DECIMAL(4,2);

    SELECT a.CourseID, a.DueDate INTO v_CourseID, v_DueDate
    FROM Assignment a
    WHERE a.AssignmentID = p_AssignmentID;

    IF v_CourseID IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Assignment not found.';
    END IF;

    SELECT s.Status INTO v_StudentStatus
    FROM Student s
    WHERE s.StudentID = p_StudentID;

    IF v_StudentStatus IS NULL OR v_StudentStatus <> 'Active' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student not found or inactive.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM Enrollment e
        WHERE e.StudentID = p_StudentID
          AND e.CourseID = v_CourseID
          AND e.Status = 'Successful'
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student is not enrolled in the course.';
    END IF;

    IF NOW() > v_DueDate THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Assignment deadline has passed.';
    END IF;

    SELECT SubmissionID, Score INTO v_ExistingSubmissionID, v_ExistingScore
    FROM Submission
    WHERE AssignmentID = p_AssignmentID AND StudentID = p_StudentID;

    IF v_ExistingSubmissionID IS NOT NULL THEN
        IF v_ExistingScore IS NOT NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot resubmit: assignment already graded.';
        END IF;

        UPDATE Submission
        SET FileURL = p_FileURL,
            SubmissionDate = NOW()
        WHERE SubmissionID = v_ExistingSubmissionID;

        SELECT v_ExistingSubmissionID AS SubmissionID, 'Submission updated successfully.' AS Message;
    ELSE
        INSERT INTO Submission (AssignmentID, StudentID, SubmissionDate, FileURL, Score, Feedback)
        VALUES (p_AssignmentID, p_StudentID, NOW(), p_FileURL, NULL, NULL);

        SELECT LAST_INSERT_ID() AS SubmissionID, 'Submission stored. Waiting for grading.' AS Message;
    END IF;
END //

CREATE PROCEDURE sp_GradeSubmission(
    IN p_SubmissionID INT,
    IN p_Score DECIMAL(4,2),
    IN p_Feedback TEXT
)
BEGIN
    DECLARE v_AssignmentID INT;
    DECLARE v_StudentID INT;
    DECLARE v_CourseID INT;
    DECLARE v_MaxScore DECIMAL(4,2);
    DECLARE v_AverageFinal DECIMAL(4,2);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SELECT a.AssignmentID, a.CourseID, a.MaxScore
    INTO v_AssignmentID, v_CourseID, v_MaxScore
    FROM Submission s
    INNER JOIN Assignment a ON s.AssignmentID = a.AssignmentID
    WHERE s.SubmissionID = p_SubmissionID;

    IF v_AssignmentID IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Submission not found.';
    END IF;

    IF p_Score < 0 OR p_Score > v_MaxScore THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Score is outside the allowed range.';
    END IF;

    SELECT StudentID INTO v_StudentID
    FROM Submission
    WHERE SubmissionID = p_SubmissionID;

    UPDATE Submission
    SET Score = p_Score, Feedback = p_Feedback
    WHERE SubmissionID = p_SubmissionID;

    SELECT AVG(s.Score) INTO v_AverageFinal
    FROM Submission s
    INNER JOIN Assignment a ON s.AssignmentID = a.AssignmentID
    WHERE s.StudentID = v_StudentID
      AND a.CourseID = v_CourseID
      AND s.Score IS NOT NULL;

    UPDATE Enrollment
    SET FinalScore = v_AverageFinal
    WHERE StudentID = v_StudentID AND CourseID = v_CourseID;

    CALL sp_CalculateStudentGPA(v_StudentID);

    COMMIT;

    SELECT p_SubmissionID AS SubmissionID, v_StudentID AS StudentID,
           v_CourseID AS CourseID, v_AverageFinal AS CourseFinalScore,
           'Submission graded successfully.' AS Message;
END //

CREATE PROCEDURE sp_RecordAttendance(
    IN p_StudentID INT,
    IN p_CourseID INT,
    IN p_SessionDate DATE,
    IN p_Status VARCHAR(20)
)
BEGIN
    DECLARE v_StartDate DATETIME(0);
    DECLARE v_EndDate DATETIME(0);

    SELECT StartDate, EndDate INTO v_StartDate, v_EndDate
    FROM Course
    WHERE CourseID = p_CourseID;

    IF v_StartDate IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Course not found.';
    END IF;

    IF p_Status NOT IN ('Present', 'Absent') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid attendance status.';
    END IF;

    IF p_SessionDate < DATE(v_StartDate) OR p_SessionDate > DATE(v_EndDate) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Session date is outside the course date range.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM Enrollment
        WHERE StudentID = p_StudentID AND CourseID = p_CourseID AND Status = 'Successful'
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student is not enrolled in the course.';
    END IF;

    INSERT INTO Attendance (StudentID, CourseID, SessionDate, Status)
    VALUES (p_StudentID, p_CourseID, p_SessionDate, p_Status);

    SELECT LAST_INSERT_ID() AS AttendanceID, 'Attendance recorded.' AS Message;
END //

-- Certificates only issued once a course has actually ended (Completed).
CREATE PROCEDURE sp_IssueCertificatesForCourse(IN p_CourseID INT)
BEGIN
    DECLARE v_IssuedCount INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    INSERT INTO Certificate (StudentID, CourseID, IssueDate, CertificateCode)
    SELECT
        e.StudentID,
        e.CourseID,
        NOW(),
        CONCAT('CERT-', e.CourseID, '-', e.StudentID, '-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 1000000), 6, '0'))
    FROM Enrollment e
    INNER JOIN Course c ON e.CourseID = c.CourseID
    WHERE e.Status = 'Successful'
      AND e.FinalScore IS NOT NULL
      AND e.FinalScore >= 10
      AND c.Status = 'Completed'
      AND c.EndDate <= NOW()
      AND (p_CourseID IS NULL OR e.CourseID = p_CourseID)
      AND NOT EXISTS (
          SELECT 1 FROM Certificate cert
          WHERE cert.StudentID = e.StudentID AND cert.CourseID = e.CourseID
      );

    SET v_IssuedCount = ROW_COUNT();
    COMMIT;

    SELECT v_IssuedCount AS CertificatesIssued, 'Certificate issuance completed.' AS Message;
END //

CREATE PROCEDURE sp_CancelEnrollment(IN p_EnrollmentID INT)
BEGIN
    DECLARE v_StudentID INT;
    DECLARE v_CourseID INT;
    DECLARE v_Amount DECIMAL(12,2);
    DECLARE v_TeacherID INT;
    DECLARE v_LatestPaymentID INT;
    DECLARE v_RefundTransactionID VARCHAR(100);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SELECT StudentID, CourseID INTO v_StudentID, v_CourseID
    FROM Enrollment
    WHERE EnrollmentID = p_EnrollmentID;

    IF v_StudentID IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Enrollment not found.';
    END IF;

    SELECT PaymentID, Amount INTO v_LatestPaymentID, v_Amount
    FROM Payment
    WHERE StudentID = v_StudentID
      AND CourseID = v_CourseID
      AND Status = 'Successful'
    ORDER BY PaymentDate DESC, PaymentID DESC
    LIMIT 1;

    IF v_LatestPaymentID IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No successful payment found for this enrollment.';
    END IF;

    SELECT TeacherID INTO v_TeacherID
    FROM Course
    WHERE CourseID = v_CourseID;

    SET v_RefundTransactionID = CONCAT('RFN-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 1000000), 6, '0'));

    UPDATE Enrollment SET Status = 'Dropped' WHERE EnrollmentID = p_EnrollmentID;

    INSERT INTO Payment (StudentID, CourseID, Amount, PaymentDate, Status, TransactionID)
    VALUES (v_StudentID, v_CourseID, v_Amount, NOW(), 'Refunded', v_RefundTransactionID);

    UPDATE Teacher
    SET TotalIncome = IF(TotalIncome >= v_Amount, TotalIncome - v_Amount, 0)
    WHERE TeacherID = v_TeacherID;

    COMMIT;

    SELECT p_EnrollmentID AS EnrollmentID, v_RefundTransactionID AS RefundTransactionID,
           'Enrollment canceled successfully.' AS Message;
END //

-- Course status lifecycle: Draft -> Upcoming -> Active -> Completed
-- Draft is never auto-transitioned (teacher must explicitly publish it to
-- Upcoming once content/assignments are ready). Cancelled is also never
-- auto-set by this procedure.
CREATE PROCEDURE sp_UpdateCourseStatus()
BEGIN
    UPDATE Course
    SET Status = 'Completed'
    WHERE EndDate <= NOW() AND Status IN ('Upcoming', 'Active');

    UPDATE Course
    SET Status = 'Active'
    WHERE StartDate <= NOW() AND EndDate > NOW() AND Status = 'Upcoming';

    SELECT 'Course statuses refreshed.' AS Message;
END //

-- Assignments may only be created/edited/deleted while the course is not
-- finished (Completed/Cancelled), to avoid corrupting historical records.
CREATE PROCEDURE sp_CreateAssignment(
    IN p_CourseID INT,
    IN p_Title VARCHAR(150),
    IN p_Description TEXT,
    IN p_DueDate DATETIME(0),
    IN p_MaxScore DECIMAL(4,2)
)
BEGIN
    DECLARE v_CourseStatus VARCHAR(20);

    SELECT Status INTO v_CourseStatus FROM Course WHERE CourseID = p_CourseID AND IsDeleted = 0;

    IF v_CourseStatus IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Course not found.';
    END IF;

    IF v_CourseStatus IN ('Completed', 'Cancelled') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot add assignments to a finished course.';
    END IF;

    IF p_MaxScore <= 0 OR p_MaxScore > 20 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'MaxScore must be between 0.01 and 20.';
    END IF;

    INSERT INTO Assignment (CourseID, Title, Description, DueDate, MaxScore)
    VALUES (p_CourseID, p_Title, p_Description, p_DueDate, p_MaxScore);

    SELECT LAST_INSERT_ID() AS AssignmentID, 'Assignment created successfully.' AS Message;
END //

CREATE PROCEDURE sp_UpdateAssignment(
    IN p_AssignmentID INT,
    IN p_Title VARCHAR(150),
    IN p_Description TEXT,
    IN p_DueDate DATETIME(0),
    IN p_MaxScore DECIMAL(4,2)
)
BEGIN
    DECLARE v_CourseStatus VARCHAR(20);
    DECLARE v_CourseID INT;

    SELECT a.CourseID, c.Status INTO v_CourseID, v_CourseStatus
    FROM Assignment a INNER JOIN Course c ON a.CourseID = c.CourseID
    WHERE a.AssignmentID = p_AssignmentID;

    IF v_CourseID IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Assignment not found.';
    END IF;

    IF v_CourseStatus IN ('Completed', 'Cancelled') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot edit assignments of a finished course.';
    END IF;

    IF p_MaxScore IS NOT NULL AND (p_MaxScore <= 0 OR p_MaxScore > 20) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'MaxScore must be between 0.01 and 20.';
    END IF;

    UPDATE Assignment
    SET
        Title = COALESCE(p_Title, Title),
        Description = COALESCE(p_Description, Description),
        DueDate = COALESCE(p_DueDate, DueDate),
        MaxScore = COALESCE(p_MaxScore, MaxScore)
    WHERE AssignmentID = p_AssignmentID;

    SELECT p_AssignmentID AS AssignmentID, 'Assignment updated successfully.' AS Message;
END //

-- Deleting an assignment cascades to its submissions (FK ON DELETE CASCADE).
-- Any enrollment FinalScore values that were derived from those submissions
-- are recalculated afterwards so no stale/orphan grade data remains.
CREATE PROCEDURE sp_DeleteAssignment(IN p_AssignmentID INT)
BEGIN
    DECLARE v_CourseID INT;
    DECLARE v_CourseStatus VARCHAR(20);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    SELECT a.CourseID, c.Status INTO v_CourseID, v_CourseStatus
    FROM Assignment a INNER JOIN Course c ON a.CourseID = c.CourseID
    WHERE a.AssignmentID = p_AssignmentID;

    IF v_CourseID IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Assignment not found.';
    END IF;

    IF v_CourseStatus IN ('Completed', 'Cancelled') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot delete assignments of a finished course.';
    END IF;

    START TRANSACTION;

    -- حذف تکلیف (submission‌ها به صورت آبشاری حذف می‌شوند)
    DELETE FROM Assignment WHERE AssignmentID = p_AssignmentID;

    -- بازمحاسبه FinalScore برای همه دانشجویان این درس
    UPDATE Enrollment e
    SET e.FinalScore = (
        SELECT AVG(s.Score)
        FROM Submission s
        INNER JOIN Assignment a ON s.AssignmentID = a.AssignmentID
        WHERE s.StudentID = e.StudentID
          AND a.CourseID = v_CourseID
          AND s.Score IS NOT NULL
    )
    WHERE e.CourseID = v_CourseID;

    -- به‌روزرسانی GPA تمام دانشجویان این درس (حالا داخل تراکنش)
    BEGIN
        DECLARE done INT DEFAULT 0;
        DECLARE v_StudentID INT;
        DECLARE cur CURSOR FOR
            SELECT StudentID FROM Enrollment WHERE CourseID = v_CourseID;
        DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

        OPEN cur;
        read_loop: LOOP
            FETCH cur INTO v_StudentID;
            IF done = 1 THEN
                LEAVE read_loop;
            END IF;
            CALL sp_UpdateStudentGPA(v_StudentID);
        END LOOP;
        CLOSE cur;
    END;

    COMMIT;

    SELECT p_AssignmentID AS AssignmentID, 'Assignment deleted successfully.' AS Message;
END;

CREATE PROCEDURE sp_GetSubmissionsForGrading(
    IN p_TeacherID INT,
    IN p_CourseID INT,
    IN p_AssignmentID INT
)
BEGIN
    SELECT
        s.SubmissionID,
        s.AssignmentID,
        a.Title AS AssignmentTitle,
        a.CourseID,
        c.Title AS CourseTitle,
        s.StudentID,
        u.FullName AS StudentName,
        u.Email AS StudentEmail,
        s.SubmissionDate,
        s.FileURL,
        s.Score,
        s.Feedback,
        a.MaxScore,
        a.DueDate
    FROM Submission s
    INNER JOIN Assignment a ON s.AssignmentID = a.AssignmentID
    INNER JOIN Course c ON a.CourseID = c.CourseID
    INNER JOIN `User` u ON s.StudentID = u.UserID
    WHERE c.TeacherID = p_TeacherID
      AND (p_CourseID IS NULL OR a.CourseID = p_CourseID)
      AND (p_AssignmentID IS NULL OR s.AssignmentID = p_AssignmentID)
    ORDER BY a.CourseID, a.DueDate, s.SubmissionDate;
END //

CREATE PROCEDURE sp_UpdateStudentGPA(IN p_StudentID INT)
BEGIN
    DECLARE v_NewGPA DECIMAL(4,2);
    IF NOT EXISTS (SELECT 1 FROM Student WHERE StudentID = p_StudentID) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student not found.';
    END IF;
    SET v_NewGPA = fn_CalculateStudentGPA(p_StudentID);
    UPDATE Student SET GPA = v_NewGPA WHERE StudentID = p_StudentID;
END //

-- =============================================================================
-- ANNOUNCEMENT PROCEDURES (NEW)
-- =============================================================================

-- Announcements can be posted for any non-deleted course owned by the
-- teacher (Draft included, so the teacher can prep announcements before
-- publishing the course), but not for finished courses.
CREATE PROCEDURE sp_CreateAnnouncement(
    IN p_CourseID INT,
    IN p_TeacherID INT,
    IN p_Title VARCHAR(150),
    IN p_Content TEXT
)
BEGIN
    DECLARE v_TeacherID INT;
    DECLARE v_CourseStatus VARCHAR(20);

    SELECT TeacherID, Status INTO v_TeacherID, v_CourseStatus
    FROM Course WHERE CourseID = p_CourseID AND IsDeleted = 0;

    IF v_TeacherID IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Course not found.';
    END IF;

    IF v_TeacherID <> p_TeacherID THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'You can only post announcements for your own courses.';
    END IF;

    IF v_CourseStatus IN ('Completed', 'Cancelled') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot post announcements for a finished course.';
    END IF;

    INSERT INTO Announcement (CourseID, Title, Content)
    VALUES (p_CourseID, p_Title, p_Content);

    SELECT LAST_INSERT_ID() AS AnnouncementID, 'Announcement created successfully.' AS Message;
END //

CREATE PROCEDURE sp_UpdateAnnouncement(
    IN p_AnnouncementID INT,
    IN p_TeacherID INT,
    IN p_Title VARCHAR(150),
    IN p_Content TEXT
)
BEGIN
    DECLARE v_TeacherID INT;
    DECLARE v_CourseStatus VARCHAR(20);

    SELECT c.TeacherID, c.Status INTO v_TeacherID, v_CourseStatus
    FROM Announcement an INNER JOIN Course c ON an.CourseID = c.CourseID
    WHERE an.AnnouncementID = p_AnnouncementID;

    IF v_TeacherID IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Announcement not found.';
    END IF;

    IF v_TeacherID <> p_TeacherID THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'You can only edit announcements for your own courses.';
    END IF;

    IF v_CourseStatus IN ('Completed', 'Cancelled') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot edit announcements of a finished course.';
    END IF;

    UPDATE Announcement
    SET
        Title = COALESCE(p_Title, Title),
        Content = COALESCE(p_Content, Content)
    WHERE AnnouncementID = p_AnnouncementID;

    SELECT p_AnnouncementID AS AnnouncementID, 'Announcement updated successfully.' AS Message;
END //

CREATE PROCEDURE sp_DeleteAnnouncement(
    IN p_AnnouncementID INT,
    IN p_TeacherID INT
)
BEGIN
    DECLARE v_TeacherID INT;

    SELECT c.TeacherID INTO v_TeacherID
    FROM Announcement an INNER JOIN Course c ON an.CourseID = c.CourseID
    WHERE an.AnnouncementID = p_AnnouncementID;

    IF v_TeacherID IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Announcement not found.';
    END IF;

    IF v_TeacherID <> p_TeacherID THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'You can only delete announcements for your own courses.';
    END IF;

    DELETE FROM Announcement WHERE AnnouncementID = p_AnnouncementID;

    SELECT p_AnnouncementID AS AnnouncementID, 'Announcement deleted successfully.' AS Message;
END //

-- Returns announcements for a course. Caller (API layer) is responsible for
-- checking that the requesting user is the course's teacher or an enrolled
-- (Successful) student before calling this.
CREATE PROCEDURE sp_GetAnnouncementsByCourse(IN p_CourseID INT)
BEGIN
    SELECT
        AnnouncementID,
        CourseID,
        Title,
        Content,
        CreatedAt,
        UpdatedAt
    FROM Announcement
    WHERE CourseID = p_CourseID
    ORDER BY CreatedAt DESC;
END //

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER trg_ValidateSubmissionScore
BEFORE INSERT ON Submission
FOR EACH ROW
BEGIN
    DECLARE v_MaxScore DECIMAL(4,2);
    SELECT MaxScore INTO v_MaxScore FROM Assignment WHERE AssignmentID = NEW.AssignmentID;
    IF NEW.Score IS NOT NULL AND (NEW.Score < 0 OR NEW.Score > v_MaxScore) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Submission score is outside the allowed range.';
    END IF;
END //

CREATE TRIGGER trg_CheckCourseCapacity
BEFORE INSERT ON Enrollment
FOR EACH ROW
BEGIN
    DECLARE v_Capacity INT;
    DECLARE v_SuccessfulCount INT;
    IF NEW.Status = 'Successful' THEN
        SELECT Capacity INTO v_Capacity FROM Course WHERE CourseID = NEW.CourseID;
        SELECT COUNT(*) INTO v_SuccessfulCount
        FROM Enrollment
        WHERE CourseID = NEW.CourseID AND Status = 'Successful';
        IF v_SuccessfulCount >= v_Capacity THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Course capacity exceeded.';
        END IF;
    END IF;
END //

CREATE TRIGGER trg_Enrollment_Insert_UpdateGPA
AFTER INSERT ON Enrollment
FOR EACH ROW
BEGIN
    CALL sp_UpdateStudentGPA(NEW.StudentID);
END //

CREATE TRIGGER trg_Enrollment_Update_UpdateGPA
AFTER UPDATE ON Enrollment
FOR EACH ROW
BEGIN
    CALL sp_UpdateStudentGPA(NEW.StudentID);
END //

CREATE TRIGGER trg_Enrollment_Delete_UpdateGPA
AFTER DELETE ON Enrollment
FOR EACH ROW
BEGIN
    CALL sp_UpdateStudentGPA(OLD.StudentID);
END //

CREATE TRIGGER trg_ValidateAttendanceDate
BEFORE INSERT ON Attendance
FOR EACH ROW
BEGIN
    DECLARE v_StartDate DATETIME(0);
    DECLARE v_EndDate DATETIME(0);
    SELECT StartDate, EndDate INTO v_StartDate, v_EndDate
    FROM Course WHERE CourseID = NEW.CourseID;
    IF NEW.SessionDate < DATE(v_StartDate) OR NEW.SessionDate > DATE(v_EndDate) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Attendance date is outside the course date range.';
    END IF;
END //

DELIMITER ;

-- =============================================================================
-- VIEWS
-- =============================================================================

CREATE VIEW vw_StudentTranscript AS
SELECT
    u.UserID AS StudentID,
    u.FullName,
    u.Email,
    c.CourseID,
    c.Title AS CourseTitle,
    e.EnrollmentDate,
    e.Status AS EnrollmentStatus,
    e.FinalScore,
    s.GPA
FROM Enrollment e
INNER JOIN Student s ON e.StudentID = s.StudentID
INNER JOIN `User` u ON s.StudentID = u.UserID
INNER JOIN Course c ON e.CourseID = c.CourseID
WHERE u.IsDeleted = 0;

CREATE VIEW vw_TeacherDashboard AS
SELECT
    t.TeacherID,
    u.FullName AS TeacherName,
    COUNT(DISTINCT c.CourseID) AS CourseCount,
    COUNT(DISTINCT e.StudentID) AS StudentCount,
    COALESCE(SUM(CASE WHEN p.Status = 'Successful' THEN p.Amount ELSE 0 END), 0) AS TotalIncome
FROM Teacher t
INNER JOIN `User` u ON t.TeacherID = u.UserID
LEFT JOIN Course c ON t.TeacherID = c.TeacherID
LEFT JOIN Enrollment e ON c.CourseID = e.CourseID AND e.Status = 'Successful'
LEFT JOIN Payment p ON p.StudentID = e.StudentID AND p.CourseID = e.CourseID
GROUP BY t.TeacherID, u.FullName;

CREATE VIEW vw_CourseStatistics AS
SELECT
    c.CourseID,
    c.Title,
    c.Status,
    c.Capacity,
    COUNT(CASE WHEN e.Status = 'Successful' THEN 1 END) AS SuccessfulEnrollments,
    COUNT(CASE WHEN e.Status = 'Pending' THEN 1 END) AS PendingEnrollments,
    COUNT(CASE WHEN e.Status = 'Failed' THEN 1 END) AS FailedEnrollments,
    COUNT(CASE WHEN e.Status = 'Dropped' THEN 1 END) AS DroppedEnrollments,
    AVG(e.FinalScore) AS AverageScore
FROM Course c
LEFT JOIN Enrollment e ON c.CourseID = e.CourseID
GROUP BY c.CourseID, c.Title, c.Status, c.Capacity;

CREATE VIEW vw_FinancialSummary AS
SELECT
    YEAR(PaymentDate) AS ReportYear,
    MONTH(PaymentDate) AS ReportMonth,
    COUNT(*) AS TransactionCount,
    SUM(CASE WHEN Status = 'Successful' THEN Amount ELSE 0 END) AS SuccessfulAmount,
    SUM(CASE WHEN Status = 'Refunded' THEN Amount ELSE 0 END) AS RefundedAmount
FROM Payment
GROUP BY YEAR(PaymentDate), MONTH(PaymentDate);

CREATE VIEW vw_StudentCertificates AS
SELECT
    cert.CertificateID,
    cert.CertificateCode,
    cert.IssueDate,
    cert.StudentID,
    u.FullName AS StudentName,
    cert.CourseID,
    c.Title AS CourseTitle
FROM Certificate cert
INNER JOIN `User` u ON cert.StudentID = u.UserID
INNER JOIN Course c ON cert.CourseID = c.CourseID;

-- =============================================================================
-- REPORTS (STORED PROCEDURES)
-- =============================================================================

DELIMITER //

CREATE PROCEDURE sp_ReportTopStudents(IN p_TopN INT)
BEGIN
    SELECT
        u.UserID AS StudentID,
        u.FullName,
        u.Email,
        s.GPA,
        s.Status
    FROM Student s
    INNER JOIN `User` u ON s.StudentID = u.UserID
    WHERE u.Role = 'Student' AND u.IsDeleted = 0
    ORDER BY s.GPA DESC, u.FullName ASC
    LIMIT p_TopN;
END //

CREATE PROCEDURE sp_ReportTeacherIncome(IN p_StartDate DATE, IN p_EndDate DATE)
BEGIN
    SELECT
        t.TeacherID,
        u.FullName AS TeacherName,
        c.CourseID,
        c.Title AS CourseTitle,
        COALESCE(SUM(CASE WHEN p.Status = 'Successful' AND p.PaymentDate >= p_StartDate AND p.PaymentDate < DATE_ADD(p_EndDate, INTERVAL 1 DAY) THEN p.Amount ELSE 0 END), 0) AS Income
    FROM Teacher t
    INNER JOIN `User` u ON t.TeacherID = u.UserID
    LEFT JOIN Course c ON t.TeacherID = c.TeacherID
    LEFT JOIN Payment p ON c.CourseID = p.CourseID
    GROUP BY t.TeacherID, u.FullName, c.CourseID, c.Title
    ORDER BY Income DESC, TeacherName ASC;
END //

CREATE PROCEDURE sp_ReportPopularCourses()
BEGIN
    SELECT
        c.CourseID,
        c.Title,
        c.Status,
        COUNT(CASE WHEN e.Status = 'Successful' THEN 1 END) AS SuccessfulEnrollments
    FROM Course c
    LEFT JOIN Enrollment e ON c.CourseID = e.CourseID
    GROUP BY c.CourseID, c.Title, c.Status
    ORDER BY SuccessfulEnrollments DESC, c.Title ASC;
END //

CREATE PROCEDURE sp_ReportCourseEnrollments(IN p_CourseID INT)
BEGIN
    SELECT
        c.CourseID,
        c.Title,
        SUM(CASE WHEN e.Status = 'Successful' THEN 1 ELSE 0 END) AS SuccessfulCount,
        SUM(CASE WHEN e.Status = 'Pending' THEN 1 ELSE 0 END) AS PendingCount,
        SUM(CASE WHEN e.Status = 'Failed' THEN 1 ELSE 0 END) AS FailedCount,
        SUM(CASE WHEN e.Status = 'Dropped' THEN 1 ELSE 0 END) AS DroppedCount
    FROM Course c
    LEFT JOIN Enrollment e ON c.CourseID = e.CourseID
    WHERE p_CourseID IS NULL OR c.CourseID = p_CourseID
    GROUP BY c.CourseID, c.Title
    ORDER BY c.CourseID;
END //

CREATE PROCEDURE sp_ReportInactiveStudents(IN p_Days INT)
BEGIN
    SELECT
        u.UserID AS StudentID,
        u.FullName,
        u.Email,
        s.Status,
        la.LastActivityDate
    FROM Student s
    INNER JOIN `User` u ON s.StudentID = u.UserID
    LEFT JOIN (
        SELECT StudentID, MAX(ActivityDate) AS LastActivityDate FROM (
            SELECT StudentID, EnrollmentDate AS ActivityDate FROM Enrollment
            UNION ALL
            SELECT StudentID, PaymentDate FROM Payment
            UNION ALL
            SELECT StudentID, SubmissionDate FROM Submission
            UNION ALL
            SELECT StudentID, CAST(SessionDate AS DATETIME) FROM Attendance
        ) AS all_activities GROUP BY StudentID
    ) la ON s.StudentID = la.StudentID
    WHERE s.Status = 'Inactive'
       OR la.LastActivityDate < DATE_SUB(NOW(), INTERVAL p_Days DAY)
    ORDER BY la.LastActivityDate ASC;
END //

CREATE PROCEDURE sp_ReportFailedPayments(IN p_StartDate DATE, IN p_EndDate DATE)
BEGIN
    SELECT
        p.PaymentID,
        u.FullName AS StudentName,
        c.Title AS CourseTitle,
        p.Amount,
        p.PaymentDate,
        p.TransactionID,
        p.Status
    FROM Payment p
    INNER JOIN `User` u ON p.StudentID = u.UserID
    INNER JOIN Course c ON p.CourseID = c.CourseID
    WHERE p.Status = 'Failed'
      AND p.PaymentDate >= p_StartDate
      AND p.PaymentDate < DATE_ADD(p_EndDate, INTERVAL 1 DAY)
    ORDER BY p.PaymentDate DESC;
END //

CREATE PROCEDURE sp_ReportCourseGrades(IN p_CourseID INT)
BEGIN
    SELECT
        c.CourseID,
        c.Title,
        AVG(e.FinalScore) AS AverageScore,
        (SELECT AVG(FinalScore) FROM (
            SELECT FinalScore, ROW_NUMBER() OVER (ORDER BY FinalScore) AS row_num,
                   COUNT(*) OVER () AS total
            FROM Enrollment e2 WHERE e2.CourseID = c.CourseID AND e2.FinalScore IS NOT NULL
        ) AS med WHERE row_num IN (FLOOR((total+1)/2), CEIL((total+1)/2))) AS MedianScore,
        SUM(CASE WHEN e.FinalScore >= 10 THEN 1 ELSE 0 END) AS PassedCount,
        SUM(CASE WHEN e.FinalScore < 10 THEN 1 ELSE 0 END) AS FailedCount
    FROM Course c
    INNER JOIN Enrollment e ON c.CourseID = e.CourseID
    WHERE e.FinalScore IS NOT NULL
      AND (p_CourseID IS NULL OR c.CourseID = p_CourseID)
    GROUP BY c.CourseID, c.Title
    ORDER BY c.CourseID;
END //

CREATE PROCEDURE sp_ReportAttendance(IN p_StudentID INT, IN p_CourseID INT)
BEGIN
    SELECT
        u.FullName AS StudentName,
        c.Title AS CourseTitle,
        a.SessionDate,
        a.Status,
        ROUND(100.0 * SUM(CASE WHEN a.Status = 'Present' THEN 1 ELSE 0 END) OVER () / NULLIF(COUNT(*) OVER (), 0), 2) AS AttendancePercent
    FROM Attendance a
    INNER JOIN `User` u ON a.StudentID = u.UserID
    INNER JOIN Course c ON a.CourseID = c.CourseID
    WHERE a.StudentID = p_StudentID
      AND a.CourseID = p_CourseID
    ORDER BY a.SessionDate;
END //

CREATE PROCEDURE sp_ReportMonthlyIncome(IN p_Year INT)
BEGIN
    IF p_Year IS NULL THEN SET p_Year = YEAR(CURDATE()); END IF;
    SELECT
        MONTH(PaymentDate) AS ReportMonth,
        COUNT(*) AS TransactionCount,
        SUM(CASE WHEN Status = 'Successful' THEN Amount ELSE 0 END) AS SuccessfulAmount,
        SUM(CASE WHEN Status = 'Refunded' THEN Amount ELSE 0 END) AS RefundedAmount
    FROM Payment
    WHERE YEAR(PaymentDate) = p_Year
    GROUP BY MONTH(PaymentDate)
    ORDER BY ReportMonth;
END //

CREATE PROCEDURE sp_ReportTeacherRanking(IN p_Basis VARCHAR(20))
BEGIN
    IF p_Basis = 'Income' THEN
        SELECT
            t.TeacherID,
            u.FullName AS TeacherName,
            COALESCE(SUM(CASE WHEN p.Status = 'Successful' THEN p.Amount ELSE 0 END), 0) AS Score
        FROM Teacher t
        INNER JOIN `User` u ON t.TeacherID = u.UserID
        LEFT JOIN Course c ON t.TeacherID = c.TeacherID
        LEFT JOIN Payment p ON c.CourseID = p.CourseID
        GROUP BY t.TeacherID, u.FullName
        ORDER BY Score DESC, TeacherName ASC;
    ELSEIF p_Basis = 'Grades' THEN
        SELECT
            t.TeacherID,
            u.FullName AS TeacherName,
            AVG(e.FinalScore) AS Score
        FROM Teacher t
        INNER JOIN `User` u ON t.TeacherID = u.UserID
        LEFT JOIN Course c ON t.TeacherID = c.TeacherID
        LEFT JOIN Enrollment e ON c.CourseID = e.CourseID AND e.FinalScore IS NOT NULL
        GROUP BY t.TeacherID, u.FullName
        ORDER BY Score DESC, TeacherName ASC;
    ELSE
        SELECT
            t.TeacherID,
            u.FullName AS TeacherName,
            COUNT(DISTINCT c.CourseID) AS Score
        FROM Teacher t
        INNER JOIN `User` u ON t.TeacherID = u.UserID
        LEFT JOIN Course c ON t.TeacherID = c.TeacherID
        GROUP BY t.TeacherID, u.FullName
        ORDER BY Score DESC, TeacherName ASC;
    END IF;
END //

CREATE PROCEDURE sp_GenerateMonthlyFinancialReport(IN p_Year INT, IN p_Month INT)
BEGIN
    DECLARE v_TotalRevenue DECIMAL(18,2);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SELECT COALESCE(SUM(Amount), 0) INTO v_TotalRevenue
    FROM Payment
    WHERE Status = 'Successful'
      AND YEAR(PaymentDate) = p_Year
      AND MONTH(PaymentDate) = p_Month;

    INSERT INTO FinancialReportLog (ReportYear, ReportMonth, TotalRevenue)
    VALUES (p_Year, p_Month, v_TotalRevenue);

    COMMIT;

    SELECT p_Year AS ReportYear, p_Month AS ReportMonth, v_TotalRevenue AS TotalRevenue;
END //

-- =============================================================================
-- ADDITIONAL PROCEDURES (REGISTRATION, PROFILE, ETC.)
-- =============================================================================

CREATE PROCEDURE sp_RegisterUser(
    IN p_FullName VARCHAR(100),
    IN p_Email VARCHAR(255),
    IN p_PasswordHash VARCHAR(255),
    IN p_PhoneNumber VARCHAR(20),
    IN p_Role VARCHAR(20),
    IN p_DateOfBirth DATE
)
BEGIN
    DECLARE v_UserID INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    IF EXISTS (SELECT 1 FROM `User` WHERE Email = p_Email AND IsDeleted = 0) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Email already exists.';
    END IF;

    INSERT INTO `User` (FullName, Email, PasswordHash, Role, PhoneNumber, RegistrationDate, IsDeleted)
    VALUES (p_FullName, p_Email, p_PasswordHash, p_Role, p_PhoneNumber, NOW(), 0);
    SET v_UserID = LAST_INSERT_ID();

    IF p_Role = 'Student' THEN
        INSERT INTO Student (StudentID, DateOfBirth, GPA, Status)
        VALUES (v_UserID, p_DateOfBirth, 0, 'Active');
    ELSEIF p_Role = 'Teacher' THEN
        INSERT INTO Teacher (TeacherID, Expertise, HireDate, TotalIncome)
        VALUES (v_UserID, '', CURDATE(), 0);
    END IF;

    COMMIT;

    SELECT v_UserID AS UserID, p_Role AS Role;
END //

CREATE PROCEDURE sp_UpdateUserProfile(
    IN p_UserID INT,
    IN p_FullName VARCHAR(100),
    IN p_PhoneNumber VARCHAR(20),
    IN p_PasswordHash VARCHAR(255)
)
BEGIN
    UPDATE `User`
    SET
        FullName = COALESCE(p_FullName, FullName),
        PhoneNumber = COALESCE(p_PhoneNumber, PhoneNumber),
        PasswordHash = COALESCE(p_PasswordHash, PasswordHash)
    WHERE UserID = p_UserID AND IsDeleted = 0;

    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found or deleted.';
    END IF;

    SELECT 'Profile updated' AS Message;
END //

CREATE PROCEDURE sp_GetStudentPayments(IN p_StudentID INT)
BEGIN
    SELECT
        p.PaymentID,
        p.CourseID,
        c.Title AS CourseTitle,
        p.Amount,
        p.PaymentDate,
        p.Status,
        p.TransactionID
    FROM Payment p
    INNER JOIN Course c ON p.CourseID = c.CourseID
    WHERE p.StudentID = p_StudentID
    ORDER BY p.PaymentDate DESC;
END //

CREATE PROCEDURE sp_GetStudentGrades(IN p_StudentID INT)
BEGIN
    SELECT
        c.CourseID,
        c.Title AS CourseTitle,
        e.FinalScore,
        e.Status AS EnrollmentStatus
    FROM Enrollment e
    INNER JOIN Course c ON e.CourseID = c.CourseID
    WHERE e.StudentID = p_StudentID
      AND e.FinalScore IS NOT NULL
    ORDER BY c.Title;

    SELECT
        a.AssignmentID,
        a.Title AS AssignmentTitle,
        a.CourseID,
        c.Title AS CourseTitle,
        s.Score,
        s.Feedback,
        s.SubmissionDate
    FROM Submission s
    INNER JOIN Assignment a ON s.AssignmentID = a.AssignmentID
    INNER JOIN Course c ON a.CourseID = c.CourseID
    WHERE s.StudentID = p_StudentID
      AND s.Score IS NOT NULL
    ORDER BY a.DueDate DESC;
END //

CREATE PROCEDURE sp_GetUsers(IN p_Role VARCHAR(20), IN p_IncludeDeleted TINYINT)
BEGIN
    SELECT
        u.UserID,
        u.FullName,
        u.Email,
        u.Role,
        u.PhoneNumber,
        u.RegistrationDate,
        u.IsDeleted,
        s.Status AS StudentStatus,
        s.GPA,
        t.Expertise,
        t.TotalIncome
    FROM `User` u
    LEFT JOIN Student s ON u.UserID = s.StudentID AND u.Role = 'Student'
    LEFT JOIN Teacher t ON u.UserID = t.TeacherID AND u.Role = 'Teacher'
    WHERE (p_Role IS NULL OR u.Role = p_Role)
      AND (p_IncludeDeleted = 1 OR u.IsDeleted = 0)
    ORDER BY u.RegistrationDate DESC;
END //

CREATE PROCEDURE sp_UpdateUserStatus(
    IN p_UserID INT,
    IN p_IsDeleted TINYINT,
    IN p_StudentStatus VARCHAR(20)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    IF p_IsDeleted IS NOT NULL THEN
        UPDATE `User` SET IsDeleted = p_IsDeleted WHERE UserID = p_UserID;
    END IF;

    IF p_StudentStatus IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM Student WHERE StudentID = p_UserID) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User is not a student.';
        END IF;
        UPDATE Student SET Status = p_StudentStatus WHERE StudentID = p_UserID;
    END IF;

    COMMIT;
    SELECT 'User status updated' AS Message;
END //

-- sp_GetCourses now defaults to excluding Draft courses for the public
-- listing (p_IncludeDraftFor lets a teacher see their own drafts).
CREATE PROCEDURE sp_GetCourses(
    IN p_Status VARCHAR(20),
    IN p_TeacherID INT,
    IN p_MinPrice DECIMAL(12,2),
    IN p_MaxPrice DECIMAL(12,2),
    IN p_SearchTitle VARCHAR(150),
    IN p_RequestingTeacherID INT
)
BEGIN
    SELECT
        c.CourseID,
        c.Title,
        c.Description,
        c.Price,
        c.StartDate,
        c.EndDate,
        c.Capacity,
        c.Status,
        c.TeacherID,
        u.FullName AS TeacherName,
        (SELECT COUNT(*) FROM Enrollment e WHERE e.CourseID = c.CourseID AND e.Status = 'Successful') AS EnrolledCount
    FROM Course c
    INNER JOIN `User` u ON c.TeacherID = u.UserID
    WHERE c.IsDeleted = 0
      AND (p_Status IS NULL OR c.Status = p_Status)
      AND (p_TeacherID IS NULL OR c.TeacherID = p_TeacherID)
      AND (p_MinPrice IS NULL OR c.Price >= p_MinPrice)
      AND (p_MaxPrice IS NULL OR c.Price <= p_MaxPrice)
      AND (p_SearchTitle IS NULL OR c.Title LIKE CONCAT('%', p_SearchTitle, '%'))
      AND (
          c.Status <> 'Draft'
          OR (p_RequestingTeacherID IS NOT NULL AND c.TeacherID = p_RequestingTeacherID)
      )
    ORDER BY c.StartDate;
END //

CREATE PROCEDURE sp_GetCourseDetails(
    IN p_CourseID INT,
    IN p_IncludeAssignments TINYINT,
    IN p_IncludeStudents TINYINT
)
BEGIN
    SELECT
        c.CourseID,
        c.Title,
        c.Description,
        c.Price,
        c.StartDate,
        c.EndDate,
        c.Capacity,
        c.Status,
        c.TeacherID,
        u.FullName AS TeacherName
    FROM Course c
    INNER JOIN `User` u ON c.TeacherID = u.UserID
    WHERE c.CourseID = p_CourseID AND c.IsDeleted = 0;

    IF p_IncludeAssignments = 1 THEN
        SELECT
            a.AssignmentID,
            a.Title,
            a.Description,
            a.DueDate,
            a.MaxScore,
            (SELECT COUNT(*) FROM Submission s WHERE s.AssignmentID = a.AssignmentID) AS SubmissionCount
        FROM Assignment a
        WHERE a.CourseID = p_CourseID
        ORDER BY a.DueDate;
    END IF;

    IF p_IncludeStudents = 1 THEN
        SELECT
            s.StudentID,
            u.FullName,
            u.Email,
            e.EnrollmentDate,
            e.Status AS EnrollmentStatus,
            e.FinalScore,
            e.ProgressPercent
        FROM Enrollment e
        INNER JOIN Student s ON e.StudentID = s.StudentID
        INNER JOIN `User` u ON s.StudentID = u.UserID
        WHERE e.CourseID = p_CourseID
        ORDER BY e.EnrollmentDate;
    END IF;
END //

-- New courses are created in 'Draft' status by default so the teacher can
-- prepare assignments/announcements before publishing (-> Upcoming) and
-- opening enrollment.
CREATE PROCEDURE sp_CreateCourse(
    IN p_TeacherID INT,
    IN p_Title VARCHAR(150),
    IN p_Description TEXT,
    IN p_Price DECIMAL(12,2),
    IN p_StartDate DATETIME(0),
    IN p_EndDate DATETIME(0),
    IN p_Capacity INT
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Teacher WHERE TeacherID = p_TeacherID) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Teacher not found.';
    END IF;

    INSERT INTO Course (TeacherID, Title, Description, Price, StartDate, EndDate, Capacity, Status, IsDeleted)
    VALUES (p_TeacherID, p_Title, p_Description, p_Price, p_StartDate, p_EndDate, p_Capacity, 'Draft', 0);

    SELECT LAST_INSERT_ID() AS CourseID, 'Course created' AS Message;
END //

-- Status transitions are restricted to a sane forward lifecycle:
-- Draft -> Upcoming (publish, opens enrollment)
-- Upcoming -> Active/Completed/Cancelled
-- Active -> Completed/Cancelled
-- Completed/Cancelled are terminal (no further status changes).
-- Manual transition INTO 'Active' from 'Draft' is blocked (must go through
-- Upcoming so students have a chance to enroll first).
CREATE PROCEDURE sp_UpdateCourse(
    IN p_CourseID INT,
    IN p_Title VARCHAR(150),
    IN p_Description TEXT,
    IN p_Price DECIMAL(12,2),
    IN p_StartDate DATETIME(0),
    IN p_EndDate DATETIME(0),
    IN p_Capacity INT,
    IN p_Status VARCHAR(20)
)
BEGIN
    DECLARE v_CurrentStatus VARCHAR(20);

    SELECT Status INTO v_CurrentStatus FROM Course WHERE CourseID = p_CourseID AND IsDeleted = 0;

    IF v_CurrentStatus IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Course not found or deleted.';
    END IF;

    IF p_Status IS NOT NULL AND p_Status <> v_CurrentStatus THEN
        IF v_CurrentStatus IN ('Completed', 'Cancelled') THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot change status of a finished course.';
        END IF;

        IF v_CurrentStatus = 'Draft' AND p_Status NOT IN ('Upcoming', 'Cancelled') THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A Draft course can only move to Upcoming or Cancelled.';
        END IF;

        IF v_CurrentStatus = 'Upcoming' AND p_Status NOT IN ('Active', 'Completed', 'Cancelled', 'Draft') THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid status transition from Upcoming.';
        END IF;

        IF v_CurrentStatus = 'Active' AND p_Status NOT IN ('Completed', 'Cancelled') THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'An Active course can only move to Completed or Cancelled.';
        END IF;
    END IF;

    UPDATE Course
    SET
        Title = COALESCE(p_Title, Title),
        Description = COALESCE(p_Description, Description),
        Price = COALESCE(p_Price, Price),
        StartDate = COALESCE(p_StartDate, StartDate),
        EndDate = COALESCE(p_EndDate, EndDate),
        Capacity = COALESCE(p_Capacity, Capacity),
        Status = COALESCE(p_Status, Status)
    WHERE CourseID = p_CourseID AND IsDeleted = 0;

    SELECT 'Course updated' AS Message;
END //

CREATE PROCEDURE sp_DeleteCourse(IN p_CourseID INT)
BEGIN
    UPDATE Course SET IsDeleted = 1 WHERE CourseID = p_CourseID;
    SELECT 'Course deleted (soft)' AS Message;
END //

CREATE PROCEDURE sp_GetAssignmentsByCourse(IN p_CourseID INT, IN p_StudentID INT)
BEGIN
    SELECT
        a.AssignmentID,
        a.Title,
        a.Description,
        a.DueDate,
        a.MaxScore,
        s.SubmissionID,
        s.SubmissionDate,
        s.FileURL AS SubmissionURL,
        s.Score,
        s.Feedback,
        CASE
            WHEN s.SubmissionID IS NOT NULL THEN 'Submitted'
            WHEN NOW() > a.DueDate THEN 'Missed'
            ELSE 'Pending'
        END AS SubmissionStatus
    FROM Assignment a
    LEFT JOIN Submission s ON a.AssignmentID = s.AssignmentID AND (p_StudentID IS NULL OR s.StudentID = p_StudentID)
    WHERE a.CourseID = p_CourseID
    ORDER BY a.DueDate;
END //

CREATE PROCEDURE sp_GetCourseStudents(IN p_CourseID INT)
BEGIN
    SELECT
        s.StudentID,
        u.FullName,
        u.Email,
        e.EnrollmentDate,
        e.Status AS EnrollmentStatus,
        e.FinalScore,
        e.ProgressPercent,
        s.GPA
    FROM Enrollment e
    INNER JOIN Student s ON e.StudentID = s.StudentID
    INNER JOIN `User` u ON s.StudentID = u.UserID
    WHERE e.CourseID = p_CourseID;
END //

DELIMITER ;

-- =============================================================================
-- SECURITY ROLES
-- =============================================================================

CREATE ROLE IF NOT EXISTS AdminRole;
CREATE ROLE IF NOT EXISTS TeacherRole;
CREATE ROLE IF NOT EXISTS StudentRole;

GRANT ALL PRIVILEGES ON OnlineSchoolDB.* TO AdminRole;
GRANT EXECUTE ON PROCEDURE sp_GradeSubmission TO TeacherRole;
GRANT EXECUTE ON PROCEDURE sp_RecordAttendance TO TeacherRole;
GRANT EXECUTE ON PROCEDURE sp_IssueCertificatesForCourse TO TeacherRole;
GRANT EXECUTE ON PROCEDURE sp_UpdateCourseStatus TO TeacherRole;
GRANT EXECUTE ON PROCEDURE sp_ReportPopularCourses TO TeacherRole;
GRANT EXECUTE ON PROCEDURE sp_ReportTeacherIncome TO TeacherRole;
GRANT EXECUTE ON PROCEDURE sp_CreateAnnouncement TO TeacherRole;
GRANT EXECUTE ON PROCEDURE sp_UpdateAnnouncement TO TeacherRole;
GRANT EXECUTE ON PROCEDURE sp_DeleteAnnouncement TO TeacherRole;
GRANT EXECUTE ON PROCEDURE sp_GetAnnouncementsByCourse TO TeacherRole;
GRANT EXECUTE ON PROCEDURE sp_CreateAssignment TO TeacherRole;
GRANT EXECUTE ON PROCEDURE sp_UpdateAssignment TO TeacherRole;
GRANT EXECUTE ON PROCEDURE sp_DeleteAssignment TO TeacherRole;
GRANT SELECT ON vw_TeacherDashboard TO TeacherRole;
GRANT SELECT ON vw_CourseStatistics TO TeacherRole;
GRANT SELECT ON vw_StudentTranscript TO TeacherRole;
GRANT SELECT ON vw_StudentCertificates TO TeacherRole;

GRANT EXECUTE ON PROCEDURE sp_EnrollStudentInCourse TO StudentRole;
GRANT EXECUTE ON PROCEDURE sp_SubmitAssignment TO StudentRole;
GRANT EXECUTE ON PROCEDURE sp_ReportCourseGrades TO StudentRole;
GRANT EXECUTE ON PROCEDURE sp_ReportAttendance TO StudentRole;
GRANT EXECUTE ON PROCEDURE sp_GetAnnouncementsByCourse TO StudentRole;
GRANT SELECT ON vw_StudentTranscript TO StudentRole;
GRANT SELECT ON vw_StudentCertificates TO StudentRole;
GRANT SELECT ON vw_CourseStatistics TO StudentRole;

-- =============================================================================
-- TEST CASES
-- =============================================================================

CALL sp_UpdateCourseStatus();

-- Publish the draft course so it becomes available for enrollment (Upcoming)
CALL sp_UpdateCourse(6, NULL, NULL, NULL, NULL, NULL, NULL, 'Upcoming');

-- Existing flows
CALL sp_EnrollStudentInCourse(8, 5, 1400.00, NULL);
CALL sp_SubmitAssignment(5, 4, 'https://files.example.com/new_submission.pdf');
SET @NewSubmissionID = (SELECT MAX(SubmissionID) FROM Submission WHERE StudentID = 4 AND AssignmentID = 5);
CALL sp_GradeSubmission(@NewSubmissionID, 16.00, 'Strong solution.');
CALL sp_RecordAttendance(4, 5, CURDATE(), 'Present');
CALL sp_IssueCertificatesForCourse(1);
CALL sp_IssueCertificatesForCourse(4);
CALL sp_CancelEnrollment(4);
SELECT fn_CalculateStudentGPA(4) AS StudentGPA;
CALL sp_GetCourseStudents(1);

-- Announcement flow tests
CALL sp_CreateAnnouncement(2, 2, 'New Material Uploaded', 'Lecture slides for week 3 have been uploaded to the resources page.');
SET @NewAnnouncementID = LAST_INSERT_ID();
CALL sp_UpdateAnnouncement(@NewAnnouncementID, 2, 'New Material Uploaded (Updated)', 'Lecture slides and exercises for week 3 have been uploaded.');
CALL sp_GetAnnouncementsByCourse(2);
CALL sp_DeleteAnnouncement(@NewAnnouncementID, 2);

-- Assignment edit/delete flow tests (course 2 is Active, still editable)
CALL sp_CreateAssignment(2, 'Extra Practice Set', 'Optional extra practice problems.', DATE_ADD(NOW(), INTERVAL 12 DAY), 10);
SET @NewAssignmentID = LAST_INSERT_ID();
CALL sp_UpdateAssignment(@NewAssignmentID, 'Extra Practice Set (Revised)', 'Optional extra practice problems, revised version.', DATE_ADD(NOW(), INTERVAL 14 DAY), 15);
CALL sp_DeleteAssignment(@NewAssignmentID);

-- Reports
CALL sp_ReportTopStudents(5);
CALL sp_ReportTeacherIncome(DATE_SUB(CURDATE(), INTERVAL 365 DAY), CURDATE());
CALL sp_ReportPopularCourses();
CALL sp_ReportCourseEnrollments(NULL);
CALL sp_ReportInactiveStudents(30);
CALL sp_ReportFailedPayments(DATE_SUB(CURDATE(), INTERVAL 365 DAY), CURDATE());
CALL sp_ReportCourseGrades(NULL);
CALL sp_ReportAttendance(4, 1);
CALL sp_ReportMonthlyIncome(YEAR(CURDATE()));
CALL sp_ReportTeacherRanking('Income');
SELECT * FROM vw_StudentTranscript;
SELECT * FROM vw_TeacherDashboard;
SELECT * FROM vw_CourseStatistics;
SELECT * FROM vw_FinancialSummary;
SELECT * FROM vw_StudentCertificates;
CALL sp_GenerateMonthlyFinancialReport(2025, 1);

-- Sanity check: list courses (public, drafts hidden), and as the owning teacher (drafts shown)
CALL sp_GetCourses(NULL, NULL, NULL, NULL, NULL, NULL);
CALL sp_GetCourses(NULL, NULL, NULL, NULL, NULL, 2);