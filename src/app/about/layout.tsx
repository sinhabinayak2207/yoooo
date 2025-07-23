import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'About Us - Occ World Trade',
  description: 'Learn about our company, our mission, values, and the team behind our innovative B2B solutions.',
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
