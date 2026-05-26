from typing import Any

from zerver.lib.test_classes import ZulipTestCase

import zerver.worker.base as worker_base


# Dummy para utilizar la cola
class DummyWorker(worker_base.QueueProcessingWorker):
    queue_name = "dummy_queue"

    def consume(self, data: dict[str, Any]) -> None:
        pass


# Tests elaborados por Gael Ruiz

# Test
class BaseTest(ZulipTestCase):
    def beforeEach(self) -> None:
        super().beforeEach()
        worker_base.worker_classes.clear()
        worker_base.test_queues.clear()

    def afterEach(self) -> None:
        worker_base.worker_classes.clear()
        worker_base.test_queues.clear()
        super().afterEach()

    def test_worker_timeout_error_message(self) -> None:
        error = worker_base.WorkerTimeoutError("dummy_queue", 30, 2)

        self.assertEqual(
            str(error),
            "Timed out in dummy_queue after 60 seconds processing 2 events",
        )

    def test_register_worker_adds_worker_class(self) -> None:
        worker_base.register_worker("dummy_queue", DummyWorker)

        self.assertEqual(worker_base.worker_classes["dummy_queue"], DummyWorker)

    def test_register_worker_adds_test_queue(self) -> None:
        worker_base.register_worker("dummy_queue", DummyWorker, is_test_queue=True)

        self.assertIn("dummy_queue", worker_base.test_queues)

    def test_assign_queue_sets_queue_name(self) -> None:
        @worker_base.assign_queue("decorated_queue", is_test_queue=False)
        class DecoratedWorker(worker_base.QueueProcessingWorker):
            def consume(self, data: dict[str, Any]) -> None:
                pass

        self.assertEqual(DecoratedWorker.queue_name, "decorated_queue")