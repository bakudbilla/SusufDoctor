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
