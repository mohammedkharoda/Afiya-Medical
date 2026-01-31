import { GoogleGenAI, Type } from "@google/genai";

const MEDICATION_SYSTEM_PROMPT = `You are a medical assistant helping doctors in a clinic setting. Your role is to suggest additional medications that may complement an existing prescription based on the diagnosis and medications already prescribed.

IMPORTANT GUIDELINES:
1. Only suggest medications commonly used in outpatient/clinic settings
2. Consider potential drug interactions with existing medications
3. Be conservative - suggest 2-4 medications maximum
4. Include dosage, frequency, and duration for each suggestion
5. Provide a brief reason for each suggestion
6. Consider patient context (age, gender, allergies, conditions) if provided
7. Never suggest controlled substances or schedule II drugs
8. Always defer to the doctor's judgment - these are suggestions only
9. If patient has allergies, NEVER suggest medications in that class`;

export interface MedicationSuggestion {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  reason: string;
}

export interface PatientContext {
  age?: number;
  gender?: string;
  allergies?: string[];
  currentMedications?: string[];
  conditions?: string[];
}

export interface ExistingMedication {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
}

// JSON Schema for structured output
const medicationSuggestionSchema = {
  type: Type.OBJECT,
  properties: {
    suggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          medicineName: { type: Type.STRING, description: "Name of the medication" },
          dosage: { type: Type.STRING, description: "Dosage amount (e.g., 500mg)" },
          frequency: { type: Type.STRING, description: "How often to take (e.g., twice daily)" },
          duration: { type: Type.STRING, description: "How long to take (e.g., 5 days)" },
          instructions: { type: Type.STRING, description: "Special instructions" },
          reason: { type: Type.STRING, description: "Brief reason for this suggestion" },
        },
        required: ["medicineName", "dosage", "frequency", "duration", "instructions", "reason"],
      },
    },
  },
  required: ["suggestions"],
};

function buildMedicationPrompt(
  diagnosis: string,
  existingMedications: ExistingMedication[],
  patientContext?: PatientContext,
  symptoms?: string,
): string {
  let prompt = `Diagnosis: ${diagnosis}\n`;

  if (symptoms) {
    prompt += `Symptoms reported: ${symptoms}\n`;
  }

  if (existingMedications.length > 0) {
    prompt += `\nAlready prescribed:\n`;
    existingMedications.forEach((m) => {
      prompt += `- ${m.medicineName} ${m.dosage}, ${m.frequency} for ${m.duration}\n`;
    });
  } else {
    prompt += `\nNo medications prescribed yet.\n`;
  }

  if (patientContext) {
    prompt += `\nPatient context:\n`;
    if (patientContext.age) prompt += `- Age: ${patientContext.age} years\n`;
    if (patientContext.gender) prompt += `- Gender: ${patientContext.gender}\n`;
    if (patientContext.allergies && patientContext.allergies.length > 0) {
      prompt += `- Known allergies: ${patientContext.allergies.join(", ")}\n`;
    } else {
      prompt += `- Known allergies: None reported\n`;
    }
    if (
      patientContext.currentMedications &&
      patientContext.currentMedications.length > 0
    ) {
      prompt += `- Current medications (ongoing): ${patientContext.currentMedications.join(", ")}\n`;
    }
    if (patientContext.conditions && patientContext.conditions.length > 0) {
      prompt += `- Existing conditions: ${patientContext.conditions.join(", ")}\n`;
    }
  }

  prompt += `\nSuggest 2-4 additional medications that would complement this prescription. Consider drug interactions and contraindications.`;

  return prompt;
}

export async function generateMedicationSuggestions(
  diagnosis: string,
  existingMedications: ExistingMedication[],
  patientContext?: PatientContext,
  symptoms?: string,
): Promise<MedicationSuggestion[]> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_GEMINI_API_KEY is not configured");
  }

  const ai = new GoogleGenAI({ apiKey });

  const userPrompt = buildMedicationPrompt(
    diagnosis,
    existingMedications,
    patientContext,
    symptoms,
  );

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: MEDICATION_SYSTEM_PROMPT + "\n\n" + userPrompt,
    config: {
      temperature: 0.3,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
      responseSchema: medicationSuggestionSchema,
      thinkingConfig: {
        thinkingBudget: 0, // Disable thinking for clean JSON output
      },
    },
  });

  const rawText = response.text;

  if (!rawText) {
    throw new Error("Empty response from Gemini API");
  }

  const parsed = JSON.parse(rawText);

  if (!Array.isArray(parsed.suggestions)) {
    throw new Error("Invalid suggestions format from Gemini API");
  }

  // Validate and sanitize each suggestion
  const suggestions: MedicationSuggestion[] = parsed.suggestions
    .slice(0, 4) // Max 4 suggestions
    .map((s: Record<string, unknown>) => ({
      medicineName: String(s.medicineName || "").trim(),
      dosage: String(s.dosage || "").trim(),
      frequency: String(s.frequency || "").trim(),
      duration: String(s.duration || "").trim(),
      instructions: String(s.instructions || "").trim(),
      reason: String(s.reason || "").trim(),
    }))
    .filter(
      (s: MedicationSuggestion) =>
        s.medicineName && s.dosage && s.frequency && s.duration,
    );

  return suggestions;
}

export const MEDICATION_DISCLAIMER = `DISCLAIMER: These AI-generated suggestions are for informational purposes only and should not be considered medical advice. The prescribing physician is solely responsible for verifying appropriateness, dosages, interactions, and contraindications before prescribing any medication. AI suggestions may not account for all patient-specific factors.`;
