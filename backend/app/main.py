from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from .database import engine, Base, get_db
from . import models, schemas, crud

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Inventory & Order Management API")

# Configure CORS to allow requests from local dev and production domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Dashboard API ---
@app.get("/dashboard/summary", response_model=schemas.DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    return crud.get_dashboard_summary(db)

# --- Product APIs ---
@app.post("/products", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    db_product = crud.get_product_by_sku(db, sku=product.sku)
    if db_product:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product SKU/code '{product.sku}' must be unique."
        )
    return crud.create_product(db=db, product=product)

@app.get("/products", response_model=List[schemas.ProductResponse])
def read_products(db: Session = Depends(get_db)):
    return crud.get_products(db)

@app.get("/products/{product_id}", response_model=schemas.ProductResponse)
def read_product(product_id: int, db: Session = Depends(get_db)):
    db_product = crud.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

@app.put("/products/{product_id}", response_model=schemas.ProductResponse)
def update_product(product_id: int, product: schemas.ProductUpdate, db: Session = Depends(get_db)):
    db_product = crud.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    sku_owner = crud.get_product_by_sku(db, sku=product.sku)
    if sku_owner and sku_owner.id != product_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product SKU/code '{product.sku}' must be unique."
        )
    
    return crud.update_product(db=db, product_id=product_id, product_data=product)

@app.delete("/products/{product_id}", response_model=schemas.ProductResponse)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    db_product = crud.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if product is in any orders
    if len(db_product.order_items) > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete product as it is referenced in active orders. Cancel those orders first."
        )
        
    return crud.delete_product(db=db, product_id=product_id)

# --- Customer APIs ---
@app.post("/customers", response_model=schemas.CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    db_customer = crud.get_customer_by_email(db, email=customer.email)
    if db_customer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Customer email '{customer.email}' must be unique."
        )
    return crud.create_customer(db=db, customer=customer)

@app.get("/customers", response_model=List[schemas.CustomerResponse])
def read_customers(db: Session = Depends(get_db)):
    return crud.get_customers(db)

@app.get("/customers/{customer_id}", response_model=schemas.CustomerResponse)
def read_customer(customer_id: int, db: Session = Depends(get_db)):
    db_customer = crud.get_customer(db, customer_id=customer_id)
    if db_customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return db_customer

@app.delete("/customers/{customer_id}", response_model=schemas.CustomerResponse)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    db_customer = crud.get_customer(db, customer_id=customer_id)
    if db_customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    # Check if customer has orders
    if len(db_customer.orders) > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete customer as they have active orders. Cancel/delete those orders first."
        )
    return crud.delete_customer(db=db, customer_id=customer_id)

# --- Order APIs ---
@app.post("/orders", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_order(db=db, order_data=order)
    except crud.EntityNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except crud.InsufficientStockException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@app.get("/orders", response_model=List[schemas.OrderResponse])
def read_orders(db: Session = Depends(get_db)):
    return crud.get_orders(db)

@app.get("/orders/{order_id}", response_model=schemas.OrderResponse)
def read_order(order_id: int, db: Session = Depends(get_db)):
    db_order = crud.get_order(db, order_id=order_id)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return db_order

@app.delete("/orders/{order_id}", response_model=schemas.OrderResponse)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    db_order = crud.get_order(db, order_id=order_id)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return crud.delete_order(db=db, order_id=order_id)

# --- Database Seeding Endpoint ---
@app.post("/seed", status_code=status.HTTP_200_OK)
def seed_data(db: Session = Depends(get_db)):
    # Check if already seeded to prevent duplicate creation
    if db.query(models.Product).count() > 0 or db.query(models.Customer).count() > 0:
        return {"message": "Database already contains seed data."}

    # Create dummy products
    dummy_products = [
        models.Product(name="Ergonomic Office Chair", sku="CHR-001", price=199.99, quantity=25),
        models.Product(name="Mechanical Keyboard", sku="KEY-002", price=89.50, quantity=5),
        models.Product(name="UltraWide Monitor 34\"", sku="MON-003", price=349.99, quantity=8),
        models.Product(name="Wireless Mouse", sku="MS-004", price=29.99, quantity=40),
        models.Product(name="USB-C Hub Multiport", sku="HUB-005", price=45.00, quantity=3),  # Low stock
    ]
    
    # Create dummy customers
    dummy_customers = [
        models.Customer(name="Alice Johnson", email="alice@example.com", phone="+1-555-0100"),
        models.Customer(name="Bob Smith", email="bob@example.com", phone="+1-555-0199"),
        models.Customer(name="Charlie Davis", email="charlie@example.com", phone="+1-555-0123"),
    ]
    
    for p in dummy_products:
        db.add(p)
    for c in dummy_customers:
        db.add(c)
        
    db.commit()
    
    # Create a dummy order
    customer = db.query(models.Customer).first()
    p1 = db.query(models.Product).filter(models.Product.sku == "CHR-001").first()
    p2 = db.query(models.Product).filter(models.Product.sku == "MS-004").first()
    
    if customer and p1 and p2:
        db_order = models.Order(customer_id=customer.id, total_amount=(p1.price * 1 + p2.price * 2))
        db.add(db_order)
        db.flush()
        
        db_item1 = models.OrderItem(order_id=db_order.id, product_id=p1.id, quantity=1)
        db_item2 = models.OrderItem(order_id=db_order.id, product_id=p2.id, quantity=2)
        
        p1.quantity -= 1
        p2.quantity -= 2
        
        db.add(db_item1)
        db.add(db_item2)
        db.commit()
        
    return {"message": "Database seeded successfully with dummy data!"}
