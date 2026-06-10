import { Metadata } from "next";
import ServicesSection from "../../components/services/ServicesSection";

export const metadata: Metadata = {
  title: 'Services - OCC WORLD TRADE',
  description: 'Discover our comprehensive range of B2B services including bulk sourcing, quality control, global logistics, custom packaging, market analysis, and consulting.',
};

export default function ServicesPage() {
  return <ServicesSection />;
}
