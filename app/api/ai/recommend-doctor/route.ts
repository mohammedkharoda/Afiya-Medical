import { NextRequest, NextResponse } from "next/server";
import { db, users, doctorProfiles } from "@/lib/db";
import { eq } from "drizzle-orm";
import { GoogleGenAI, Type } from "@google/genai";

// Keyword-based specialty detection (reliable fallback)
function detectSpecialtyFromSymptoms(
  symptoms: string,
): { specialty: string; reason: string } | null {
  const lowerSymptoms = symptoms.toLowerCase();

  // Skin issues -> Dermatologist
  const skinKeywords = [
    "skin",
    "rash",
    "ringworm",
    "fungal",
    "acne",
    "eczema",
    "psoriasis",
    "itching",
    "itch",
    "hives",
    "allergy",
    "pimple",
    "boil",
    "wound",
    "burn",
    "infection on skin",
    "dry skin",
    "oily skin",
    "dandruff",
    "hair fall",
    "hair loss",
  ];
  if (skinKeywords.some((k) => lowerSymptoms.includes(k))) {
    return {
      specialty: "Dermatologist",
      reason:
        "Skin-related symptoms require a dermatologist for proper diagnosis and treatment",
    };
  }

  // Heart issues -> Cardiologist
  const heartKeywords = [
    "chest pain",
    "heart",
    "palpitation",
    "blood pressure",
    "bp",
    "hypertension",
    "cardiac",
  ];
  if (heartKeywords.some((k) => lowerSymptoms.includes(k))) {
    return {
      specialty: "Cardiologist",
      reason: "Heart and cardiovascular symptoms require a cardiologist",
    };
  }

  // Bone/joint issues -> Orthopedic
  const boneKeywords = [
    "bone",
    "joint",
    "fracture",
    "arthritis",
    "back pain",
    "knee",
    "shoulder",
    "spine",
    "muscle pain",
    "sprain",
    "ligament",
  ];
  if (boneKeywords.some((k) => lowerSymptoms.includes(k))) {
    return {
      specialty: "Orthopedic",
      reason: "Bone, joint, and muscle issues require an orthopedic specialist",
    };
  }

  // Eye issues -> Ophthalmologist
  const eyeKeywords = [
    "eye",
    "vision",
    "blind",
    "cataract",
    "glasses",
    "spectacle",
    "sight",
  ];
  if (eyeKeywords.some((k) => lowerSymptoms.includes(k))) {
    return {
      specialty: "Ophthalmologist",
      reason: "Eye and vision problems require an ophthalmologist",
    };
  }

  // ENT issues -> ENT Specialist
  const entKeywords = [
    "ear",
    "nose",
    "throat",
    "hearing",
    "deaf",
    "sinus",
    "tonsil",
    "voice",
    "snoring",
  ];
  if (entKeywords.some((k) => lowerSymptoms.includes(k))) {
    return {
      specialty: "ENT Specialist",
      reason: "Ear, nose, and throat issues require an ENT specialist",
    };
  }

  // Mental health -> Psychiatrist
  const mentalKeywords = [
    "anxiety",
    "depression",
    "stress",
    "panic",
    "mental",
    "sleep problem",
    "insomnia",
    "mood",
  ];
  if (mentalKeywords.some((k) => lowerSymptoms.includes(k))) {
    return {
      specialty: "Psychiatrist",
      reason: "Mental health concerns require a psychiatrist",
    };
  }

  // Women's health -> Gynecologist
  const gynecKeywords = [
    "pregnancy",
    "pregnant",
    "menstrual",
    "period",
    "ovary",
    "uterus",
    "pcos",
    "menopause",
  ];
  if (gynecKeywords.some((k) => lowerSymptoms.includes(k))) {
    return {
      specialty: "Gynecologist",
      reason: "Women's health issues require a gynecologist",
    };
  }

  // Digestive issues -> Gastroenterologist
  const digestiveKeywords = [
    "stomach",
    "digestion",
    "liver",
    "bowel",
    "constipation",
    "diarrhea",
    "acidity",
    "ulcer",
    "gastric",
    "vomiting",
    "nausea",
  ];
  if (digestiveKeywords.some((k) => lowerSymptoms.includes(k))) {
    return {
      specialty: "Gastroenterologist",
      reason: "Digestive system issues require a gastroenterologist",
    };
  }

  // Children's health -> Pediatrician
  const childKeywords = ["child", "baby", "infant", "toddler", "pediatric"];
  if (childKeywords.some((k) => lowerSymptoms.includes(k))) {
    return {
      specialty: "Pediatrician",
      reason: "Children's health issues require a pediatrician",
    };
  }

  // Diabetes/hormones -> Endocrinologist
  const hormonalKeywords = ["diabetes", "thyroid", "hormone", "sugar level"];
  if (hormonalKeywords.some((k) => lowerSymptoms.includes(k))) {
    return {
      specialty: "Endocrinologist",
      reason: "Hormonal and metabolic issues require an endocrinologist",
    };
  }

  // Kidney issues -> Nephrologist
  const kidneyKeywords = ["kidney", "urine", "urinary", "bladder"];
  if (kidneyKeywords.some((k) => lowerSymptoms.includes(k))) {
    return {
      specialty: "Nephrologist",
      reason: "Kidney and urinary issues require a nephrologist",
    };
  }

  // Nerve issues -> Neurologist
  const nerveKeywords = [
    "nerve",
    "headache",
    "migraine",
    "seizure",
    "numbness",
    "tingling",
    "paralysis",
    "brain",
  ];
  if (nerveKeywords.some((k) => lowerSymptoms.includes(k))) {
    return {
      specialty: "Neurologist",
      reason: "Neurological symptoms require a neurologist",
    };
  }

  // General symptoms -> General Physician
  const generalKeywords = [
    "fever",
    "cold",
    "cough",
    "flu",
    "weakness",
    "fatigue",
    "general checkup",
  ];
  if (generalKeywords.some((k) => lowerSymptoms.includes(k))) {
    return {
      specialty: "General Physician",
      reason: "General symptoms can be evaluated by a general physician",
    };
  }

  return null; // Let AI decide if no keywords match
}

