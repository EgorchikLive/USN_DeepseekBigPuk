from io import BytesIO
import unittest

from openpyxl import Workbook

from app.services.spreadsheet_data import SpreadsheetDataError, parse_workbook


def sample_workbook() -> bytes:
    workbook = Workbook()
    schedule = workbook.active
    schedule.title = "КУБОК ВЫЗОВА 2026 экспресс"
    schedule["A1"] = "КУБОК ВЫЗОВА: экспресс"
    schedule["A4"] = "13.06.2026 Конференция"
    schedule["M6"] = "Проблемные слоты: резерв на 06:55"
    for cell, value in {
        "A9": "Время",
        "B9": "№",
        "C9": "Игроки",
        "G9": "Судьи",
        "A10": "06:20-06:55\nГруппа А",
        "B10": 1,
        "G10": "JUDGE_001 1",
        "G11": "JUDGE_002 2",
        "A12": "06:55-07:30\nГруппа B",
        "B12": 2,
        "G12": "JUDGE_003 1",
    }.items():
        schedule[cell] = value

    responses = workbook.create_sheet("Ответы судей Кубок вызова экспр")
    responses["C1"] = "Фамилия Имя"
    responses["F1"] = "Email"
    responses["H1"] = "Город"
    responses["I1"] = "Клуб"
    responses["J1"] = "Как Вас представить участникам турнира?"
    responses["K1"] = "Прошу зарегистрировать меня в качестве судьи 13 июня 2026"
    responses["L1"] = "Прошу зарегистрировать меня в качестве судьи 14 июня 2026"
    responses["B2"] = "PERSON NAME"
    responses["C2"] = "JUDGE_001"
    responses["F2"] = "private@example.test"
    responses["H2"] = "Москва"
    responses["I2"] = "Клуб"
    responses["J2"] = "Краткое представление"
    responses["K2"] = "06:20-06:55"

    for sheet_name in ("Оценки ОС", "Оценки КС"):
        ratings = workbook.create_sheet(sheet_name)
        ratings.append(["ФИО судьи", "Критерий 1", "Критерий 2"])
        ratings.append(["JUDGE_001", 3, 2])
        ratings.append(["JUDGE_002", 1, 3])

    output = BytesIO()
    workbook.save(output)
    return output.getvalue()


class SpreadsheetDataTests(unittest.TestCase):
    def test_parses_schedule_applications_and_aggregated_ratings(self):
        data = parse_workbook(sample_workbook())

        self.assertEqual(len(data["tournaments"]), 1)
        tournament = data["tournaments"][0]
        self.assertEqual(tournament["id"], "tournament-01")
        self.assertEqual(tournament["date"], "13.06.2026")
        self.assertEqual(tournament["dates"], ["13.06.2026", "14.06.2026"])
        self.assertEqual(tournament["problematic_slots"], "резерв на 06:55")
        self.assertEqual(len(tournament["schedule"]), 2)
        self.assertEqual(
            tournament["schedule"][0]["judge_ids"],
            ["JUDGE_001", "JUDGE_002"],
        )
        self.assertEqual(tournament["schedule"][0]["assigned_judge_count"], 2)
        self.assertEqual(tournament["schedule"][1]["match_count"], 1)

        self.assertEqual(len(tournament["applications"]), 1)
        application = tournament["applications"][0]
        self.assertEqual(application["judge_id"], "JUDGE_001")
        self.assertEqual(application["city"], "Москва")
        self.assertEqual(application["availability"][0]["answer"], "06:20-06:55")
        self.assertNotIn("PERSON NAME", repr(application))
        self.assertNotIn("private@example.test", repr(application))

        os_ratings = next(
            item for item in data["ratings_summary"] if item["sheet"] == "Оценки ОС"
        )
        self.assertEqual(os_ratings["rated_judge_count"], 2)
        self.assertEqual(os_ratings["criteria"][0]["average"], 2.0)
        self.assertEqual(
            os_ratings["criteria"][0]["scores"],
            {"1": 1, "2": 0, "3": 1},
        )

    def test_rejects_non_workbook_content(self):
        with self.assertRaises(SpreadsheetDataError):
            parse_workbook(b"not an xlsx file")


if __name__ == "__main__":
    unittest.main()
