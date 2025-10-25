import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

const FAQSection: React.FC = () => {
  const [openItems, setOpenItems] = useState<number[]>([0]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const faqItems = [
    {
      question: "What is phishing",
      answer: "Phishing is a cybercrime in which a target or targets are contacted by email, telephone, or text message by someone posing as a legitimate institution to lure individuals into providing sensitive data such as personally identifiable information, banking and credit card details, and passwords. OR Phishing is a cyber attack where the attacker tricks the target into disclosing personal information, revealing login credentials, or transferring money."
    },
    {
      question: "Why should I bother Knowing what Phishing is all about",
      answer: "Understanding phishing is crucial for protecting yourself and your organization from cyber threats. Phishing attacks can lead to identity theft, financial loss, data breaches, and compromised personal information. By knowing how to identify and prevent phishing attempts, you can avoid becoming a victim and help protect others in your network."
    },
    {
      question: "Two Major Types of Phishing Attack",
      answer: "1. **Email Phishing**: The most common type where attackers send fraudulent emails that appear to come from legitimate sources to steal sensitive information. 2. **Spear Phishing**: A more targeted approach where attackers research specific individuals or organizations and craft personalized messages to increase the likelihood of success."
    },
    {
      question: "How to Prevent and Protect Against Phishing As An End-user",
      answer: "• Verify sender identity before clicking links or downloading attachments • Check URLs carefully for misspellings or suspicious domains • Use two-factor authentication whenever possible • Keep software and browsers updated • Be cautious with personal information sharing • Use reputable antivirus software • Report suspicious emails to your IT department"
    },
    {
      question: "How to Prevent and Protect Against Phishing As A Company",
      answer: "• Implement comprehensive security awareness training • Use advanced email filtering and anti-phishing tools • Deploy multi-factor authentication across all systems • Conduct regular phishing simulations • Establish clear incident response procedures • Monitor and analyze network traffic • Create and enforce security policies • Regularly update and patch all systems"
    }
  ];

  return (
    <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <p className="text-lg text-gray-600">Learn more about phishing and how to protect yourself</p>
        </div>

        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Info className="h-5 w-5 text-blue-600 mr-3" />
                  <span className="font-semibold text-gray-900">{item.question}</span>
                </div>
                {openItems.includes(index) ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </button>
              
              {openItems.includes(index) && (
                <div className="px-6 pb-4">
                  <div className="prose prose-sm text-gray-700 leading-relaxed">
                    {item.answer.split('\n').map((paragraph, pIndex) => (
                      <p key={pIndex} className="mb-2 last:mb-0">
                        {paragraph.includes('**') 
                          ? paragraph.split('**').map((text, tIndex) => 
                              tIndex % 2 === 1 ? <strong key={tIndex}>{text}</strong> : text
                            )
                          : paragraph
                        }
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;