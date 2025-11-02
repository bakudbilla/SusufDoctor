from transformers import AutoProcessor
from PIL import Image

# Load the processor that matches smolvlm
processor = AutoProcessor.from_pretrained("HuggingFaceTB/smolvlm-500M")

def preprocess_image(image):
    """For multimodal model, images are passed through the processor, not manually."""
    if not isinstance(image, Image.Image):
        image = Image.open(image).convert("RGB")
    return image

def preprocess_text(text):
    """Text is also handled by the processor; this is for reference."""
    return text

def prepare_inputs(image, text):
    """Prepare multimodal input for smolvlm-500M"""
    inputs = processor(
        text=text,
        images=image,
        return_tensors="pt",
        padding=True
    )
    return inputs
