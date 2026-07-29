USE GestionBibliotheque;
GO

INSERT INTO Etablissement (Raison_Sociale, Type_Etablissement, Adresse, Telephone, Fax, Email, Site_Web)
VALUES (N'ثانوية الأمير عبد القادر', N'ثانوية', N'شارع الاستقلال، المدية', '025000000', '025000001', 'contact@exemple-lycee.dz', 'www.exemple-lycee.dz');

INSERT INTO Categories (Nom_Categorie) VALUES
    (N'تاريخ'),
    (N'علوم'),
    (N'طب'),
    (N'رياضيات'),
    (N'كيمياء'),
    (N'أدب وثقافة'),
    (N'فلسفة'),
    (N'تكنولوجيا ومعلوماتية'),
    (N'فيزياء'),
    (N'اقتصاد وتسيير');
GO

-- ============================================================================
-- 6. CRÉATION DES EMPLACEMENTS PHYSIQUES
-- ============================================================================
INSERT INTO Emplacements (Rang, Etage, ID_Categorie)
SELECT 'A', 4, ID_Categorie FROM Categories WHERE Nom_Categorie = N'تاريخ' UNION ALL
SELECT 'A', 1, ID_Categorie FROM Categories WHERE Nom_Categorie = N'علوم' UNION ALL
SELECT 'A', 2, ID_Categorie FROM Categories WHERE Nom_Categorie = N'طب' UNION ALL
SELECT 'A', 3, ID_Categorie FROM Categories WHERE Nom_Categorie = N'رياضيات' UNION ALL
SELECT 'B', 1, ID_Categorie FROM Categories WHERE Nom_Categorie = N'كيمياء' UNION ALL
SELECT 'B', 2, ID_Categorie FROM Categories WHERE Nom_Categorie = N'أدب وثقافة' UNION ALL
SELECT 'B', 3, ID_Categorie FROM Categories WHERE Nom_Categorie = N'فلسفة' UNION ALL
SELECT 'C', 1, ID_Categorie FROM Categories WHERE Nom_Categorie = N'تكنولوجيا ومعلوماتية' UNION ALL
SELECT 'C', 2, ID_Categorie FROM Categories WHERE Nom_Categorie = N'فيزياء' UNION ALL
SELECT 'C', 3, ID_Categorie FROM Categories WHERE Nom_Categorie = N'اقتصاد وتسيير';
GO

