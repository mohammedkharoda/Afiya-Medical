"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// Afiya branding colors
const colors = {
  primary: "#2A7C7C",
  secondary: "#1F5F5F",
  text: "#333333",
  muted: "#666666",
  light: "#f8f9fa",
  border: "#e5e7eb",
  warning: "#ffc107",
  info: "#17a2b8",
};

// Styles for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: colors.text,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  logo: {
    width: 50,
    height: 50,
    marginBottom: 8,
  },
  clinicName: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: colors.muted,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  infoLabel: {
    width: 100,
    fontFamily: "Helvetica-Bold",
    color: colors.muted,
  },
  infoValue: {
    flex: 1,
    color: colors.text,
  },
  medication: {
    backgroundColor: colors.light,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  medicationName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    color: colors.text,
    marginBottom: 4,
  },
  medicationDetails: {
    fontSize: 10,
    color: colors.muted,
    marginBottom: 2,
  },
  medicationInstructions: {
    fontSize: 10,
    color: colors.text,
    fontStyle: "italic",
    marginTop: 4,
  },
  notesBox: {
    backgroundColor: "#fff3cd",
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    marginTop: 5,
  },
  followupBox: {
    backgroundColor: "#d1ecf1",
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.info,
    marginTop: 5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontSize: 9,
    color: colors.muted,
    marginBottom: 3,
  },
  disclaimer: {
    fontSize: 8,
    color: colors.muted,
    marginTop: 5,
  },
});

interface Medication {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

interface PrescriptionData {
  id: string;
  diagnosis: string;
  notes?: string;
  createdAt: string;
  followUpDate?: string;
  doctorName?: string;
  attachmentUrl?: string;
  medications: Medication[];
}

interface PrescriptionPDFProps {
  prescription: PrescriptionData;
}

// Format date helper
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "N/A";
  }
};

export const PrescriptionPDF = ({ prescription }: PrescriptionPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header with Logo */}
      <View style={styles.header}>
        <Image
          style={styles.logo}
          src="https://res.cloudinary.com/dg2ezgumd/image/upload/v1769090131/logos_f96i4b.png"
        />
        <Text style={styles.clinicName}>Afiya Medical Clinic</Text>
        <Text style={styles.subtitle}>Medical Prescription</Text>
      </View>

      {/* Prescription Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prescription Details</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date:</Text>
          <Text style={styles.infoValue}>
            {formatDate(prescription.createdAt)}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Doctor:</Text>
          <Text style={styles.infoValue}>
            {prescription.doctorName || "Dr. N/A"}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Diagnosis:</Text>
          <Text style={styles.infoValue}>{prescription.diagnosis}</Text>
        </View>
      </View>

      {/* Medications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medications</Text>
        {prescription.medications.map((med, index) => (
          <View key={med.id || index} style={styles.medication}>
            <Text style={styles.medicationName}>
              {index + 1}. {med.medicineName}
            </Text>
            <Text style={styles.medicationDetails}>
              Dosage: {med.dosage} | Frequency: {med.frequency} | Duration:{" "}
              {med.duration}
            </Text>
            {med.instructions && (
              <Text style={styles.medicationInstructions}>
                Instructions: {med.instructions}
              </Text>
            )}
          </View>
        ))}
      </View>

      {/* Doctor's Notes */}
      {prescription.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Doctor&apos;s Notes</Text>
          <View style={styles.notesBox}>
            <Text>{prescription.notes}</Text>
          </View>
        </View>
      )}

      {/* Follow-up Date */}
      {prescription.followUpDate && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Follow-up</Text>
          <View style={styles.followupBox}>
            <Text>Follow-up Date: {formatDate(prescription.followUpDate)}</Text>
          </View>
        </View>
      )}

      {/* Attachment Note */}
      {prescription.attachmentUrl && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attachment</Text>
          <Text style={{ fontSize: 10, color: colors.muted }}>
            This prescription has an attached document. Please check the
            separate file that was downloaded along with this PDF.
          </Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Generated from Afiya Medical Clinic Patient Portal
        </Text>
        <Text style={styles.disclaimer}>
          Please follow the medication schedule as prescribed. Contact your
          doctor if you experience any adverse effects. This document is for
          reference purposes only.
        </Text>
      </View>
    </Page>
  </Document>
);

export default PrescriptionPDF;