const DOCTOR_RECOMMENDATION_PROMPT = `You are a medical assistant. Your job is to identify the CORRECT medical specialty for patient symptoms.

CRITICAL RULES:
1. ALWAYS identify the specific specialist needed - do NOT default to General Physician unless symptoms are truly vague
2. Be SPECIFIC - skin problems need Dermatologist, NOT General Physician
3. If the ideal specialist is not available, still report the CORRECT specialty they need

MANDATORY SPECIALTY MAPPING - YOU MUST FOLLOW THIS:
- ANY skin issue (rash, irritation, ringworm, fungal infection, acne, eczema, psoriasis, itching, skin allergy, hives): idealSpeciality = "Dermatologist"
- Heart/chest issues (chest pain, palpitations, blood pressure): idealSpeciality = "Cardiologist"
- Bone/joint/muscle issues (fractures, arthritis, back pain, knee pain): idealSpeciality = "Orthopedic"
- Eye issues (vision, eye pain, redness): idealSpeciality = "Ophthalmologist"
- Ear/nose/throat (hearing, sinus, throat pain, tonsils): idealSpeciality = "ENT Specialist"
- Mental health (anxiety, depression, stress): idealSpeciality = "Psychiatrist"
- Children under 12: idealSpeciality = "Pediatrician"
- Women's health (pregnancy, menstrual): idealSpeciality = "Gynecologist"
- Digestive (stomach, liver, bowel): idealSpeciality = "Gastroenterologist"
- Fever, cold, general checkup with no specific organ: idealSpeciality = "General Physician"

EXAMPLE:
- "skin irritation and ringworm" -> idealSpeciality MUST be "Dermatologist" (NOT General Physician)
- "chest pain" -> idealSpeciality MUST be "Cardiologist"
- "back pain" -> idealSpeciality MUST be "Orthopedic"`;

