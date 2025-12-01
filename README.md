# SusufDoctor 
SusufDoctor is an intelligent web application that replicates the radiologist’s workflow by generating comprehensive chest X-ray reports. It integrates current and prior scans with patient metadata for longitudinal, context-aware analysis, uses a single transformer decoder to generate a full radiology report. The Chexpert plus dataset was used for this project. It was then processed into the longitudinal format, suitable for both single report generation and longitudinal. Dataset can be found here: https://aimi.stanford.edu/datasets/chexpert-plus

<img width="1365" height="611" alt="Screenshot 2025-11-07 181238" src="https://github.com/user-attachments/assets/35657c32-16b2-4c62-85ad-3496973b91e7" />

<img width="1359" height="647" alt="Screenshot 2025-11-20 230649" src="https://github.com/user-attachments/assets/f235727f-9d84-45a1-8243-46557468b94d" />


<img width="1351" height="621" alt="Screenshot 2025-11-16 153707" src="https://github.com/user-attachments/assets/f79c6ac2-4e01-44e5-9f0f-5c09d89d16cf" />

 In the application, The Radiologist Dashboard is where reports are generated and patient data is managed
 
<img width="1361" height="526" alt="image" src="https://github.com/user-attachments/assets/6f6c366c-9cbd-4731-a87b-e8f48bb5adb0" />

- Initial Software solution Demmo can be found here: https://youtu.be/lUa4ap6wx6A

- Final Solution Demo : https://drive.google.com/drive/folders/1gImvbdYVC4rdFb_jOS-51BmFvxBIpgDM

- Figma Design here: https://www.figma.com/design/x4BV86NXe2AFrBRMU13sUo/SusufDoctor?node-id=0-1&t=8XOOY7tIJ7egppzp-1

- Susuf Doctor Web App: https://susuf-doctor.vercel.app/
  
- Susuf Doctor backend(Fast api):https://susufdoctorbackend-100056520598.europe-west1.run.app/docs


## Repository  
GitHub repo:  https://github.com/bakudbilla/SusufDoctor/

##  Setup & Environment  

### Option 1: Open in Colab  
Click this button to open the notebook on colab: https://colab.research.google.com/drive/1VoKGHSeq9YBj_OPvWF6PXs52tBRlDiPM?usp=sharing
### Option 2: Running on Vscode
- Clone repository
```bash
- git clone https://github.com/bakudbilla/SusufDoctor.git
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

## Tech Stack

| Layer | Technology |
|--------|-------------|
| Frontend | React (Vite) + TailwindCSS |
| Backend | FastAPI (Python) |
| Database | Firestore (Google Cloud) |
| Storage | Google Cloud Storage |
| Deployment | Google cloud RUn & Vercel (Frontend) |
| Model | AI-based Radiology Report Generator |

## Prerequisites

Before running the project, ensure you have the following installed:

- Python 3.9+  
- Node.js 18+ and npm  
- Git  
- Google Cloud Service Account JSON key  
- Vercel or Render account (for deployment)

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
 ```
uvicorn main:app --reload
```
NB: The  backend will be available at: http://127.0.0.1:8000

# Frontend Setup (React + Vite)

This document provides a complete guide to setting up, configuring, and deploying the **SuSufDoctor React frontend** built with **Vite**.

1. Prerequisites

Before running the project, ensure that you have the following installed:
- Node.js 18+  
- npm (Node Package Manager)  
- Git  
- A backend API (FastAPI or deployed API URL)  

2. Clone the Repository

If you haven’t already, clone the project from GitHub:

```
git clone https://github.com/bakudbilla/SusufDoctor.git
```
3. Navigate to directory
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
The  frontend will be available at: http://localhost:5173

# Project Results

The proposed SuSufDoctor system achieved significant performance improvements after fine-tuning the SmolVLM-500M model using LoRA and 4-bit quantization. The model’s BLEU score improved from 1.29% to 61.53%, ROUGE-L from 8.26% to 66.08%, and BERTScore (F1) from 80.48% to 93.92%, demonstrating strong gains in both linguistic quality and semantic accuracy of generated reports. The deployed web system generates structured radiology reports with longitudinal comparison in 5–30 seconds per case, and all outputs are validated by radiologists through a built-in editing workflow. These results confirm the system’s effectiveness as a fast, reliable clinical decision-support tool for low-resource healthcare settings.
