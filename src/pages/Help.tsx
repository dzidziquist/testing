import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'How do I add items to my closet?',
    answer: 'Tap the "+" button on the home screen or navigate to the Closet tab and tap "Add Item". You can upload a photo of your clothing item, and our AI will help identify the category, color, and other details.',
  },
  {
    question: 'How does the outfit suggestion work?',
    answer: 'Our styling algorithm considers your wardrobe items, weather conditions, and your style preferences to suggest outfits. The more you use the app and provide feedback, the better the suggestions become.',
  },
  {
    question: 'Can I plan outfits for specific days?',
    answer: 'Yes! Use the Planner feature to schedule outfits for upcoming days. You can view your planned outfits in a calendar view and make adjustments as needed.',
  },
  {
    question: 'What happens to items I archive?',
    answer: 'Archived items are hidden from your active closet but not deleted. You can view and restore archived items anytime from the Closet tab by selecting the "Archived" filter.',
  },
  {
    question: 'How do I track what I\'ve worn?',
    answer: 'When you wear an outfit, mark it as "worn" in the app. This helps track your wearing patterns and provides better insights about your wardrobe usage.',
  },
  {
    question: 'Can I customize the app appearance?',
    answer: 'Yes! Go to Settings > Appearance to choose between light, dark, or system theme. You can also select an accent color that matches your style.',
  },
  {
    question: 'How do I change my password?',
    answer: 'Go to Settings > Account > Change Password. You\'ll need to enter your new password and confirm it.',
  },
  {
    question: 'How do I delete my account?',
    answer: 'Go to Settings > Account > Delete Account. Please note that this action is permanent and will delete all your data including your closet, outfits, and insights.',
  },
];

export default function HelpPage() {
  const navigate = useNavigate();

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="px-4 pt-4 pb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="section-header">Help & FAQ</h1>
        <p className="text-muted-foreground text-sm">
          Find answers to common questions
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4"
      >
        <Card className="p-4">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>

        <Card className="p-4 mt-6">
          <h3 className="font-semibold mb-2">Still need help?</h3>
          <p className="text-sm text-muted-foreground">
            Contact us at support@inukki.app and we'll get back to you as soon as possible.
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
