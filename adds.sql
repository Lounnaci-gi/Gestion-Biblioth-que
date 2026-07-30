USE GestionBibliotheque;
GO

-- ============================================================================
-- adds.sql (version idempotente)
-- Chaque INSERT est maintenant protégé par NOT EXISTS / IF NOT EXISTS afin de
-- pouvoir relancer ce script autant de fois que nécessaire sans provoquer
-- d'erreurs de clé dupliquée ni de plantage en cascade.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Établissement (une seule ligne attendue en usage normal)
-- ----------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM Etablissement)
BEGIN
    INSERT INTO Etablissement (Raison_Sociale, Type_Etablissement, Adresse, Telephone, Fax, Email, Site_Web)
    VALUES (N'ثانوية الأمير عبد القادر', N'ثانوية', N'شارع الاستقلال، المدية', '025000000', '025000001', 'contact@exemple-lycee.dz', 'www.exemple-lycee.dz');
END
GO

-- ----------------------------------------------------------------------------
-- 2. Catégories : on ne garde que celles qui n'existent pas encore
-- ----------------------------------------------------------------------------
INSERT INTO Categories (Nom_Categorie)
SELECT V.Nom_Categorie
FROM (VALUES
    (N'تاريخ'),
    (N'علوم'),
    (N'طب'),
    (N'رياضيات'),
    (N'كيمياء'),
    (N'أدب وثقافة'),
    (N'فلسفة'),
    (N'تكنولوجيا ومعلوماتية'),
    (N'فيزياء'),
    (N'اقتصاد وتسيير')
) AS V(Nom_Categorie)
WHERE NOT EXISTS (
    SELECT 1 FROM Categories C WHERE C.Nom_Categorie = V.Nom_Categorie
);
GO

-- ----------------------------------------------------------------------------
-- 3. Emplacements : on ne garde que les combinaisons Rang/Étage/Catégorie
--    qui n'existent pas encore. On résout ID_Categorie via JOIN plutôt que
--    de dépendre d'un insert précédent qui aurait pu échouer.
-- ----------------------------------------------------------------------------
INSERT INTO Emplacements (Rang, Etage, ID_Categorie)
SELECT V.Rang, V.Etage, C.ID_Categorie
FROM (VALUES
    ('A', 4, N'تاريخ'),
    ('A', 1, N'علوم'),
    ('A', 2, N'طب'),
    ('A', 3, N'رياضيات'),
    ('B', 1, N'كيمياء'),
    ('B', 2, N'أدب وثقافة'),
    ('B', 3, N'فلسفة'),
    ('C', 1, N'تكنولوجيا ومعلوماتية'),
    ('C', 2, N'فيزياء'),
    ('C', 3, N'اقتصاد وتسيير')
) AS V(Rang, Etage, Nom_Categorie)
JOIN Categories C ON C.Nom_Categorie = V.Nom_Categorie
WHERE NOT EXISTS (
    SELECT 1 FROM Emplacements E
    WHERE E.Rang = V.Rang AND E.Etage = V.Etage AND E.ID_Categorie = C.ID_Categorie
);
GO

-- ----------------------------------------------------------------------------
-- 4. Adhérents : on filtre sur l'email (unique) pour ne pas ré-insérer
-- ----------------------------------------------------------------------------
INSERT INTO Adherents (Nom, Prenom, Adresse, Email, Telephone, Specialite, Classe_Section, Statut)
SELECT V.Nom, V.Prenom, V.Adresse, V.Email, V.Telephone, V.Specialite, V.Classe_Section, V.Statut
FROM (VALUES
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
    (N'مباركي', N'وليد', N'شارع زيغود يوسف، أدرار', 'walid.msebarki@email.com', '0661000020', N'جيولوجيا', N'سنة ثانية', N'نشط')
) AS V(Nom, Prenom, Adresse, Email, Telephone, Specialite, Classe_Section, Statut)
WHERE NOT EXISTS (
    SELECT 1 FROM Adherents A WHERE A.Email = V.Email
);
GO

-- ============================================================================
-- 5. Livres (10 thèmes × 10 livres)
--    Chaque bloc résout ID_Emplacement via JOIN (pas de variable DECLARE
--    qui pourrait rester NULL si un insert précédent avait échoué), et
--    filtre sur ISBN (unique) pour ne pas ré-insérer.
-- ============================================================================

