from app.core.context import RequestContext
from app.core.exceptions import ProductNotFound
from app.repositories.product_repo import ProductRepository
from app.schemas.product import StoreProductDetail, StoreProductListItem


class ProductService:
    def __init__(self, product_repository: ProductRepository) -> None:
        self.product_repository = product_repository

    def list_store_products(self, context: RequestContext) -> list[StoreProductListItem]:
        products = self.product_repository.list_store_products(
            tenant_id=context.tenant_id,
            shop_id=context.shop_id,
        )
        return [StoreProductListItem.model_validate(product) for product in products]

    def get_store_product(self, context: RequestContext, product_id: int) -> StoreProductDetail:
        product = self.product_repository.get_store_product(
            tenant_id=context.tenant_id,
            shop_id=context.shop_id,
            product_id=product_id,
        )
        if product is None:
            raise ProductNotFound()
        return StoreProductDetail.model_validate(product)
