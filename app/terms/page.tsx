export default function TermsPage() {
  return (
    <div className="bg-background">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">
            Last updated: February 7, 2026
          </p>
          <h1 className="text-3xl font-bold text-foreground">
            Terms & Conditions
          </h1>
          <p className="text-muted-foreground">
            These Terms & Conditions govern your access to and use of Afiya
            Wellness (the "App"). By creating an account or using the App, you
            agree to these terms. If you do not agree, do not use the App.
          </p>
        </div>

        <div className="mt-10 space-y-8 text-sm leading-6 text-foreground">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">1. Who Can Use the App</h2>
            <p>
              The App is intended for patients, doctors, and clinic
              administrators. You must provide accurate, current, and complete
              information when registering. Patients must be at least the age of
              majority in their jurisdiction or have a parent or guardian manage
              their account.
            </p>
          </section>

          <section id="emergency" className="space-y-2">
            <h2 className="text-lg font-semibold">2. Emergency Disclaimer</h2>
            <p>
              The App does not provide emergency services. If you believe you are
              experiencing a medical emergency, call your local emergency number
              immediately or go to the nearest emergency facility.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">
              3. Doctor-Patient Relationship
            </h2>
            <p>
              Scheduling or messaging through the App does not automatically
              create a doctor-patient relationship. A relationship is
              established only when a doctor accepts an appointment or otherwise
              agrees to provide care.
            </p>
          </section>

          <section id="patient" className="space-y-2">
            <h2 className="text-lg font-semibold">4. Patient Responsibilities</h2>
            <p>
              Patients agree to provide accurate medical history and contact
              details, follow clinician instructions, and use the App
              respectfully. Patients are responsible for monitoring their own
              health and seeking in-person care when needed.
            </p>
          </section>

          <section id="doctor" className="space-y-2">
            <h2 className="text-lg font-semibold">5. Doctor Responsibilities</h2>
            <p>
              Doctors must maintain active licensure, comply with professional
              standards, and provide care consistent with applicable laws and
              clinical guidelines. Doctors determine whether a patient is
              suitable for remote care and may require in-person visits when
              appropriate.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">6. Appointments & Cancellations</h2>
            <p>
              Appointment availability depends on each doctor's schedule. We do
              not guarantee availability at any specific time. Clinics or
              doctors may set cancellation or no-show policies within the App.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">
              7. Prescriptions & Medical Records
            </h2>
            <p>
              Prescriptions and treatment decisions are made solely by licensed
              clinicians. The App may store visit notes and records for care
              coordination and continuity.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">8. Payments & Billing</h2>
            <p>
              Payment terms, fees, and refunds are set by the clinic or doctor
              and shown before payment. You agree to pay all applicable charges
              for services you request.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">9. Acceptable Use</h2>
            <p>
              You may not misuse the App, attempt to access systems without
              authorization, or transmit harmful code. We may suspend or
              terminate accounts that violate these terms or applicable law.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">10. Privacy</h2>
            <p>
              Our handling of personal and health information is described in
              the Privacy Policy. By using the App, you consent to those
              practices.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">11. Intellectual Property</h2>
            <p>
              The App, its content, and its software are owned by Afiya Wellness
              or its licensors and are protected by intellectual property laws.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">12. Disclaimers</h2>
            <p>
              The App is provided "as is" and "as available." We do not warrant
              that the App will be uninterrupted or error-free. Medical advice
              is provided by licensed clinicians, not by the App itself.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">13. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Afiya Wellness is not
              liable for indirect, incidental, or consequential damages arising
              from your use of the App.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">14. Changes to These Terms</h2>
            <p>
              We may update these Terms & Conditions from time to time. Material
              changes will be posted in the App, and continued use means you
              accept the updated terms.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">15. Contact</h2>
            <p>
              For questions about these terms, please contact support through
              the App.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
