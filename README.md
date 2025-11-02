# SusufDoctor (https://susuf-doctor.vercel.app/)
“SusufDoctor”, is an intelligent web application that replicates the radiologist’s workflow by generating comprehensive chest X-ray reports. It integrates current and prior scans with patient metadata for longitudinal, context-aware analysis, uses a single transformer decoder to generate a full radiology report and provides visual explanations through Grad-CAM for transparency. The system further incorporates Reinforcement Learning with Human Feedback (RLHF), allowing radiologists to refine reports and continuously improve performance, making it a practical solution for reducing workload and enhancing diagnostic support, especially in resource-limited settings such as Ghana and Rwanda where patient to radiologist ratio is low.
It implements the **automatic radiology report generation system** using deep learning. It combines **custom embeddings fusion** and a **Transformer-based decoder** to generate structured and clinically coherent radiology reports from input data (images, prior reports, or both).  

The Chexpert plus dataset was used for this project. It was then processed into the longitudinal format, suitable for both single report generation and longitudinal. Dataset can be found here: https://aimi.stanford.edu/datasets/chexpert-plus

Initial Software solution Demmo can be found here: https://youtu.be/lUa4ap6wx6A

Final Solution Demo : https://drive.google.com/drive/folders/1gImvbdYVC4rdFb_jOS-51BmFvxBIpgDM

Figma Design here: https://www.figma.com/design/x4BV86NXe2AFrBRMU13sUo/SusufDoctor?node-id=0-1&t=8XOOY7tIJ7egppzp-1

Susuf Doctor Web App: https://susuf-doctor.vercel.app/

Key features:  
- Custom **`FuseEmbeddingsLayer`** for multimodal feature fusion  
- **`TransformerDecoder`** for sequence-to-sequence text generation  
- Integrated **tokenizer** for handling medical text vocabulary  
- End-to-end training, evaluation, and inference pipeline  

## Repository  
GitHub repo:  https://github.com/bakudbilla/SusufDoctor/

##  Setup & Environment  

### Option 1: Open in Colab  
Click this button to open the notebook on colab: https://colab.research.google.com/drive/1VoKGHSeq9YBj_OPvWF6PXs52tBRlDiPM?usp=sharing
### Option 2: Running on Vscode
- Clone repository
```bash
- git clone https://github.com/your-username/your-repo-name.git
- cd SusufDoctor
- pip install -r requirements.txt
```
- Run the notebook file


# SuSufDoctor WEP APP SETUP

## Features

- AI-powered report generation from X-ray images  
- Secure file storage using Google Cloud Storage (GCS)  
- User authentication (JWT)  
- Patient record management  
- FastAPI backend with React + Vite frontend  
- Deployed on Render (backend) and Vercel (frontend)

---

## Tech Stack

| Layer | Technology |
|--------|-------------|
| Frontend | React (Vite) + TailwindCSS |
| Backend | FastAPI (Python) |
| Database | Firestore (Google Cloud) |
| Storage | Google Cloud Storage |
| Deployment | Render (API) & Vercel (Frontend) |
| Model | AI-based Radiology Report Generator |

---

## Prerequisites

Before running the project, ensure you have the following installed:

- Python 3.9+  
- Node.js 18+ and npm  
- Git  
- Google Cloud Service Account JSON key  
- Vercel or Render account (for deployment)

---

## Folder Structure


---

## Backend Setup (FastAPI)
1. Navigate to the Backend Directory

```
cd fast_api
```
2. create a virtual environment
```
python -m venv venv

source venv/Scripts/activate     # On Windows
# or
source venv/bin/activate         # On Mac/Linux
```
3. Install requirements
 ```
pip install -r requirements.txt
```
4. create your environment variables
```
GOOGLE_APPLICATION_CREDENTIALS=optimal-carving-475915-u7-4c85df30bf2f.json
BUCKET_NAME=susufdoctor-storage
SECRET_KEY=your-secret-key
ALGORITHM=HS256
```

5. Run the backend server
uvicorn main:app --reload

# Frontend Setup (React + Vite)

This document provides a complete guide to setting up, configuring, and deploying the **SuSufDoctor React frontend** built with **Vite**.

---

1. Prerequisites

Before running the project, ensure that you have the following installed:

- Node.js 18+  
- npm (Node Package Manager)  
- Git  
- A backend API (FastAPI or deployed API URL)  

---

2. Clone the Repository

If you haven’t already, clone the project from GitHub:

```
git clone https://github.com/bakudbilla/SusufDoctor.git
```
3.Navigate to directory
```
    cd SusufDoctor/susufdoctor-app
```
4. Install npm  packages
   ```
   npm install
   ```
5. Run the Development Server
   ```
   npm run dev
   ```