-- ============================================================================
-- 7. INSERTION DE 20 ADHÉRENTS (En arabe uniquement)
-- ============================================================================
INSERT INTO Adherents (Nom, Prenom, Adresse, Email, Telephone, Specialite, Classe_Section, Statut) VALUES
(N'بن علي', N'محمد', N'حي المجاهدين، المدية', 'mohamed.benali@email.com', '0661000001', N'معلوماتية', N'سنة أولى', N'نشط'),
(N'قاسمي', N'أحمد', N'شارع القدس، الجزائر', 'ahmed.kacemi@email.com', '0661000002', N'رياضيات', N'سنة ثانية', N'نشط'),
(N'زروقي', N'فاطمة', N'حي النصر، البليدة', 'fatima.zerrouki@email.com', '0661000003', N'علوم الطبيعة', N'سنة ثالثة', N'نشط'),
(N'سليماني', N'ياسين', N'شارع أول نوفمبر، وهران', 'yassine.soltani@email.com', '0661000004', N'فيزياء', N'سنة أولى', N'نشط'),
(N'علاوي', N'مريم', N'حي البساتين، قسنطينة', 'meriem.allaoui@email.com', '0661000005', N'أدب عربي', N'سنة ثانية', N'نشط'),
(N'حاجي', N'عمر', N'شارع الاستقلال، سطيف', 'omar.hadji@email.com', '0661000006', N'تاريخ', N'سنة ثالثة', N'غير نشط'),
(N'بوداوود', N'أمينة', N'حي السلام، باتنة', 'amina.boudaoud@email.com', '0661000007', N'كيمياء', N'سنة أولى', N'نشط'),
(N'طاهري', N'خالد', N'شارع الحرية، تلمسان', 'khaled.taheri@email.com', '0661000008', N'إلكترونيك', N'سنة ثانية', N'نشط'),
(N'حمداني', N'سارة', N'حي الزهور، عنابة', 'sara.hamdani@email.com', '0661000009', N'اقتصاد', N'سنة ثالثة', N'نشط'),
(N'منصوري', N'عبد القادر', N'شارع جيش التحرير، الشلف', 'abdelkader.mansouri@email.com', '0661000010', N'حقوق', N'سنة أولى', N'موقوف'),
(N'بوعزيز', N'إيمان', N'حي الوفاء، بجاية', 'imen.bouaziz@email.com', '0661000011', N'لغات أجنبية', N'سنة ثانية', N'نشط'),
(N'رحماني', N'بلال', N'شارع فلسطين، بسكرة', 'bilal.rahmani@email.com', '0661000012', N'ميكانيك', N'سنة ثالثة', N'نشط'),
(N'شريف', N'خديجة', N'حي الصنوبر، الجلفة', 'khadija.cherif@email.com', '0661000013', N'علوم إسلامية', N'سنة أولى', N'نشط'),
(N'مصباحي', N'رضوان', N'شارع العربي بن مهيدي، مستغانم', 'redouane.mesbahi@email.com', '0661000014', N'بيولوجيا', N'سنة ثانية', N'نشط'),
(N'سعدي', N'أسماء', N'حي الأمل، تارت', 'asma.saadi@email.com', '0661000015', N'طب عام', N'سنة ثالثة', N'نشط'),
(N'عثماني', N'حمزة', N'شارع ديدوش مراد، سكيكدة', 'hamza.osmani@email.com', '0661000016', N'صيدلة', N'سنة أولى', N'نشط'),
(N'فارس', N'زينب', N'حي النور، المسيلة', 'zeineb.fares@email.com', '0661000017', N'هندسة مدنية', N'سنة ثانية', N'نشط'),
(N'براهمي', N'يوسف', N'شارع الشهداء، خنشلة', 'youssef.brahmi@email.com', '0661000018', N'إعلام آلي', N'سنة ثالثة', N'نشط'),
(N'دراجي', N'نور الهدى', N'حي الورود، غليزان', 'nour.daradji@email.com', '0661000019', N'فلسفة', N'سنة أولى', N'نشط'),
(N'مباركي', N'وليد', N'شارع زيغود يوسف، أدرار', 'walid.msebarki@email.com', '0661000020', N'جيولوجيا', N'سنة ثانية', N'نشط');
GO

-- ============================================================================
-- 8. INSERTION DE 100 LIVRES (10 THÈMES × 10 LIVRES)
-- ============================================================================

