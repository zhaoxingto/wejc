import time

from sqlalchemy.orm import Session

from app.core.context import RequestContext
from app.core.exceptions import CustomerNotFound, ProductNotFound, SkuNotFound
from app.models.customer import Cart
from app.repositories.cart_repo import CartRepository
from app.repositories.customer_repo import CustomerRepository
from app.repositories.product_repo import ProductRepository
from app.schemas.order import CartAddRequest, CartRead


class CartService:
    def __init__(
        self,
        session: Session,
        cart_repository: CartRepository,
        customer_repository: CustomerRepository,
        product_repository: ProductRepository,
    ) -> None:
        self.session = session
        self.cart_repository = cart_repository
        self.customer_repository = customer_repository
        self.product_repository = product_repository

    def add_item(self, context: RequestContext, payload: CartAddRequest) -> CartRead:
        customer = self.customer_repository.get_by_id(payload.customer_id, context.tenant_id, context.shop_id)
        if customer is None:
            raise CustomerNotFound()

        product = self.product_repository.get_store_product(context.tenant_id, context.shop_id, payload.product_id)
        if product is None:
            raise ProductNotFound()

        sku = self.product_repository.get_sku(context.tenant_id, context.shop_id, payload.product_id, payload.sku_id)
        if sku is None:
            raise SkuNotFound()

        cart = self.cart_repository.get_by_customer_sku(payload.customer_id, payload.sku_id)
        if cart is None:
            cart = Cart(
                id=self._next_id(),
                tenant_id=context.tenant_id,
                shop_id=context.shop_id,
                customer_id=payload.customer_id,
                product_id=payload.product_id,
                sku_id=payload.sku_id,
                qty=payload.qty,
            )
            self.cart_repository.add(cart)
        else:
            cart.qty += payload.qty

        self.session.commit()
        self.session.refresh(cart)
        return CartRead.model_validate(cart)

    def _next_id(self) -> int:
        return time.time_ns()