-- A. تاريخ
INSERT INTO Livres (Titre, ISBN, Auteur, Editeur, Annee_Publication, Quantite_Totale, Quantite_Disponible, ID_Emplacement)
SELECT V.Titre, V.ISBN, V.Auteur, V.Editeur, V.Annee, V.QteTot, V.QteDispo, E.ID_Emplacement
FROM (VALUES
    (N'تاريخ الجزائر الحديث', '978-9961-0-0001-1', N'أبو القاسم سعد الله', N'المؤسسة الوطنية للكتاب', 1998, 5, 5),
    (N'مقدمة ابن خلدون', '978-9961-0-0002-8', N'ابن خلدون', N'دار المعارف', 2005, 3, 3),
    (N'تاريخ الأمة العربية', '978-9961-0-0003-5', N'محمد عزة دروزة', N'دار الشروق', 2001, 4, 4),
    (N'الثورة الجزائرية في عامها الأول', '978-9961-0-0004-2', N'محمد العربي مدني', N'دار الأمة', 2008, 2, 2),
    (N'الحضارة الإسلامية عبر العصور', '978-9961-0-0005-9', N'راغب السرجاني', N'دار اقرأ', 2012, 6, 6),
    (N'أعلام الفكر التاريخي', '978-9961-0-0006-6', N'عبد العزيز الدوري', N'مركز الدراسات العربية', 2010, 3, 3),
    (N'تاريخ المغرب العربي', '978-9961-0-0007-3', N'جاليصي جيلالي', N'ديوان المطبوعات الجامعية', 1995, 4, 4),
    (N'معركة الجزائر', '978-9961-0-0008-0', N'ياسف سعدي', N'دار الحكمة', 2003, 5, 5),
    (N'الدولة العثمانية تاريخ وحضارة', '978-9961-0-0009-7', N'أكمل الدين إحسان أوغلو', N'دار الشروق', 2015, 2, 2),
    (N'وجوه جزائرية في التاريخ', '978-9961-0-0010-3', N'مهدي بوعبدلي', N'المؤسسة الوطنية للكتاب', 2000, 3, 3)
) AS V(Titre, ISBN, Auteur, Editeur, Annee, QteTot, QteDispo)
JOIN Emplacements E ON E.Rang = 'A'
JOIN Categories C ON C.ID_Categorie = E.ID_Categorie AND C.Nom_Categorie = N'تاريخ'
WHERE NOT EXISTS (SELECT 1 FROM Livres L WHERE L.ISBN = V.ISBN);
GO

-- B. علوم
INSERT INTO Livres (Titre, ISBN, Auteur, Editeur, Annee_Publication, Quantite_Totale, Quantite_Disponible, ID_Emplacement)
SELECT V.Titre, V.ISBN, V.Auteur, V.Editeur, V.Annee, V.QteTot, V.QteDispo, E.ID_Emplacement
FROM (VALUES
    (N'موسوعة العلوم العامة', '978-9961-0-0011-0', N'أحمد زكي', N'دار الفكر العربي', 2010, 4, 4),
    (N'مبادئ العلوم الطبيعية', '978-9961-0-0012-7', N'علي مصطفى مشرفة', N'دار المعارف', 2008, 5, 5),
    (N'قصة العلوم', '978-9961-0-0013-4', N'أنا جينر', N'العبيكان للنشر', 2014, 3, 3),
    (N'مناهج البحث العلمي', '978-9961-0-0014-1', N'عبد الرحمن بدوي', N'دار النهضة العربية', 2002, 6, 6),
    (N'الكون والتصميم البديع', '978-9961-0-0015-8', N'جون لينوكس', N'دار الفكر', 2018, 2, 2),
    (N'تاريخ الكشوف العلمية', '978-9961-0-0016-5', N'إسحاق أزيموف', N'دار الشروق', 2005, 3, 3),
    (N'مقدمة في علم البيئة', '978-9961-0-0017-2', N'حسن أحمد', N'ديوان المطبوعات الجامعية', 2011, 4, 4),
    (N'تاريخ النظريات العلمية', '978-9961-0-0018-9', N'سمير حلمي', N'دار الثقافة', 2009, 2, 2),
    (N'الفلك والكون الحديث', '978-9961-0-0019-6', N'يوسف البابا', N'المكتبة العصرية', 2016, 5, 5),
    (N'العلوم والتكنولوجيا في المجتمع', '978-9961-0-0020-2', N'محمد السيد', N'دار النهضة', 2013, 3, 3)
) AS V(Titre, ISBN, Auteur, Editeur, Annee, QteTot, QteDispo)
JOIN Emplacements E ON E.Rang = 'A'
JOIN Categories C ON C.ID_Categorie = E.ID_Categorie AND C.Nom_Categorie = N'علوم'
WHERE NOT EXISTS (SELECT 1 FROM Livres L WHERE L.ISBN = V.ISBN);
GO

