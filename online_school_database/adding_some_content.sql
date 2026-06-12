USE OnlineSchoolDB;

-- =====================================================
-- 1. به‌روزرسانی توضیحات برخی دوره‌ها (اختیاری)
-- =====================================================
UPDATE Course SET Description = CONCAT(Description, ' این دوره شامل پروژه‌های عملی و تمرین‌های تعاملی است.') WHERE CourseID IN (2, 3, 5, 7);

-- =====================================================
-- 2. افزودن تکالیف جدید برای دوره‌های مختلف
-- =====================================================

-- دوره 2 (Database Design - Active)
INSERT INTO Assignment (CourseID, Title, Description, DueDate, MaxScore) VALUES
(2, 'پروژه طراحی پایگاه داده', 'طراحی یک پایگاه داده برای سیستم کتابخانه با نرمال‌سازی تا 3NF و پیاده‌سازی SQL', DATE_ADD(NOW(), INTERVAL 15 DAY), 20),
(2, 'تمرین کوئری‌های پیشرفته', 'نوشتن ۱۰ کوئری JOIN و Subquery روی دیتابیس نمونه', DATE_ADD(NOW(), INTERVAL 5 DAY), 15);

-- دوره 3 (AI Fundamentals - Upcoming)
INSERT INTO Assignment (CourseID, Title, Description, DueDate, MaxScore) VALUES
(3, 'تمرین مقدماتی پایتون', 'نوشتن توابع پایه و کار با لیست‌ها برای آمادگی دوره هوش مصنوعی', DATE_ADD(NOW(), INTERVAL 20 DAY), 10),
(3, 'پروژه اول: طبقه‌بندی ساده', 'پیاده‌سازی یک طبقه‌بند KNN با داده‌های کوچک', DATE_ADD(NOW(), INTERVAL 35 DAY), 20);

-- دوره 5 (Algorithms - Active)
INSERT INTO Assignment (CourseID, Title, Description, DueDate, MaxScore) VALUES
(5, 'تحلیل پیچیدگی زمانی', 'محاسبه O(n) برای الگوریتم‌های داده شده و مقایسه', DATE_ADD(NOW(), INTERVAL 7 DAY), 15),
(5, 'پیاده‌سازی الگوریتم مرتب‌سازی سریع', 'نوشتن QuickSort و آنالیز آن', DATE_ADD(NOW(), INTERVAL 14 DAY), 20);

-- دوره 7 (Cloud Computing - Upcoming)
INSERT INTO Assignment (CourseID, Title, Description, DueDate, MaxScore) VALUES
(7, 'آشنایی با AWS S3', 'ایجاد یک bucket و آپلود فایل از طریق CLI', DATE_ADD(NOW(), INTERVAL 30 DAY), 10);

-- =====================================================
-- 3. افزودن اعلان‌های جدید (Announcements)
-- =====================================================

-- دوره 2
INSERT INTO Announcement (CourseID, Title, Content) VALUES
(2, 'نکات مهم پروژه', 'حتماً فایل توضیحات پروژه را مطالعه کنید. مهلت ارسال: ۱۵ روز دیگر.'),
(2, 'تغییر در زمان کلاس', 'جلسه این هفته به جای سه‌شنبه، چهارشنبه برگزار می‌شود.');

-- دوره 3
INSERT INTO Announcement (CourseID, Title, Content) VALUES
(3, 'شروع دوره', 'به دوره هوش مصنوعی خوش آمدید. پیش‌نیازها را بررسی کنید.'),
(3, 'منابع مطالعه', 'کتاب‌های معرفی شده در سرفصل، لطفاً فصل ۱ و ۲ را مطالعه کنید.');

-- دوره 5
INSERT INTO Announcement (CourseID, Title, Content) VALUES
(5, 'تمرین اول', 'تمرین تحلیل پیچیدگی زمان فردا منتشر می‌شود.'),
(5, 'تست آنلاین', 'یک آزمون کوتاه در هفته آینده برگزار خواهد شد.');

-- دوره 7
INSERT INTO Announcement (CourseID, Title, Content) VALUES
(7, 'پیش‌نیازها', 'حتماً یک حساب AWS Free Tier ایجاد کنید.'),
(7, 'برنامه جلسات', 'ساعت برگزاری: شنبه‌ها ۱۸ تا ۲۰');

-- =====================================================
-- 4. در صورت نیاز، افزودن محتوای متنی یا توضیحات اضافی برای درس‌ها
-- (می‌توان از فیلد Description خود دوره استفاده کرد که قبلاً به‌روز شد)
-- =====================================================

-- نمایش خلاصه تغییرات برای تأیید
SELECT 'تمامی تغییرات با موفقیت اعمال شد.' AS Status;