-- A. THÈME : تاريخ (10 livres)
DECLARE @Emp_Histoire INT = (SELECT E.ID_Emplacement FROM Emplacements E JOIN Categories C ON E.ID_Categorie = C.ID_Categorie WHERE C.Nom_Categorie = N'تاريخ' AND E.Rang = 'A');
INSERT INTO Livres (Titre, ISBN, Auteur, Editeur, Annee_Publication, Quantite_Totale, Quantite_Disponible, ID_Emplacement) VALUES
(N'تاريخ الجزائر الحديث', '978-9961-0-0001-1', N'أبو القاسم سعد الله', N'المؤسسة الوطنية للكتاب', 1998, 5, 5, @Emp_Histoire),
(N'مقدمة ابن خلدون', '978-9961-0-0002-8', N'ابن خلدون', N'دار المعارف', 2005, 3, 3, @Emp_Histoire),
(N'تاريخ الأمة العربية', '978-9961-0-0003-5', N'محمد عزة دروزة', N'دار الشروق', 2001, 4, 4, @Emp_Histoire),
(N'الثورة الجزائرية في عامها الأول', '978-9961-0-0004-2', N'محمد العربي مدني', N'دار الأمة', 2008, 2, 2, @Emp_Histoire),
(N'الحضارة الإسلامية عبر العصور', '978-9961-0-0005-9', N'راغب السرجاني', N'دار اقرأ', 2012, 6, 6, @Emp_Histoire),
(N'أعلام الفكر التاريخي', '978-9961-0-0006-6', N'عبد العزيز الدوري', N'مركز الدراسات العربية', 2010, 3, 3, @Emp_Histoire),
(N'تاريخ المغرب العربي', '978-9961-0-0007-3', N'جاليصي جيلالي', N'ديوان المطبوعات الجامعية', 1995, 4, 4, @Emp_Histoire),
(N'معركة الجزائر', '978-9961-0-0008-0', N'ياسف سعدي', N'دار الحكمة', 2003, 5, 5, @Emp_Histoire),
(N'الدولة العثمانية تاريخ وحضارة', '978-9961-0-0009-7', N'أكمل الدين إحسان أوغلو', N'دار الشروق', 2015, 2, 2, @Emp_Histoire),
(N'وجوه جزائرية في التاريخ', '978-9961-0-0010-3', N'مهدي بوعبدلي', N'المؤسسة الوطنية للكتاب', 2000, 3, 3, @Emp_Histoire);

-- B. THÈME : علوم (10 livres)
DECLARE @Emp_Sciences INT = (SELECT E.ID_Emplacement FROM Emplacements E JOIN Categories C ON E.ID_Categorie = C.ID_Categorie WHERE C.Nom_Categorie = N'علوم' AND E.Rang = 'A');
INSERT INTO Livres (Titre, ISBN, Auteur, Editeur, Annee_Publication, Quantite_Totale, Quantite_Disponible, ID_Emplacement) VALUES
(N'موسوعة العلوم العامة', '978-9961-0-0011-0', N'أحمد زكي', N'دار الفكر العربي', 2010, 4, 4, @Emp_Sciences),
(N'مبادئ العلوم الطبيعية', '978-9961-0-0012-7', N'علي مصطفى مشرفة', N'دار المعارف', 2008, 5, 5, @Emp_Sciences),
(N'قصة العلوم', '978-9961-0-0013-4', N'أنا جينر', N'العبيكان للنشر', 2014, 3, 3, @Emp_Sciences),
(N'مناهج البحث العلمي', '978-9961-0-0014-1', N'عبد الرحمن بدوي', N'دار النهضة العربية', 2002, 6, 6, @Emp_Sciences),
(N'الكون والتصميم البديع', '978-9961-0-0015-8', N'جون لينوكس', N'دار الفكر', 2018, 2, 2, @Emp_Sciences),
(N'تاريخ الكشوف العلمية', '978-9961-0-0016-5', N'إسحاق أزيموف', N'دار الشروق', 2005, 3, 3, @Emp_Sciences),
(N'مقدمة في علم البيئة', '978-9961-0-0017-2', N'حسن أحمد', N'ديوان المطبوعات الجامعية', 2011, 4, 4, @Emp_Sciences),
(N'تاريخ النظريات العلمية', '978-9961-0-0018-9', N'سمير حلمي', N'دار الثقافة', 2009, 2, 2, @Emp_Sciences),
(N'الفلك والكون الحديث', '978-9961-0-0019-6', N'يوسف البابا', N'المكتبة العصرية', 2016, 5, 5, @Emp_Sciences),
(N'العلوم والتكنولوجيا في المجتمع', '978-9961-0-0020-2', N'محمد السيد', N'دار النهضة', 2013, 3, 3, @Emp_Sciences);

