import { MotionAccordion, Reveal } from "@/components/marketing/motion";

const faqs = [
  {
    question: "Is my medical data secure?",
    answer:
      "Afiya Wellness is designed to keep patient information protected and limited to the people involved in care.",
  },
  {
    question: "Can I book same-day appointments?",
    answer:
      "Yes, when same-day slots are available. The booking experience shows open times directly so people can move quickly.",
  },
  {
    question: "What payment methods are supported?",
    answer:
      "The platform supports cash, cards, UPI, and online payments, with a clear payment history linked to appointments.",
  },
  {
    question: "Can I see prescriptions online later?",
    answer:
      "Yes. Prescriptions remain available in the portal so patients can revisit medication details after the appointment.",
  },
  {
    question: "Does it work on mobile?",
    answer:
      "Yes. Afiya Wellness works as a Progressive Web App, which means it can feel app-like on phones and tablets right from the browser.",
  },
  {
    question: "How do video consultations work?",
    answer:
      "When a consultation is approved for video, patients join directly from the portal without needing a separate workflow.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="bg-muted/20 px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <div className="mb-14 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-primary">
              FAQ
            </p>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Common questions before people continue.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              This keeps the decision simple for visitors who are about to head
              into sign up or login.
            </p>
          </div>
        </Reveal>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Reveal key={faq.question} delay={0.04 * index}>
              <MotionAccordion question={faq.question} answer={faq.answer} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
