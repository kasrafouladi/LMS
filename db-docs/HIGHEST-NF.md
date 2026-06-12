# Functional Dependency Analysis, Prime Attributes, CKs, and Highest Normal Form

## 1. `User`

| Column | Type | Nullable | Constraints |
|--------|------|----------|-------------|
| UserID | INT | NO | PK |
| FullName | VARCHAR(100) | NO | CHECK(LENGTH>=3) |
| Email | VARCHAR(255) | NO | UNIQUE |
| PasswordHash | VARCHAR(255) | NO | |
| Role | VARCHAR(20) | NO | CHECK IN ('Admin','Teacher','Student') |
| PhoneNumber | VARCHAR(20) | YES | |
| RegistrationDate | DATETIME | NO | DEFAULT NOW() |
| IsDeleted | TINYINT(1) | NO | DEFAULT 0 |

**Functional Dependencies:**  
- UserID → FullName, Email, PasswordHash, Role, PhoneNumber, RegistrationDate, IsDeleted (by definition of PK).  
- Email → UserID (unique), and thus all other attributes as well (since Email is a candidate key).  

**Candidate Keys:** {UserID}, {Email}  

**Prime Attributes:** UserID, Email  

**Check Constraints (CK):**  
- `CK_User_FullName`: CHAR_LENGTH(FullName) BETWEEN 3 AND 100  
- `CK_User_Role`: Role IN ('Admin','Teacher','Student')  

**Highest Normal Form:**  
- No partial dependencies (no composite key).  
- No transitive dependencies (all non-prime attributes depend directly on the candidate key).  
- **BCNF** (every determinant is a candidate key).  

---

## 2. `Student`

| Column | Type | Constraints |
|--------|------|-------------|
| StudentID | INT | PK, FK → User(UserID) |
| DateOfBirth | DATE | NULL |
| GPA | DECIMAL(4,2) | NOT NULL DEFAULT 0, CHECK (0-20) |
| Status | VARCHAR(20) | NOT NULL DEFAULT 'Active', CHECK IN ('Active','Inactive') |

**Functional Dependencies:**  
- StudentID → DateOfBirth, GPA, Status (PK)  
- There is no other candidate key.  

**Prime Attributes:** StudentID  

**Check Constraints:**  
- `CK_Student_GPA`: GPA BETWEEN 0 AND 20  
- `CK_Student_Status`: Status IN ('Active','Inactive')  

**Highest Normal Form:**  
- All non-prime attributes fully depend on the primary key. No transitive dependencies.  
- **BCNF** (single attribute key).  

---

## 3. `Teacher`

| Column | Type | Constraints |
|--------|------|-------------|
| TeacherID | INT | PK, FK → User(UserID) |
| Expertise | VARCHAR(200) | NOT NULL |
| HireDate | DATE | NOT NULL DEFAULT CURDATE() |
| TotalIncome | DECIMAL(18,2) | NOT NULL DEFAULT 0, CHECK(>=0) |

**Functional Dependencies:**  
- TeacherID → Expertise, HireDate, TotalIncome  

**Prime Attributes:** TeacherID  

**Check Constraints:**  
- `CK_Teacher_TotalIncome`: TotalIncome >= 0  

**Highest Normal Form:** **BCNF**  

---

## 4. `Course`

| Column | Type | Constraints |
|--------|------|-------------|
| CourseID | INT | PK |
| TeacherID | INT | NOT NULL, FK → Teacher(TeacherID) |
| Title | VARCHAR(150) | NOT NULL, CHECK(LENGTH 3-150) |
| Description | TEXT | NULL |
| Price | DECIMAL(12,2) | NOT NULL, CHECK(>=0) |
| StartDate | DATETIME | NOT NULL |
| EndDate | DATETIME | NOT NULL, CHECK(EndDate > StartDate) |
| Capacity | INT | NOT NULL, CHECK(>0) |
| Status | VARCHAR(20) | NOT NULL DEFAULT 'Draft', CHECK IN ('Draft','Upcoming','Active','Completed','Cancelled') |
| IsDeleted | TINYINT(1) | NOT NULL DEFAULT 0 |

**Functional Dependencies:**  
- CourseID → all other attributes (PK).  
- No other candidate keys (Title is not unique, TeacherID+StartDate could be unique but not enforced).  

**Prime Attributes:** CourseID  

**Check Constraints:**  
- `CK_Course_Title`: CHAR_LENGTH(Title) BETWEEN 3 AND 150  
- `CK_Course_Price`: Price >= 0  
- `CK_Course_Capacity`: Capacity > 0  
- `CK_Course_Status`: Status in given list  
- `CK_Course_Dates`: EndDate > StartDate  

**Highest Normal Form:** **BCNF**  

---

## 5. `Enrollment`

