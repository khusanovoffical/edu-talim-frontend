import asyncio
import json
import os
import sys

# Backend yo'lini qo'shish
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal, init_db
from app.core.security import get_password_hash
from app.models.models import (
    District, School, User, UserRole, ClassRoom, ClassEnrollment, ClassTeacher,
    Subject, Lesson, Exercise, QuestionType, ContentStatus, Assignment,
    AssignmentQuestion, Project, ProjectStatus, ExplanationStyle
)

async def seed():
    print("--> Ma'lumotlar bazasi jadvallarini ishga tushirish...")
    await init_db()

    async with AsyncSessionLocal() as db:
        # 1. Tumanni tekshirish va yaratish
        res = await db.execute(select(District).where(District.code == "chilonzor"))
        district = res.scalars().first()
        if not district:
            district = District(name="Chilonzor tumani", code="chilonzor")
            db.add(district)
            await db.commit()
            await db.refresh(district)
            print(f"[+] Tuman yaratildi: {district.name}")

        # 2. Maktablarni yaratish
        res_s = await db.execute(select(School).where(School.code == "maktab-217"))
        school_217 = res_s.scalars().first()
        if not school_217:
            school_217 = School(
                district_id=district.id,
                name="217-sonli umumta'lim maktabi",
                code="maktab-217",
                region="Toshkent shahri",
                district_name="Chilonzor tumani",
                director_name="Sobirov Alisher Rustamovich",
                director_phone="+998 90 123 45 67",
                address="Toshkent sh., Chilonzor tumani, 19-mavze",
                is_active=True
            )
            db.add(school_217)
            await db.commit()
            await db.refresh(school_217)
            print(f"[+] Maktab yaratildi: {school_217.name}")

        res_s2 = await db.execute(select(School).where(School.code == "maktab-14"))
        school_14 = res_s2.scalars().first()
        if not school_14:
            school_14 = School(
                district_id=district.id,
                name="14-sonli umumta'lim maktabi",
                code="maktab-14",
                region="Samarqand viloyati",
                district_name="Samarqand shahri",
                director_name="Qodirova Shahnoza Baxtiyorovna",
                director_phone="+998 91 987 65 43",
                address="Samarqand sh., Registon ko'chasi",
                is_active=True
            )
            db.add(school_14)
            await db.commit()
            await db.refresh(school_14)
            print(f"[+] Maktab yaratildi: {school_14.name}")

        # 3. 4 ta Aniq Rol Foydalanuvchilarini yaratish
        users_data = [
            ("admin@eduai.uz", "admin", "Boshqaruvchi Administrator", "AdminEduAI2026!", UserRole.ADMIN, None, school_217.id, "Bosh Admin"),
            ("zam217@eduai.uz", "zam217", "Zilola Ergasheva (Zam Direktor)", "ZamEduAI2026!", UserRole.SCHOOL_ADMIN, None, school_217.id, "Maktab Admini"),
            ("ustoz@eduai.uz", "ustoz_farhod", "Farhod Alimov (Ustoz)", "UstozEduAI2026!", UserRole.TEACHER, None, school_217.id, "Oliy toifali o'qituvchi"),
            ("nodir@eduai.uz", "nodir_dev", "Nodirbek Boboyev (O'quvchi)", "NodirEduAI2026!", UserRole.STUDENT, 9, school_217.id, "9-sinf o'quvchisi"),
        ]

        created_users = {}
        for email, username, name, pwd, role, grade, sc_id, pos in users_data:
            u_check = await db.execute(select(User).where(User.email == email))
            user = u_check.scalars().first()
            if not user:
                user = User(
                    email=email,
                    username=username,
                    full_name=name,
                    hashed_password=get_password_hash(pwd),
                    role=role,
                    grade=grade,
                    school_id=sc_id,
                    position=pos,
                    explanation_style=ExplanationStyle.STEP_BY_STEP,
                    is_active=True
                )
                db.add(user)
                await db.commit()
                await db.refresh(user)
                print(f"[+] Foydalanuvchi yaratildi: {user.email} ({user.role.value})")
            created_users[role] = user

        # 4. Sinflarni yaratish
        res_c = await db.execute(select(ClassRoom).where(ClassRoom.school_id == school_217.id, ClassRoom.name == "9-A"))
        class_9a = res_c.scalars().first()
        if not class_9a:
            class_9a = ClassRoom(school_id=school_217.id, name="9-A", grade=9, academic_year="2026-2027")
            db.add(class_9a)
            await db.commit()
            await db.refresh(class_9a)
            print(f"[+] Sinf yaratildi: {class_9a.name}")

            # O'qituvchini sinfga biriktirish
            ct = ClassTeacher(class_id=class_9a.id, teacher_id=created_users[UserRole.TEACHER].id)
            db.add(ct)
            # O'quvchini sinfga biriktirish
            ce = ClassEnrollment(class_id=class_9a.id, student_id=created_users[UserRole.STUDENT].id)
            db.add(ce)
            await db.commit()

        # 5. Fanlarni yaratish
        subjects_data = [
            ("Matematika", "math", "Aniq hisob-kitoblar, algebra va geometriya", "Calculator"),
            ("Ingliz tili", "english", "Chet tili grammatikasi, lug'at va suhbat ko'nikmalari", "Globe")
        ]
        created_subs = {}
        for s_name, code, desc, icon in subjects_data:
            s_chk = await db.execute(select(Subject).where(Subject.code == code))
            subj = s_chk.scalars().first()
            if not subj:
                subj = Subject(name=s_name, code=code, description=desc, icon=icon, is_active=True)
                db.add(subj)
                await db.commit()
                await db.refresh(subj)
                print(f"[+] Fan yaratildi: {subj.name}")
            created_subs[code] = subj

        # 6. Darslar (Lessons)
        lesson_data = [
            (
                created_subs["math"].id, 9, "Chiziqli tenglamalar va ularning yechimi",
                "Chiziqli tenglamalar asoslari",
                """# Chiziqli tenglamalar
$ax + b = 0$ ko'rinishidagi tenglama bir noma'lumli chiziqli tenglama deyiladi ($a \\neq 0$).

### Asosiy qoidalar:
1. Tenglikning bir tomonidagi hadni ikkinchi tomoniga qarama-qarshi ishora bilan o'tkazish mumkin.
2. Tenglikning har ikkala qismini noldan farqli bitta songa ko'paytirish yoki bo'lish mumkin.

### Misol:
3x - 9 = 0
3x = 9
x = 3
"""
            ),
            (
                created_subs["english"].id, 9, "Present Continuous Tense",
                "Hozirgi davomli zamon qoidalari",
                """# Present Continuous Tense
We use the Present Continuous for things that are happening right now!

### Formula:
`Subject + am / is / are + Verb-ing`

### Examples:
- I **am studying** EduAI right now.
- The students **are coding** an IT project.
"""
            )
        ]

        created_lessons = []
        for s_id, gr, title, desc, cont in lesson_data:
            l_chk = await db.execute(select(Lesson).where(Lesson.title == title))
            les = l_chk.scalars().first()
            if not les:
                les = Lesson(
                    subject_id=s_id, grade=gr, title=title, description=desc,
                    content_markdown=cont, status=ContentStatus.APPROVED,
                    created_by_id=created_users[UserRole.TEACHER].id
                )
                db.add(les)
                await db.commit()
                await db.refresh(les)
                print(f"[+] Dars yaratildi: {les.title}")
            created_lessons.append(les)

        # 7. Mashqlar va Testlar (Exercises)
        exercises_data = [
            (
                created_lessons[0].id, created_subs["math"].id, 9, "Chiziqli tenglamalar",
                "Tenglamani yeching: 4x + 8 = 24. x ning qiymatini toping.",
                QuestionType.NUMERIC, None, "4",
                "Dastlab 8 ni o'ng tomonga minus ishorasi bilan o'tkazing.",
                "4x = 16 bo'ladi. Endi 16 ni 4 ga bo'ling.",
                "To'g'ri yechim: 4x = 24 - 8 -> 4x = 16 -> x = 4."
            ),
            (
                created_lessons[0].id, created_subs["math"].id, 9, "Oddiy kasrlar",
                "3/5 + 1/5 ifodaning qiymatini hisoblang:",
                QuestionType.MULTIPLE_CHOICE, ["2/5", "4/5", "4/10", "1"], "4/5",
                "Maxrajlar bir xil bo'lgani uchun faqat suratlarni qo'shing.",
                "Maxraj o'zgarmasdan 5 qoladi, suratlar: 3 + 1 = 4.",
                "To'g'ri javob: 4/5."
            ),
            (
                created_lessons[1].id, created_subs["english"].id, 9, "Present Continuous",
                "Choose the correct sentence in Present Continuous:",
                QuestionType.MULTIPLE_CHOICE,
                ["She is play tennis now.", "She are playing tennis now.", "She is playing tennis now.", "She playing tennis now."],
                "She is playing tennis now.",
                "Ega 'She' bo'lgani uchun yordamchi fe'l 'is' bo'ladi.",
                "Asosiy fe'l esa -ing qo'shimchasi bilan keladi: playing.",
                "Subject + is + Verb-ing: She is playing tennis now."
            )
        ]

        created_exercises = []
        for l_id, s_id, gr, top, q_txt, q_typ, opts, ans, h1, h2, expl in exercises_data:
            e_chk = await db.execute(select(Exercise).where(Exercise.question_text == q_txt))
            ex = e_chk.scalars().first()
            if not ex:
                ex = Exercise(
                    lesson_id=l_id, subject_id=s_id, grade=gr, topic=top,
                    question_text=q_txt, question_type=q_typ,
                    options_json=json.dumps(opts) if opts else None,
                    correct_answer=ans, hint_1=h1, hint_2=h2, explanation=expl, points=10
                )
                db.add(ex)
                await db.commit()
                await db.refresh(ex)
                print(f"[+] Mashq yaratildi: {ex.topic}")
            created_exercises.append(ex)

        # 8. Topshiriq (Assignment)
        a_chk = await db.execute(select(Assignment).where(Assignment.title == "1-amaliy vazifa: Matematika va Ingliz tili"))
        if not a_chk.scalars().first():
            assign = Assignment(
                class_id=class_9a.id,
                teacher_id=created_users[UserRole.TEACHER].id,
                title="1-amaliy vazifa: Matematika va Ingliz tili",
                description="Ushbu topshiriq orqali chiziqli tenglamalar va zamonlarni mustahkamlang.",
                instructions="Savollarni diqqat bilan o'qib, o'z javobingizni tanlang yoki yozing.",
                status="published"
            )
            db.add(assign)
            await db.commit()
            await db.refresh(assign)

            for ex in created_exercises:
                aq = AssignmentQuestion(
                    assignment_id=assign.id,
                    exercise_id=ex.id,
                    question_text=ex.question_text,
                    question_type="multiple_choice" if ex.options_json else "open_text",
                    options_json=ex.options_json,
                    correct_answer=ex.correct_answer,
                    points=ex.points
                )
                db.add(aq)
            await db.commit()
            print(f"[+] Topshiriq yaratildi: {assign.title}")

        # 9. IT Yoshlar namunaviy loyihalari
        p_chk = await db.execute(select(Project).where(Project.title == "EduBot — Maktab uchun Telegram Bot"))
        if not p_chk.scalars().first():
            p1 = Project(
                school_id=school_217.id,
                owner_id=created_users[UserRole.STUDENT].id,
                title="EduBot — Maktab uchun Telegram Bot",
                description="Maktab dars jadvali va qo'ng'iroqlar vaqtini o'quvchilarga avtomatik yuboruvchi Python/Aiogram boti.",
                category="bot",
                team_members="Nodirbek Boboyev, Jasur Saidov",
                demo_url="https://t.me/EduBotDemo",
                repo_url="https://github.com/ityoshlar/edubot",
                status=ProjectStatus.APPROVED,
                mentor_id=created_users[UserRole.TEACHER].id,
                review_notes="Juda foydali va amaliy loyiha. Showcase ga tasdiqlandi."
            )
            p2 = Project(
                school_id=school_217.id,
                owner_id=created_users[UserRole.STUDENT].id,
                title="SmartEco — Maktab energiyasini tejash tizimi",
                description="Arduino va IoT sensorlari yordamida sinfxonalardagi chiroqlar va havoni nazorat qiluvchi aqlli qurilma.",
                category="robotics",
                team_members="Nodirbek Boboyev, Malika Rahimova",
                status=ProjectStatus.APPROVED
            )
            db.add_all([p1, p2])
            await db.commit()
            print("[+] IT Yoshlar namunaviy loyihalari yaratildi.")

    print("\n=== MA'LUMOTLAR MUVAFFAQIYATLI YUKLANDI ===")
    print("Yagona 4 ta rol hisoblari:")
    print("1. Bosh Admin:     admin@eduai.uz / AdminEduAI2026! (yoki login: admin)")
    print("2. Maktab Admini:  zam217@eduai.uz / ZamEduAI2026! (yoki login: zam217)")
    print("3. O'qituvchi:     ustoz@eduai.uz / UstozEduAI2026! (yoki login: ustoz_farhod)")
    print("4. O'quvchi:       nodir@eduai.uz / NodirEduAI2026! (yoki login: nodir_dev)")

if __name__ == "__main__":
    asyncio.run(seed())
