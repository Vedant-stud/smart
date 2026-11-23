import unittest

from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.models
from app.db.database import Base
from app.db.deps import get_accessible_farm_or_404
from app.models.farm import Farm
from app.models.task import Task
from app.models.user import User
from app.routers.tasks import create_task, list_tasks
from app.schemas.task import TaskCreate
from app.schemas.user import UserCreate


class FarmAccessTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://")
        Base.metadata.create_all(self.engine)
        self.session = sessionmaker(bind=self.engine)()

        self.owner = self._create_user("farmer", "owner@example.com")
        self.other = self._create_user("farmer", "other@example.com")
        self.agronomist = self._create_user("agronomist", "agronomist@example.com")
        self.farm = Farm(owner_id=self.owner.id, name="Test farm", location_text="Test location")
        self.other_farm = Farm(owner_id=self.other.id, name="Other farm", location_text="Other location")
        self.session.add_all([self.farm, self.other_farm])
        self.session.commit()

    def tearDown(self):
        self.session.close()
        self.engine.dispose()

    def _create_user(self, role: str, email: str) -> User:
        user = User(
            full_name="Test User",
            email=email,
            hashed_password="not-a-real-password",
            role=role,
        )
        self.session.add(user)
        self.session.commit()
        return user

    def test_owner_and_privileged_roles_can_access_farm(self):
        self.assertEqual(get_accessible_farm_or_404(self.session, self.farm.id, self.owner).id, self.farm.id)
        self.assertEqual(
            get_accessible_farm_or_404(self.session, self.farm.id, self.agronomist).id,
            self.farm.id,
        )

    def test_other_farmer_cannot_access_farm(self):
        with self.assertRaises(HTTPException) as error:
            get_accessible_farm_or_404(self.session, self.farm.id, self.other)
        self.assertEqual(error.exception.status_code, 403)

    def test_missing_farm_returns_not_found(self):
        with self.assertRaises(HTTPException) as error:
            get_accessible_farm_or_404(self.session, -1, self.owner)
        self.assertEqual(error.exception.status_code, 404)

    def test_task_list_only_returns_owned_farm_records(self):
        self.session.add_all([
            Task(farm_id=self.farm.id, title="Owner task"),
            Task(farm_id=self.other_farm.id, title="Other task"),
        ])
        self.session.commit()

        tasks = list_tasks(None, None, self.session, self.owner)
        self.assertEqual({task.title for task in tasks}, {"Owner task"})

    def test_cannot_create_task_for_another_farm(self):
        payload = TaskCreate(farm_id=self.other_farm.id, title="Unauthorized task")
        with self.assertRaises(HTTPException) as error:
            create_task(payload, self.session, self.owner)
        self.assertEqual(error.exception.status_code, 403)

    def test_public_registration_cannot_assign_privileged_role(self):
        with self.assertRaises(ValidationError):
            UserCreate(
                full_name="Test User",
                email="new@example.com",
                password="password",
                role="admin",
            )


if __name__ == "__main__":
    unittest.main()