-- C. طب
INSERT INTO Livres (Titre, ISBN, Auteur, Editeur, Annee_Publication, Quantite_Totale, Quantite_Disponible, ID_Emplacement)
SELECT V.Titre, V.ISBN, V.Auteur, V.Editeur, V.Annee, V.QteTot, V.QteDispo, E.ID_Emplacement
FROM (VALUES
    (N'القانون في الطب', '978-9961-0-0021-9', N'ابن سينا', N'دار الكتب العلمية', 2004, 3, 3),
    (N'مبادئ علم التشريح', '978-9961-0-0022-6', N'صالح النفيسي', N'دار العلوم للنشر', 2012, 4, 4),
    (N'علم وظائف الأعضاء', '978-9961-0-0023-3', N'خالد منصور', N'ديوان المطبوعات الجامعية', 2010, 5, 5),
    (N'الطب الوقائي والصحة العامة', '978-9961-0-0024-0', N'منى خليل', N'دار الفكر العربي', 2015, 2, 2),
    (N'دليل أدوية العصر', '978-9961-0-0025-7', N'محمد علي', N'المكتبة الطبية', 2019, 6, 6),
    (N'تاريخ الطب عند العرب', '978-9961-0-0026-4', N'أمين رويحة', N'دار القلم', 2001, 3, 3),
    (N'أمراض الباطنة والتغشية', '978-9961-0-0027-1', N'حسن عبد الله', N'الدار العربية للنشر', 2013, 4, 4),
    (N'مبادئ جراحة اليوم الواحد', '978-9961-0-0028-8', N'عادل حسني', N'دار الصحافة الطبية', 2017, 2, 2),
    (N'تغذية الإنسان والإمراضية', '978-9961-0-0029-5', N'سعاد سليمان', N'دار المعرفة', 2011, 5, 5),
    (N'الإسعافات الأولية والتصرف', '978-9961-0-0030-1', N'طارق الهلالي', N'دار الهلال', 2018, 4, 4)
) AS V(Titre, ISBN, Auteur, Editeur, Annee, QteTot, QteDispo)
JOIN Emplacements E ON E.Rang = 'A'
JOIN Categories C ON C.ID_Categorie = E.ID_Categorie AND C.Nom_Categorie = N'طب'
WHERE NOT EXISTS (SELECT 1 FROM Livres L WHERE L.ISBN = V.ISBN);
GO

