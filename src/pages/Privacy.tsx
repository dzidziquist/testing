import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="px-4 pt-4 pb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="section-header">Privacy Policy</h1>
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
            <h2 className="font-semibold text-lg mb-2">Information We Collect</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We collect information you provide directly to us, including your email address, 
              profile information, clothing items you add to your closet, and your style preferences. 
              We also collect photos of clothing items that you upload to the app.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-lg mb-2">How We Use Your Information</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We use the information we collect to provide, maintain, and improve our services, 
              including generating personalized outfit recommendations. Your clothing photos are 
              analyzed to identify item characteristics like color, pattern, and category.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-lg mb-2">Data Storage & Security</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your data is stored securely in our cloud infrastructure. We implement appropriate 
              technical and organizational measures to protect your personal information against 
              unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-lg mb-2">Data Sharing</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We do not sell your personal information. We may share your information with 
              third-party service providers who assist us in operating our services, but only 
              to the extent necessary for them to provide their services.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-lg mb-2">Your Rights</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You have the right to access, update, or delete your personal information at any time. 
              You can do this through the app settings or by contacting us directly.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-lg mb-2">Contact Us</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at 
              privacy@inukki.app.
            </p>
          </section>
        </Card>
      </motion.div>
    </div>
  );
}
