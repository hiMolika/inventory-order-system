import unittest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app import models, schemas, crud

class TestInventorySystem(unittest.TestCase):
    def setUp(self):
        # Create SQLite in-memory database for testing
        self.engine = create_engine("sqlite:///:memory:")
        TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        Base.metadata.create_all(bind=self.engine)
        self.db = TestingSessionLocal()
        
    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)

    def test_create_product(self):
        # Test valid product creation
        prod_in = schemas.ProductCreate(name="Laptop", sku="LAP-001", price=999.99, quantity=10)
        prod = crud.create_product(self.db, prod_in)
        self.assertEqual(prod.name, "Laptop")
        self.assertEqual(prod.sku, "LAP-001")
        self.assertEqual(prod.price, 999.99)
        self.assertEqual(prod.quantity, 10)

    def test_create_customer(self):
        # Test valid customer creation
        cust_in = schemas.CustomerCreate(name="Alice", email="alice@test.com", phone="123456")
        cust = crud.create_customer(self.db, cust_in)
        self.assertEqual(cust.name, "Alice")
        self.assertEqual(cust.email, "alice@test.com")

    def test_order_creation_success(self):
        # Setup product and customer
        prod = crud.create_product(self.db, schemas.ProductCreate(name="Mouse", sku="MS-01", price=20.0, quantity=15))
        cust = crud.create_customer(self.db, schemas.CustomerCreate(name="Bob", email="bob@test.com"))
        
        # Place order for 5 mice
        order_in = schemas.OrderCreate(
            customer_id=cust.id,
            items=[schemas.OrderItemCreate(product_id=prod.id, quantity=5)]
        )
        order = crud.create_order(self.db, order_in)
        
        # Assertions
        self.assertEqual(order.customer_id, cust.id)
        self.assertEqual(order.total_amount, 100.0)  # 20.0 * 5
        self.assertEqual(len(order.items), 1)
        self.assertEqual(order.items[0].quantity, 5)
        
        # Check stock reduction
        self.db.refresh(prod)
        self.assertEqual(prod.quantity, 10)  # 15 - 5

    def test_order_creation_insufficient_stock(self):
        # Setup product and customer
        prod = crud.create_product(self.db, schemas.ProductCreate(name="Keyboard", sku="KB-01", price=50.0, quantity=3))
        cust = crud.create_customer(self.db, schemas.CustomerCreate(name="Charlie", email="charlie@test.com"))
        
        # Try ordering 5 keyboards (only 3 in stock)
        order_in = schemas.OrderCreate(
            customer_id=cust.id,
            items=[schemas.OrderItemCreate(product_id=prod.id, quantity=5)]
        )
        
        with self.assertRaises(crud.InsufficientStockException):
            crud.create_order(self.db, order_in)
            
        # Verify stock was NOT reduced (atomic transaction check)
        self.db.refresh(prod)
        self.assertEqual(prod.quantity, 3)

    def test_order_cancellation_restores_stock(self):
        # Setup product, customer, and order
        prod = crud.create_product(self.db, schemas.ProductCreate(name="Monitor", sku="MON-01", price=200.0, quantity=10))
        cust = crud.create_customer(self.db, schemas.CustomerCreate(name="Dave", email="dave@test.com"))
        
        order = crud.create_order(self.db, schemas.OrderCreate(
            customer_id=cust.id,
            items=[schemas.OrderItemCreate(product_id=prod.id, quantity=2)]
        ))
        
        self.db.refresh(prod)
        self.assertEqual(prod.quantity, 8)  # 10 - 2
        
        # Cancel order
        crud.delete_order(self.db, order.id)
        
        # Verify stock restored
        self.db.refresh(prod)
        self.assertEqual(prod.quantity, 10)  # Restored back to 10
        
        # Verify order was deleted
        self.assertIsNone(crud.get_order(self.db, order.id))

if __name__ == "__main__":
    unittest.main()
