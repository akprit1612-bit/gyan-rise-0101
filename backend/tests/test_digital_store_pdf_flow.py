import pytest

import backend.server as server


@pytest.mark.asyncio
async def test_verify_returns_existing_purchase_without_creating_new(monkeypatch):
    class DummyCollection:
        async def find_one(self, *args, **kwargs):
            return {"id": "existing-purchase", "user_id": "student-1", "pdf_id": "pdf-1", "payment_id": "pay-1", "created_at": "2026-01-01T00:00:00+00:00"}

        async def insert_one(self, *args, **kwargs):
            return None

    monkeypatch.setattr(server, "db", type("DB", (), {"purchases": DummyCollection(), "payments": DummyCollection()}))
    monkeypatch.setattr(server, "get_razorpay_keys", lambda: ("key", "secret"))

    result = await server.digital_store_payments_verify(
        server.PaymentVerifyPdfIn(
            razorpay_payment_id="pay_123",
            razorpay_order_id="order_123",
            razorpay_signature="sig",
            pdf_id="pdf-1",
        ),
        user={"id": "student-1"},
    )

    assert result["already"] is True
    assert result["purchase"]["id"] == "existing-purchase"