| Column | Type | Constraints |
|--------|------|-------------|
| EnrollmentID | INT | PK |
| StudentID | INT | NOT NULL, FK → Student(StudentID) |
| CourseID | INT | NOT NULL, FK → Course(CourseID) |
| EnrollmentDate | DATETIME | NOT NULL DEFAULT NOW() |
| Status | VARCHAR(20) | NOT NULL DEFAULT 'Pending', CHECK IN ('Pending','Successful','Failed','Dropped') |
| FinalScore | DECIMAL(4,2) | NULL, CHECK(0-20) |
| ProgressPercent | INT | NOT NULL DEFAULT 0, CHECK(0-100) |
| UNIQUE(StudentID, CourseID) | | |

**Functional Dependencies:**  
- EnrollmentID → all others (PK).  
- (StudentID, CourseID) → EnrollmentID, EnrollmentDate, Status, FinalScore, ProgressPercent (by unique constraint). So it is a candidate key.  

**Candidate Keys:** {EnrollmentID}, {StudentID, CourseID}  

**Prime Attributes:** EnrollmentID, StudentID, CourseID  

**Check Constraints:**  
- `CK_Enrollment_Status`: Status IN ('Pending','Successful','Failed','Dropped')  
- `CK_Enrollment_FinalScore`: FinalScore IS NULL OR BETWEEN 0 AND 20  
- `CK_Enrollment_Progress`: ProgressPercent BETWEEN 0 AND 100  

**Highest Normal Form:**  
- Table is in BCNF because every determinant is a candidate key. (The only non-trivial FDs are from candidate keys to others).  

---

## 6. `Assignment`

| Column | Type | Constraints |
|--------|------|-------------|
| AssignmentID | INT | PK |
| CourseID | INT | NOT NULL, FK → Course(CourseID) |
| Title | VARCHAR(150) | NOT NULL, CHECK(LENGTH 3-150) |
| Description | TEXT | NULL |
| DueDate | DATETIME | NOT NULL |
| MaxScore | DECIMAL(4,2) | NOT NULL, CHECK(>0 AND <=20) |

**Functional Dependencies:**  
- AssignmentID → all others.  
- No other candidate keys (CourseID+Title could be unique but not enforced).  

**Prime Attributes:** AssignmentID  

**Check Constraints:**  
- `CK_Assignment_Title`: CHAR_LENGTH(Title) BETWEEN 3 AND 150  
- `CK_Assignment_MaxScore`: MaxScore > 0 AND MaxScore <= 20  

**Highest Normal Form:** **BCNF**  

---

## 7. `Submission`

| Column | Type | Constraints |
|--------|------|-------------|
| SubmissionID | INT | PK |
| AssignmentID | INT | NOT NULL, FK → Assignment(AssignmentID) ON DELETE CASCADE |
| StudentID | INT | NOT NULL, FK → Student(StudentID) |
| SubmissionDate | DATETIME | NOT NULL DEFAULT NOW() |
| FileURL | VARCHAR(500) | NOT NULL |
| Score | DECIMAL(4,2) | NULL, CHECK(0-20) |
| Feedback | TEXT | NULL |
| UNIQUE(AssignmentID, StudentID) | | |

**Functional Dependencies:**  
- SubmissionID → all others.  
- (AssignmentID, StudentID) → SubmissionID, SubmissionDate, FileURL, Score, Feedback (by unique constraint).  
- Also, (AssignmentID, StudentID) → Score, Feedback, etc., but Score and Feedback also depend on the pair.  

**Candidate Keys:** {SubmissionID}, {AssignmentID, StudentID}  

**Prime Attributes:** SubmissionID, AssignmentID, StudentID  

**Check Constraints:**  
- `CK_Submission_Score`: Score IS NULL OR BETWEEN 0 AND 20  

**Highest Normal Form:** **BCNF** (no non-trivial FD that is not a superkey).  

---

## 8. `Attendance`

| Column | Type | Constraints |
|--------|------|-------------|
| AttendanceID | INT | PK |
| StudentID | INT | NOT NULL, FK → Student |
| CourseID | INT | NOT NULL, FK → Course |
| SessionDate | DATE | NOT NULL |
| Status | VARCHAR(20) | NOT NULL, CHECK IN ('Present','Absent') |
| UNIQUE(StudentID, CourseID, SessionDate) | | |

**Functional Dependencies:**  
- AttendanceID → all others.  
- (StudentID, CourseID, SessionDate) → AttendanceID, Status (by unique constraint).  

**Candidate Keys:** {AttendanceID}, {StudentID, CourseID, SessionDate}  

**Prime Attributes:** AttendanceID, StudentID, CourseID, SessionDate  

**Check Constraints:**  
- `CK_Attendance_Status`: Status IN ('Present','Absent')  

**Highest Normal Form:** **BCNF**  

---

## 9. `Payment`

