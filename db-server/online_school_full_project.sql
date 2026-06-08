-- Online School Management System

USE master;
GO

IF DB_ID(N'OnlineSchoolDB') IS NOT NULL
BEGIN
    ALTER DATABASE OnlineSchoolDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE OnlineSchoolDB;
END
GO

CREATE DATABASE OnlineSchoolDB;
GO

USE OnlineSchoolDB;
GO

-- =============================================================================
-- 1. DATABASE CREATION
-- =============================================================================
-- The database is created above. The rest of the script builds the project from zero.

-- =============================================================================
-- 2. TABLES
-- =============================================================================
-- Core entity tables

CREATE TABLE dbo.[User] (
    UserID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    FullName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role NVARCHAR(20) NOT NULL,
    PhoneNumber NVARCHAR(20) NULL,
    RegistrationDate DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    IsDeleted BIT NOT NULL DEFAULT 0,
    CONSTRAINT UQ_User_Email UNIQUE (Email),
    CONSTRAINT CK_User_FullName CHECK (LEN(FullName) BETWEEN 3 AND 100),
    CONSTRAINT CK_User_Email CHECK (Email LIKE '%_@_%._%'),
    CONSTRAINT CK_User_Role CHECK (Role IN ('Admin', 'Teacher', 'Student')),
    CONSTRAINT CK_User_PhoneNumber CHECK (
        PhoneNumber IS NULL OR (
            LEN(PhoneNumber) BETWEEN 10 AND 15
            AND PhoneNumber NOT LIKE '%[^0-9]%'
        )
    )
);

CREATE TABLE dbo.Student (
    StudentID INT NOT NULL PRIMARY KEY,
    DateOfBirth DATE NULL,
    GPA DECIMAL(4,2) NOT NULL DEFAULT 0,
    Status NVARCHAR(20) NOT NULL DEFAULT 'Active',
    CONSTRAINT FK_Student_User FOREIGN KEY (StudentID) REFERENCES dbo.[User](UserID),
    CONSTRAINT CK_Student_GPA CHECK (GPA BETWEEN 0 AND 20),
    CONSTRAINT CK_Student_Status CHECK (Status IN ('Active', 'Inactive')),
    CONSTRAINT CK_Student_Age CHECK (
        DateOfBirth IS NULL OR DATEDIFF(YEAR, DateOfBirth, GETDATE()) BETWEEN 5 AND 100
    )
);

CREATE TABLE dbo.Teacher (
    TeacherID INT NOT NULL PRIMARY KEY,
    Expertise NVARCHAR(200) NOT NULL,
    HireDate DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    TotalIncome DECIMAL(18,2) NOT NULL DEFAULT 0,
    CONSTRAINT FK_Teacher_User FOREIGN KEY (TeacherID) REFERENCES dbo.[User](UserID),
    CONSTRAINT CK_Teacher_TotalIncome CHECK (TotalIncome >= 0)
);

CREATE TABLE dbo.Course (
    CourseID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    TeacherID INT NOT NULL,
    Title NVARCHAR(150) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    Price DECIMAL(12,2) NOT NULL,
    StartDate DATETIME2(0) NOT NULL,
    EndDate DATETIME2(0) NOT NULL,
    Capacity INT NOT NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'Upcoming',
    IsDeleted BIT NOT NULL DEFAULT 0,
    CONSTRAINT FK_Course_Teacher FOREIGN KEY (TeacherID) REFERENCES dbo.Teacher(TeacherID),
    CONSTRAINT CK_Course_Title CHECK (LEN(Title) BETWEEN 3 AND 150),
    CONSTRAINT CK_Course_Price CHECK (Price >= 0),
    CONSTRAINT CK_Course_Capacity CHECK (Capacity > 0),
    CONSTRAINT CK_Course_Status CHECK (Status IN ('Upcoming', 'Active', 'Completed', 'Cancelled')),
    CONSTRAINT CK_Course_Dates CHECK (EndDate > StartDate)
);

CREATE TABLE dbo.Enrollment (
    EnrollmentID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    StudentID INT NOT NULL,
    CourseID INT NOT NULL,
    EnrollmentDate DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    Status NVARCHAR(20) NOT NULL DEFAULT 'Pending',
    FinalScore DECIMAL(4,2) NULL,
    ProgressPercent INT NOT NULL DEFAULT 0,
    CONSTRAINT FK_Enrollment_Student FOREIGN KEY (StudentID) REFERENCES dbo.Student(StudentID),
    CONSTRAINT FK_Enrollment_Course FOREIGN KEY (CourseID) REFERENCES dbo.Course(CourseID),
    CONSTRAINT UQ_Enrollment_Student_Course UNIQUE (StudentID, CourseID),
    CONSTRAINT CK_Enrollment_Status CHECK (Status IN ('Pending', 'Successful', 'Failed', 'Dropped')),
    CONSTRAINT CK_Enrollment_FinalScore CHECK (FinalScore IS NULL OR FinalScore BETWEEN 0 AND 20),
    CONSTRAINT CK_Enrollment_Progress CHECK (ProgressPercent BETWEEN 0 AND 100)
);

CREATE TABLE dbo.Assignment (
    AssignmentID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    CourseID INT NOT NULL,
    Title NVARCHAR(150) NOT NULL,
    DueDate DATETIME2(0) NOT NULL,
    MaxScore DECIMAL(4,2) NOT NULL,
    CONSTRAINT FK_Assignment_Course FOREIGN KEY (CourseID) REFERENCES dbo.Course(CourseID),
    CONSTRAINT CK_Assignment_Title CHECK (LEN(Title) BETWEEN 3 AND 150),
    CONSTRAINT CK_Assignment_MaxScore CHECK (MaxScore > 0 AND MaxScore <= 20)
);

CREATE TABLE dbo.Submission (
    SubmissionID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    AssignmentID INT NOT NULL,
    StudentID INT NOT NULL,
    SubmissionDate DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    FileURL NVARCHAR(500) NOT NULL,
    Score DECIMAL(4,2) NULL,
    Feedback NVARCHAR(MAX) NULL,
    CONSTRAINT FK_Submission_Assignment FOREIGN KEY (AssignmentID) REFERENCES dbo.Assignment(AssignmentID),
    CONSTRAINT FK_Submission_Student FOREIGN KEY (StudentID) REFERENCES dbo.Student(StudentID),
    CONSTRAINT UQ_Submission_Assignment_Student UNIQUE (AssignmentID, StudentID),
    CONSTRAINT CK_Submission_Score CHECK (Score IS NULL OR Score BETWEEN 0 AND 20)
);

CREATE TABLE dbo.Attendance (
    AttendanceID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    StudentID INT NOT NULL,
    CourseID INT NOT NULL,
    SessionDate DATE NOT NULL,
    Status NVARCHAR(20) NOT NULL,
    CONSTRAINT FK_Attendance_Student FOREIGN KEY (StudentID) REFERENCES dbo.Student(StudentID),
    CONSTRAINT FK_Attendance_Course FOREIGN KEY (CourseID) REFERENCES dbo.Course(CourseID),
    CONSTRAINT UQ_Attendance UNIQUE (StudentID, CourseID, SessionDate),
    CONSTRAINT CK_Attendance_Status CHECK (Status IN ('Present', 'Absent'))
);

