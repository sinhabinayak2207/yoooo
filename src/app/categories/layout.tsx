import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Product Categories | Occ World Trade",
  description: "Browse our extensive range of product categories for your business needs",
};

export default function CategoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