-- C. THÈME : طب (10 livres)
DECLARE @Emp_Medecine INT = (SELECT E.ID_Emplacement FROM Emplacements E JOIN Categories C ON E.ID_Categorie = C.ID_Categorie WHERE C.Nom_Categorie = N'طب' AND E.Rang = 'A');
INSERT INTO Livres (Titre, ISBN, Auteur, Editeur, Annee_Publication, Quantite_Totale, Quantite_Disponible, ID_Emplacement) VALUES
(N'القانون في الطب', '978-9961-0-0021-9', N'ابن سينا', N'دار الكتب العلمية', 2004, 3, 3, @Emp_Medecine),
(N'مبادئ علم التشريح', '978-9961-0-0022-6', N'صالح النفيسي', N'دار العلوم للنشر', 2012, 4, 4, @Emp_Medecine),
(N'علم وظائف الأعضاء', '978-9961-0-0023-3', N'خالد منصور', N'ديوان المطبوعات الجامعية', 2010, 5, 5, @Emp_Medecine),
(N'الطب الوقائي والصحة العامة', '978-9961-0-0024-0', N'منى خليل', N'دار الفكر العربي', 2015, 2, 2, @Emp_Medecine),
(N'دليل أدوية العصر', '978-9961-0-0025-7', N'محمد علي', N'المكتبة الطبية', 2019, 6, 6, @Emp_Medecine),
(N'تاريخ الطب عند العرب', '978-9961-0-0026-4', N'أمين رويحة', N'دار القلم', 2001, 3, 3, @Emp_Medecine),
(N'أمراض الباطنة والتغشية', '978-9961-0-0027-1', N'حسن عبد الله', N'الدار العربية للنشر', 2013, 4, 4, @Emp_Medecine),
(N'مبادئ جراحة اليوم الواحد', '978-9961-0-0028-8', N'عادل حسني', N'دار الصحافة الطبية', 2017, 2, 2, @Emp_Medecine),
(N'تغذية الإنسان والإمراضية', '978-9961-0-0029-5', N'سعاد سليمان', N'دار المعرفة', 2011, 5, 5, @Emp_Medecine),
(N'الإسعافات الأولية والتصرف', '978-9961-0-0030-1', N'طارق الهلالي', N'دار الهلال', 2018, 4, 4, @Emp_Medecine);

-- D. THÈME : رياضيات (10 livres)
DECLARE @Emp_Math INT = (SELECT E.ID_Emplacement FROM Emplacements E JOIN Categories C ON E.ID_Categorie = C.ID_Categorie WHERE C.Nom_Categorie = N'رياضيات' AND E.Rang = 'A');
INSERT INTO Livres (Titre, ISBN, Auteur, Editeur, Annee_Publication, Quantite_Totale, Quantite_Disponible, ID_Emplacement) VALUES
(N'مبادئ التحليل الرياضي', '978-9961-0-0031-8', N'أحمد مصطفى', N'ديوان المطبوعات الجامعية', 2008, 4, 4, @Emp_Math),
(N'الجبر الخطي وتطبيقاته', '978-9961-0-0032-5', N'عماد خليل', N'دار الفكر', 2012, 5, 5, @Emp_Math),
(N'الهندسة التحليلية والفضائية', '978-9961-0-0033-2', N'سعيد عبد الله', N'دار المعارف', 2005, 3, 3, @Emp_Math),
(N'حساب التفاضل والتكامل', '978-9961-0-0034-9', N'محمد عثمان', N'الدار الجامعية', 2014, 6, 6, @Emp_Math),
(N'مقدمة في الاحتمالات والإحصاء', '978-9961-0-0035-6', N'فؤاد زكي', N'دار الشروق', 2010, 4, 4, @Emp_Math),
(N'تاريخ الرياضيات عند المسلمين', '978-9961-0-0036-3', N'علي الدفاع', N'دار الكاتب العربي', 1999, 2, 2, @Emp_Math),
(N'المعادلات التفاضلية وتطبيقاتها', '978-9961-0-0037-0', N'حسن خليل', N'ديوان المطبوعات الجامعية', 2016, 3, 3, @Emp_Math),
(N'الرياضيات المتقطعة', '978-9961-0-0038-7', N'سامي مهدي', N'دار العلم', 2013, 5, 5, @Emp_Math),
(N'المنطق الرياضي ونظرية المجموعات', '978-9961-0-0039-4', N'جمال سالم', N'دار المعرفة', 2007, 2, 2, @Emp_Math),
(N'أولمبياد الرياضيات المسائل والحلول', '978-9961-0-0040-0', N'وليد الشافعي', N'دار التربية', 2018, 4, 4, @Emp_Math);