CREATE TABLE dbo.Payment (
    PaymentID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    StudentID INT NOT NULL,
    CourseID INT NOT NULL,
    Amount DECIMAL(12,2) NOT NULL,
    PaymentDate DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    Status NVARCHAR(20) NOT NULL DEFAULT 'Pending',
    TransactionID NVARCHAR(100) NULL,
    CONSTRAINT FK_Payment_Student FOREIGN KEY (StudentID) REFERENCES dbo.Student(StudentID),
    CONSTRAINT FK_Payment_Course FOREIGN KEY (CourseID) REFERENCES dbo.Course(CourseID),
    CONSTRAINT UQ_Payment_TransactionID UNIQUE (TransactionID),
    CONSTRAINT CK_Payment_Amount CHECK (Amount >= 0),
    CONSTRAINT CK_Payment_Status CHECK (Status IN ('Pending', 'Successful', 'Failed', 'Refunded'))
);

CREATE TABLE dbo.Certificate (
    CertificateID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    StudentID INT NOT NULL,
    CourseID INT NOT NULL,
    IssueDate DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    CertificateCode NVARCHAR(100) NOT NULL,
    CONSTRAINT FK_Certificate_Student FOREIGN KEY (StudentID) REFERENCES dbo.Student(StudentID),
    CONSTRAINT FK_Certificate_Course FOREIGN KEY (CourseID) REFERENCES dbo.Course(CourseID),
    CONSTRAINT UQ_Certificate_Student_Course UNIQUE (StudentID, CourseID),
    CONSTRAINT UQ_Certificate_Code UNIQUE (CertificateCode)
);

-- =============================================================================
-- 3. CONSTRAINTS
-- =============================================================================
-- Inline constraints already cover most business rules.
-- Extra rules are implemented with triggers and stored procedures where a CHECK constraint is not enough.

-- =============================================================================
-- 4. SAMPLE DATA
-- =============================================================================
-- Enough data for the procedures, views, reports, and tests to work immediately.

SET IDENTITY_INSERT dbo.[User] ON;
INSERT INTO dbo.[User] (UserID, FullName, Email, PasswordHash, Role, PhoneNumber, RegistrationDate, IsDeleted) VALUES
(1,  'System Admin', 'admin@onlineschool.test',  'HASH_ADMIN_001',  'Admin',   '09120000001', DATEADD(DAY, -30, SYSDATETIME()), 0),
(2,  'Alice Teacher', 'alice.teacher@onlineschool.test', 'HASH_TEACH_002', 'Teacher', '09120000002', DATEADD(DAY, -90, SYSDATETIME()), 0),
(3,  'Bob Teacher',   'bob.teacher@onlineschool.test',   'HASH_TEACH_003', 'Teacher', '09120000003', DATEADD(DAY, -85, SYSDATETIME()), 0),
(4,  'John Student',   'john.student@onlineschool.test',  'HASH_STUD_004',  'Student', '09120000004', DATEADD(DAY, -70, SYSDATETIME()), 0),
(5,  'Mary Student',   'mary.student@onlineschool.test',  'HASH_STUD_005',  'Student', '09120000005', DATEADD(DAY, -68, SYSDATETIME()), 0),
(6,  'Chris Student',  'chris.student@onlineschool.test', 'HASH_STUD_006',  'Student', '09120000006', DATEADD(DAY, -66, SYSDATETIME()), 0),
(7,  'Lily Student',   'lily.student@onlineschool.test',  'HASH_STUD_007',  'Student', '09120000007', DATEADD(DAY, -64, SYSDATETIME()), 0),
(8,  'Omar Student',   'omar.student@onlineschool.test',  'HASH_STUD_008',  'Student', '09120000008', DATEADD(DAY, -62, SYSDATETIME()), 0),
(9,  'Nina Student',   'nina.student@onlineschool.test',  'HASH_STUD_009',  'Student', '09120000009', DATEADD(DAY, -60, SYSDATETIME()), 0),
(10, 'Paul Student',   'paul.student@onlineschool.test',  'HASH_STUD_010',  'Student', '09120000010', DATEADD(DAY, -58, SYSDATETIME()), 0),
(11, 'Eva Student',    'eva.student@onlineschool.test',   'HASH_STUD_011',  'Student', '09120000011', DATEADD(DAY, -56, SYSDATETIME()), 0);
SET IDENTITY_INSERT dbo.[User] OFF;

INSERT INTO dbo.Student (StudentID, DateOfBirth, GPA, Status) VALUES
(4,  '2003-05-12', 0, 'Active'),
(5,  '2004-02-18', 0, 'Active'),
(6,  '2002-11-03', 0, 'Active'),
(7,  '2003-08-21', 0, 'Active'),
(8,  '2005-01-14', 0, 'Active'),
(9,  '2004-09-30', 0, 'Active'),
(10, '2003-03-07', 0, 'Active'),
(11, '2001-12-25', 0, 'Inactive');

INSERT INTO dbo.Teacher (TeacherID, Expertise, HireDate, TotalIncome) VALUES
(2, 'Database and SQL', '2021-09-01', 0),
(3, 'Artificial Intelligence', '2020-10-15', 0);

SET IDENTITY_INSERT dbo.Course ON;
INSERT INTO dbo.Course (CourseID, TeacherID, Title, Description, Price, StartDate, EndDate, Capacity, Status, IsDeleted) VALUES
(1, 2, 'SQL Basics', 'Introductory SQL course', 1200.00, DATEADD(DAY, -120, SYSDATETIME()), DATEADD(DAY, -90, SYSDATETIME()), 3, 'Completed', 0),
(2, 2, 'Database Design', 'Relational model and normalization', 1500.00, DATEADD(DAY, -10, SYSDATETIME()), DATEADD(DAY,  20, SYSDATETIME()), 4, 'Active', 0),
(3, 3, 'AI Fundamentals', 'Basic AI and machine learning concepts', 1800.00, DATEADD(DAY,  10, SYSDATETIME()), DATEADD(DAY,  50, SYSDATETIME()), 4, 'Upcoming', 0),
(4, 3, 'Networks', 'Computer networks and protocols', 1000.00, DATEADD(DAY, -60, SYSDATETIME()), DATEADD(DAY, -30, SYSDATETIME()), 5, 'Completed', 0),
(5, 2, 'Algorithms', 'Algorithms and problem solving', 1400.00, DATEADD(DAY, -15, SYSDATETIME()), DATEADD(DAY,  15, SYSDATETIME()), 5, 'Active', 0);
SET IDENTITY_INSERT dbo.Course OFF;

SET IDENTITY_INSERT dbo.Assignment ON;
INSERT INTO dbo.Assignment (AssignmentID, CourseID, Title, DueDate, MaxScore) VALUES
(1, 1, 'SQL Query Set 1', DATEADD(DAY, -100, SYSDATETIME()), 20),
(2, 1, 'SQL Query Set 2', DATEADD(DAY, -95, SYSDATETIME()), 20),
(3, 2, 'Normalization Task', DATEADD(DAY,  10, SYSDATETIME()), 20),
(4, 4, 'Network Basics Quiz', DATEADD(DAY, -35, SYSDATETIME()), 20),
(5, 5, 'Algorithms Homework', DATEADD(DAY,  10, SYSDATETIME()), 20);
SET IDENTITY_INSERT dbo.Assignment OFF;