| Column | Type | Constraints |
|--------|------|-------------|
| PaymentID | INT | PK |
| StudentID | INT | NOT NULL, FK → Student |
| CourseID | INT | NOT NULL, FK → Course |
| Amount | DECIMAL(12,2) | NOT NULL, CHECK(>=0) |
| PaymentDate | DATETIME | NOT NULL DEFAULT NOW() |
| Status | VARCHAR(20) | NOT NULL DEFAULT 'Pending', CHECK IN ('Pending','Successful','Failed','Refunded') |
| TransactionID | VARCHAR(100) | NULL, UNIQUE |

**Functional Dependencies:**  
- PaymentID → all others.  
- TransactionID → PaymentID (unique), hence all others.  
- No other candidate keys (StudentID+CourseID+PaymentDate could be multiple).  

**Candidate Keys:** {PaymentID}, {TransactionID} (if TransactionID is not null; nullable but unique)  

**Prime Attributes:** PaymentID, TransactionID  

**Check Constraints:**  
- `CK_Payment_Amount`: Amount >= 0  
- `CK_Payment_Status`: Status IN list  

**Highest Normal Form:** **BCNF**  

---

## 10. `Certificate`

| Column | Type | Constraints |
|--------|------|-------------|
| CertificateID | INT | PK |
| StudentID | INT | NOT NULL, FK → Student |
| CourseID | INT | NOT NULL, FK → Course |
| IssueDate | DATETIME | NOT NULL DEFAULT NOW() |
| CertificateCode | VARCHAR(100) | NOT NULL, UNIQUE |
| UNIQUE(StudentID, CourseID) | | |

**Functional Dependencies:**  
- CertificateID → all others.  
- CertificateCode → CertificateID, hence all others.  
- (StudentID, CourseID) → CertificateID, IssueDate, CertificateCode.  

**Candidate Keys:** {CertificateID}, {CertificateCode}, {StudentID, CourseID}  

**Prime Attributes:** CertificateID, CertificateCode, StudentID, CourseID  

**Highest Normal Form:** **BCNF**  

---

## 11. `FinancialReportLog`

| Column | Type | Constraints |
|--------|------|-------------|
| ReportID | INT | PK |
| ReportYear | INT | NULL |
| ReportMonth | INT | NULL |
| TotalRevenue | DECIMAL(18,2) | NULL |
| GeneratedAt | DATETIME | DEFAULT NOW() |

**Functional Dependencies:**  
- ReportID → all others.  
- No other candidate keys (reports can have same year/month but different generated time).  

**Prime Attributes:** ReportID  

**Highest Normal Form:** **BCNF**  

---

## 12. `Announcement`

| Column | Type | Constraints |
|--------|------|-------------|
| AnnouncementID | INT | PK |
| CourseID | INT | NOT NULL, FK → Course ON DELETE CASCADE |
| Title | VARCHAR(150) | NOT NULL, CHECK(LENGTH 3-150) |
| Content | TEXT | NOT NULL, CHECK(LENGTH >=1) |
| CreatedAt | DATETIME | NOT NULL DEFAULT NOW() |
| UpdatedAt | DATETIME | NOT NULL DEFAULT NOW() ON UPDATE |

**Functional Dependencies:**  
- AnnouncementID → all others.  
- No other candidate keys (CourseID+Title? not unique).  

**Prime Attributes:** AnnouncementID  

**Check Constraints:**  
- `CK_Announcement_Title`: CHAR_LENGTH(Title) BETWEEN 3 AND 150  
- `CK_Announcement_Content`: CHAR_LENGTH(Content) >= 1  

**Highest Normal Form:** **BCNF**  

---

## Summary Table

| Table | Candidate Keys | Prime Attributes | Highest Normal Form |
|-------|----------------|------------------|----------------------|
| User | {UserID}, {Email} | UserID, Email | BCNF |
| Student | {StudentID} | StudentID | BCNF |
| Teacher | {TeacherID} | TeacherID | BCNF |
| Course | {CourseID} | CourseID | BCNF |
| Enrollment | {EnrollmentID}, {StudentID, CourseID} | EnrollmentID, StudentID, CourseID | BCNF |
| Assignment | {AssignmentID} | AssignmentID | BCNF |
| Submission | {SubmissionID}, {AssignmentID, StudentID} | SubmissionID, AssignmentID, StudentID | BCNF |
| Attendance | {AttendanceID}, {StudentID, CourseID, SessionDate} | AttendanceID, StudentID, CourseID, SessionDate | BCNF |
| Payment | {PaymentID}, {TransactionID} | PaymentID, TransactionID | BCNF |
| Certificate | {CertificateID}, {CertificateCode}, {StudentID, CourseID} | CertificateID, CertificateCode, StudentID, CourseID | BCNF |
| FinancialReportLog | {ReportID} | ReportID | BCNF |
| Announcement | {AnnouncementID} | AnnouncementID | BCNF |

**Conclusion:** All tables are in **BCNF** (and therefore also in 3NF, 2NF, 1NF). The design avoids partial and transitive dependencies through proper use of primary keys and unique constraints.

And they are in **4NF, 5NF, 6NF** as well!.