-- E. THÈME : كيمياء (10 livres)
DECLARE @Emp_Chimie INT = (SELECT E.ID_Emplacement FROM Emplacements E JOIN Categories C ON E.ID_Categorie = C.ID_Categorie WHERE C.Nom_Categorie = N'كيمياء' AND E.Rang = 'B');
INSERT INTO Livres (Titre, ISBN, Auteur, Editeur, Annee_Publication, Quantite_Totale, Quantite_Disponible, ID_Emplacement) VALUES
(N'الكيمياء العامة والدقائق', '978-9961-0-0041-7', N'حسن بيك', N'دار الكتب الجامعية', 2009, 5, 5, @Emp_Chimie),
(N'الكيمياء العضوية الحديثة', '978-9961-0-0042-4', N'صالح زكي', N'ديوان المطبوعات الجامعية', 2014, 4, 4, @Emp_Chimie),
(N'الكيمياء غير العضوية', '978-9961-0-0043-1', N'عبد العزيز نصر', N'دار المعارف', 2006, 3, 3, @Emp_Chimie),
(N'الكيمياء الفيزيائية وتطبيقاتها', '978-9961-0-0044-8', N'محمد الجابري', N'دار الفكر العلمي', 2011, 5, 5, @Emp_Chimie),
(N'الكيمياء التحليلية الكمية', '978-9961-0-0045-5', N'مصطفى كمال', N'الدار العربية للنشر', 2015, 2, 2, @Emp_Chimie),
(N'كيمياء الأغذية والتحليل الغذائي', '978-9961-0-0046-2', N'منى إبراهيم', N'دار العلوم', 2017, 3, 3, @Emp_Chimie),
(N'تجارب في الكيمياء العملية', '978-9961-0-0047-9', N'كمال فهمي', N'ديوان المطبوعات الجامعية', 2008, 6, 6, @Emp_Chimie),
(N'الكيمياء الحيوية الطبية', '978-9961-0-0048-6', N'سعد الدين', N'دار الشروق', 2013, 4, 4, @Emp_Chimie),
(N'جدول العناصر والتفاعلات', '978-9961-0-0049-3', N'طارق النجار', N'دار العبيكان', 2019, 3, 3, @Emp_Chimie),
(N'التلوث الكيميائي للبيئة', '978-9961-0-0050-9', N'عادل مشرفة', N'دار الفكر العربي', 2010, 2, 2, @Emp_Chimie);