SET IDENTITY_INSERT dbo.Enrollment ON;
INSERT INTO dbo.Enrollment (EnrollmentID, StudentID, CourseID, EnrollmentDate, Status, FinalScore, ProgressPercent) VALUES
(1, 4, 1, DATEADD(DAY, -119, SYSDATETIME()), 'Successful', 18.00, 100),
(2, 5, 1, DATEADD(DAY, -118, SYSDATETIME()), 'Successful', 15.00, 100),
(3, 6, 1, DATEADD(DAY, -117, SYSDATETIME()), 'Successful',  9.00, 100),
(4, 7, 2, DATEADD(DAY, -9,  SYSDATETIME()), 'Successful', 14.00,  50),
(5, 8, 2, DATEADD(DAY, -8,  SYSDATETIME()), 'Pending',    NULL,   10),
(6, 9, 4, DATEADD(DAY, -59, SYSDATETIME()), 'Successful', 17.00, 100),
(7,10, 5, DATEADD(DAY, -14, SYSDATETIME()), 'Failed',      NULL,   20),
(8,11, 5, DATEADD(DAY, -13, SYSDATETIME()), 'Dropped',     NULL,    0),
(9, 4, 5, DATEADD(DAY, -12, SYSDATETIME()), 'Successful', 12.00,  80),
(10,5, 4, DATEADD(DAY, -58, SYSDATETIME()), 'Successful', 11.00, 100);
SET IDENTITY_INSERT dbo.Enrollment OFF;

SET IDENTITY_INSERT dbo.Payment ON;
INSERT INTO dbo.Payment (PaymentID, StudentID, CourseID, Amount, PaymentDate, Status, TransactionID) VALUES
(1, 4, 1, 1200.00, DATEADD(DAY, -119, SYSDATETIME()), 'Successful', 'TXN-000001'),
(2, 5, 1, 1200.00, DATEADD(DAY, -118, SYSDATETIME()), 'Successful', 'TXN-000002'),
(3, 6, 1, 1200.00, DATEADD(DAY, -117, SYSDATETIME()), 'Successful', 'TXN-000003'),
(4, 7, 2, 1500.00, DATEADD(DAY, -9,  SYSDATETIME()), 'Successful', 'TXN-000004'),
(5, 8, 2, 1500.00, DATEADD(DAY, -8,  SYSDATETIME()), 'Pending',    'TXN-000005'),
(6, 9, 4, 1000.00, DATEADD(DAY, -59, SYSDATETIME()), 'Successful', 'TXN-000006'),
(7,10, 5, 1400.00, DATEADD(DAY, -14, SYSDATETIME()), 'Failed',      'TXN-000007'),
(8,11, 5, 1400.00, DATEADD(DAY, -13, SYSDATETIME()), 'Refunded',    'TXN-000008'),
(9, 4, 5, 1400.00, DATEADD(DAY, -12, SYSDATETIME()), 'Successful', 'TXN-000009'),
(10,5, 4, 1000.00, DATEADD(DAY, -58, SYSDATETIME()), 'Successful', 'TXN-000010');
SET IDENTITY_INSERT dbo.Payment OFF;

SET IDENTITY_INSERT dbo.Submission ON;
INSERT INTO dbo.Submission (SubmissionID, AssignmentID, StudentID, SubmissionDate, FileURL, Score, Feedback) VALUES
(1, 1, 4, DATEADD(DAY, -100, SYSDATETIME()), 'https://files.example.com/s1_a1.pdf', 18.00, 'Good work'),
(2, 2, 4, DATEADD(DAY, -94,  SYSDATETIME()), 'https://files.example.com/s1_a2.pdf', 17.00, 'Solid answer'),
(3, 1, 5, DATEADD(DAY, -99,  SYSDATETIME()), 'https://files.example.com/s2_a1.pdf', 15.00, 'Correct'),
(4, 1, 6, DATEADD(DAY, -98,  SYSDATETIME()), 'https://files.example.com/s3_a1.pdf',  9.00, 'Needs improvement'),
(5, 3, 7, DATEADD(DAY, -1,   SYSDATETIME()), 'https://files.example.com/s4_a3.pdf', 14.00, 'Nice submission'),
(6, 4, 9, DATEADD(DAY, -40,  SYSDATETIME()), 'https://files.example.com/s5_a4.pdf', 17.00, 'Well done'),
(7, 5, 4, DATEADD(DAY, -2,   SYSDATETIME()), 'https://files.example.com/s6_a5.pdf', 12.00, 'Good'),
(8, 4, 5, DATEADD(DAY, -39,  SYSDATETIME()), 'https://files.example.com/s7_a4.pdf', 11.00, 'Accepted');
SET IDENTITY_INSERT dbo.Submission OFF;

SET IDENTITY_INSERT dbo.Attendance ON;
INSERT INTO dbo.Attendance (AttendanceID, StudentID, CourseID, SessionDate, Status) VALUES
(1, 4, 1, CAST(DATEADD(DAY, -110, SYSDATETIME()) AS DATE), 'Present'),
(2, 5, 1, CAST(DATEADD(DAY, -109, SYSDATETIME()) AS DATE), 'Present'),
(3, 6, 1, CAST(DATEADD(DAY, -108, SYSDATETIME()) AS DATE), 'Absent'),
(4, 7, 2, CAST(DATEADD(DAY, -5,   SYSDATETIME()) AS DATE), 'Present'),
(5, 9, 4, CAST(DATEADD(DAY, -45,  SYSDATETIME()) AS DATE), 'Present'),
(6, 4, 5, CAST(DATEADD(DAY, -5,   SYSDATETIME()) AS DATE), 'Present');
SET IDENTITY_INSERT dbo.Attendance OFF;


-- =============================================================================
-- 5. FUNCTIONS
-- =============================================================================
CREATE OR ALTER FUNCTION dbo.fn_CalculateStudentGPA
(
    @StudentID INT
)
RETURNS DECIMAL(4,2)
AS
BEGIN
    DECLARE @Result DECIMAL(4,2);
    SELECT @Result = CAST(ISNULL(AVG(CAST(FinalScore AS DECIMAL(5,2))), 0) AS DECIMAL(4,2))
    FROM dbo.Enrollment
    WHERE StudentID = @StudentID
      AND Status = 'Successful'
      AND FinalScore IS NOT NULL;
    RETURN ISNULL(@Result, 0);
END;
GO

CREATE OR ALTER FUNCTION dbo.fn_GetCourseStudents
(
    @CourseID INT
)
RETURNS TABLE
AS
RETURN
(
    SELECT
        s.StudentID,
        u.FullName,
        u.Email,
        e.EnrollmentDate,
        e.Status AS EnrollmentStatus,
        e.FinalScore,
        e.ProgressPercent,
        s.GPA
    FROM dbo.Enrollment e
    INNER JOIN dbo.Student s ON e.StudentID = s.StudentID
    INNER JOIN dbo.[User] u ON s.StudentID = u.UserID
    WHERE e.CourseID = @CourseID
);
GO

