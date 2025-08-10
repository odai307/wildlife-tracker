# Wildlife Classifier 🐅

A full-stack web application that uses deep learning to classify wildlife images, specifically big cats. Upload an image or use your camera to identify Cheetahs, Jaguars, Leopards, Lions, and Tigers with confidence scores.

## Features

- **Image Upload**: Upload images from your device for classification
- **Camera Integration**: Take photos directly using your device's camera
- **Multi-Camera Support**: Switch between front and back cameras on mobile devices
- **Real-time Classification**: Get instant predictions with confidence scores
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Frontend
- **React**: User interface and component management
- **Axios**: HTTP requests to backend API
- **HTML5 Camera API**: Camera access and image capture

### Backend
- **Node.js**: Server runtime
- **Express.js**: Web framework
- **Multer**: File upload handling
- **Python**: Machine learning inference

### Machine Learning
- **PyTorch**: Deep learning framework
- **torchvision**: Pre-trained models and transforms
- **ResNet-18**: Convolutional neural network architecture
- **PIL (Pillow)**: Image processing

## Supported Animals

The model can classify the following big cats:
- 🐆 **Cheetah**
- 🐅 **Jaguar** 
- 🐆 **Leopard**
- 🦁 **Lion**
- 🐅 **Tiger**

## Installation

### Prerequisites
- Node.js (v14 or higher)
- Python 3.8+
- npm or yarn

### Clone the Repository
```bash
git clone https://github.com/odai307/wildlife-classifier.git
cd wildlife-classifier
```

### Install Python Dependencies
```bash
# Install Python dependencies from requirements.txt
pip install -r requirements.txt
```

### Backend Setup
```bash
cd server
npm install

# Install Python dependencies
pip install -r ../requirements.txt

# Or alternatively install individually:
# pip install torch torchvision pillow numpy
```

### Frontend Setup
```bash
cd client  # or wherever your React app is located
npm install
```

### Environment Variables
Create a `.env` file in the server directory:
```env
PORT=3000
NODE_ENV=development
```

## Project Structure

```
wildlife-classifier/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ImageUpload.js
│   │   │   └── ImageUpload.css
│   │   └── ...
│   └── package.json
├── server/                    # Node.js backend
│   ├── controllers/
│   │   └── imageController.js
│   ├── routes/
│   │   └── imageRoutes.js
│   ├── middlewares/
│   │   └── uploadMiddleware.js
│   ├── ml/
│   │   ├── model.pth          # Trained PyTorch model
│   │   └── classes.json       # Class labels
│   ├── classify.py            # Python classification script
│   ├── app.js                 # Express server
│   └── package.json
├── requirements.txt           # Python dependencies
├── .gitignore
└── README.md
```

## Usage

### Start the Backend Server
```bash
cd server
npm run dev
# Server will start on http://localhost:3000
```

### Start the Frontend Development Server
```bash
cd client
npm start
# React app will start on http://localhost:5173 (or 3001)
```

### Using the Application

1. **Upload Image**: Click "Choose File" and select an animal image
2. **Use Camera**: Click "Use Camera" to take a photo directly
3. **Classify**: Click "Classify Image" to get predictions
4. **View Results**: See the predicted animal type and confidence score

## API Endpoints

### POST /api/upload
Uploads an image file and returns classification results.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Form data with `image` file

**Response:**
```json
{
  "prediction": {
    "animalType": "Cheetah",
    "confidence": 0.9581093788146973
  }
}
```

## Model Information

The classification model is built using:
- **Architecture**: ResNet-18
- **Input Size**: 224x224 pixels
- **Classes**: 5 big cat species
- **Framework**: PyTorch

The model uses standard ImageNet preprocessing with normalization values:
- Mean: [0.485, 0.456, 0.406]
- Std: [0.229, 0.224, 0.225]

## Development

### Running Tests
```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

### Building for Production
```bash
# Build React app
cd client
npm run build

# Start production server
cd server
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Common Issues

**Python Module Not Found**
```bash
pip install -r requirements.txt
```

**Virtual Environment (Recommended)**
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Camera Access Denied**
- Ensure HTTPS is used in production
- Grant camera permissions in browser settings

**Model Loading Errors**
- Verify `model.pth` and `classes.json` exist in `server/ml/`
- Check file paths and permissions

### Error Messages

- **"No image file uploaded"**: Ensure file is selected before submitting
- **"Image classification failed"**: Check Python dependencies and model files
- **"Invalid response from Python script"**: Verify classes.json format

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- PyTorch team for the deep learning framework
- torchvision for pre-trained models
- React community for frontend tools

## Future Enhancements

- [ ] Add more animal species
- [ ] Implement batch processing
- [ ] Add confidence threshold settings
- [ ] Include animal information and facts
- [ ] Add image history and favorites
- [ ] Implement user authentication
- [ ] Add mobile app version

---

**Made with ❤️ for wildlife conservation and education**