-- F. THÈME : أدب وثقافة (10 livres)
DECLARE @Emp_Litterature INT = (SELECT E.ID_Emplacement FROM Emplacements E JOIN Categories C ON E.ID_Categorie = C.ID_Categorie WHERE C.Nom_Categorie = N'أدب وثقافة' AND E.Rang = 'B');
INSERT INTO Livres (Titre, ISBN, Auteur, Editeur, Annee_Publication, Quantite_Totale, Quantite_Disponible, ID_Emplacement) VALUES
(N'ذاكرة الجسد', '978-9961-0-0051-6', N'أحلام مستغانمي', N'دار الآداب', 1993, 5, 5, @Emp_Litterature),
(N'الدار الكبيرة', '978-9961-0-0052-3', N'محمد ديب', N'دار الأمة', 1980, 4, 4, @Emp_Litterature),
(N'الزلزال', '978-9961-0-0053-0', N'الطاهر وطار', N'المؤسسة الوطنية للكتاب', 1974, 3, 3, @Emp_Litterature),
(N'ريح الجنوب', '978-9961-0-0054-7', N'عبد الحميد بن هدوقة', N'دار الكاتب الجزائري', 1971, 4, 4, @Emp_Litterature),
(N'ثلاثية القاهرة', '978-9961-0-0055-4', N'نجيب محفوظ', N'دار الشروق', 1956, 6, 6, @Emp_Litterature),
(N'ديوان مفدي زكرياء', '978-9961-0-0056-1', N'مفدي زكرياء', N'المؤسسة الوطنية للكتاب', 1985, 5, 5, @Emp_Litterature),
(N'الأعمال الكاملة للإبراهيمي', '978-9961-0-0057-8', N'محمد البشير الإبراهيمي', N'دار الغرب الإسلامي', 1997, 2, 2, @Emp_Litterature),
(N'تاريخ الأدب العربي', '978-9961-0-0058-5', N'شوقي ضيف', N'دار المعارف', 1960, 4, 4, @Emp_Litterature),
(N'النقد الأدبي الحديث', '978-9961-0-0059-2', N'محمد مندور', N'نهضة مصر', 2002, 3, 3, @Emp_Litterature),
(N'رصيف أزهار لا يجيب', '978-9961-0-0060-8', N'مالك حداد', N'دار الأمة', 1968, 3, 3, @Emp_Litterature);

-- G. THÈME : فلسفة (10 livres)
DECLARE @Emp_Philosophie INT = (SELECT E.ID_Emplacement FROM Emplacements E JOIN Categories C ON E.ID_Categorie = C.ID_Categorie WHERE C.Nom_Categorie = N'فلسفة' AND E.Rang = 'B');
INSERT INTO Livres (Titre, ISBN, Auteur, Editeur, Annee_Publication, Quantite_Totale, Quantite_Disponible, ID_Emplacement) VALUES
(N'شروط النهضة', '978-9961-0-0061-5', N'مالك بن نبي', N'دار الفكر', 1960, 5, 5, @Emp_Philosophie),
(N'وجهة العالم الإسلامي', '978-9961-0-0062-2', N'مالك بن نبي', N'دار الفكر', 1970, 4, 4, @Emp_Philosophie),
(N'تاريخ الفلسفة اليونانية', '978-9961-0-0063-9', N'يوسف كرم', N'دار القلم', 1985, 3, 3, @Emp_Philosophie),
(N'تهافت الفلاسفة', '978-9961-0-0064-6', N'أبو حامد الغزالي', N'دار المعارف', 1998, 4, 4, @Emp_Philosophie),
(N'تهافت التهافت', '978-9961-0-0065-3', N'ابن رشد', N'مركز دراسات الوحدة العربية', 2001, 3, 3, @Emp_Philosophie),
(N'الفلسفة الحديثة والتنوير', '978-9961-0-0066-0', N'مراد وهبة', N'دار قباء', 2005, 2, 2, @Emp_Philosophie),
(N'نقد العقل العربي', '978-9961-0-0067-7', N'محمد عابد الجابري', N'مركز دراسات الوحدة العربية', 1984, 5, 5, @Emp_Philosophie),
(N'فلسفة التنوير', '978-9961-0-0068-4', N'إرنست كاسيرر', N'دار التنوير', 2008, 2, 2, @Emp_Philosophie),
(N'منطق الكشف العلمي', '978-9961-0-0069-1', N'كارل بوبر', N'دار الفكر الفلسفي', 2006, 3, 3, @Emp_Philosophie),
(N'الفكر العربي في عصر النهضة', '978-9961-0-0070-7', N'ألبرت حوراني', N'دار النهار', 1997, 4, 4, @Emp_Philosophie);