-- =============================================================================
-- 6. PROCEDURES
-- =============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_CalculateStudentGPA
    @StudentID INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @NewGPA DECIMAL(4,2);
    IF NOT EXISTS (SELECT 1 FROM dbo.Student WHERE StudentID = @StudentID)
        THROW 50001, 'Student not found.', 1;
    SET @NewGPA = dbo.fn_CalculateStudentGPA(@StudentID);
    UPDATE dbo.Student SET GPA = @NewGPA WHERE StudentID = @StudentID;
    SELECT @StudentID AS StudentID, @NewGPA AS CalculatedGPA;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_EnrollStudentInCourse
    @StudentID INT,
    @CourseID INT,
    @Amount DECIMAL(12,2),
    @TransactionID NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @CoursePrice DECIMAL(12,2);
    DECLARE @Capacity INT;
    DECLARE @CourseStatus NVARCHAR(20);
    DECLARE @StudentStatus NVARCHAR(20);
    DECLARE @ExistingCount INT;
    DECLARE @SuccessfulCount INT;
    DECLARE @TeacherID INT;
    DECLARE @EnrollmentID INT;
    DECLARE @PaymentID INT;
    DECLARE @GeneratedTransactionID NVARCHAR(100);
    DECLARE @StudentName NVARCHAR(100);
    DECLARE @CourseTitle NVARCHAR(150);

    BEGIN TRY
        BEGIN TRANSACTION;

        SELECT @StudentStatus = s.Status, @StudentName = u.FullName
        FROM dbo.Student s
        INNER JOIN dbo.[User] u ON s.StudentID = u.UserID
        WHERE s.StudentID = @StudentID AND u.IsDeleted = 0;

        IF @StudentStatus IS NULL OR @StudentStatus <> 'Active'
            THROW 50002, 'Student not found or inactive.', 1;

        SELECT
            @CoursePrice = c.Price,
            @Capacity = c.Capacity,
            @CourseStatus = c.Status,
            @TeacherID = c.TeacherID,
            @CourseTitle = c.Title
        FROM dbo.Course c
        WHERE c.CourseID = @CourseID AND c.IsDeleted = 0;

        IF @CourseStatus IS NULL OR @CourseStatus NOT IN ('Upcoming', 'Active')
            THROW 50003, 'Course not found or not open for enrollment.', 1;

        IF @Amount <> @CoursePrice
            THROW 50004, 'Payment amount does not match course price.', 1;

        SELECT @ExistingCount = COUNT(*)
        FROM dbo.Enrollment
        WHERE StudentID = @StudentID AND CourseID = @CourseID;

        IF @ExistingCount > 0
            THROW 50005, 'The student is already enrolled in this course.', 1;

        SELECT @SuccessfulCount = COUNT(*)
        FROM dbo.Enrollment WITH (UPDLOCK, HOLDLOCK)
        WHERE CourseID = @CourseID AND Status = 'Successful';

        IF @SuccessfulCount >= @Capacity
            THROW 50006, 'Course capacity has been reached.', 1;

        SET @GeneratedTransactionID = COALESCE(@TransactionID, CONCAT('TRX-', CONVERT(VARCHAR(8), GETDATE(), 112), '-', RIGHT('000000' + CAST(ABS(CHECKSUM(NEWID())) % 1000000 AS VARCHAR(6)), 6)));

        INSERT INTO dbo.Enrollment (StudentID, CourseID, EnrollmentDate, Status, FinalScore, ProgressPercent)
        VALUES (@StudentID, @CourseID, SYSDATETIME(), 'Pending', NULL, 0);
        SET @EnrollmentID = SCOPE_IDENTITY();

        INSERT INTO dbo.Payment (StudentID, CourseID, Amount, PaymentDate, Status, TransactionID)
        VALUES (@StudentID, @CourseID, @Amount, SYSDATETIME(), 'Pending', @GeneratedTransactionID);
        SET @PaymentID = SCOPE_IDENTITY();

        UPDATE dbo.Enrollment
        SET Status = 'Successful'
        WHERE EnrollmentID = @EnrollmentID;

        UPDATE dbo.Payment
        SET Status = 'Successful'
        WHERE PaymentID = @PaymentID;

        UPDATE dbo.Teacher
        SET TotalIncome = TotalIncome + @Amount
        WHERE TeacherID = @TeacherID;

        EXEC dbo.sp_CalculateStudentGPA @StudentID = @StudentID;

        COMMIT TRANSACTION;

        SELECT
            @EnrollmentID AS EnrollmentID,
            @PaymentID AS PaymentID,
            @GeneratedTransactionID AS TransactionID,
            @StudentName AS StudentName,
            @CourseTitle AS CourseTitle,
            'Enrollment completed successfully.' AS Message;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_SubmitAssignment
    @AssignmentID INT,
    @StudentID INT,
    @FileURL NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @CourseID INT;
    DECLARE @DueDate DATETIME2(0);
    DECLARE @StudentStatus NVARCHAR(20);

    SELECT @CourseID = a.CourseID, @DueDate = a.DueDate
    FROM dbo.Assignment a
    WHERE a.AssignmentID = @AssignmentID;

    IF @CourseID IS NULL
        THROW 50011, 'Assignment not found.', 1;

    SELECT @StudentStatus = s.Status
    FROM dbo.Student s
    WHERE s.StudentID = @StudentID;

    IF @StudentStatus IS NULL OR @StudentStatus <> 'Active'
        THROW 50012, 'Student not found or inactive.', 1;

    IF NOT EXISTS (
        SELECT 1
        FROM dbo.Enrollment e
        WHERE e.StudentID = @StudentID
          AND e.CourseID = @CourseID
          AND e.Status = 'Successful'
    )
        THROW 50013, 'Student is not enrolled in the course.', 1;

    IF GETDATE() > @DueDate
        THROW 50014, 'Assignment deadline has passed.', 1;

    IF EXISTS (
        SELECT 1
        FROM dbo.Submission
        WHERE AssignmentID = @AssignmentID AND StudentID = @StudentID
    )
        THROW 50015, 'The student has already submitted this assignment.', 1;

    INSERT INTO dbo.Submission (AssignmentID, StudentID, SubmissionDate, FileURL, Score, Feedback)
    VALUES (@AssignmentID, @StudentID, SYSDATETIME(), @FileURL, NULL, NULL);

    SELECT SCOPE_IDENTITY() AS SubmissionID, 'Submission stored. Waiting for grading.' AS Message;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_GradeSubmission
    @SubmissionID INT,
    @Score DECIMAL(4,2),
    @Feedback NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @AssignmentID INT;
    DECLARE @StudentID INT;
    DECLARE @CourseID INT;
    DECLARE @MaxScore DECIMAL(4,2);
    DECLARE @AverageFinal DECIMAL(4,2);

    BEGIN TRY
        BEGIN TRANSACTION;

        SELECT
            @AssignmentID = a.AssignmentID,
            @CourseID = a.CourseID,
            @MaxScore = a.MaxScore
        FROM dbo.Submission s
        INNER JOIN dbo.Assignment a ON s.AssignmentID = a.AssignmentID
        WHERE s.SubmissionID = @SubmissionID;

        IF @AssignmentID IS NULL
            THROW 50021, 'Submission not found.', 1;

        IF @Score < 0 OR @Score > @MaxScore
            THROW 50022, 'Score is outside the allowed range.', 1;

        SELECT @StudentID = StudentID
        FROM dbo.Submission
        WHERE SubmissionID = @SubmissionID;

        UPDATE dbo.Submission
        SET Score = @Score,
            Feedback = @Feedback
        WHERE SubmissionID = @SubmissionID;

        SELECT @AverageFinal = CAST(AVG(CAST(s.Score AS DECIMAL(5,2))) AS DECIMAL(4,2))
        FROM dbo.Submission s
        INNER JOIN dbo.Assignment a ON s.AssignmentID = a.AssignmentID
        WHERE s.StudentID = @StudentID
          AND a.CourseID = @CourseID
          AND s.Score IS NOT NULL;

        UPDATE dbo.Enrollment
        SET FinalScore = @AverageFinal
        WHERE StudentID = @StudentID AND CourseID = @CourseID;

        EXEC dbo.sp_CalculateStudentGPA @StudentID = @StudentID;

        COMMIT TRANSACTION;

        SELECT
            @SubmissionID AS SubmissionID,
            @StudentID AS StudentID,
            @CourseID AS CourseID,
            @AverageFinal AS CourseFinalScore,
            'Submission graded successfully.' AS Message;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_RecordAttendance
    @StudentID INT,
    @CourseID INT,
    @SessionDate DATE,
    @Status NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @StartDate DATETIME2(0);
    DECLARE @EndDate DATETIME2(0);

    SELECT @StartDate = StartDate, @EndDate = EndDate
    FROM dbo.Course
    WHERE CourseID = @CourseID;

    IF @StartDate IS NULL
        THROW 50031, 'Course not found.', 1;

    IF @Status NOT IN ('Present', 'Absent')
        THROW 50032, 'Invalid attendance status.', 1;

    IF @SessionDate < CAST(@StartDate AS DATE) OR @SessionDate > CAST(@EndDate AS DATE)
        THROW 50033, 'Session date is outside the course date range.', 1;

    IF NOT EXISTS (
        SELECT 1 FROM dbo.Enrollment
        WHERE StudentID = @StudentID AND CourseID = @CourseID AND Status = 'Successful'
    )
        THROW 50034, 'Student is not enrolled in the course.', 1;

    INSERT INTO dbo.Attendance (StudentID, CourseID, SessionDate, Status)
    VALUES (@StudentID, @CourseID, @SessionDate, @Status);

    SELECT SCOPE_IDENTITY() AS AttendanceID, 'Attendance recorded.' AS Message;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_IssueCertificatesForCourse
    @CourseID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @IssuedCount INT = 0;

    BEGIN TRY
        BEGIN TRANSACTION;

        ;WITH Candidate AS (
            SELECT
                e.StudentID,
                e.CourseID
            FROM dbo.Enrollment e
            INNER JOIN dbo.Course c ON e.CourseID = c.CourseID
            WHERE e.Status = 'Successful'
              AND e.FinalScore IS NOT NULL
              AND e.FinalScore >= 10
              AND c.EndDate <= GETDATE()
              AND (@CourseID IS NULL OR e.CourseID = @CourseID)
              AND NOT EXISTS (
                    SELECT 1
                    FROM dbo.Certificate cert
                    WHERE cert.StudentID = e.StudentID
                      AND cert.CourseID = e.CourseID
              )
        )
        INSERT INTO dbo.Certificate (StudentID, CourseID, IssueDate, CertificateCode)
        SELECT
            StudentID,
            CourseID,
            SYSDATETIME(),
            CONCAT('CERT-', CourseID, '-', StudentID, '-', CONVERT(VARCHAR(8), GETDATE(), 112), '-', RIGHT('000000' + CAST(ABS(CHECKSUM(NEWID())) % 1000000 AS VARCHAR(6)), 6))
        FROM Candidate;

        SET @IssuedCount = @@ROWCOUNT;

        COMMIT TRANSACTION;
        SELECT @IssuedCount AS CertificatesIssued, 'Certificate issuance completed.' AS Message;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_CancelEnrollment
    @EnrollmentID INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @StudentID INT;
    DECLARE @CourseID INT;
    DECLARE @Amount DECIMAL(12,2);
    DECLARE @TeacherID INT;
    DECLARE @LatestPaymentID INT;
    DECLARE @RefundTransactionID NVARCHAR(100);

    BEGIN TRY
        BEGIN TRANSACTION;

        SELECT
            @StudentID = Enrollment.StudentID,
            @CourseID = Enrollment.CourseID
        FROM dbo.Enrollment
        WHERE EnrollmentID = @EnrollmentID;

        IF @StudentID IS NULL
            THROW 50041, 'Enrollment not found.', 1;

        SELECT TOP (1)
            @LatestPaymentID = PaymentID,
            @Amount = Amount
        FROM dbo.Payment
        WHERE StudentID = @StudentID
          AND CourseID = @CourseID
          AND Status = 'Successful'
        ORDER BY PaymentDate DESC, PaymentID DESC;

        IF @LatestPaymentID IS NULL
            THROW 50042, 'No successful payment found for this enrollment.', 1;

        SELECT @TeacherID = c.TeacherID
        FROM dbo.Course c
        WHERE c.CourseID = @CourseID;

        SET @RefundTransactionID = CONCAT('RFN-', CONVERT(VARCHAR(8), GETDATE(), 112), '-', RIGHT('000000' + CAST(ABS(CHECKSUM(NEWID())) % 1000000 AS VARCHAR(6)), 6));

        UPDATE dbo.Enrollment
        SET Status = 'Dropped'
        WHERE EnrollmentID = @EnrollmentID;

        INSERT INTO dbo.Payment (StudentID, CourseID, Amount, PaymentDate, Status, TransactionID)
        VALUES (@StudentID, @CourseID, @Amount, SYSDATETIME(), 'Refunded', @RefundTransactionID);

        UPDATE dbo.Teacher
        SET TotalIncome = CASE WHEN TotalIncome >= @Amount THEN TotalIncome - @Amount ELSE 0 END
        WHERE TeacherID = @TeacherID;

        COMMIT TRANSACTION;
        SELECT @EnrollmentID AS EnrollmentID, @RefundTransactionID AS RefundTransactionID, 'Enrollment canceled successfully.' AS Message;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_UpdateCourseStatus
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.Course
    SET Status = 'Completed'
    WHERE EndDate <= GETDATE()
      AND Status <> 'Completed';

    UPDATE dbo.Course
    SET Status = 'Active'
    WHERE StartDate <= GETDATE()
      AND EndDate > GETDATE()
      AND Status = 'Upcoming';

    UPDATE dbo.Course
    SET Status = 'Upcoming'
    WHERE StartDate > GETDATE()
      AND Status NOT IN ('Upcoming', 'Completed');

    SELECT 'Course statuses refreshed.' AS Message;
