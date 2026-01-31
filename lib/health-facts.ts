/**
 * Curated health and wellness facts
 * Displayed during loading to educate and engage users
 */

export const healthFacts = [
  "Drinking water first thing in the morning helps kickstart your metabolism.",
  "Walking for just 30 minutes a day can reduce the risk of heart disease by 35%.",
  "Getting 7-9 hours of sleep improves memory and immune function.",
  "Eating a rainbow of fruits and vegetables ensures diverse nutrient intake.",
  "Regular handwashing is one of the most effective ways to prevent illness.",
  "Deep breathing exercises can reduce stress and lower blood pressure.",
  "Standing up every 30 minutes improves circulation and reduces back pain.",
  "Staying hydrated helps maintain healthy skin and supports kidney function.",
  "Laughter triggers the release of endorphins, your body's natural feel-good chemicals.",
  "Regular dental check-ups can help detect early signs of systemic diseases.",
  "Eating slowly and mindfully can improve digestion and prevent overeating.",
  "Exposure to sunlight helps your body produce vitamin D for strong bones.",
  "Reducing sugar intake can lower your risk of type 2 diabetes.",
  "Regular exercise releases endorphins that naturally boost your mood.",
  "Maintaining a healthy weight reduces strain on your joints and heart.",
  "Eating breakfast within an hour of waking can boost your energy levels.",
  "Stretching for 10 minutes daily can improve flexibility and reduce injury risk.",
  "Green tea contains antioxidants that support heart health and brain function.",
  "Taking short breaks during work can improve focus and productivity.",
  "Practicing gratitude has been shown to improve mental health and well-being.",
  "Limiting screen time before bed can improve your sleep quality.",
  "Adding fiber to your diet supports digestive health and helps control blood sugar.",
  "Social connections and meaningful relationships boost both mental and physical health.",
  "Regular health screenings can catch potential issues early when they're most treatable.",
  "Maintaining good posture can prevent neck and back pain.",
  "Omega-3 fatty acids from fish support brain health and reduce inflammation.",
  "Staying mentally active with puzzles or learning new skills keeps your brain sharp.",
  "Moderate caffeine consumption can improve alertness and physical performance.",
  "Washing your hands for at least 20 seconds with soap kills most germs.",
  "Regular cardiovascular exercise strengthens your heart and improves circulation.",
];

/**
 * Get a random health fact
 */
export function getRandomHealthFact(): string {
  return healthFacts[Math.floor(Math.random() * healthFacts.length)];
}

/**
 * Get a health fact by index (with wrapping)
 */
export function getHealthFactByIndex(index: number): string {
  return healthFacts[index % healthFacts.length];
}