-- H. THÈME : تكنولوجيا ومعلوماتية (10 livres)
DECLARE @Emp_Informatique INT = (SELECT E.ID_Emplacement FROM Emplacements E JOIN Categories C ON E.ID_Categorie = C.ID_Categorie WHERE C.Nom_Categorie = N'تكنولوجيا ومعلوماتية' AND E.Rang = 'C');
INSERT INTO Livres (Titre, ISBN, Auteur, Editeur, Annee_Publication, Quantite_Totale, Quantite_Disponible, ID_Emplacement) VALUES
(N'أساسيات البرمجة بلغة بايثون', '978-9961-0-0071-4', N'أحمد حسن', N'دار العلوم والتكنولوجيا', 2020, 6, 6, @Emp_Informatique),
(N'قواعد البيانات ونظم إدارة SQL', '978-9961-0-0072-1', N'خالد السعدي', N'دار الفكر العربي', 2018, 5, 5, @Emp_Informatique),
(N'شباكات الكمبيوتر والأمن السيبراني', '978-9961-0-0073-8', N'محمد الفارس', N'الدار الجامعية', 2021, 4, 4, @Emp_Informatique),
(N'مقدمة في الذكاء الاصطناعي', '978-9961-0-0074-5', N'وليد سامي', N'العبيكان للنشر', 2022, 5, 5, @Emp_Informatique),
(N'تطوير تطبيقات الويب الحديثة', '978-9961-0-0075-2', N'ياسر جابر', N'دار المعرفة التكنولوجية', 2019, 3, 3, @Emp_Informatique),
(N'هندسة البرمجيات والتصميم', '978-9961-0-0076-9', N'عمر الشريف', N'ديوان المطبوعات الجامعية', 2017, 4, 4, @Emp_Informatique),
(N'أنظمة التشغيل المتقدمة', '978-9961-0-0077-6', N'طارق محمود', N'دار الثقافة الرقمية', 2016, 3, 3, @Emp_Informatique),
(N'خوارزميات وهياكل البيانات', '978-9961-0-0078-3', N'إبراهيم كامل', N'دار العلوم', 2015, 5, 5, @Emp_Informatique),
(N'إنترنت الأشياء والثورة الرقمية', '978-9961-0-0079-0', N'سليم القاضي', N'دار النهضة العلمية', 2023, 4, 4, @Emp_Informatique),
(N'تعلم آلة مع بايثون', '978-9961-0-0080-6', N'رمزي جلال', N'دار التقنية', 2021, 3, 3, @Emp_Informatique);

-- I. THÈME : فيزياء (10 livres)
DECLARE @Emp_Physique INT = (SELECT E.ID_Emplacement FROM Emplacements E JOIN Categories C ON E.ID_Categorie = C.ID_Categorie WHERE C.Nom_Categorie = N'فيزياء' AND E.Rang = 'C');
INSERT INTO Livres (Titre, ISBN, Auteur, Editeur, Annee_Publication, Quantite_Totale, Quantite_Disponible, ID_Emplacement) VALUES
(N'الفيزياء العامة للمهندسين', '978-9961-0-0081-3', N'محمود الشاذلي', N'ديوان المطبوعات الجامعية', 2010, 5, 5, @Emp_Physique),
(N'ميكانيكا الكم وتطبيقاتها', '978-9961-0-0082-0', N'علي زكي', N'دار الفكر العربي', 2014, 3, 3, @Emp_Physique),
(N'النظرية النسبية لآينشتاين', '978-9961-0-0083-7', N'مصطفى محمود', N'دار المعارف', 1995, 4, 4, @Emp_Physique),
(N'الفيزياء النووية والجسيمات', '978-9961-0-0084-4', N'حسن نصر', N'دار العلوم للنشر', 2012, 2, 2, @Emp_Physique),
(N'الكهرومغناطيسية الكلاسيكية', '978-9961-0-0085-1', N'سامي العلي', N'الدار الجامعية', 2016, 4, 4, @Emp_Physique),
(N'فيزياء الحالة الصلبة', '978-9961-0-0086-8', N'فاروق فاروق', N'ديوان المطبوعات', 2009, 3, 3, @Emp_Physique),
(N'الديناميكا الحرارية وتطبيقاتها', '978-9961-0-0087-5', N'كمال فهمي', N'دار الثقافة', 2011, 5, 5, @Emp_Physique),
(N'البصريات والفيزياء الموجية', '978-9961-0-0088-2', N'عماد عبد النور', N'دار المعرفة', 2013, 4, 4, @Emp_Physique),
(N'مقدمة في الفيزياء الفلكية', '978-9961-0-0089-9', N'جمال الدين', N'دار الشروق', 2017, 3, 3, @Emp_Physique),
(N'تاريخ الفيزياء وتطور العلوم', '978-9961-0-0090-5', N'أحمد الفولي', N'دار القلم', 2007, 2, 2, @Emp_Physique);

