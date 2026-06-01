from sqlalchemy.orm import Session
from . import models, schemas

# --- Exceptions ---
class InsufficientStockException(Exception):
    def __init__(self, product_name: str, requested: int, available: int):
        self.product_name = product_name
        self.requested = requested
        self.available = available
        super().__init__(f"Insufficient stock for product '{product_name}'. Requested: {requested}, Available: {available}")

class EntityNotFoundException(Exception):
    pass

# --- Product CRUD ---
def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_product_by_sku(db: Session, sku: str):
    return db.query(models.Product).filter(models.Product.sku == sku).first()

def get_products(db: Session):
    return db.query(models.Product).all()

def create_product(db: Session, product: schemas.ProductCreate):
    db_product = models.Product(
        name=product.name,
        sku=product.sku,
        price=product.price,
        quantity=product.quantity
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, product_id: int, product_data: schemas.ProductUpdate):
    db_product = get_product(db, product_id)
    if not db_product:
        return None
    db_product.name = product_data.name
    db_product.sku = product_data.sku
    db_product.price = product_data.price
    db_product.quantity = product_data.quantity
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int):
    db_product = get_product(db, product_id)
    if not db_product:
        return None
    db.delete(db_product)
    db.commit()
    return db_product

# --- Customer CRUD ---
def get_customer(db: Session, customer_id: int):
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()

def get_customer_by_email(db: Session, email: str):
    return db.query(models.Customer).filter(models.Customer.email == email).first()

def get_customers(db: Session):
    return db.query(models.Customer).all()

def create_customer(db: Session, customer: schemas.CustomerCreate):
    db_customer = models.Customer(
        name=customer.name,
        email=customer.email,
        phone=customer.phone
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

def delete_customer(db: Session, customer_id: int):
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        return None
    db.delete(db_customer)
    db.commit()
    return db_customer

# --- Order CRUD ---
def get_order(db: Session, order_id: int):
    return db.query(models.Order).filter(models.Order.id == order_id).first()

def get_orders(db: Session):
    return db.query(models.Order).order_by(models.Order.created_at.desc()).all()

def create_order(db: Session, order_data: schemas.OrderCreate):
    # Verify customer exists
    customer = get_customer(db, order_data.customer_id)
    if not customer:
        raise EntityNotFoundException(f"Customer with ID {order_data.customer_id} does not exist.")

    total_amount = 0.0
    items_to_create = []

    # Using with_for_update() inside transaction prevents race conditions on stock check
    for item in order_data.items:
        product = db.query(models.Product).with_for_update().filter(models.Product.id == item.product_id).first()
        if not product:
            raise EntityNotFoundException(f"Product with ID {item.product_id} does not exist.")
        
        if product.quantity < item.quantity:
            raise InsufficientStockException(product.name, item.quantity, product.quantity)
        
        # Deduct stock
        product.quantity -= item.quantity
        
        # Calculate subtotal
        total_amount += product.price * item.quantity
        items_to_create.append((product, item.quantity))

    # Create Order
    db_order = models.Order(
        customer_id=order_data.customer_id,
        total_amount=total_amount
    )
    db.add(db_order)
    db.flush()  # Gets db_order.id

    # Create Order Items
    for product, qty in items_to_create:
        db_item = models.OrderItem(
            order_id=db_order.id,
            product_id=product.id,
            quantity=qty
        )
        db.add(db_item)

    db.commit()
    db.refresh(db_order)
    return db_order

def delete_order(db: Session, order_id: int):
    # Fetch order inside update lock
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        return None
    
    # Restore stock for each item
    for item in db_order.items:
        product = db.query(models.Product).with_for_update().filter(models.Product.id == item.product_id).first()
        if product:
            product.quantity += item.quantity
            
    db.delete(db_order)
    db.commit()
    return db_order

# --- Dashboard Summary ---
def get_dashboard_summary(db: Session, low_stock_threshold: int = 10):
    total_products = db.query(models.Product).count()
    total_customers = db.query(models.Customer).count()
    total_orders = db.query(models.Order).count()
    
    low_stock = db.query(models.Product).filter(models.Product.quantity < low_stock_threshold).all()
    
    return schemas.DashboardSummary(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        low_stock_products=[
            schemas.LowStockProduct(
                id=p.id,
                name=p.name,
                sku=p.sku,
                quantity=p.quantity
            ) for p in low_stock
        ]
    )
