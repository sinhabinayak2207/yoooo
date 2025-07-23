"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { updateProductImage as updateFirebaseProductImage, addProduct as addFirebaseProduct, removeProduct as removeFirebaseProduct } from '@/lib/firebase-db';
import { Product as FirebaseProduct } from '@/lib/firebase-db';
import { initializeProducts } from '@/lib/initialize-products';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  category: string;
  featured?: boolean;
  inStock?: boolean;
  updatedAt: Date;
  updatedBy: string;
  price?: number;
  unit?: string;
  showPricing?: boolean;
  keyFeatures?: string[]; // Changed from Record<string, string> to string[] to match firebase-db.ts
  specifications?: Record<string, string>;
}

// Initial product data
export const initialProducts: Product[] = [];

interface ProductContextType {
  products: Product[];
  categories: string[];
  featuredProducts: Product[];
  loading: boolean;
  updateProductImage: (productId: string, imageUrl: string) => Promise<void>;
  updateFeaturedStatus: (productId: string, featured: boolean) => Promise<void>;
  updateStockStatus: (productId: string, inStock: boolean) => Promise<void>;
  addProduct: (product: { name: string, description: string, price?: number, imageUrl: string, category: string, unit?: string, specifications?: Record<string, string>, showPricing?: boolean, keyFeatures?: string[], [key: string]: any }) => Promise<string>;
  removeProduct: (productId: string) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
}