-- D. رياضيات
INSERT INTO Livres (Titre, ISBN, Auteur, Editeur, Annee_Publication, Quantite_Totale, Quantite_Disponible, ID_Emplacement)
SELECT V.Titre, V.ISBN, V.Auteur, V.Editeur, V.Annee, V.QteTot, V.QteDispo, E.ID_Emplacement
FROM (VALUES
    (N'مبادئ التحليل الرياضي', '978-9961-0-0031-8', N'أحمد مصطفى', N'ديوان المطبوعات الجامعية', 2008, 4, 4),
    (N'الجبر الخطي وتطبيقاته', '978-9961-0-0032-5', N'عماد خليل', N'دار الفكر', 2012, 5, 5),
    (N'الهندسة التحليلية والفضائية', '978-9961-0-0033-2', N'سعيد عبد الله', N'دار المعارف', 2005, 3, 3),
    (N'حساب التفاضل والتكامل', '978-9961-0-0034-9', N'محمد عثمان', N'الدار الجامعية', 2014, 6, 6),
    (N'مقدمة في الاحتمالات والإحصاء', '978-9961-0-0035-6', N'فؤاد زكي', N'دار الشروق', 2010, 4, 4),
    (N'تاريخ الرياضيات عند المسلمين', '978-9961-0-0036-3', N'علي الدفاع', N'دار الكاتب العربي', 1999, 2, 2),
    (N'المعادلات التفاضلية وتطبيقاتها', '978-9961-0-0037-0', N'حسن خليل', N'ديوان المطبوعات الجامعية', 2016, 3, 3),
    (N'الرياضيات المتقطعة', '978-9961-0-0038-7', N'سامي مهدي', N'دار العلم', 2013, 5, 5),
    (N'المنطق الرياضي ونظرية المجموعات', '978-9961-0-0039-4', N'جمال سالم', N'دار المعرفة', 2007, 2, 2),
    (N'أولمبياد الرياضيات المسائل والحلول', '978-9961-0-0040-0', N'وليد الشافعي', N'دار التربية', 2018, 4, 4)
) AS V(Titre, ISBN, Auteur, Editeur, Annee, QteTot, QteDispo)
JOIN Emplacements E ON E.Rang = 'A'
JOIN Categories C ON C.ID_Categorie = E.ID_Categorie AND C.Nom_Categorie = N'رياضيات'
WHERE NOT EXISTS (SELECT 1 FROM Livres L WHERE L.ISBN = V.ISBN);
GO

-- E. كيمياء
INSERT INTO Livres (Titre, ISBN, Auteur, Editeur, Annee_Publication, Quantite_Totale, Quantite_Disponible, ID_Emplacement)
SELECT V.Titre, V.ISBN, V.Auteur, V.Editeur, V.Annee, V.QteTot, V.QteDispo, E.ID_Emplacement
FROM (VALUES
    (N'الكيمياء العامة والدقائق', '978-9961-0-0041-7', N'حسن بيك', N'دار الكتب الجامعية', 2009, 5, 5),
    (N'الكيمياء العضوية الحديثة', '978-9961-0-0042-4', N'صالح زكي', N'ديوان المطبوعات الجامعية', 2014, 4, 4),
    (N'الكيمياء غير العضوية', '978-9961-0-0043-1', N'عبد العزيز نصر', N'دار المعارف', 2006, 3, 3),
    (N'الكيمياء الفيزيائية وتطبيقاتها', '978-9961-0-0044-8', N'محمد الجابري', N'دار الفكر العلمي', 2011, 5, 5),
    (N'الكيمياء التحليلية الكمية', '978-9961-0-0045-5', N'مصطفى كمال', N'الدار العربية للنشر', 2015, 2, 2),
    (N'كيمياء الأغذية والتحليل الغذائي', '978-9961-0-0046-2', N'منى إبراهيم', N'دار العلوم', 2017, 3, 3),
    (N'تجارب في الكيمياء العملية', '978-9961-0-0047-9', N'كمال فهمي', N'ديوان المطبوعات الجامعية', 2008, 6, 6),
    (N'الكيمياء الحيوية الطبية', '978-9961-0-0048-6', N'سعد الدين', N'دار الشروق', 2013, 4, 4),
    (N'جدول العناصر والتفاعلات', '978-9961-0-0049-3', N'طارق النجار', N'دار العبيكان', 2019, 3, 3),
    (N'التلوث الكيميائي للبيئة', '978-9961-0-0050-9', N'عادل مشرفة', N'دار الفكر العربي', 2010, 2, 2)
) AS V(Titre, ISBN, Auteur, Editeur, Annee, QteTot, QteDispo)
JOIN Emplacements E ON E.Rang = 'B'
JOIN Categories C ON C.ID_Categorie = E.ID_Categorie AND C.Nom_Categorie = N'كيمياء'
WHERE NOT EXISTS (SELECT 1 FROM Livres L WHERE L.ISBN = V.ISBN);
GO

