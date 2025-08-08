import { Link } from "react-router-dom";

// Define the Product interface based on your data structure
interface ProductImage {
  url: string;
  alt?: string;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  images: ProductImage[];
  discountPrice?: number;
  countInStock: number;
  // Add other product properties if needed
}

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  error: string | null;
}

const ProductGrid = ({ products, loading, error }: ProductGridProps) => {
  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-lg">Loading Products...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading products: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {products.map((product: Product) => (
          <Link
            key={product._id}
            to={`/product/${product._id}`}
            className="block"
          >
            <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow duration-300">
              <div className="w-full h-96 mb-4">
                <img
                  src={product.images[0].url}
                  alt={product.images[0].alt || product.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <h3 className="text-sm mb-2">{product.name}</h3>
              <div className="flex items-center gap-2 mb-2">
                {product.discountPrice ? (
                  <>
                    <p className="text-gray-500 font-medium text-sm tracking-tighter line-through">
                      ${product.price.toFixed(2)}
                    </p>
                    <p className="text-red-600 font-medium text-sm tracking-tighter">
                      ${product.discountPrice.toFixed(2)}
                    </p>
                  </>
                ) : (
                  <p className="text-gray-500 font-medium text-sm tracking-tighter">
                    ${product.price.toFixed(2)}
                  </p>
                )}
              </div>
              {product.countInStock < 10 && product.countInStock > 0 && (
                <p className="text-orange-500 text-xs">
                  Only {product.countInStock} left!
                </p>
              )}
              {product.countInStock === 0 && (
                <p className="text-red-500 text-xs">Out of stock</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;
