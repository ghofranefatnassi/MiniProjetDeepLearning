from io import BytesIO

import numpy as np
from PIL import Image
from fastapi import FastAPI,File,UploadFile
import tensorflow as tf
import requests
import uvicorn
app = FastAPI()
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost",
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

endpoint = "http://localhost:8502/v1/models/prod_model:predict"

CLASS_NAMES = ["Early Blight", "Late Blight", "Healthy"]
@app.get("/ping")
async  def ping():
    return {"Hello Worls I'm Alive My name is ghofrane fatnassi"}

def read_file_as_image(data) -> np.ndarray:
    image = np.array(Image.open(BytesIO(data)))
    return image


@app.post("/predict")
async def predict(
    file: UploadFile = File(...)
):
    image = read_file_as_image(await file.read())
    img_batch = np.expand_dims(image, 0)

    json_data = {
        "instances": img_batch.tolist()
    }

    response = requests.post(endpoint, json=json_data)

    # FIRST check if there is a problem
    response_data = response.json()
    print("DEBUG - Server Response:", response_data)

    if "predictions" not in response_data:
        raise Exception(f"Error from TensorFlow Serving: {response_data}")

    prediction = np.array(response.json()["predictions"][0])

    predicted_class = CLASS_NAMES[np.argmax(prediction)]
    confidence = np.max(prediction)

    return {
        "class": predicted_class,
        "confidence": float(confidence)
    }


if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)
