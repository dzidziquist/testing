import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="px-4 pt-4 pb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="section-header">Terms of Service</h1>
        <p className="text-muted-foreground text-sm">
          Last updated: February 2025
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4"
      >
        <Card className="p-6 space-y-6">
          <section>
            <h2 className="font-semibold text-lg mb-2">1. Acceptance of Terms</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              By accessing or using Inukki, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-lg mb-2">2. Description of Service</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Inukki is a digital wardrobe management application that helps you organize 
              your clothing, create outfits, and receive personalized style recommendations. 
              We reserve the right to modify or discontinue features at any time.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-lg mb-2">3. User Accounts</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials 
              and for all activities that occur under your account. You must provide accurate 
              information when creating your account.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-lg mb-2">4. User Content</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You retain ownership of the photos and content you upload. By uploading content, 
              you grant us a license to use, process, and analyze this content to provide our 
              services to you.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-lg mb-2">5. Prohibited Conduct</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You agree not to use the service for any unlawful purpose, upload harmful content, 
              attempt to gain unauthorized access, or interfere with other users' experience.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-lg mb-2">6. Termination</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We may terminate or suspend your account at our discretion if you violate these 
              terms. You may delete your account at any time through the app settings.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-lg mb-2">7. Disclaimer</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The service is provided "as is" without warranties of any kind. We do not guarantee 
              that outfit recommendations will suit your needs or preferences perfectly.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-lg mb-2">8. Contact</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              For questions about these Terms, contact us at legal@inukki.app.
            </p>
          </section>
        </Card>
      </motion.div>
    </div>
  );
}