END;
GO


CREATE OR ALTER PROCEDURE dbo.sp_CreateAssignment
    @CourseID INT,
    @Title NVARCHAR(150),
    @DueDate DATETIME2(0),
    @MaxScore DECIMAL(4,2)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- Check if course exists and teacher (caller) is allowed (will be checked in API)
    IF NOT EXISTS (SELECT 1 FROM dbo.Course WHERE CourseID = @CourseID AND IsDeleted = 0)
        THROW 60001, 'Course not found.', 1;

    IF @MaxScore <= 0 OR @MaxScore > 20
        THROW 60002, 'MaxScore must be between 0.01 and 20.', 1;

    INSERT INTO dbo.Assignment (CourseID, Title, DueDate, MaxScore)
    VALUES (@CourseID, @Title, @DueDate, @MaxScore);

    SELECT SCOPE_IDENTITY() AS AssignmentID, 'Assignment created successfully.' AS Message;
END;
GO


CREATE OR ALTER PROCEDURE dbo.sp_UpdateAssignment
    @AssignmentID INT,
    @Title NVARCHAR(150) = NULL,
    @DueDate DATETIME2(0) = NULL,
    @MaxScore DECIMAL(4,2) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Assignment WHERE AssignmentID = @AssignmentID)
        THROW 60011, 'Assignment not found.', 1;

    IF @MaxScore IS NOT NULL AND (@MaxScore <= 0 OR @MaxScore > 20)
        THROW 60012, 'MaxScore must be between 0.01 and 20.', 1;

    UPDATE dbo.Assignment
    SET
        Title = ISNULL(@Title, Title),
        DueDate = ISNULL(@DueDate, DueDate),
        MaxScore = ISNULL(@MaxScore, MaxScore)
    WHERE AssignmentID = @AssignmentID;

    SELECT @AssignmentID AS AssignmentID, 'Assignment updated successfully.' AS Message;
END;
GO


