import React from 'react';
import { Product } from '../../types';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: Product[];
  onSelectProduct: (slug: string) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, onSelectProduct }) => {
  if (!products || products.length === 0) {
    return (
      <div className="py-16 text-center text-[#6B5F82]">
        <p className="font-serif text-xl text-[#1E1630]">No products found in this category</p>
        <p className="text-sm font-sans mt-1">Please explore another collection or reset your filter.</p>
      </div>
    );
  }

  return (
    <div
      id="storefront-product-grid"
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onClick={onSelectProduct}
        />
      ))}
    </div>
  );
};
