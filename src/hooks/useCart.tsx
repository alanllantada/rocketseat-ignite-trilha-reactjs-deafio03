import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
     const storagedCart = localStorage.getItem('@RocketShoes:cart');
    if (storagedCart) {
       return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      
      const response = await api.get(`/products/${productId}`);
      const responseAmount = await api.get(`/stock/${productId}`);
      const { amount } : Stock = responseAmount.data;
      const index = cart.findIndex(item => item.id === productId);
      if (index > -1)
      {
        if ((cart[index].amount + 1) > amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
        const newCart = cart.map((item) => {
          if (item.id === productId) {
            return {
              ...item,
              amount: item.amount += 1
            };
          }
          else {
            return item;
          }
        });
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        setCart(newCart);
      }
      else {
        if (amount < 1) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
        const { id, title, price, image } = response.data;
        const newProduct = {
          id, 
          title,
          price,
          image,
          amount: 1
        }
        const newCart = [...cart, newProduct];
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        setCart(newCart);
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const index = cart.findIndex(item => item.id === productId);
      if (index < 0) {
        throw new Error("Produto inexistente!");
      }
      const newCart = cart.filter((el) => el.id !== productId);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      setCart(newCart);
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }
      const index = cart.findIndex(item => item.id === productId);
      if (index < 0) {
        throw new Error("Produto inexistente!");
        
      }
      const responseAmount = await api.get(`/stock/${productId}`);
      const stock : Stock = responseAmount.data;
      if (amount > stock.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      const newCart = [...cart];
      newCart[index].amount = amount;
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      setCart(newCart);
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
