
// Defines the structure for an AI competitor's personality and backstory.
export interface Persona {
  name: string; // The character's title, e.g., "The Frustrated Teacher"
  description: string; // A short, flavorful description.
  // Typing characteristics that will influence the AI's behavior.
  baseWPM: number;
  baseAccuracy: number;
}

// An array of available personas for the game to use.
export const personas: Persona[] = [
  {
    name: "The Frustrated Teacher",
    description: "Lamenting a class's recent failure, types with furious, error-prone energy.",
    baseWPM: 65,
    baseAccuracy: 0.93,
  },
  {
    name: "The Breakthrough Scientist",
    description: "Meticulously documenting a groundbreaking discovery. Precise and methodical.",
    baseWPM: 75,
    baseAccuracy: 0.98,
  },
  {
    name: "The Campaigning Politician",
    description: "Frantically typing talking points before a live debate. Fast but repetitive.",
    baseWPM: 85,
    baseAccuracy: 0.95,
  },
  {
    name: "The Stoic Soldier",
    description: "Barking orders with rapid-fire precision. Short, efficient bursts.",
    baseWPM: 80,
    baseAccuracy: 0.96,
  },
];
