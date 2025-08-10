import sys
import json
from PIL import Image
import torch
import torch.nn as nn
from torchvision import models, transforms
import os

try:
    # Paths
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    MODEL_PATH = os.path.join(BASE_DIR, "ml", "model.pth")
    LABELS_PATH = os.path.join(BASE_DIR, "ml", "classes.json")

    # Debug: Check if files exist
    if not os.path.exists(MODEL_PATH):
        print(json.dumps({'error': f'Model file not found: {MODEL_PATH}'}), flush=True)
        sys.exit(1)

    if not os.path.exists(LABELS_PATH):
        print(json.dumps({'error': f'Labels file not found: {LABELS_PATH}'}), flush=True)
        sys.exit(1)

    # Load labels
    with open(LABELS_PATH, 'r') as f:
        class_data = json.load(f)
    
    # Convert to list if it's a dictionary with string keys
    if isinstance(class_data, dict):
        # Assuming keys are string representations of indices
        class_names = [class_data[str(i)] for i in range(len(class_data))]
    else:
        class_names = class_data
    
    print(f"Loaded {len(class_names)} class names: {class_names}", file=sys.stderr, flush=True)

    # Load model
    model = models.resnet18(weights=None)  # Updated to remove deprecated 'pretrained'
    model.fc = nn.Linear(model.fc.in_features, len(class_names))
    
    print("Loading model state dict...", file=sys.stderr, flush=True)
    model.load_state_dict(torch.load(MODEL_PATH, map_location=torch.device("cpu")))
    model.eval()
    
    print("Model loaded successfully", file=sys.stderr, flush=True)

    # Transform for inference
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std=[0.229, 0.224, 0.225]),
    ])

except Exception as e:
    print(json.dumps({'error': f'Setup error: {str(e)}'}), flush=True)
    sys.exit(1)

def classify(image_path):
    try:
        # Check if image file exists
        if not os.path.exists(image_path):
            error_msg = f'Image file not found: {image_path}'
            print(json.dumps({'error': error_msg}), flush=True)
            sys.exit(1)

        print(f"Opening image: {image_path}", file=sys.stderr, flush=True)
        image = Image.open(image_path).convert('RGB')
        print(f"Image size: {image.size}", file=sys.stderr, flush=True)
        
        input_tensor = transform(image).unsqueeze(0)
        print("Image transformed successfully", file=sys.stderr, flush=True)

        with torch.no_grad():
            outputs = model(input_tensor)
            probs = torch.nn.functional.softmax(outputs[0], dim=0)
            pred_idx = torch.argmax(probs).item()
            confidence = probs[pred_idx].item()

        print(f"Prediction index: {pred_idx}, Confidence: {confidence}", file=sys.stderr, flush=True)
        
        # Check if prediction index is valid
        if pred_idx >= len(class_names):
            error_msg = f'Invalid prediction index {pred_idx}, only have {len(class_names)} classes'
            print(json.dumps({'error': error_msg}), flush=True)
            sys.exit(1)

        # Get the animal type
        animal_type = class_names[pred_idx]
        print(f"Animal type: {animal_type}", file=sys.stderr, flush=True)

        # Return the classification result
        result = {
            'animalType': animal_type,
            'confidence': confidence
        }

        print(f"About to output result: {result}", file=sys.stderr, flush=True)
        
        # Output the result to stdout
        output_json = json.dumps(result)
        print(output_json, flush=True)
        
        print("Result output successful", file=sys.stderr, flush=True)
        sys.exit(0)

    except Exception as e:
        error_msg = f'Classification error: {str(e)}'
        print(f"Exception caught: {error_msg}", file=sys.stderr, flush=True)
        print(json.dumps({'error': error_msg}), flush=True)
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No image path provided'}), flush=True)
        sys.exit(1)

    print(f"Starting classification for: {sys.argv[1]}", file=sys.stderr, flush=True)
    classify(sys.argv[1])

def classify(image_path):
    try:
        # Check if image file exists
        if not os.path.exists(image_path):
            print(json.dumps({'error': f'Image file not found: {image_path}'}), flush=True)
            sys.exit(1)

        image = Image.open(image_path).convert('RGB')
        input_tensor = transform(image).unsqueeze(0)

        with torch.no_grad():
            outputs = model(input_tensor)
            probs = torch.nn.functional.softmax(outputs[0], dim=0)
            pred_idx = torch.argmax(probs).item()
            confidence = probs[pred_idx].item()

        # Return the classification result
        result = {
            'animalType': class_names[pred_idx],
            'confidence': confidence
        }

        print(json.dumps(result), flush=True)
        sys.exit(0)

    except Exception as e:
        print(json.dumps({'error': f'Classification error: {str(e)}'}), flush=True)
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No image path provided'}), flush=True)
        sys.exit(1)

    classify(sys.argv[1])