CREATE OR ALTER PROCEDURE dbo.sp_DeleteAssignment
    @AssignmentID INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- Check if any submissions exist for this assignment
    IF EXISTS (SELECT 1 FROM dbo.Submission WHERE AssignmentID = @AssignmentID)
        THROW 60021, 'Cannot delete assignment because submissions already exist.', 1;

    DELETE FROM dbo.Assignment WHERE AssignmentID = @AssignmentID;

    SELECT @AssignmentID AS AssignmentID, 'Assignment deleted successfully.' AS Message;
END;
GO


CREATE OR ALTER PROCEDURE dbo.sp_GetSubmissionsForGrading
    @TeacherID INT,
    @CourseID INT = NULL,
    @AssignmentID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Security: ensure teacher is the owner of the course(s)
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
    FROM dbo.Submission s
    INNER JOIN dbo.Assignment a ON s.AssignmentID = a.AssignmentID
    INNER JOIN dbo.Course c ON a.CourseID = c.CourseID
    INNER JOIN dbo.[User] u ON s.StudentID = u.UserID
    WHERE c.TeacherID = @TeacherID
      AND (@CourseID IS NULL OR a.CourseID = @CourseID)
      AND (@AssignmentID IS NULL OR s.AssignmentID = @AssignmentID)
    ORDER BY a.CourseID, a.DueDate, s.SubmissionDate;
END;
GO

-- =============================================================================
-- 7. TRIGGERS
-- =============================================================================
CREATE OR ALTER TRIGGER dbo.trg_ValidateSubmissionScore
ON dbo.Submission
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN dbo.Assignment a ON i.AssignmentID = a.AssignmentID
        WHERE i.Score IS NOT NULL
          AND (i.Score < 0 OR i.Score > a.MaxScore)
    )
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50101, 'Submission score is outside the allowed range.', 1;
    END
END;
GO

CREATE OR ALTER TRIGGER dbo.trg_CheckCourseCapacity
ON dbo.Enrollment
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN dbo.Course c ON i.CourseID = c.CourseID
        WHERE i.Status = 'Successful'
          AND (
                SELECT COUNT(*)
                FROM dbo.Enrollment e
                WHERE e.CourseID = i.CourseID
                  AND e.Status = 'Successful'
              ) > c.Capacity
    )
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50102, 'Course capacity exceeded.', 1;
    END
END;
GO

CREATE OR ALTER TRIGGER dbo.trg_RecalculateStudentGPA
ON dbo.Enrollment
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    ;WITH AffectedStudents AS (
        SELECT StudentID FROM inserted
        UNION
        SELECT StudentID FROM deleted
    )
    UPDATE s
    SET GPA = dbo.fn_CalculateStudentGPA(s.StudentID)
    FROM dbo.Student s
    INNER JOIN AffectedStudents a ON s.StudentID = a.StudentID;
END;
GO

CREATE OR ALTER TRIGGER dbo.trg_ValidateAttendanceDate
ON dbo.Attendance
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN dbo.Course c ON i.CourseID = c.CourseID
        WHERE i.SessionDate < CAST(c.StartDate AS DATE)
           OR i.SessionDate > CAST(c.EndDate AS DATE)
    )
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50103, 'Attendance date is outside the course date range.', 1;
    END
END;
GO

-- =============================================================================
-- 8. VIEWS
-- =============================================================================
CREATE OR ALTER VIEW dbo.vw_StudentTranscript
AS
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
FROM dbo.Enrollment e
INNER JOIN dbo.Student s ON e.StudentID = s.StudentID
INNER JOIN dbo.[User] u ON s.StudentID = u.UserID
INNER JOIN dbo.Course c ON e.CourseID = c.CourseID
WHERE u.IsDeleted = 0;
GO

CREATE OR ALTER VIEW dbo.vw_TeacherDashboard
AS
SELECT
    t.TeacherID,
    u.FullName AS TeacherName,
    COUNT(DISTINCT c.CourseID) AS CourseCount,
    COUNT(DISTINCT e.StudentID) AS StudentCount,
    ISNULL(SUM(CASE WHEN p.Status = 'Successful' THEN p.Amount ELSE 0 END), 0) AS TotalIncome
FROM dbo.Teacher t
INNER JOIN dbo.[User] u ON t.TeacherID = u.UserID
LEFT JOIN dbo.Course c ON t.TeacherID = c.TeacherID
LEFT JOIN dbo.Enrollment e ON c.CourseID = e.CourseID AND e.Status = 'Successful'
LEFT JOIN dbo.Payment p ON p.StudentID = e.StudentID AND p.CourseID = e.CourseID
GROUP BY t.TeacherID, u.FullName;
GO

CREATE OR ALTER VIEW dbo.vw_CourseStatistics
AS
SELECT
    c.CourseID,
    c.Title,
    c.Status,
    c.Capacity,
    COUNT(CASE WHEN e.Status = 'Successful' THEN 1 END) AS SuccessfulEnrollments,
    COUNT(CASE WHEN e.Status = 'Pending' THEN 1 END) AS PendingEnrollments,
    COUNT(CASE WHEN e.Status = 'Failed' THEN 1 END) AS FailedEnrollments,
    COUNT(CASE WHEN e.Status = 'Dropped' THEN 1 END) AS DroppedEnrollments,
    AVG(CAST(e.FinalScore AS DECIMAL(5,2))) AS AverageScore
FROM dbo.Course c
LEFT JOIN dbo.Enrollment e ON c.CourseID = e.CourseID
GROUP BY c.CourseID, c.Title, c.Status, c.Capacity;
GO

CREATE OR ALTER VIEW dbo.vw_FinancialSummary
AS
SELECT
    YEAR(PaymentDate) AS ReportYear,
    MONTH(PaymentDate) AS ReportMonth,
    COUNT(*) AS TransactionCount,
    SUM(CASE WHEN Status = 'Successful' THEN Amount ELSE 0 END) AS SuccessfulAmount,
    SUM(CASE WHEN Status = 'Refunded' THEN Amount ELSE 0 END) AS RefundedAmount
FROM dbo.Payment
GROUP BY YEAR(PaymentDate), MONTH(PaymentDate);
GO

CREATE OR ALTER VIEW dbo.vw_StudentCertificates
AS
SELECT
    cert.CertificateID,
    cert.CertificateCode,
    cert.IssueDate,
    cert.StudentID,
    u.FullName AS StudentName,
    cert.CourseID,
    c.Title AS CourseTitle
FROM dbo.Certificate cert
INNER JOIN dbo.[User] u ON cert.StudentID = u.UserID
INNER JOIN dbo.Course c ON cert.CourseID = c.CourseID;
GO

