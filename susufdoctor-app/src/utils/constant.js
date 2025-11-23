import report from '../assets/report.png';
import wordcloud from '../assets/wordcloud.png';
import rlhf from '../assets/RLHF.png';
import patient from '../assets/patient_analysis.jpeg';



//export const API_URL= 'https://susuf-doctor-api-264979066371.europe-west1.run.app/';
export const API_URL = "http://localhost:8000";
// export const API_URL = 'https://susufdoctor-production.up.railway.app'

export const services = [
    {
      img: report,
      title: "Single Image Report Generation",
      desc: "Automatically generate preliminary reports using standardized templates. Saves time, reduces errors, and enhances diagnostic accuracy."
    },
    {
      img: wordcloud,
      title: "Word Cloud",
      desc: "The word cloud helps radiologists quickly identify the most common conditions and patterns appearing across patient reports."
    },
    {
      img: rlhf,
      title: "Longitudinal Analysis",
      desc: "Longitudinal analysis helps track changes between scans to identify disease progression across different patient visits"
    },
    {
      img: patient,
      title: "Patient Analysis",
      desc: "Provides immediate patient-level insights. Supports clinicians in decision-making and timely interventions."
    },
];


export const privacyPolicies = [
  "I am a licensed radiologist or an authorized medical professional.",
  "I understand that SuSufDoctor provides AI-generated draft reports that must be reviewed, edited, and validated before clinical use.",
  "I will upload only patient images I am legally permitted to handle and will maintain patient confidentiality at all times.",
  "Patient data is being used in an AI system and patients are aware of this.",
  "I acknowledge that AI outputs may contain errors and do not replace professional medical judgment.",
  "I agree not to share patient data outside approved clinical workflows.",
  "I will use the system responsibly, ethically, and in compliance with medical data protection standards.",
  "I accept that the platform may store data securely in the cloud for clinical support and record-keeping.",
  "I understand that misuse of the system or unauthorized access may result in account termination.",
];