const ProductContext = createContext<ProductContextType | null>(null);

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch products from Firebase when the component mounts
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // First, ensure products exist in Firestore
        try {
          console.log('Initializing products in Firestore if needed...');
          await initializeProducts();
          console.log('Products initialization complete');
        } catch (initError) {
          console.error('Error initializing products:', initError);
          // Continue with fetching - we'll use what's available
        }
        
        // Import dynamically to avoid SSR issues
        const { getAllProducts } = await import('@/lib/firebase-db');
        const firebaseProducts = await getAllProducts();
        
        if (firebaseProducts && firebaseProducts.length > 0) {
          console.log('Fetched products from Firebase:', firebaseProducts.length);
          
          // Convert Firebase timestamps to JS Date objects
          const formattedProducts = firebaseProducts.map((product: any) => ({
            ...product,
            slug: product.slug || product.name.toLowerCase().replace(/\s+/g, '-'),
            updatedAt: product.updatedAt instanceof Date ? product.updatedAt : new Date(product.updatedAt)
          }));
          
          setProducts(formattedProducts as Product[]);
          setLoading(false);
        } else {
          console.log('No products found in Firebase, using default data');
          
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        
        setLoading(false);
        
        // Fallback to localStorage
        try {
          const storedProducts = localStorage.getItem('products');
          if (storedProducts) {
            const parsedProducts = JSON.parse(storedProducts);
            setProducts(parsedProducts.map((product: any) => ({
              ...product,
              updatedAt: new Date(product.updatedAt)
            })));
          } else {
       
          }
        } catch (e) {
          console.error('Error hydrating products from localStorage:', e);
          
        }
      }
    };
    
    fetchProducts();
  }, []);

  // Compute derived values - use the existing categories list
  const productCategories = [...new Set(products.map(product => product.category))];
  const featuredProducts = products.filter(product => product.featured === true);

  // Update product image
  const updateProductImage = async (productId: string, newImageUrl: string): Promise<void> => {
    try {
      if (!productId || !newImageUrl) {
        console.error('ProductContext: Invalid parameters for updateProductImage', { productId, newImageUrl });
        return;
      }

      // Add cache-busting parameter to ensure we're using the latest image
      const timestamp = new Date().getTime();
      const imageUrlWithCache = newImageUrl.includes('?') 
        ? `${newImageUrl}&t=${timestamp}` 
        : `${newImageUrl}?t=${timestamp}`;
      
      // Use system as the default updatedBy value
      const validUpdatedBy = 'system@b2b-showcase.com';

      // Import dynamically to avoid SSR issues
      const { updateProductImage: updateFirebaseImage } = await import('@/lib/firebase-db');
      
      try {
        // Ensure Firebase auth is initialized before updating
        const { getAuth } = await import('firebase/auth');
        const auth = getAuth();
        
        await updateFirebaseImage(productId, imageUrlWithCache, validUpdatedBy);
      } catch (firestoreError) {
        console.error('Firestore update failed:', firestoreError);
        // Even if Firestore update fails, continue with local updates
      }
      
      // Find the product to update in local state
      const productToUpdate = products.find(p => p.id === productId);
      
      if (!productToUpdate) {
        console.error(`ProductContext: Product with ID ${productId} not found in local state`);
        return;
      }
      
      // Create updated products array
      const updatedProducts = products.map(product => {
        if (product.id === productId) {
          return {
            ...product,
            imageUrl: imageUrlWithCache,
            updatedAt: new Date(),
            updatedBy: validUpdatedBy
          };
        }
        return product;
      });
      
      // Update state
      setProducts(updatedProducts);
      
      // Dispatch a custom event to notify other components
      if (typeof window !== 'undefined') {
        const eventData = { 
          productId, 
          imageUrl: imageUrlWithCache,
          timestamp: new Date().getTime()
        };
        
        const event = new CustomEvent('productUpdated', { 
          detail: eventData,
          bubbles: true
        });
        
        window.dispatchEvent(event);
        document.dispatchEvent(event);
        
        console.log('Dispatched productUpdated event:', eventData);
      }
    } catch (error) {
      console.error('Error updating product image:', error);
      throw error;
    }
  };
  
  // Update featured status - limit to 3 featured products
  const updateFeaturedStatus = async (productId: string, featured: boolean): Promise<void> => {
    try {
      console.log(`Updating featured status for product ${productId} to ${featured ? 'Featured' : 'Not Featured'}`);
      
      // If trying to set featured to true, check how many products are already featured
      if (featured) {
        // Count current featured products excluding the current one
        const currentFeaturedCount = products.filter(p => p.featured && p.id !== productId).length;
        
        // If already 3 featured products, prevent adding another
        if (currentFeaturedCount >= 3) {
          console.log('Cannot feature more than 3 products. Please unfeatured one first.');
          throw new Error('Maximum of 3 featured products allowed. Please unfeatured one first.');
        }
      }
      
      // Use our dedicated function to update featured status in Firestore
      const { updateProductFeaturedStatus } = await import('@/lib/firebase-db');
      
      // Get current user email or use system default
      let updatedBy = 'system@b2b-showcase.com';
      try {
        const { getAuth } = await import('firebase/auth');
        const auth = getAuth();
        if (auth.currentUser?.email) {
          updatedBy = auth.currentUser.email;
        }
      } catch (authError) {
        console.warn('Could not get current user, using default:', authError);
      }
      
      // Update in Firestore using our dedicated function
      await updateProductFeaturedStatus(productId, featured, updatedBy);
      console.log(`Firestore updated for product ${productId} featured status`);

      // Update local state
      setProducts(prevProducts => prevProducts.map(product => {
        if (product.id === productId) {
          return { ...product, featured, updatedAt: new Date() };
        }
        return product;
      }));

      // Notify UI components that product data has changed
      window.dispatchEvent(new CustomEvent('productUpdated', {
        detail: { productId }
      }));

      console.log(`Product ${productId} featured status updated to ${featured}`);
    } catch (error) {
      console.error('Error updating featured status:', error);
      throw error;
    }
  };

  /**
   * Update a product's stock status
   * @param productId The ID of the product to update
   * @param inStock Whether the product is in stock
   */
  const updateStockStatus = async (productId: string, inStock: boolean): Promise<void> => {
    try {
      console.log(`Updating stock status for product ${productId} to ${inStock ? 'In Stock' : 'Out of Stock'}`);
      
      // Use our dedicated function to update stock status in Firestore
      const { updateProductStockStatus } = await import('@/lib/firebase-db');
      
      // Get current user email or use system default
      let updatedBy = 'system@b2b-showcase.com';
      try {
        const { getAuth } = await import('firebase/auth');
        const auth = getAuth();
        if (auth.currentUser?.email) {
          updatedBy = auth.currentUser.email;
        }
      } catch (authError) {
        console.warn('Could not get current user, using default:', authError);
      }
      
      // Update in Firestore using our dedicated function
      await updateProductStockStatus(productId, inStock, updatedBy);
      console.log(`Firestore updated for product ${productId} stock status`);

      // Update local state
      setProducts(prevProducts => prevProducts.map(product => {
        if (product.id === productId) {
          return { ...product, inStock, updatedAt: new Date() };
        }
        return product;
      }));

      // Dispatch custom event for real-time UI updates
      const event = new CustomEvent('productUpdated', { 
        detail: { productId, inStock },
        bubbles: true
      });
      window.dispatchEvent(event);
      document.dispatchEvent(event);
      
      console.log(`Stock status updated for product ${productId}: ${inStock ? 'In Stock' : 'Out of Stock'}`);
    } catch (error) {
      console.error('Error updating stock status:', error);
      throw error;
    }
  };

  // Add a new product
  const addProduct = async (product: { name: string, description: string, price?: number, imageUrl: string, category: string, unit?: string, specifications?: Record<string, string>, showPricing?: boolean, keyFeatures?: string[], [key: string]: any }): Promise<string> => {
    try {
      // Get current user email or use admin default
      let user = 'admin';
      
      // Use the user from the auth context directly
      if (auth?.user?.email) {
        user = auth.user.email;
        console.log(`Using authenticated user email for product creation: ${user}`);
      } else {
        // Fallback to Firebase auth if context user is not available
        try {
          const { getAuth } = await import('firebase/auth');
          const firebaseAuth = getAuth();
          if (firebaseAuth.currentUser?.email) {
            user = firebaseAuth.currentUser.email;
            console.log(`Using Firebase currentUser email for product creation: ${user}`);
          }
        } catch (authError) {
          console.warn('Could not get current user from Firebase, using default:', authError);
        }
      }
      
      // Generate a slug from the name
      const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      // Create the product with the slug
      const productWithSlug = {
        ...product,
        slug: slug
      };
      
      // Add to Firebase
      const newProductId = await addFirebaseProduct(productWithSlug, user);
      
      // Update local state
      const newProduct = {
        ...product,
        id: newProductId,
        slug: slug,
        updatedAt: new Date(),
        updatedBy: user,
        featured: false,
        inStock: true
      } as Product;
      
      setProducts(prevProducts => [...prevProducts, newProduct]);
      
      // Dispatch event for components to update with category information
      window.dispatchEvent(new CustomEvent('productAdded', { 
        detail: { 
          productId: newProductId,
          category: product.category
        } 
      }));
      
      return newProductId;
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  };
  
  // Remove a product
  const removeProduct = async (productId: string): Promise<void> => {
    try {
      // First get the product details for logging
      const productToDelete = products.find(p => p.id === productId);
      console.log(`Removing product: ${productToDelete?.name || productId}`);
      
      // Remove from Firebase
      await removeFirebaseProduct(productId);
      
      // Update local state
      setProducts(prevProducts => prevProducts.filter(product => product.id !== productId));
      
      // Clear any local storage caches that might reference this product
      try {
        const localStorageKeys = ['recentProducts', 'viewedProducts', 'featuredProducts'];
        localStorageKeys.forEach(key => {
          try {
            const storedData = localStorage.getItem(key);
            if (storedData) {
              const parsedData = JSON.parse(storedData);
              if (Array.isArray(parsedData)) {
                const filteredData = parsedData.filter((item: any) => 
                  item.id !== productId && item.productId !== productId
                );
                localStorage.setItem(key, JSON.stringify(filteredData));
              }
            }
          } catch (e) {
            console.warn(`Error clearing ${key} cache:`, e);
          }
        });
      } catch (cacheError) {
        console.warn('Error clearing product caches:', cacheError);
      }
      
      // Dispatch events for components to update
      const events = ['productRemoved', 'productDeleted', 'productUpdated'];
      events.forEach(eventName => {
        window.dispatchEvent(new CustomEvent(eventName, { 
          detail: { 
            productId, 
            name: productToDelete?.name,
            category: productToDelete?.category // Include category for product count updates
          },
          bubbles: true 
        }));
        document.dispatchEvent(new CustomEvent(eventName, { 
          detail: { 
            productId, 
            name: productToDelete?.name,
            category: productToDelete?.category // Include category for product count updates
          },
          bubbles: true 
        }));
      });
      
      console.log(`Product ${productToDelete?.name || productId} successfully removed`);
    } catch (error) {
      console.error('Error removing product:', error);
      throw error;
    }
  };

  // Update product
  const updateProduct = async (product: Product): Promise<void> => {
    try {
      if (!auth.user) {
        throw new Error('You must be logged in to update a product');
      }
      
      if (!product.id) {
        throw new Error('Product ID is required');
      }
      
      // Import dynamically to avoid SSR issues
      const { updateProduct: updateFirebaseProduct } = await import('@/lib/firebase-db');
      
      // Set the updatedBy field to the current user's email and ensure price is a number
      const updatedProduct = {
        ...product,
        updatedBy: auth.user.email || 'unknown',
        updatedAt: new Date(),
        price: product.price || 0 // Ensure price is always a number, default to 0 if undefined
      };
      
      // Update the product in Firebase
      await updateFirebaseProduct(updatedProduct);
      
      // Update the local state
      setProducts(prevProducts => {
        return prevProducts.map(p => {
          if (p.id === product.id) {
            return updatedProduct;
          }
          return p;
        });
      });
      
      // Update localStorage
      try {
        const storedProducts = localStorage.getItem('products');
        if (storedProducts) {
          const parsedProducts = JSON.parse(storedProducts);
          const updatedProducts = parsedProducts.map((p: Product) => {
            if (p.id === product.id) {
              return updatedProduct;
            }
            return p;
          });
          localStorage.setItem('products', JSON.stringify(updatedProducts));
        }
      } catch (e) {
        console.error('Error updating localStorage:', e);
      }
      
      console.log(`Product ${product.name} updated successfully`);
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        categories: productCategories,
        featuredProducts,
        loading,
        updateProductImage,
        updateFeaturedStatus,
        updateStockStatus,
        addProduct,
        removeProduct,
        updateProduct
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === null) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