-- =============================================================================
-- 9. REPORTS
-- =============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_ReportTopStudents
    @TopN INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@TopN)
        u.UserID AS StudentID,
        u.FullName,
        u.Email,
        s.GPA,
        s.Status
    FROM dbo.Student s
    INNER JOIN dbo.[User] u ON s.StudentID = u.UserID
    WHERE u.Role = 'Student' AND u.IsDeleted = 0
    ORDER BY s.GPA DESC, u.FullName ASC;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_ReportTeacherIncome
    @StartDate DATE,
    @EndDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        t.TeacherID,
        u.FullName AS TeacherName,
        c.CourseID,
        c.Title AS CourseTitle,
        SUM(CASE WHEN p.Status = 'Successful' AND p.PaymentDate >= @StartDate AND p.PaymentDate < DATEADD(DAY, 1, @EndDate) THEN p.Amount ELSE 0 END) AS Income
    FROM dbo.Teacher t
    INNER JOIN dbo.[User] u ON t.TeacherID = u.UserID
    LEFT JOIN dbo.Course c ON t.TeacherID = c.TeacherID
    LEFT JOIN dbo.Payment p ON c.CourseID = p.CourseID
    GROUP BY t.TeacherID, u.FullName, c.CourseID, c.Title
    ORDER BY Income DESC, TeacherName ASC;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_ReportPopularCourses
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        c.CourseID,
        c.Title,
        c.Status,
        COUNT(CASE WHEN e.Status = 'Successful' THEN 1 END) AS SuccessfulEnrollments
    FROM dbo.Course c
    LEFT JOIN dbo.Enrollment e ON c.CourseID = e.CourseID
    GROUP BY c.CourseID, c.Title, c.Status
    ORDER BY SuccessfulEnrollments DESC, c.Title ASC;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_ReportCourseEnrollments
    @CourseID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        c.CourseID,
        c.Title,
        SUM(CASE WHEN e.Status = 'Successful' THEN 1 ELSE 0 END) AS SuccessfulCount,
        SUM(CASE WHEN e.Status = 'Pending' THEN 1 ELSE 0 END) AS PendingCount,
        SUM(CASE WHEN e.Status = 'Failed' THEN 1 ELSE 0 END) AS FailedCount,
        SUM(CASE WHEN e.Status = 'Dropped' THEN 1 ELSE 0 END) AS DroppedCount
    FROM dbo.Course c
    LEFT JOIN dbo.Enrollment e ON c.CourseID = e.CourseID
    WHERE @CourseID IS NULL OR c.CourseID = @CourseID
    GROUP BY c.CourseID, c.Title
    ORDER BY c.CourseID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_ReportInactiveStudents
    @Days INT = 60
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        u.UserID AS StudentID,
        u.FullName,
        u.Email,
        s.Status,
        la.LastActivityDate
    FROM dbo.Student s
    INNER JOIN dbo.[User] u ON s.StudentID = u.UserID
    OUTER APPLY (
        SELECT MAX(ActivityDate) AS LastActivityDate
        FROM (
            SELECT e.EnrollmentDate AS ActivityDate FROM dbo.Enrollment e WHERE e.StudentID = s.StudentID
            UNION ALL
            SELECT p.PaymentDate FROM dbo.Payment p WHERE p.StudentID = s.StudentID
            UNION ALL
            SELECT sub.SubmissionDate FROM dbo.Submission sub WHERE sub.StudentID = s.StudentID
            UNION ALL
            SELECT CAST(a.SessionDate AS DATETIME2(0)) FROM dbo.Attendance a WHERE a.StudentID = s.StudentID
        ) x
    ) la
    WHERE s.Status = 'Inactive'
       OR la.LastActivityDate < DATEADD(DAY, -@Days, SYSDATETIME())
    ORDER BY la.LastActivityDate ASC;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_ReportFailedPayments
    @StartDate DATE,
    @EndDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        p.PaymentID,
        u.FullName AS StudentName,
        c.Title AS CourseTitle,
        p.Amount,
        p.PaymentDate,
        p.TransactionID,
        p.Status
    FROM dbo.Payment p
    INNER JOIN dbo.[User] u ON p.StudentID = u.UserID
    INNER JOIN dbo.Course c ON p.CourseID = c.CourseID
    WHERE p.Status = 'Failed'
      AND p.PaymentDate >= @StartDate
      AND p.PaymentDate < DATEADD(DAY, 1, @EndDate)
    ORDER BY p.PaymentDate DESC;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_ReportCourseGrades
    @CourseID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH Graded AS (
        SELECT
            c.CourseID,
            c.Title,
            e.FinalScore,
            AVG(CAST(e.FinalScore AS DECIMAL(5,2))) OVER (PARTITION BY c.CourseID) AS AverageScore,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY e.FinalScore) OVER (PARTITION BY c.CourseID) AS MedianScore,
            SUM(CASE WHEN e.FinalScore >= 10 THEN 1 ELSE 0 END) OVER (PARTITION BY c.CourseID) AS PassedCount,
            SUM(CASE WHEN e.FinalScore < 10 THEN 1 ELSE 0 END) OVER (PARTITION BY c.CourseID) AS FailedCount,
            ROW_NUMBER() OVER (PARTITION BY c.CourseID ORDER BY c.CourseID) AS rn
        FROM dbo.Course c
        INNER JOIN dbo.Enrollment e ON c.CourseID = e.CourseID
        WHERE e.FinalScore IS NOT NULL
          AND (@CourseID IS NULL OR c.CourseID = @CourseID)
    )
    SELECT
        CourseID,
        Title,
        AverageScore,
        MedianScore,
        PassedCount,
        FailedCount
    FROM Graded
    WHERE rn = 1
    ORDER BY CourseID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_ReportAttendance
    @StudentID INT,
    @CourseID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        u.FullName AS StudentName,
        c.Title AS CourseTitle,
        a.SessionDate,
        a.Status,
        CAST(100.0 * SUM(CASE WHEN a.Status = 'Present' THEN 1 ELSE 0 END) OVER () / NULLIF(COUNT(*) OVER (), 0) AS DECIMAL(5,2)) AS AttendancePercent
    FROM dbo.Attendance a
    INNER JOIN dbo.[User] u ON a.StudentID = u.UserID
    INNER JOIN dbo.Course c ON a.CourseID = c.CourseID
    WHERE a.StudentID = @StudentID
      AND a.CourseID = @CourseID
    ORDER BY a.SessionDate;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_ReportMonthlyIncome
    @Year INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF @Year IS NULL SET @Year = YEAR(GETDATE());
    SELECT
        MONTH(PaymentDate) AS ReportMonth,
        COUNT(*) AS TransactionCount,
        SUM(CASE WHEN Status = 'Successful' THEN Amount ELSE 0 END) AS SuccessfulAmount,
        SUM(CASE WHEN Status = 'Refunded' THEN Amount ELSE 0 END) AS RefundedAmount
    FROM dbo.Payment
    WHERE YEAR(PaymentDate) = @Year
    GROUP BY MONTH(PaymentDate)
    ORDER BY ReportMonth;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_ReportTeacherRanking
    @Basis NVARCHAR(20) = 'Income'
AS
BEGIN
    SET NOCOUNT ON;

    IF @Basis = 'Income'
    BEGIN
        SELECT
            t.TeacherID,
            u.FullName AS TeacherName,
            ISNULL(SUM(CASE WHEN p.Status = 'Successful' THEN p.Amount ELSE 0 END), 0) AS Score
        FROM dbo.Teacher t
        INNER JOIN dbo.[User] u ON t.TeacherID = u.UserID
        LEFT JOIN dbo.Course c ON t.TeacherID = c.TeacherID
        LEFT JOIN dbo.Payment p ON c.CourseID = p.CourseID
        GROUP BY t.TeacherID, u.FullName
        ORDER BY Score DESC, TeacherName ASC;
    END
    ELSE IF @Basis = 'Grades'
    BEGIN
        SELECT
            t.TeacherID,
            u.FullName AS TeacherName,
            AVG(CAST(e.FinalScore AS DECIMAL(5,2))) AS Score
        FROM dbo.Teacher t
        INNER JOIN dbo.[User] u ON t.TeacherID = u.UserID
        LEFT JOIN dbo.Course c ON t.TeacherID = c.TeacherID
        LEFT JOIN dbo.Enrollment e ON c.CourseID = e.CourseID AND e.FinalScore IS NOT NULL
        GROUP BY t.TeacherID, u.FullName
        ORDER BY Score DESC, TeacherName ASC;
    END
    ELSE
    BEGIN
        SELECT
            t.TeacherID,
            u.FullName AS TeacherName,
            COUNT(DISTINCT c.CourseID) AS Score
        FROM dbo.Teacher t
        INNER JOIN dbo.[User] u ON t.TeacherID = u.UserID
        LEFT JOIN dbo.Course c ON t.TeacherID = c.TeacherID
        GROUP BY t.TeacherID, u.FullName
        ORDER BY Score DESC, TeacherName ASC;
    END