-- F. أدب وثقافة
INSERT INTO Livres (Titre, ISBN, Auteur, Editeur, Annee_Publication, Quantite_Totale, Quantite_Disponible, ID_Emplacement)
SELECT V.Titre, V.ISBN, V.Auteur, V.Editeur, V.Annee, V.QteTot, V.QteDispo, E.ID_Emplacement
FROM (VALUES
    (N'ذاكرة الجسد', '978-9961-0-0051-6', N'أحلام مستغانمي', N'دار الآداب', 1993, 5, 5),
    (N'الدار الكبيرة', '978-9961-0-0052-3', N'محمد ديب', N'دار الأمة', 1980, 4, 4),
    (N'الزلزال', '978-9961-0-0053-0', N'الطاهر وطار', N'المؤسسة الوطنية للكتاب', 1974, 3, 3),
    (N'ريح الجنوب', '978-9961-0-0054-7', N'عبد الحميد بن هدوقة', N'دار الكاتب الجزائري', 1971, 4, 4),
    (N'ثلاثية القاهرة', '978-9961-0-0055-4', N'نجيب محفوظ', N'دار الشروق', 1956, 6, 6),
    (N'ديوان مفدي زكرياء', '978-9961-0-0056-1', N'مفدي زكرياء', N'المؤسسة الوطنية للكتاب', 1985, 5, 5),
    (N'الأعمال الكاملة للإبراهيمي', '978-9961-0-0057-8', N'محمد البشير الإبراهيمي', N'دار الغرب الإسلامي', 1997, 2, 2),
    (N'تاريخ الأدب العربي', '978-9961-0-0058-5', N'شوقي ضيف', N'دار المعارف', 1960, 4, 4),
    (N'النقد الأدبي الحديث', '978-9961-0-0059-2', N'محمد مندور', N'نهضة مصر', 2002, 3, 3),
    (N'رصيف أزهار لا يجيب', '978-9961-0-0060-8', N'مالك حداد', N'دار الأمة', 1968, 3, 3)
) AS V(Titre, ISBN, Auteur, Editeur, Annee, QteTot, QteDispo)
JOIN Emplacements E ON E.Rang = 'B'
JOIN Categories C ON C.ID_Categorie = E.ID_Categorie AND C.Nom_Categorie = N'أدب وثقافة'
WHERE NOT EXISTS (SELECT 1 FROM Livres L WHERE L.ISBN = V.ISBN);
GO

-- G. فلسفة
INSERT INTO Livres (Titre, ISBN, Auteur, Editeur, Annee_Publication, Quantite_Totale, Quantite_Disponible, ID_Emplacement)
SELECT V.Titre, V.ISBN, V.Auteur, V.Editeur, V.Annee, V.QteTot, V.QteDispo, E.ID_Emplacement
FROM (VALUES
    (N'شروط النهضة', '978-9961-0-0061-5', N'مالك بن نبي', N'دار الفكر', 1960, 5, 5),
    (N'وجهة العالم الإسلامي', '978-9961-0-0062-2', N'مالك بن نبي', N'دار الفكر', 1970, 4, 4),
    (N'تاريخ الفلسفة اليونانية', '978-9961-0-0063-9', N'يوسف كرم', N'دار القلم', 1985, 3, 3),
    (N'تهافت الفلاسفة', '978-9961-0-0064-6', N'أبو حامد الغزالي', N'دار المعارف', 1998, 4, 4),
    (N'تهافت التهافت', '978-9961-0-0065-3', N'ابن رشد', N'مركز دراسات الوحدة العربية', 2001, 3, 3),
    (N'الفلسفة الحديثة والتنوير', '978-9961-0-0066-0', N'مراد وهبة', N'دار قباء', 2005, 2, 2),
    (N'نقد العقل العربي', '978-9961-0-0067-7', N'محمد عابد الجابري', N'مركز دراسات الوحدة العربية', 1984, 5, 5),
    (N'فلسفة التنوير', '978-9961-0-0068-4', N'إرنست كاسيرر', N'دار التنوير', 2008, 2, 2),
    (N'منطق الكشف العلمي', '978-9961-0-0069-1', N'كارل بوبر', N'دار الفكر الفلسفي', 2006, 3, 3),
    (N'الفكر العربي في عصر النهضة', '978-9961-0-0070-7', N'ألبرت حوراني', N'دار النهار', 1997, 4, 4)
) AS V(Titre, ISBN, Auteur, Editeur, Annee, QteTot, QteDispo)
JOIN Emplacements E ON E.Rang = 'B'
JOIN Categories C ON C.ID_Categorie = E.ID_Categorie AND C.Nom_Categorie = N'فلسفة'
WHERE NOT EXISTS (SELECT 1 FROM Livres L WHERE L.ISBN = V.ISBN);
GO

