import ClientOnly from "../../components/ClientOnly";

// Import the client component only (below)
import VanillaClient from "../../client/pricer/VanillaClient";

export default function VanillaPage() {
  return <ClientOnly>{() => <VanillaClient />}</ClientOnly>;
}