END;
GO

-- =====================================================
-- REPORT TRANSACTION
-- Monthly Financial Report
-- =====================================================

CREATE TABLE FinancialReportLog
(
    ReportID INT IDENTITY(1,1) PRIMARY KEY,
    ReportYear INT,
    ReportMonth INT,
    TotalRevenue DECIMAL(18,2),
    GeneratedAt DATETIME DEFAULT GETDATE()
);
GO

CREATE OR ALTER PROCEDURE sp_GenerateMonthlyFinancialReport
(
    @Year INT,
    @Month INT
)
AS
BEGIN

    BEGIN TRY

        BEGIN TRANSACTION;

        DECLARE @TotalRevenue DECIMAL(18,2);

        SELECT
            @TotalRevenue = ISNULL(SUM(Amount),0)
        FROM Payment
        WHERE Status = 'Successful'
          AND YEAR(PaymentDate) = @Year
          AND MONTH(PaymentDate) = @Month;

        INSERT INTO FinancialReportLog
        (
            ReportYear,
            ReportMonth,
            TotalRevenue
        )
        VALUES
        (
            @Year,
            @Month,
            @TotalRevenue
        );

        COMMIT TRANSACTION;

        SELECT
            @Year AS ReportYear,
            @Month AS ReportMonth,
            @TotalRevenue AS TotalRevenue;

    END TRY
    BEGIN CATCH

        ROLLBACK TRANSACTION;

        THROW;

    END CATCH

END;
GO

-- =============================================================================
-- 10. INDEXES
-- =============================================================================
CREATE INDEX IX_Course_TeacherID_Status ON dbo.Course (TeacherID, Status);
CREATE INDEX IX_Course_Status_StartDate ON dbo.Course (Status, StartDate);
CREATE INDEX IX_Enrollment_CourseID_Status ON dbo.Enrollment (CourseID, Status);
CREATE INDEX IX_Enrollment_StudentID_Status ON dbo.Enrollment (StudentID, Status);
CREATE INDEX IX_Submission_AssignmentID_StudentID ON dbo.Submission (AssignmentID, StudentID);
CREATE INDEX IX_Payment_PaymentDate_Status ON dbo.Payment (PaymentDate, Status);
CREATE INDEX IX_Attendance_StudentID_CourseID ON dbo.Attendance (StudentID, CourseID);
CREATE INDEX IX_Certificate_StudentID_CourseID ON dbo.Certificate (StudentID, CourseID);
GO

-- =============================================================================
-- 11. SECURITY & ROLES
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'AdminRole') CREATE ROLE AdminRole;
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'TeacherRole') CREATE ROLE TeacherRole;
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'StudentRole') CREATE ROLE StudentRole;
GO

GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO AdminRole;
GRANT EXECUTE ON SCHEMA::dbo TO AdminRole;
GO

GRANT SELECT ON dbo.vw_TeacherDashboard TO TeacherRole;
GRANT SELECT ON dbo.vw_CourseStatistics TO TeacherRole;
GRANT SELECT ON dbo.vw_StudentTranscript TO TeacherRole;
GRANT SELECT ON dbo.vw_StudentCertificates TO TeacherRole;
GRANT EXECUTE ON dbo.sp_GradeSubmission TO TeacherRole;
GRANT EXECUTE ON dbo.sp_RecordAttendance TO TeacherRole;
GRANT EXECUTE ON dbo.sp_IssueCertificatesForCourse TO TeacherRole;
GRANT EXECUTE ON dbo.sp_UpdateCourseStatus TO TeacherRole;
GRANT EXECUTE ON dbo.sp_ReportPopularCourses TO TeacherRole;
GRANT EXECUTE ON dbo.sp_ReportTeacherIncome TO TeacherRole;
GO

GRANT SELECT ON dbo.vw_StudentTranscript TO StudentRole;
GRANT SELECT ON dbo.vw_StudentCertificates TO StudentRole;
GRANT SELECT ON dbo.vw_CourseStatistics TO StudentRole;
GRANT EXECUTE ON dbo.sp_EnrollStudentInCourse TO StudentRole;
GRANT EXECUTE ON dbo.sp_SubmitAssignment TO StudentRole;
GRANT EXECUTE ON dbo.sp_ReportCourseGrades TO StudentRole;
GRANT EXECUTE ON dbo.sp_ReportAttendance TO StudentRole;
GO

-- =============================================================================
-- 12. TEST CASES
-- =============================================================================
EXEC dbo.sp_UpdateCourseStatus;
GO

EXEC dbo.sp_EnrollStudentInCourse
    @StudentID = 8,
    @CourseID = 5,
    @Amount = 1400.00,
    @TransactionID = NULL;
GO

EXEC dbo.sp_SubmitAssignment
    @AssignmentID = 5,
    @StudentID = 4,
    @FileURL = 'https://files.example.com/new_submission.pdf';
GO

DECLARE @NewSubmissionID INT = (SELECT MAX(SubmissionID) FROM dbo.Submission WHERE StudentID = 4 AND AssignmentID = 5);
EXEC dbo.sp_GradeSubmission
    @SubmissionID = @NewSubmissionID,
    @Score = 16.00,
    @Feedback = 'Strong solution.';
GO

EXEC dbo.sp_RecordAttendance
    @StudentID = 4,
    @CourseID = 5,
    @SessionDate = CAST(GETDATE() AS DATE),
    @Status = 'Present';
GO

EXEC dbo.sp_IssueCertificatesForCourse @CourseID = 1;
EXEC dbo.sp_IssueCertificatesForCourse @CourseID = 4;
GO

EXEC dbo.sp_CancelEnrollment @EnrollmentID = 4;
GO

SELECT dbo.fn_CalculateStudentGPA(4) AS StudentGPA;
GO

SELECT * FROM dbo.fn_GetCourseStudents(1);
GO

EXEC dbo.sp_ReportTopStudents @TopN = 5;
EXEC dbo.sp_ReportTeacherIncome @StartDate = DATEADD(DAY, -365, CAST(GETDATE() AS DATE)), @EndDate = CAST(GETDATE() AS DATE);
EXEC dbo.sp_ReportPopularCourses;
EXEC dbo.sp_ReportCourseEnrollments @CourseID = NULL;
EXEC dbo.sp_ReportInactiveStudents @Days = 30;
EXEC dbo.sp_ReportFailedPayments @StartDate = DATEADD(DAY, -365, CAST(GETDATE() AS DATE)), @EndDate = CAST(GETDATE() AS DATE);
EXEC dbo.sp_ReportCourseGrades @CourseID = NULL;
EXEC dbo.sp_ReportAttendance @StudentID = 4, @CourseID = 1;
EXEC dbo.sp_ReportMonthlyIncome @Year = YEAR(GETDATE());
EXEC dbo.sp_ReportTeacherRanking @Basis = 'Income';
GO

SELECT * FROM dbo.vw_StudentTranscript;
SELECT * FROM dbo.vw_TeacherDashboard;
SELECT * FROM dbo.vw_CourseStatistics;
SELECT * FROM dbo.vw_FinancialSummary;
SELECT * FROM dbo.vw_StudentCertificates;
GO

EXEC sp_GenerateMonthlyFinancialReport
    @Year = 2025,
    @Month = 1;
GO

-- End of script.