import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'Is my data sent to a server?',
    answer: 'No. All your inputs stay in your browser. Settings are saved to your device\'s local storage. Share links encode your settings in the link itself, not on a server.',
  },
  {
    question: 'What is the usable battery percentage?',
    answer: 'It models how much of the battery\'s total (nominal) energy you can actually use before hitting the manufacturer\'s discharge limit. The default 80% is an editable example, not a recommendation.',
  },
  {
    question: 'Why is my runtime shorter than I expected?',
    answer: 'Inverter conversion losses, inverter idle draw, and the planning reserve all reduce the energy available to your devices. A 500 Wh battery with 80% usable and 10% reserve only delivers 360 Wh to spend.',
  },
  {
    question: 'Should I use AC or DC for my device?',
    answer: 'If your device plugs into a wall outlet through the inverter, choose AC. If it connects directly to the battery (such as a 12 V device on a DC port), choose DC. DC avoids inverter losses.',
  },
  {
    question: 'What does "duty percentage" mean?',
    answer: 'It is the share of time a device draws the entered wattage. A laptop at 50% duty draws its rated power half the time and nothing the other half. Leave at 100% if unsure.',
  },
  {
    question: 'Can I share my setup with someone?',
    answer: 'Yes. Use "Copy share link" to put a link on your clipboard. The link contains your settings encoded in the URL fragment. Anyone who opens it can read your configuration.',
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h2 className="section-heading">Frequently asked questions</h2>
      <dl className="mt-6 divide-y divide-navy-900/10 rounded-xl border border-navy-900/10 bg-white">
        {FAQS.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={index}>
              <dt>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-navy-900"
                  aria-expanded={isOpen}
                >
                  {faq.question}
                  <ChevronDown
                    className={`h-4 w-4 flex-shrink-0 text-navy-600 transition ${isOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>
              </dt>
              {isOpen && (
                <dd className="px-4 pb-4 text-sm text-navy-600 animate-slide-up">{faq.answer}</dd>
              )}
            </div>
          );
        })}
      </dl>
    </section>
  );
}
