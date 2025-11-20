import report from '../assets/report.png';
import gradcam from '../assets/Gradcam.jpeg';
import rlhf from '../assets/RLHF.png';
import patient from '../assets/patient_analysis.jpeg';


// export const API_URL= 'https://susufdoctor-production.up.railway.app';
export const API_URL= 'https://susufdoctorbackend-100056520598.europe-west1.run.app';
// export const API_URL = "http://localhost:8000";
export const services = [
    {
      img: report,
      title: "Report Generation",
      desc: "Automatically generate preliminary reports using standardized templates. Saves time, reduces errors, and enhances diagnostic accuracy."
    },
    {
      img: gradcam,
      title: "Gradcam Visualization",
      desc: "Instantly visualize the exact areas the AI focuses on within the image. Enhances diagnostic confidence and communication with clinicians."
    },
    {
      img: rlhf,
      title: "RLHF",
      desc: "Refines reports continuously using Human Feedback. Ensures the system evolves to meet expert radiologists’ standards."
    },
    {
      img: patient,
      title: "Patient Analysis",
      desc: "Provides immediate patient-level insights. Supports clinicians in decision-making and timely interventions."
    },
];