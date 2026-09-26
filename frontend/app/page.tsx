import Landing from "../components/Landing";
import DepositFeatures from "../components/DepositFeatures";
import SocialProofBanner from '../components/SocialProofBanner';
import HowItWorks from "../components/HowItWorks";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <main className="h-100vh w-100% min-w-auto ">
      <nav className="flex ml-5">
        <p className="header">
          NIPATE! 
          <span></span>
        </p>
      </nav>
      <Landing />
      <SocialProofBanner />
      <HowItWorks />
      <DepositFeatures />
      <Footer />
    </main>
  );
}