-- H. تكنولوجيا ومعلوماتية
INSERT INTO Livres (Titre, ISBN, Auteur, Editeur, Annee_Publication, Quantite_Totale, Quantite_Disponible, ID_Emplacement)
SELECT V.Titre, V.ISBN, V.Auteur, V.Editeur, V.Annee, V.QteTot, V.QteDispo, E.ID_Emplacement
FROM (VALUES
    (N'أساسيات البرمجة بلغة بايثون', '978-9961-0-0071-4', N'أحمد حسن', N'دار العلوم والتكنولوجيا', 2020, 6, 6),
    (N'قواعد البيانات ونظم إدارة SQL', '978-9961-0-0072-1', N'خالد السعدي', N'دار الفكر العربي', 2018, 5, 5),
    (N'شباكات الكمبيوتر والأمن السيبراني', '978-9961-0-0073-8', N'محمد الفارس', N'الدار الجامعية', 2021, 4, 4),
    (N'مقدمة في الذكاء الاصطناعي', '978-9961-0-0074-5', N'وليد سامي', N'العبيكان للنشر', 2022, 5, 5),
    (N'تطوير تطبيقات الويب الحديثة', '978-9961-0-0075-2', N'ياسر جابر', N'دار المعرفة التكنولوجية', 2019, 3, 3),
    (N'هندسة البرمجيات والتصميم', '978-9961-0-0076-9', N'عمر الشريف', N'ديوان المطبوعات الجامعية', 2017, 4, 4),
    (N'أنظمة التشغيل المتقدمة', '978-9961-0-0077-6', N'طارق محمود', N'دار الثقافة الرقمية', 2016, 3, 3),
    (N'خوارزميات وهياكل البيانات', '978-9961-0-0078-3', N'إبراهيم كامل', N'دار العلوم', 2015, 5, 5),
    (N'إنترنت الأشياء والثورة الرقمية', '978-9961-0-0079-0', N'سليم القاضي', N'دار النهضة العلمية', 2023, 4, 4),
    (N'تعلم آلة مع بايثون', '978-9961-0-0080-6', N'رمزي جلال', N'دار التقنية', 2021, 3, 3)
) AS V(Titre, ISBN, Auteur, Editeur, Annee, QteTot, QteDispo)
JOIN Emplacements E ON E.Rang = 'C'
JOIN Categories C ON C.ID_Categorie = E.ID_Categorie AND C.Nom_Categorie = N'تكنولوجيا ومعلوماتية'
WHERE NOT EXISTS (SELECT 1 FROM Livres L WHERE L.ISBN = V.ISBN);
GO

-- I. فيزياء
INSERT INTO Livres (Titre, ISBN, Auteur, Editeur, Annee_Publication, Quantite_Totale, Quantite_Disponible, ID_Emplacement)
SELECT V.Titre, V.ISBN, V.Auteur, V.Editeur, V.Annee, V.QteTot, V.QteDispo, E.ID_Emplacement
FROM (VALUES
    (N'الفيزياء العامة للمهندسين', '978-9961-0-0081-3', N'محمود الشاذلي', N'ديوان المطبوعات الجامعية', 2010, 5, 5),
    (N'ميكانيكا الكم وتطبيقاتها', '978-9961-0-0082-0', N'علي زكي', N'دار الفكر العربي', 2014, 3, 3),
    (N'النظرية النسبية لآينشتاين', '978-9961-0-0083-7', N'مصطفى محمود', N'دار المعارف', 1995, 4, 4),
    (N'الفيزياء النووية والجسيمات', '978-9961-0-0084-4', N'حسن نصر', N'دار العلوم للنشر', 2012, 2, 2),
    (N'الكهرومغناطيسية الكلاسيكية', '978-9961-0-0085-1', N'سامي العلي', N'الدار الجامعية', 2016, 4, 4),
    (N'فيزياء الحالة الصلبة', '978-9961-0-0086-8', N'فاروق فاروق', N'ديوان المطبوعات', 2009, 3, 3),
    (N'الديناميكا الحرارية وتطبيقاتها', '978-9961-0-0087-5', N'كمال فهمي', N'دار الثقافة', 2011, 5, 5),
    (N'البصريات والفيزياء الموجية', '978-9961-0-0088-2', N'عماد عبد النور', N'دار المعرفة', 2013, 4, 4),
    (N'مقدمة في الفيزياء الفلكية', '978-9961-0-0089-9', N'جمال الدين', N'دار الشروق', 2017, 3, 3),
    (N'تاريخ الفيزياء وتطور العلوم', '978-9961-0-0090-5', N'أحمد الفولي', N'دار القلم', 2007, 2, 2)
) AS V(Titre, ISBN, Auteur, Editeur, Annee, QteTot, QteDispo)
JOIN Emplacements E ON E.Rang = 'C'
JOIN Categories C ON C.ID_Categorie = E.ID_Categorie AND C.Nom_Categorie = N'فيزياء'
WHERE NOT EXISTS (SELECT 1 FROM Livres L WHERE L.ISBN = V.ISBN);
GO