const doctorRecommendationSchema = {
  type: Type.OBJECT,
  properties: {
    idealSpeciality: {
      type: Type.STRING,
      description:
        "The SPECIFIC specialist needed. For skin issues: Dermatologist. For heart: Cardiologist. For bones: Orthopedic. Only use General Physician for truly vague symptoms like fever or general checkup.",
    },
    idealSpecialityReason: {
      type: Type.STRING,
      description:
        "Brief explanation of why this specialty is needed for the symptoms",
    },
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          doctorId: {
            type: Type.STRING,
            description: "ID of the recommended doctor from available list",
          },
          reason: {
            type: Type.STRING,
            description:
              "Why this doctor is recommended (be honest if they're not the ideal specialty)",
          },
          priority: {
            type: Type.NUMBER,
            description: "Priority ranking (1 = most recommended)",
          },
        },
        required: ["doctorId", "reason", "priority"],
      },
    },
    generalAdvice: {
      type: Type.STRING,
      description: "General health advice based on symptoms",
    },
  },
  required: ["idealSpeciality", "idealSpecialityReason", "recommendations"],
};

export async function POST(req: NextRequest) {
  try {
    // Allow both authenticated and unauthenticated access (for registration page)
    const body = await req.json();
    const { symptoms } = body;

    if (!symptoms || typeof symptoms !== "string") {
      return NextResponse.json(
        { error: "Symptoms are required" },
        { status: 400 },
      );
    }

    // FIRST: Use keyword-based detection for reliable results
    const keywordDetection = detectSpecialtyFromSymptoms(symptoms);

    // Get all doctors with their profiles
    const doctors = await db
      .select({
        id: users.id,
        name: users.name,
        speciality: doctorProfiles.speciality,
        degrees: doctorProfiles.degrees,
        experience: doctorProfiles.experience,
      })
      .from(users)
      .innerJoin(doctorProfiles, eq(users.id, doctorProfiles.userId))
      .where(eq(users.role, "DOCTOR"));

    if (doctors.length === 0) {
      return NextResponse.json({
        recommendations: [],
        generalAdvice:
          "No doctors are currently available. Please check back later.",
      });
    }

    // Get available specialities
    const availableSpecialities = [
      ...new Set(doctors.map((d) => d.speciality)),
    ];

    // Initialize Gemini AI
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Fallback: Use keyword detection if no AI key
      if (keywordDetection) {
        const idealSpeciality = keywordDetection.specialty;
        const hasIdealSpecialist = availableSpecialities.some(
          (s) => s.toLowerCase() === idealSpeciality.toLowerCase(),
        );

        if (hasIdealSpecialist) {
          const matchingDoctors = doctors.filter(
            (d) => d.speciality.toLowerCase() === idealSpeciality.toLowerCase(),
          );
          return NextResponse.json({
            idealSpeciality,
            idealSpecialityReason: keywordDetection.reason,
            hasIdealSpecialist: true,
            recommendations: matchingDoctors.map((d, i) => ({
              doctorId: d.id,
              doctorName: d.name,
              speciality: d.speciality,
              degrees: d.degrees,
              experience: d.experience,
              reason: `Specialist in ${d.speciality} - ideal for your symptoms`,
              priority: i + 1,
            })),
            generalAdvice: "Please select a doctor and book your appointment.",
          });
        } else {
          return NextResponse.json({
            idealSpeciality,
            idealSpecialityReason: keywordDetection.reason,
            hasIdealSpecialist: false,
            recommendations: [],
            generalAdvice: `We currently don't have a ${idealSpeciality} at our clinic. Please check back later or visit another clinic for this specialty.`,
          });
        }
      }

      // No keyword match, suggest General Physician
      const gpDoctors = doctors.filter(
        (d) => d.speciality === "General Physician",
      );
      return NextResponse.json({
        idealSpeciality: "General Physician",
        idealSpecialityReason:
          "For general symptoms, a General Physician can help with initial evaluation",
        hasIdealSpecialist: gpDoctors.length > 0,
        recommendations: gpDoctors.map((d, i) => ({
          doctorId: d.id,
          doctorName: d.name,
          speciality: d.speciality,
          degrees: d.degrees,
          experience: d.experience,
          reason: "General Physicians can evaluate a wide range of symptoms",
          priority: i + 1,
        })),
        generalAdvice:
          gpDoctors.length > 0
            ? "Please select a doctor and book your appointment."
            : "No suitable doctors available at the moment.",
      });
    }

    const genAI = new GoogleGenAI({ apiKey });

    // Build prompt with doctor information
    const doctorList = doctors
      .map(
        (d) =>
          `- ID: ${d.id}, Name: ${d.name}, Speciality: ${d.speciality}, Experience: ${d.experience || 0} years`,
      )
      .join("\n");

    const prompt = `Patient's symptoms: "${symptoms}"

Available specialities in our clinic: ${availableSpecialities.join(", ")}

Available doctors:
${doctorList}

INSTRUCTIONS:
1. Based on the symptoms above, identify the EXACT specialty needed using the MANDATORY SPECIALTY MAPPING
2. For skin-related symptoms (irritation, ringworm, rash, etc.), the idealSpeciality MUST be "Dermatologist"
3. Check if that specialty exists in our available specialities list
4. Recommend doctors from our list, preferring those matching the ideal specialty
5. If the ideal specialty is NOT available, set hasIdealSpecialist to false and recommend alternatives

What is the idealSpeciality for these symptoms?`;

    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        systemInstruction: DOCTOR_RECOMMENDATION_PROMPT,
        responseMimeType: "application/json",
        responseSchema: doctorRecommendationSchema,
      },
    });

    const result = JSON.parse(response.text || "{}");

    // PRIORITY: Use keyword detection result if available, otherwise use AI result
    const idealSpeciality =
      keywordDetection?.specialty ||
      result.idealSpeciality ||
      "General Physician";
    const idealSpecialityReason =
      keywordDetection?.reason || result.idealSpecialityReason || "";

    // Check if ideal speciality is available in our clinic
    const hasIdealSpecialist = availableSpecialities.some(
      (s) =>
        s.toLowerCase() === idealSpeciality.toLowerCase() ||
        s.toLowerCase().includes(idealSpeciality.toLowerCase()) ||
        idealSpeciality.toLowerCase().includes(s.toLowerCase()),
    );

    // Only provide recommendations if we have the specialist
    // If not, return empty recommendations - don't suggest alternatives
    let enrichedRecommendations: Array<{
      doctorId: string;
      doctorName: string;
      speciality: string;
      degrees: string[];
      experience: number;
      reason: string;
      priority: number;
    }> = [];

    if (hasIdealSpecialist) {
      // Find doctors matching the ideal specialty
      const matchingDoctors = doctors.filter(
        (d) =>
          d.speciality.toLowerCase() === idealSpeciality.toLowerCase() ||
          d.speciality.toLowerCase().includes(idealSpeciality.toLowerCase()) ||
          idealSpeciality.toLowerCase().includes(d.speciality.toLowerCase()),
      );

      enrichedRecommendations = matchingDoctors.map((doctor, index) => ({
        doctorId: doctor.id,
        doctorName: doctor.name,
        speciality: doctor.speciality,
        degrees: doctor.degrees || [],
        experience: doctor.experience || 0,
        reason: `Specialist in ${doctor.speciality} - ideal for your symptoms`,
        priority: index + 1,
      }));
    }

    return NextResponse.json({
      idealSpeciality,
      idealSpecialityReason,
      hasIdealSpecialist,
      recommendations: enrichedRecommendations,
      generalAdvice: hasIdealSpecialist
        ? "Please select a doctor and book your appointment."
        : `We currently don't have a ${idealSpeciality} at our clinic. Please check back later or visit another clinic for this specialty.`,
    });
  } catch (error) {
    console.error("Error recommending doctor:", error);
    return NextResponse.json(
      { error: "Failed to get recommendations" },
      { status: 500 },
    );
  }
}