-- J. THÈME : اقتصاد وتسيير (10 livres)
DECLARE @Emp_Economie INT = (SELECT E.ID_Emplacement FROM Emplacements E JOIN Categories C ON E.ID_Categorie = C.ID_Categorie WHERE C.Nom_Categorie = N'اقتصاد وتسيير' AND E.Rang = 'C');
INSERT INTO Livres (Titre, ISBN, Auteur, Editeur, Annee_Publication, Quantite_Totale, Quantite_Disponible, ID_Emplacement) VALUES
(N'مبادئ الاقتصاد الكلي', '978-9961-0-0091-2', N'سامي خليل', N'دار النهضة العربية', 2011, 5, 5, @Emp_Economie),
(N'المحاسبة العامة والتسيير المالي', '978-9961-0-0092-9', N'محمد البشير', N'ديوان المطبوعات الجامعية', 2015, 6, 6, @Emp_Economie),
(N'إدارة الأعمال والمؤسسات', '978-9961-0-0093-6', N'علي السلمي', N'دار الفكر العربي', 2008, 4, 4, @Emp_Economie),
(N'التسويق الاستراتيجي الحديث', '978-9961-0-0094-3', N'محمود العساف', N'دار العبيكان', 2018, 3, 3, @Emp_Economie),
(N'الاقتصاد الإسلامي وتطبيقاته المعاصرة', '978-9961-0-0095-0', N'عمر المتروك', N'دار الشروق', 2013, 4, 4, @Emp_Economie),
(N'المالية العامة والتشريعات الجبائية', '978-9961-0-0096-7', N'عبد المجيد القاضي', N'دار العلوم', 2012, 2, 2, @Emp_Economie),
(N'إدارة الموارد البشرية', '978-9961-0-0097-4', N'حسن إبراهيم', N'الدار الجامعية', 2016, 5, 5, @Emp_Economie),
(N'التجارة الدولية والعولمة', '978-9961-0-0098-1', N'فؤاد عبد المنعم', N'دار المعرفة', 2010, 3, 3, @Emp_Economie),
(N'القيادة والابتكار الإداري', '978-9961-0-0099-8', N'طارق سويدان', N'دار الأجيال', 2019, 4, 4, @Emp_Economie),
(N'تحليل المشاريع الاستثمارية', '978-9961-0-0100-1', N'وليد عبد اللطيف', N'ديوان المطبوعات الجامعية', 2014, 3, 3, @Emp_Economie);
GO

-- ============================================================================
-- 9. VÉRIFICATION DU RÉSULTAT FINAL
-- ============================================================================
SELECT COUNT(*) AS [Adhérents créés (Cible: 20)] FROM Adherents;
SELECT COUNT(*) AS [Livres créés (Cible: 100)] FROM Livres;
SELECT COUNT(*) AS [Catégories créées] FROM Categories;
GO