-- J. اقتصاد وتسيير
INSERT INTO Livres (Titre, ISBN, Auteur, Editeur, Annee_Publication, Quantite_Totale, Quantite_Disponible, ID_Emplacement)
SELECT V.Titre, V.ISBN, V.Auteur, V.Editeur, V.Annee, V.QteTot, V.QteDispo, E.ID_Emplacement
FROM (VALUES
    (N'مبادئ الاقتصاد الكلي', '978-9961-0-0091-2', N'سامي خليل', N'دار النهضة العربية', 2011, 5, 5),
    (N'المحاسبة العامة والتسيير المالي', '978-9961-0-0092-9', N'محمد البشير', N'ديوان المطبوعات الجامعية', 2015, 6, 6),
    (N'إدارة الأعمال والمؤسسات', '978-9961-0-0093-6', N'علي السلمي', N'دار الفكر العربي', 2008, 4, 4),
    (N'التسويق الاستراتيجي الحديث', '978-9961-0-0094-3', N'محمود العساف', N'دار العبيكان', 2018, 3, 3),
    (N'الاقتصاد الإسلامي وتطبيقاته المعاصرة', '978-9961-0-0095-0', N'عمر المتروك', N'دار الشروق', 2013, 4, 4),
    (N'المالية العامة والتشريعات الجبائية', '978-9961-0-0096-7', N'عبد المجيد القاضي', N'دار العلوم', 2012, 2, 2),
    (N'إدارة الموارد البشرية', '978-9961-0-0097-4', N'حسن إبراهيم', N'الدار الجامعية', 2016, 5, 5),
    (N'التجارة الدولية والعولمة', '978-9961-0-0098-1', N'فؤاد عبد المنعم', N'دار المعرفة', 2010, 3, 3),
    (N'القيادة والابتكار الإداري', '978-9961-0-0099-8', N'طارق سويدان', N'دار الأجيال', 2019, 4, 4),
    (N'تحليل المشاريع الاستثمارية', '978-9961-0-0100-1', N'وليد عبد اللطيف', N'ديوان المطبوعات الجامعية', 2014, 3, 3)
) AS V(Titre, ISBN, Auteur, Editeur, Annee, QteTot, QteDispo)
JOIN Emplacements E ON E.Rang = 'C'
JOIN Categories C ON C.ID_Categorie = E.ID_Categorie AND C.Nom_Categorie = N'اقتصاد وتسيير'
WHERE NOT EXISTS (SELECT 1 FROM Livres L WHERE L.ISBN = V.ISBN);
GO

-- ============================================================================
-- 6. Vérification
-- ============================================================================
SELECT COUNT(*) AS [Établissements] FROM Etablissement;
SELECT COUNT(*) AS [Catégories] FROM Categories;
SELECT COUNT(*) AS [Emplacements] FROM Emplacements;
SELECT COUNT(*) AS [Adhérents] FROM Adherents;
SELECT COUNT(*) AS [Livres] FROM Livres;
GO