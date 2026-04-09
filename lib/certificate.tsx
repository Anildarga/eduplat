import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register a default font (using built-in fonts)
// @react-pdf/renderer includes default fonts, no need to register

interface CertificateData {
  studentName: string;
  courseName: string;
  certificateNumber: string;
  issuedDate: Date;
  instructorName: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Helvetica',
    backgroundColor: '#fff',
  },
  border: {
    position: 'absolute',
    top: 40,
    left: 40,
    right: 40,
    bottom: 40,
    border: '3pt solid #1f2937',
  },
  innerBorder: {
    position: 'absolute',
    top: 45,
    left: 45,
    right: 45,
    bottom: 45,
    border: '1pt solid #10b981',
  },
  title: {
    fontSize: 48,
    textAlign: 'center',
    color: '#1f2937',
    marginBottom: 20,
    fontFamily: 'Helvetica-Bold',
  },
  line: {
    width: '60%',
    height: 2,
    backgroundColor: '#10b981',
    marginHorizontal: '20%',
    marginVertical: 10,
  },
  presentedTo: {
    fontSize: 14,
    textAlign: 'center',
    color: '#4b5563',
    marginBottom: 5,
  },
  studentName: {
    fontSize: 36,
    textAlign: 'center',
    color: '#10b981',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 10,
  },
  forCompleting: {
    fontSize: 14,
    textAlign: 'center',
    color: '#4b5563',
    marginBottom: 5,
  },
  courseName: {
    fontSize: 24,
    textAlign: 'center',
    color: '#1f2937',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 20,
  },
  achievement: {
    fontSize: 12,
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 20,
    paddingHorizontal: 50,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    paddingHorizontal: 80,
  },
  detailItem: {
    width: '40%',
  },
  detailLabel: {
    fontSize: 10,
    color: '#9ca3af',
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 12,
    color: '#1f2937',
    fontFamily: 'Helvetica-Bold',
  },
  signatureSection: {
    flexDirection: 'row',
    marginTop: 30,
    paddingHorizontal: 100,
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: 120,
    borderBottom: '1pt solid #d1d5db',
    marginTop: 20,
  },
  signatureLabel: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 5,
  },
  seal: {
    textAlign: 'right',
    fontSize: 10,
    color: '#6b7280',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    borderTop: '1pt solid #e5e7eb',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 9,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

/**
 * Generate a professional course completion certificate as a PDF
 */
export async function generateCertificatePDF(data: CertificateData): Promise<Uint8Array> {
  const { studentName, courseName, certificateNumber, issuedDate, instructorName } = data;

  const formattedDate = issuedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Decorative borders */}
        <View style={styles.border} />
        <View style={styles.innerBorder} />

        {/* Title */}
        <Text style={styles.title}>Certificate of Completion</Text>

        {/* Decorative line */}
        <View style={styles.line} />

        {/* Presented to */}
        <Text style={styles.presentedTo}>This certificate is proudly presented to</Text>

        {/* Student Name */}
        <Text style={styles.studentName}>{studentName.toUpperCase()}</Text>

        {/* For completing the course */}
        <Text style={styles.forCompleting}>for successfully completing the course</Text>

        {/* Course Name */}
        <Text style={styles.courseName}>{courseName}</Text>

        {/* Achievement text */}
        <Text style={styles.achievement}>
          having demonstrated the knowledge and skills required to successfully complete this course, we hereby award this certificate as recognition of achievement.
        </Text>

        {/* Certificate Details */}
        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Certificate Number</Text>
            <Text style={styles.detailValue}>{certificateNumber}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Date Issued</Text>
            <Text style={styles.detailValue}>{formattedDate}</Text>
          </View>
        </View>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View>
            <View style={styles.signatureBox} />
            <Text style={styles.signatureLabel}>Instructor Signature</Text>
            <Text style={styles.signatureLabel}>{instructorName}</Text>
          </View>
          <View>
            <Text style={styles.seal}>EduPlat</Text>
            <Text style={styles.seal}>Digital Certificate</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This is a digital certificate. It is valid and verifiable. | www.eduplat.com
          </Text>
        </View>
      </Page>
    </Document>
  );

  const { pdf } = await import('@react-pdf/renderer');
  // Use toBlob and convert to Uint8Array
  const blob = await pdf(doc).toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Generate a unique certificate number
 * Format: CERT-YEAR-RANDOMSTRING
 */
export function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const randomString = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `CERT-${year}-${randomString}`;
}
